<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DemandeLivraison;
use App\Models\Incident;
use App\Models\Paiement;
use App\Models\Notation;
use App\Models\SuiviLivraison;
use App\Services\CinetPayService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class DemandeLivraisonController extends Controller
{
    /**
     * Cas d'utilisation Client : "Créer demande de livraison"
     * MCT : Choisir entreprise -> Choisir type service/véhicule -> Calcul tarif -> statut EN_ATTENTE
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'id_entreprise' => ['required', Rule::exists('entreprises', 'id')->where('statut_validation', 'ACTIVE')],
            'id_type_service' => 'required|exists:type_services,id',
            'adresse_depart' => 'required|string',
            'adresse_arrivee' => 'required|string',
            'latitude_arrivee' => 'required|numeric|between:-90,90',
            'longitude_arrivee' => 'required|numeric|between:-180,180',
            'distance' => 'nullable|numeric',
            'date_programmee' => 'nullable|date',
        ]);

        $tarif = $this->calculerTarif($data['distance'] ?? null);

        $demande = DemandeLivraison::create([
            'id_client' => $request->user()->id,
            'id_entreprise' => $data['id_entreprise'] ?? null,
            'id_type_service' => $data['id_type_service'],
            'adresse_depart' => $data['adresse_depart'],
            'adresse_arrivee' => $data['adresse_arrivee'],
            'latitude_arrivee' => $data['latitude_arrivee'],
            'longitude_arrivee' => $data['longitude_arrivee'],
            'distance' => $data['distance'] ?? null,
            'tarif_estime' => $tarif,
            'code_livraison' => (string) random_int(100000, 999999),
            'statut' => $data['date_programmee'] ?? null ? 'PROGRAMMEE' : 'EN_ATTENTE',
            'date_creation' => now(),
            'date_programmee' => $data['date_programmee'] ?? null,
        ]);

        return response()->json($demande, 201);
    }

    /** Calcul tarif simplifié : base + distance (FCFA) — à ajuster selon la grille réelle */
    private function calculerTarif(?float $distanceKm): float
    {
        $base = 1000; // FCFA
        $prixParKm = 200; // FCFA
        return $base + ($distanceKm ?? 0) * $prixParKm;
    }

    public function mesDemandes(Request $request)
    {
        $demandes = DemandeLivraison::where('id_client', $request->user()->id)
            ->with(['typeService', 'entreprise', 'mission.livreur.utilisateur', 'paiement'])
            ->orderByDesc('date_creation')
            ->get();

        return response()->json($demandes);
    }

    /** Cas d'utilisation Client : "Consulter mon tableau de bord" (demandes, incidents, paiements) */
    public function mesStatistiques(Request $request)
    {
        $idClient = $request->user()->id;

        $demandesParStatut = DemandeLivraison::where('id_client', $idClient)
            ->selectRaw('statut, count(*) as total')
            ->groupBy('statut')
            ->pluck('total', 'statut');

        return response()->json([
            'total_demandes' => $demandesParStatut->sum(),
            'demandes_par_statut' => $demandesParStatut,
            'total_incidents' => Incident::whereHas('demande', fn ($q) => $q->where('id_client', $idClient))->count(),
            'total_paiements' => Paiement::whereHas('demande', fn ($q) => $q->where('id_client', $idClient))
                ->where('statut', 'CONFIRME')
                ->sum('montant'),
        ]);
    }

    public function show(Request $request, DemandeLivraison $demande)
    {
        $this->autoriser($request, $demande);

        $demande->load(['typeService', 'entreprise', 'mission.livreur.utilisateur', 'mission.vehicule', 'paiement', 'notation', 'incidents']);
        return response()->json($demande);
    }

    /** Cas d'utilisation Client : "Suivre ma livraison en temps réel" (position GPS du livreur) */
    public function suivi(Request $request, DemandeLivraison $demande)
    {
        $this->autoriser($request, $demande);

        $mission = $demande->mission()->with('livreur.utilisateur')->first();

        if (!$mission) {
            return response()->json(['statut_demande' => $demande->statut, 'statut_mission' => null, 'position' => null]);
        }

        $suivis = SuiviLivraison::where('id_mission', $mission->id)->orderBy('id')->get();
        $dernierSuivi = $suivis->last();

        return response()->json([
            'statut_demande' => $demande->statut,
            'statut_mission' => $mission->statut_prise_en_charge,
            'livreur_nom' => $mission->livreur?->utilisateur?->nom,
            'position' => $dernierSuivi ? [
                'latitude' => (float) $dernierSuivi->latitude,
                'longitude' => (float) $dernierSuivi->longitude,
                'timestamp' => $dernierSuivi->timestamp,
            ] : null,
            // Historique des positions relevées pendant la mission, pour tracer le trajet parcouru sur la carte.
            'trajet' => $suivis->map(fn (SuiviLivraison $s) => [
                'latitude' => (float) $s->latitude,
                'longitude' => (float) $s->longitude,
                'timestamp' => $s->timestamp,
            ])->values(),
        ]);
    }

    /** Cas d'utilisation : "Payer à la livraison" (espèces, confirmé ensuite par l'entreprise à la remise) */
    public function payer(Request $request, DemandeLivraison $demande)
    {
        $this->autoriser($request, $demande);

        $request->validate(['mode' => 'required|in:CASH']);

        $paiement = Paiement::updateOrCreate(
            ['id_demande' => $demande->id],
            [
                'montant' => $demande->tarif_estime,
                'mode' => 'CASH',
                'statut' => 'EN_ATTENTE',
                'date_transaction' => null,
            ]
        );

        return response()->json($paiement);
    }

    /**
     * Cas d'utilisation : "Payer en ligne" (mobile money via CinetPay).
     * Le client est redirigé vers le checkout hébergé CinetPay ; le statut n'est jamais confirmé
     * depuis le frontend, uniquement par le webhook signé après vérification serveur-à-serveur.
     */
    public function initierPaiementEnLigne(Request $request, DemandeLivraison $demande, CinetPayService $cinetPay)
    {
        $this->autoriser($request, $demande);

        abort_unless($demande->tarif_estime, 422, 'Cette demande n\'a pas de tarif à payer.');
        abort_if($demande->paiement?->statut === 'CONFIRME', 422, 'Cette demande est déjà payée.');

        $entreprise = $demande->entreprise;
        abort_unless(
            $entreprise?->paiement_en_ligne_configure,
            422,
            "Cette entreprise n'a pas encore configuré son compte de paiement en ligne."
        );

        $transactionId = 'DL' . $demande->id . '-' . Str::random(8);

        $resultat = $cinetPay->initierPaiement(
            siteId: $entreprise->cinetpay_site_id,
            apiKey: $entreprise->cinetpay_api_key,
            transactionId: $transactionId,
            montant: $demande->tarif_estime,
            description: "Livraison #{$demande->id}",
            notifyUrl: route('webhooks.cinetpay'),
            returnUrl: rtrim(config('services.cinetpay.return_url_base'), '/') . "/client/mes-demandes/{$demande->id}",
        );

        Paiement::updateOrCreate(
            ['id_demande' => $demande->id],
            [
                'montant' => $demande->tarif_estime,
                'mode' => 'EN_LIGNE',
                'statut' => 'EN_ATTENTE',
                'provider' => 'CINETPAY',
                'reference_externe' => $transactionId,
                'lien_paiement' => $resultat['payment_url'],
                'date_transaction' => null,
            ]
        );

        return response()->json(['payment_url' => $resultat['payment_url']]);
    }

    /** Cas d'utilisation : "Consulter historique livraisons" (note laissée par le client ou le livreur) */
    public function noter(Request $request, DemandeLivraison $demande)
    {
        $this->autoriser($request, $demande);

        $data = $request->validate([
            'note' => 'required|integer|min:1|max:5',
            'commentaire' => 'nullable|string',
        ]);

        $notation = Notation::updateOrCreate(
            ['id_demande' => $demande->id, 'id_auteur' => $request->user()->id],
            ['note' => $data['note'], 'commentaire' => $data['commentaire'] ?? null, 'date' => now()]
        );

        return response()->json($notation);
    }

    public function annuler(Request $request, DemandeLivraison $demande)
    {
        $this->autoriser($request, $demande);

        if (in_array($demande->statut, ['LIVREE', 'ANNULEE'])) {
            return response()->json(['message' => 'Impossible d\'annuler cette demande.'], 422);
        }

        $demande->update(['statut' => 'ANNULEE']);
        return response()->json($demande);
    }

    private function autoriser(Request $request, DemandeLivraison $demande): void
    {
        abort_unless($demande->id_client === $request->user()->id, 403, 'Cette demande ne vous appartient pas.');
    }
}

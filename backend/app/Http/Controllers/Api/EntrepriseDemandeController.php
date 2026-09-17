<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DemandeLivraison;
use App\Models\Livreur;
use App\Models\Mission;
use App\Models\Notification;
use Illuminate\Http\Request;

class EntrepriseDemandeController extends Controller
{
    /** Cas d'utilisation : "Consulter demandes" (côté entreprise) */
    public function index(Request $request)
    {
        $demandes = DemandeLivraison::where('id_entreprise', $request->user()->id)
            ->whereIn('statut', ['EN_ATTENTE', 'ACCEPTEE', 'PROGRAMMEE'])
            ->with(['client.utilisateur', 'typeService', 'paiement'])
            ->orderBy('date_creation')
            ->get();

        return response()->json($demandes);
    }

    /** Cas d'utilisation : "Consulter historique" (toutes les demandes de l'entreprise, tous statuts confondus) */
    public function historique(Request $request)
    {
        $demandes = DemandeLivraison::where('id_entreprise', $request->user()->id)
            ->with(['client.utilisateur', 'typeService', 'mission.livreur.utilisateur', 'paiement'])
            ->orderByDesc('date_creation')
            ->get();

        return response()->json($demandes);
    }

    /** Liste des livreurs assignables (pool commun, cf. cas d'utilisation "Assigner véhicule & livreur") */
    public function livreurs()
    {
        $livreurs = Livreur::with('utilisateur')->get()->map(function (Livreur $livreur) {
            $livreur->disponible = $livreur->estDisponible();
            return $livreur;
        });

        return response()->json($livreurs);
    }

    /** MCT : "Accepter ?" -> Oui -> statut ACCEPTEE / PROGRAMMEE */
    public function accepter(Request $request, DemandeLivraison $demande)
    {
        $this->autoriser($request, $demande);

        $demande->update([
            'statut' => $demande->date_programmee ? 'PROGRAMMEE' : 'ACCEPTEE',
        ]);

        $message = $demande->date_programmee
            ? "Votre demande #{$demande->id} a été acceptée et est programmée pour le " . $demande->date_programmee->format('d/m/Y à H:i') . '.'
            : "Votre demande #{$demande->id} a été acceptée par l'entreprise.";
        Notification::envoyer($demande->id_client, $message);

        return response()->json($demande);
    }

    /** MCT : "Accepter ?" -> Non -> Refuser */
    public function refuser(Request $request, DemandeLivraison $demande)
    {
        $this->autoriser($request, $demande);

        $demande->update(['statut' => 'ANNULEE']);

        Notification::envoyer($demande->id_client, "Votre demande #{$demande->id} a été refusée par l'entreprise.");

        return response()->json($demande);
    }

    /**
     * Cas d'utilisation : "Programmer la date de livraison" -> l'entreprise fixe/modifie la date
     * et le client est notifié. Possible tant que la demande n'est pas encore en cours de livraison.
     */
    public function programmer(Request $request, DemandeLivraison $demande)
    {
        $this->autoriser($request, $demande);

        if (!in_array($demande->statut, ['EN_ATTENTE', 'ACCEPTEE', 'PROGRAMMEE'])) {
            return response()->json(['message' => 'Cette demande ne peut plus être programmée.'], 422);
        }

        $data = $request->validate(['date_programmee' => 'required|date|after:now']);

        $demande->update([
            'date_programmee' => $data['date_programmee'],
            'statut' => 'PROGRAMMEE',
        ]);

        Notification::envoyer(
            $demande->id_client,
            "Votre demande #{$demande->id} est programmée pour le " . $demande->date_programmee->format('d/m/Y à H:i') . '.'
        );

        return response()->json($demande);
    }

    /**
     * MCT : "Assigner véhicule & livreur" -> crée la MISSION -> statut EN_COURS,
     * livreur passe implicitement OCCUPÉ (calculé via Livreur::estDisponible()).
     */
    public function assigner(Request $request, DemandeLivraison $demande)
    {
        $this->autoriser($request, $demande);

        $data = $request->validate([
            'id_livreur' => 'required|exists:livreurs,id',
            'id_vehicule' => 'nullable|exists:vehicules,id',
        ]);

        if (!in_array($demande->statut, ['ACCEPTEE', 'PROGRAMMEE'])) {
            return response()->json(['message' => 'La demande doit être acceptée avant assignation.'], 422);
        }

        $mission = Mission::create([
            'id_demande' => $demande->id,
            'id_livreur' => $data['id_livreur'],
            'id_vehicule' => $data['id_vehicule'] ?? null,
            'date_acceptation' => now(),
            'statut_prise_en_charge' => 'EN_ATTENTE',
        ]);

        $demande->update(['statut' => 'EN_COURS']);

        Notification::envoyer($demande->id_client, "Un livreur a été assigné à votre demande #{$demande->id}, la livraison est en cours.");

        return response()->json($mission->load('livreur.utilisateur', 'vehicule'), 201);
    }

    /** Cas d'utilisation : "Confirmer un paiement en espèces" (le livreur encaisse pour le compte de l'entreprise) */
    public function confirmerPaiement(Request $request, DemandeLivraison $demande)
    {
        $this->autoriser($request, $demande);

        $paiement = $demande->paiement;

        abort_unless($paiement, 422, 'Aucun paiement enregistré pour cette demande.');
        abort_unless($paiement->mode === 'CASH', 422, "Seuls les paiements en espèces nécessitent une confirmation manuelle.");
        abort_if($paiement->statut === 'CONFIRME', 422, 'Ce paiement est déjà confirmé.');

        $paiement->update(['statut' => 'CONFIRME', 'date_transaction' => now()]);

        Notification::envoyer($demande->id_client, "Votre paiement en espèces pour la demande #{$demande->id} a été confirmé.");

        return response()->json($paiement);
    }

    private function autoriser(Request $request, DemandeLivraison $demande): void
    {
        abort_unless($demande->id_entreprise === $request->user()->id, 403, 'Cette demande ne concerne pas votre entreprise.');
    }
}

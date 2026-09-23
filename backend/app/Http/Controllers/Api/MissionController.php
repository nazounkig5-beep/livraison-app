<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Mission;
use App\Models\Notification;
use App\Models\SuiviLivraison;
use Illuminate\Http\Request;

class MissionController extends Controller
{
    /** Cas d'utilisation : "Consulter missions" (livreur) */
    public function index(Request $request)
    {
        $missions = Mission::where('id_livreur', $request->user()->id)
            ->with(['demande.typeService', 'demande.client.utilisateur', 'demande.entreprise', 'vehicule'])
            ->orderByDesc('id')
            ->get();

        return response()->json($missions);
    }

    /** Cas d'utilisation : "Consulter le détail d'une mission" (livreur) */
    public function show(Request $request, Mission $mission)
    {
        $this->autoriser($request, $mission);

        $mission->load(['demande.typeService', 'demande.client.utilisateur', 'demande.entreprise', 'vehicule']);

        return response()->json($mission);
    }

    /** MCT : "Prendre en charge" -> statut_prise_en_charge = EN_COURS, livreur devient OCCUPÉ */
    public function prendreEnCharge(Request $request, Mission $mission)
    {
        $this->autoriser($request, $mission);

        $mission->update(['statut_prise_en_charge' => 'EN_COURS']);

        SuiviLivraison::create([
            'id_mission' => $mission->id,
            'latitude' => $request->input('latitude', 0),
            'longitude' => $request->input('longitude', 0),
            'timestamp' => now(),
            'evenement' => 'prise_en_charge',
        ]);

        return response()->json($mission);
    }

    /** MCT : "Mettre à jour GPS / Suivre" */
    public function mettreAJourPosition(Request $request, Mission $mission)
    {
        $this->autoriser($request, $mission);

        $data = $request->validate([
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
        ]);

        $mission->livreur->update(['latitude' => $data['latitude'], 'longitude' => $data['longitude']]);

        $suivi = SuiviLivraison::create([
            'id_mission' => $mission->id,
            'latitude' => $data['latitude'],
            'longitude' => $data['longitude'],
            'timestamp' => now(),
            'evenement' => 'position',
        ]);

        return response()->json($suivi, 201);
    }

    /**
     * Cas d'utilisation : "Signaler une panne" (livreur bloqué en route — panne mécanique, accident
     * mineur, etc.). Fige la position exacte de l'arrêt (nouveau SuiviLivraison) et prévient
     * l'entreprise, qui peut alors organiser un dépannage en connaissant le lieu précis.
     */
    public function signalerPanne(Request $request, Mission $mission)
    {
        $this->autoriser($request, $mission);

        abort_unless($mission->statut_prise_en_charge === 'EN_COURS', 422, "Cette mission n'est pas en cours.");
        abort_if($mission->en_panne, 422, 'Une panne est déjà en cours sur cette mission.');

        $data = $request->validate([
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'description' => 'nullable|string',
        ]);

        $mission->update([
            'en_panne' => true,
            'panne_depuis' => now(),
            'panne_description' => $data['description'] ?? null,
        ]);

        SuiviLivraison::create([
            'id_mission' => $mission->id,
            'latitude' => $data['latitude'],
            'longitude' => $data['longitude'],
            'timestamp' => now(),
            'evenement' => 'panne',
        ]);

        $demande = $mission->demande;
        if ($demande->id_entreprise) {
            Notification::envoyer(
                $demande->id_entreprise,
                "Le livreur de la demande #{$demande->id} est en panne. Consultez le suivi pour voir sa position exacte et organiser le dépannage."
            );
        }

        return response()->json($mission->fresh());
    }

    /** Cas d'utilisation : "Signaler la fin du dépannage" -> la mission reprend normalement. */
    public function resoudrePanne(Request $request, Mission $mission)
    {
        $this->autoriser($request, $mission);

        abort_unless($mission->en_panne, 422, 'Aucune panne en cours sur cette mission.');

        $data = $request->validate([
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
        ]);

        $mission->update(['en_panne' => false, 'panne_depuis' => null, 'panne_description' => null]);

        SuiviLivraison::create([
            'id_mission' => $mission->id,
            'latitude' => $data['latitude'],
            'longitude' => $data['longitude'],
            'timestamp' => now(),
            'evenement' => 'panne_resolue',
        ]);

        $demande = $mission->demande;
        if ($demande->id_entreprise) {
            Notification::envoyer($demande->id_entreprise, "Le dépannage est terminé pour la demande #{$demande->id} : le livreur a repris sa course.");
        }

        return response()->json($mission->fresh());
    }

    /** MCT : "Vérifier code" */
    public function verifierCode(Request $request, Mission $mission)
    {
        $this->autoriser($request, $mission);

        $data = $request->validate(['code' => 'required|string']);

        if ($mission->demande->code_livraison !== $data['code']) {
            return response()->json(['message' => 'Code de livraison invalide.'], 422);
        }

        return response()->json(['valide' => true]);
    }

    /** MCT : "Marquer livrée" -> DEMANDE.statut = LIVREE, MISSION.statut = TERMINEE, livreur redevient DISPONIBLE */
    public function livrer(Request $request, Mission $mission)
    {
        $this->autoriser($request, $mission);

        $mission->update(['statut_prise_en_charge' => 'TERMINEE']);
        $mission->demande->update(['statut' => 'LIVREE']);

        SuiviLivraison::create([
            'id_mission' => $mission->id,
            'latitude' => $request->input('latitude', $mission->livreur->latitude ?? 0),
            'longitude' => $request->input('longitude', $mission->livreur->longitude ?? 0),
            'timestamp' => now(),
            'evenement' => 'livree',
        ]);

        Notification::envoyer($mission->demande->id_client, "Votre demande #{$mission->id_demande} a été livrée avec succès.");

        return response()->json($mission->fresh(['demande']));
    }

    private function autoriser(Request $request, Mission $mission): void
    {
        abort_unless($mission->id_livreur === $request->user()->id, 403, 'Cette mission ne vous est pas assignée.');
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Abonnement;
use App\Models\Notification;
use Illuminate\Http\Request;

/** Cas d'utilisation Admin : "Superviser les abonnements" (entreprises et livreurs) */
class AdminAbonnementController extends Controller
{
    public function index(Request $request)
    {
        Abonnement::where('statut', 'ACTIF')->whereDate('date_fin', '<', now())->update(['statut' => 'EXPIRE']);

        $abonnements = Abonnement::with(['tarif', 'entreprise.utilisateur', 'livreur.utilisateur'])
            ->orderByDesc('date_debut')
            ->get()
            ->map(function (Abonnement $abonnement) {
                $abonnement->abonne_nom = $abonnement->entreprise?->utilisateur?->nom ?? $abonnement->livreur?->utilisateur?->nom;
                $abonnement->abonne_type = $abonnement->id_entreprise ? 'ENTREPRISE' : 'LIVREUR';
                return $abonnement;
            });

        return response()->json($abonnements);
    }

    /** Cas d'utilisation Admin : "Confirmer un paiement d'abonnement en espèces" */
    public function confirmerPaiement(Abonnement $abonnement)
    {
        abort_unless($abonnement->mode_paiement === 'CASH', 422, "Seuls les paiements en espèces nécessitent une confirmation manuelle.");
        abort_if($abonnement->statut_paiement === 'CONFIRME', 422, 'Ce paiement est déjà confirmé.');

        $abonnement->update(['statut_paiement' => 'CONFIRME']);

        $idAbonne = $abonnement->id_entreprise ?? $abonnement->id_livreur;
        Notification::envoyer($idAbonne, 'Votre paiement en espèces pour votre abonnement a été confirmé par un administrateur.');

        return response()->json($abonnement->load('tarif'));
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Abonnement;
use App\Models\TarifAbonnement;
use Illuminate\Http\Request;

/** Cas d'utilisation : "Gérer abonnements & tarifs" côté entreprise/livreur (souscription et paiement) */
class AbonnementController extends Controller
{
    /**
     * Bascule en EXPIRE tout abonnement ACTIF dont la date de fin est dépassée.
     * Appelé avant chaque lecture : cette appli n'a pas de tâche planifiée qui tourne en continu
     * (le backend ne vit que pendant que l'utilisateur a l'appli ouverte), donc on ne peut pas
     * compter uniquement sur `abonnements:actualiser` (voir routes/console.php) pour garder les
     * statuts à jour — cette vérification à la volée est la vraie garantie de cohérence.
     */
    private function actualiserExpirations($query = null): void
    {
        (($query ?? Abonnement::query()))
            ->where('statut', 'ACTIF')
            ->whereDate('date_fin', '<', now())
            ->update(['statut' => 'EXPIRE']);
    }

    private function abonnementActifCourant(Request $request): ?Abonnement
    {
        $user = $request->user();
        $colonne = $user->role === 'ENTREPRISE' ? 'id_entreprise' : 'id_livreur';

        return Abonnement::where($colonne, $user->id)->where('statut', 'ACTIF')->first();
    }

    public function mesAbonnements(Request $request)
    {
        $user = $request->user();
        $colonne = $user->role === 'ENTREPRISE' ? 'id_entreprise' : 'id_livreur';

        $this->actualiserExpirations(Abonnement::where($colonne, $user->id));

        $abonnements = Abonnement::with('tarif')
            ->where($colonne, $user->id)
            ->orderByDesc('date_debut')
            ->get();

        return response()->json($abonnements);
    }

    public function souscrire(Request $request)
    {
        $data = $request->validate([
            'id_tarif' => 'required|exists:tarif_abonnements,id',
            'mode' => 'required|in:EN_LIGNE,CASH',
        ]);

        $user = $request->user();

        if ($abonnementActif = $this->abonnementActifCourant($request)) {
            return response()->json([
                'message' => "Un abonnement est déjà actif jusqu'au {$abonnementActif->date_fin->format('d/m/Y')}.",
            ], 422);
        }

        $tarif = TarifAbonnement::findOrFail($data['id_tarif']);

        $abonnement = Abonnement::create([
            'id_entreprise' => $user->role === 'ENTREPRISE' ? $user->id : null,
            'id_livreur' => $user->role === 'LIVREUR' ? $user->id : null,
            'id_tarif' => $tarif->id,
            'montant' => $tarif->prix,
            'date_debut' => now(),
            'date_fin' => now()->addMonths($tarif->duree),
            'statut' => 'ACTIF',
            'mode_paiement' => $data['mode'],
            'statut_paiement' => $data['mode'] === 'EN_LIGNE' ? 'CONFIRME' : 'EN_ATTENTE',
        ]);

        return response()->json($abonnement->load('tarif'), 201);
    }
}

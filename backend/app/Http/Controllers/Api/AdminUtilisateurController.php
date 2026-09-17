<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Utilisateur;
use Illuminate\Http\Request;

/** Cas d'utilisation : "Gérer utilisateurs" */
class AdminUtilisateurController extends Controller
{
    public function index(Request $request)
    {
        $query = Utilisateur::with(['client.demandes', 'entreprise.demandes', 'livreur.missions']);

        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        if ($request->filled('recherche')) {
            $recherche = $request->recherche;
            $query->where(
                fn ($q) => $q->where('nom', 'ilike', "%{$recherche}%")->orWhere('email', 'ilike', "%{$recherche}%")
            );
        }

        $utilisateurs = $query->orderByDesc('date_creation')->get()->map(fn (Utilisateur $u) => [
            'id' => $u->id,
            'nom' => $u->nom,
            'email' => $u->email,
            'role' => $u->role,
            'statut_compte' => $u->statut_compte,
            'date_creation' => $u->date_creation,
            'activite' => $this->activite($u),
        ]);

        return response()->json([
            'utilisateurs' => $utilisateurs,
            'stats' => [
                'total' => Utilisateur::count(),
                'clients' => Utilisateur::where('role', 'CLIENT')->count(),
                'entreprises' => Utilisateur::where('role', 'ENTREPRISE')->count(),
                'livreurs' => Utilisateur::where('role', 'LIVREUR')->count(),
                'admins' => Utilisateur::where('role', 'ADMIN')->count(),
            ],
        ]);
    }

    /** Résumé d'activité affiché dans la colonne "Activité" de la liste, selon le rôle. */
    private function activite(Utilisateur $u): ?string
    {
        return match ($u->role) {
            'CLIENT' => ($u->client?->demandes->count() ?? 0) . ' demande(s)',
            'ENTREPRISE' => ($u->entreprise?->demandes->count() ?? 0) . ' livraison(s)',
            'LIVREUR' => ($u->livreur?->missions->count() ?? 0) . ' mission(s)',
            default => null,
        };
    }

    public function suspendre(Utilisateur $utilisateur)
    {
        $utilisateur->update(['statut_compte' => 'SUSPENDU']);
        return response()->json($utilisateur);
    }

    public function reactiver(Utilisateur $utilisateur)
    {
        $utilisateur->update(['statut_compte' => 'ACTIF']);
        return response()->json($utilisateur);
    }

    /**
     * Suppression définitive d'un compte. Bloquée dès qu'un historique existe et que la BD
     * refuserait la suppression (contrainte RESTRICT sur demande_livraisons.id_client /
     * missions.id_livreur) ou que ce serait dangereux pour l'activité en cours — dans ces cas,
     * suspendre reste la bonne action au lieu de supprimer.
     */
    public function destroy(Request $request, Utilisateur $utilisateur)
    {
        abort_if($utilisateur->id === $request->user()->id, 422, 'Utilisez la zone dangereuse de votre profil pour supprimer votre propre compte.');

        if ($raison = $utilisateur->raisonBlocageSuppression()) {
            abort(422, $raison);
        }

        $utilisateur->delete();

        return response()->json(['message' => 'Utilisateur supprimé.']);
    }
}

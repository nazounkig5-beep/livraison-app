<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Entreprise;
use App\Models\Livreur;
use App\Models\Utilisateur;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    /**
     * Cas d'utilisation : "Créer compte utilisateur" + "Vérifier rôle"
     * Crée l'UTILISATEUR puis la table fille correspondant au rôle (héritage 1,1-0,1 du MCD).
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nom' => 'required|string|max:255',
            'email' => 'required|email|unique:utilisateurs,email',
            'mot_de_passe' => 'required|string|min:6',
            'role' => 'required|in:CLIENT,LIVREUR,ENTREPRISE',
            // champs spécifiques optionnels selon le rôle
            'adresse_facturation' => 'nullable|string',
            'siret' => 'nullable|required_if:role,ENTREPRISE|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $utilisateur = DB::transaction(function () use ($request) {
            $utilisateur = Utilisateur::create([
                'nom' => $request->nom,
                'email' => $request->email,
                'mot_de_passe' => Hash::make($request->mot_de_passe),
                'role' => $request->role,
                'statut_compte' => 'ACTIF',
                'date_creation' => now(),
            ]);

            match ($request->role) {
                'CLIENT' => Client::create([
                    'id' => $utilisateur->id,
                    'adresse_facturation' => $request->adresse_facturation,
                ]),
                // Un livreur employé par une entreprise est créé via Api\EmployeController::store, pas ici.
                'LIVREUR' => Livreur::create([
                    'id' => $utilisateur->id,
                    'type' => 'INDEPENDANT',
                ]),
                'ENTREPRISE' => Entreprise::create([
                    'id' => $utilisateur->id,
                    'siret' => $request->siret,
                    'nom' => $request->nom,
                    'statut_validation' => 'EN_ATTENTE', // validée ensuite par l'admin
                ]),
            };

            return $utilisateur;
        });

        $token = $utilisateur->createToken('api-token')->plainTextToken;

        return response()->json([
            'utilisateur' => $utilisateur,
            'token' => $token,
        ], 201);
    }

    /** Cas d'utilisation : "S'authentifier" */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'mot_de_passe' => 'required|string',
        ]);

        $utilisateur = Utilisateur::where('email', $request->email)->first();

        if (!$utilisateur || !Hash::check($request->mot_de_passe, $utilisateur->mot_de_passe)) {
            return response()->json(['message' => 'Identifiants invalides.'], 401);
        }

        if ($utilisateur->statut_compte === 'SUSPENDU') {
            return response()->json(['message' => 'Compte suspendu.'], 403);
        }

        $token = $utilisateur->createToken('api-token')->plainTextToken;

        return response()->json(['utilisateur' => $utilisateur, 'token' => $token]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Déconnecté.']);
    }

    public function me(Request $request)
    {
        $user = $request->user();
        $user->load(match ($user->role) {
            'CLIENT' => 'client',
            'LIVREUR' => 'livreur',
            'ENTREPRISE' => 'entreprise',
            default => [],
        });

        return response()->json($user);
    }

    /** Cas d'utilisation : "Gérer mon compte" (nom / email / téléphone / ville / adresse) */
    public function mettreAJourProfil(Request $request)
    {
        $utilisateur = $request->user();

        $data = $request->validate([
            'nom' => 'required|string|max:255',
            'email' => 'required|email|unique:utilisateurs,email,' . $utilisateur->id,
            'telephone' => 'nullable|string|max:30',
            'ville' => 'nullable|string|max:255',
            'adresse' => 'nullable|string|max:1000',
        ]);

        $utilisateur->update($data);

        return response()->json($utilisateur);
    }

    /** Cas d'utilisation : "Changer ma photo de profil" */
    public function mettreAJourPhoto(Request $request)
    {
        $request->validate(['photo' => 'required|image|max:2048']);

        $utilisateur = $request->user();

        if ($utilisateur->photo) {
            Storage::disk('public')->delete($utilisateur->photo);
        }

        $chemin = $request->file('photo')->store('photos', 'public');
        $utilisateur->update(['photo' => $chemin]);

        return response()->json($utilisateur);
    }

    /** Cas d'utilisation : "Supprimer mon compte" (zone dangereuse du profil) */
    public function supprimerMonCompte(Request $request)
    {
        $utilisateur = $request->user();

        if ($raison = $utilisateur->raisonBlocageSuppression()) {
            abort(422, $raison);
        }

        if ($utilisateur->photo) {
            Storage::disk('public')->delete($utilisateur->photo);
        }

        $utilisateur->delete();

        return response()->json(['message' => 'Compte supprimé.']);
    }

    /** Cas d'utilisation : "Changer mon mot de passe" */
    public function changerMotDePasse(Request $request)
    {
        $data = $request->validate([
            'ancien_mot_de_passe' => 'required|string',
            'nouveau_mot_de_passe' => 'required|string|min:6',
        ]);

        $utilisateur = $request->user();

        if (!Hash::check($data['ancien_mot_de_passe'], $utilisateur->mot_de_passe)) {
            return response()->json(['message' => 'Mot de passe actuel incorrect.'], 422);
        }

        $utilisateur->update(['mot_de_passe' => Hash::make($data['nouveau_mot_de_passe'])]);

        return response()->json(['message' => 'Mot de passe mis à jour.']);
    }
}

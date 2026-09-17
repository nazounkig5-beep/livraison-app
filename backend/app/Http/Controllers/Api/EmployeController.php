<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Livreur;
use App\Models\Utilisateur;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

/** Cas d'utilisation Entreprise : "Gérer mes livreurs employés" */
class EmployeController extends Controller
{
    public function index(Request $request)
    {
        $employes = Livreur::where('id_entreprise', $request->user()->id)
            ->with('utilisateur')
            ->get();

        return response()->json($employes);
    }

    /** Crée directement le compte LIVREUR (type EMPLOYE) rattaché à l'entreprise connectée */
    public function store(Request $request)
    {
        $data = $request->validate([
            'nom' => 'required|string|max:255',
            'email' => 'required|email|unique:utilisateurs,email',
            'mot_de_passe' => 'required|string|min:6',
        ]);

        $utilisateur = Utilisateur::create([
            'nom' => $data['nom'],
            'email' => $data['email'],
            'mot_de_passe' => Hash::make($data['mot_de_passe']),
            'role' => 'LIVREUR',
            'statut_compte' => 'ACTIF',
            'date_creation' => now(),
        ]);

        $livreur = Livreur::create([
            'id' => $utilisateur->id,
            'id_entreprise' => $request->user()->id,
            'type' => 'EMPLOYE',
        ]);

        return response()->json($livreur->load('utilisateur'), 201);
    }

    /** Détache le livreur de l'entreprise (il redevient indépendant) sans supprimer son compte */
    public function destroy(Request $request, Livreur $livreur)
    {
        abort_unless($livreur->id_entreprise === $request->user()->id, 403);

        $livreur->update(['id_entreprise' => null, 'type' => 'INDEPENDANT']);

        return response()->json(['message' => 'Livreur détaché de l\'entreprise.']);
    }
}

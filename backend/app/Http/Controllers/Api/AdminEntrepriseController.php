<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Entreprise;
use Illuminate\Http\Request;

/** Cas d'utilisation : "Valider dossier entreprise" / "Gérer entreprises" */
class AdminEntrepriseController extends Controller
{
    public function index()
    {
        return response()->json(Entreprise::with('utilisateur')->get());
    }

    public function valider(Request $request, Entreprise $entreprise)
    {
        $data = $request->validate(['statut_validation' => 'required|in:ACTIVE,REJETEE']);

        $entreprise->update([
            'statut_validation' => $data['statut_validation'],
            'date_validation' => now(),
        ]);

        return response()->json($entreprise);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DemandeLivraison;
use Illuminate\Http\Request;

/** Cas d'utilisation Entreprise : "Consulter dashboard" */
class EntrepriseDashboardController extends Controller
{
    public function index(Request $request)
    {
        $entreprise = $request->user()->entreprise;

        $demandesParStatut = DemandeLivraison::where('id_entreprise', $entreprise->id)
            ->selectRaw('statut, count(*) as total')
            ->groupBy('statut')
            ->pluck('total', 'statut');

        $demandesRecentes = DemandeLivraison::where('id_entreprise', $entreprise->id)
            ->where('statut', 'EN_ATTENTE')
            ->with(['client.utilisateur', 'typeService'])
            ->orderBy('date_creation')
            ->limit(5)
            ->get();

        return response()->json([
            'total_demandes' => $demandesParStatut->sum(),
            'demandes_par_statut' => $demandesParStatut,
            'demandes_en_attente' => $demandesParStatut['EN_ATTENTE'] ?? 0,
            'total_vehicules' => $entreprise->vehicules()->count(),
            'total_employes' => $entreprise->employes()->count(),
            'demandes_recentes' => $demandesRecentes,
        ]);
    }
}

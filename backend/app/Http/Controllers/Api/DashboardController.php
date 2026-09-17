<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DemandeLivraison;
use App\Models\Entreprise;
use App\Models\Incident;
use App\Models\Utilisateur;
use Illuminate\Http\Request;

/** Cas d'utilisation : "Consulter dashboard" (admin) */
class DashboardController extends Controller
{
    public function index(Request $request)
    {
        return response()->json([
            'total_utilisateurs' => Utilisateur::count(),
            'total_entreprises' => Entreprise::count(),
            'entreprises_en_attente' => Entreprise::where('statut_validation', 'EN_ATTENTE')->count(),
            'demandes_par_statut' => DemandeLivraison::selectRaw('statut, count(*) as total')->groupBy('statut')->pluck('total', 'statut'),
            'incidents_ouverts' => Incident::where('statut', 'OUVERT')->count(),
        ]);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Entreprise;
use App\Models\TarifAbonnement;
use App\Models\TypeService;
use App\Models\TypeVehicule;
use Illuminate\Http\Request;

/** Cas d'utilisation : "Configurer paramètres" (types de véhicule/service) + "Gérer abonnements & tarifs" */
class AdminParametreController extends Controller
{
    public function typesVehicule()
    {
        return response()->json(TypeVehicule::all());
    }

    public function storeTypeVehicule(Request $request)
    {
        $data = $request->validate(['nom' => 'required|in:moto,tricycle,cargo,camion']);
        return response()->json(TypeVehicule::create($data), 201);
    }

    public function typesService()
    {
        return response()->json(TypeService::all());
    }

    public function storeTypeService(Request $request)
    {
        $data = $request->validate(['nom' => 'required|in:livraison,demenagement,transport_materiel']);
        return response()->json(TypeService::create($data), 201);
    }

    public function tarifsAbonnement()
    {
        return response()->json(TarifAbonnement::all());
    }

    public function storeTarifAbonnement(Request $request)
    {
        $data = $request->validate([
            'nom' => 'required|string',
            'duree' => 'required|integer|min:1',
            'prix' => 'required|numeric|min:0',
            'description' => 'nullable|string',
        ]);

        return response()->json(TarifAbonnement::create($data), 201);
    }

    /** Cas d'utilisation Client : "Choisir l'entreprise" à qui envoyer une demande de livraison */
    public function entreprisesActives()
    {
        return response()->json(Entreprise::where('statut_validation', 'ACTIVE')->orderBy('nom')->get(['id', 'nom']));
    }
}

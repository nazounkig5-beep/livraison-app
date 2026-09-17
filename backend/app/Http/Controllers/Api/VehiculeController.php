<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Vehicule;
use Illuminate\Http\Request;

/** Cas d'utilisation : "Gérer véhicules / employés" (entreprise) */
class VehiculeController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(
            Vehicule::where('id_entreprise', $request->user()->id)->with('typeVehicule')->get()
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'id_type_vehicule' => 'required|exists:type_vehicules,id',
            'immatriculation' => 'required|string|unique:vehicules,immatriculation',
        ]);

        $vehicule = Vehicule::create([
            'id_entreprise' => $request->user()->id,
            'id_type_vehicule' => $data['id_type_vehicule'],
            'immatriculation' => $data['immatriculation'],
            'statut' => 'DISPONIBLE',
        ]);

        return response()->json($vehicule, 201);
    }

    public function update(Request $request, Vehicule $vehicule)
    {
        abort_unless($vehicule->id_entreprise === $request->user()->id, 403);

        $data = $request->validate([
            'statut' => 'sometimes|in:DISPONIBLE,EN_MAINTENANCE',
            'immatriculation' => 'sometimes|string|unique:vehicules,immatriculation,' . $vehicule->id,
        ]);

        $vehicule->update($data);
        return response()->json($vehicule);
    }

    public function destroy(Request $request, Vehicule $vehicule)
    {
        abort_unless($vehicule->id_entreprise === $request->user()->id, 403);
        $vehicule->delete();
        return response()->json(['message' => 'Véhicule supprimé.']);
    }
}

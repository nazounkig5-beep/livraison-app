<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DemandeLivraison;
use App\Models\Incident;
use Illuminate\Http\Request;

/** Cas d'utilisation : "Gérer incidents" */
class IncidentController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $query = Incident::with('demande');

        // Un client/entreprise/livreur ne voit que les incidents liés à ses propres demandes ; l'admin voit tout.
        if ($user->role !== 'ADMIN') {
            $query->whereHas('demande', function ($q) use ($user) {
                $q->where('id_client', $user->id)
                    ->orWhere('id_entreprise', $user->id)
                    ->orWhereHas('mission', fn ($m) => $m->where('id_livreur', $user->id));
            });
        }

        return response()->json($query->orderByDesc('date_ouverture')->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'id_demande' => 'required|exists:demande_livraisons,id',
            'description' => 'required|string',
        ]);

        $demande = DemandeLivraison::with('mission')->findOrFail($data['id_demande']);
        $user = $request->user();

        $concerne = $demande->id_client === $user->id
            || $demande->id_entreprise === $user->id
            || $demande->mission?->id_livreur === $user->id;

        abort_unless($concerne, 403, 'Cette demande ne vous concerne pas.');

        $incident = Incident::create([
            'id_demande' => $data['id_demande'],
            'description' => $data['description'],
            'statut' => 'OUVERT',
            'date_ouverture' => now(),
        ]);

        return response()->json($incident, 201);
    }

    public function resoudre(Request $request, Incident $incident)
    {
        abort_unless($request->user()->role === 'ADMIN', 403);
        $incident->update(['statut' => 'RESOLU']);
        return response()->json($incident);
    }
}

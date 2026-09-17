<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

/** Cas d'utilisation Livreur : "Consulter le QR code de paiement de mon entreprise" */
class LivreurProfilController extends Controller
{
    public function monEntreprise(Request $request)
    {
        $livreur = $request->user()->livreur;

        abort_unless($livreur?->id_entreprise, 404, "Vous n'êtes employé par aucune entreprise.");

        return response()->json($livreur->entreprise);
    }
}

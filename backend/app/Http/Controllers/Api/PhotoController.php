<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Storage;

/**
 * Sert les photos de profil stockées sur le disque "public", sans dépendre du lien symbolique
 * public/storage (peu fiable sur Windows sans droits admin/mode développeur).
 */
class PhotoController extends Controller
{
    public function afficher(string $nomFichier)
    {
        $chemin = 'photos/' . basename($nomFichier);

        abort_unless(Storage::disk('public')->exists($chemin), 404);

        return response()->file(Storage::disk('public')->path($chemin));
    }
}

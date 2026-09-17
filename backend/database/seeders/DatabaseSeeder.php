<?php

namespace Database\Seeders;

use App\Models\Utilisateur;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /** Crée le compte ADMIN initial (aucune inscription publique ne permet ce rôle, cf. AuthController::register) */
    public function run(): void
    {
        Utilisateur::firstOrCreate(
            ['email' => 'admin@livraison-app.local'],
            [
                'nom' => 'Administrateur',
                'mot_de_passe' => Hash::make('admin123'),
                'role' => 'ADMIN',
                'statut_compte' => 'ACTIF',
                'date_creation' => now(),
            ]
        );
    }
}

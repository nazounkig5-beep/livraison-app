<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Cas d'utilisation Livreur : "Signaler une panne" avec une photo, pour que l'entreprise voie
 * exactement de quoi il s'agit (crevaison, moteur, accident mineur...) en plus de la position GPS.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('suivi_livraisons', function (Blueprint $table) {
            $table->string('photo')->nullable()->after('evenement');
        });
    }

    public function down(): void
    {
        Schema::table('suivi_livraisons', function (Blueprint $table) {
            $table->dropColumn('photo');
        });
    }
};

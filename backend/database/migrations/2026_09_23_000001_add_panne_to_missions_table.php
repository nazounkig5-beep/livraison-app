<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Cas d'utilisation Livreur/Entreprise : "Signaler une panne" en cours de mission.
 * Volontairement un simple drapeau à côté de statut_prise_en_charge (qui reste EN_COURS pendant
 * la panne) plutôt qu'une nouvelle valeur d'enum : ça évite de casser tout ce qui teste déjà
 * statut_prise_en_charge === 'EN_COURS' (Livreur::estDisponible(), les templates, etc.) et évite
 * la manipulation d'un CHECK constraint Postgres pour ajouter une valeur d'enum.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('missions', function (Blueprint $table) {
            $table->boolean('en_panne')->default(false)->after('statut_prise_en_charge');
            $table->timestamp('panne_depuis')->nullable()->after('en_panne');
            $table->text('panne_description')->nullable()->after('panne_depuis');
        });
    }

    public function down(): void
    {
        Schema::table('missions', function (Blueprint $table) {
            $table->dropColumn(['en_panne', 'panne_depuis', 'panne_description']);
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('demande_livraisons', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_client')->constrained('clients');
            $table->foreignId('id_entreprise')->nullable()->constrained('entreprises')->nullOnDelete();
            $table->foreignId('id_type_service')->constrained('type_services');
            $table->string('adresse_depart');
            $table->string('adresse_arrivee');
            $table->decimal('distance', 8, 2)->nullable(); // km
            $table->decimal('tarif_estime', 10, 2)->nullable();
            $table->string('code_livraison', 6)->nullable(); // code de vérification à la livraison
            $table->enum('statut', [
                'EN_ATTENTE', 'ACCEPTEE', 'PROGRAMMEE', 'EN_COURS', 'LIVREE', 'ANNULEE',
            ])->default('EN_ATTENTE');
            $table->timestamp('date_creation')->useCurrent();
            $table->timestamp('date_programmee')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('demande_livraisons');
    }
};

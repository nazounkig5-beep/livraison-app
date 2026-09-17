<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('missions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_demande')->constrained('demande_livraisons')->cascadeOnDelete();
            $table->foreignId('id_livreur')->constrained('livreurs');
            $table->foreignId('id_vehicule')->nullable()->constrained('vehicules')->nullOnDelete();
            $table->timestamp('date_acceptation')->nullable();
            $table->enum('statut_prise_en_charge', ['EN_ATTENTE', 'EN_COURS', 'TERMINEE'])->default('EN_ATTENTE');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('missions');
    }
};

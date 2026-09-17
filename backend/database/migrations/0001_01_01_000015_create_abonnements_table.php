<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('abonnements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_entreprise')->nullable()->constrained('entreprises')->cascadeOnDelete();
            $table->foreignId('id_livreur')->nullable()->constrained('livreurs')->cascadeOnDelete();
            $table->foreignId('id_tarif')->constrained('tarif_abonnements');
            $table->date('date_debut');
            $table->date('date_fin');
            $table->enum('statut', ['ACTIF', 'EXPIRE', 'SUSPENDU'])->default('ACTIF');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('abonnements');
    }
};

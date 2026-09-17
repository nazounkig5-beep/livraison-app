<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('vehicules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_entreprise')->constrained('entreprises')->cascadeOnDelete();
            $table->foreignId('id_type_vehicule')->constrained('type_vehicules');
            $table->string('immatriculation')->unique();
            $table->enum('statut', ['DISPONIBLE', 'EN_MAINTENANCE'])->default('DISPONIBLE');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vehicules');
    }
};

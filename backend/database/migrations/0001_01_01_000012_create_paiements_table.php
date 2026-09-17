<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('paiements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_demande')->constrained('demande_livraisons')->cascadeOnDelete();
            $table->decimal('montant', 10, 2);
            $table->enum('mode', ['EN_LIGNE', 'CASH']);
            $table->enum('statut', ['EN_ATTENTE', 'CONFIRME', 'ECHEC'])->default('EN_ATTENTE');
            $table->timestamp('date_transaction')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('paiements');
    }
};

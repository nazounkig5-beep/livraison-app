<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('incidents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_demande')->constrained('demande_livraisons')->cascadeOnDelete();
            $table->text('description');
            $table->enum('statut', ['OUVERT', 'RESOLU'])->default('OUVERT');
            $table->timestamp('date_ouverture')->useCurrent();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('incidents');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('notations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_demande')->constrained('demande_livraisons')->cascadeOnDelete();
            $table->foreignId('id_auteur')->constrained('utilisateurs');
            $table->unsignedTinyInteger('note'); // 1..5
            $table->text('commentaire')->nullable();
            $table->timestamp('date')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notations');
    }
};

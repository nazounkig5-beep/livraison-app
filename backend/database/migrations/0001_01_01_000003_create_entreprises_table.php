<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('entreprises', function (Blueprint $table) {
            $table->foreignId('id')->primary()->constrained('utilisateurs')->cascadeOnDelete();
            $table->string('siret')->unique();
            $table->string('nom');
            $table->enum('statut_validation', ['EN_ATTENTE', 'ACTIVE', 'REJETEE'])->default('EN_ATTENTE');
            $table->timestamp('date_validation')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('entreprises');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('utilisateurs', function (Blueprint $table) {
            $table->id();
            $table->string('nom');
            $table->string('email')->unique();
            $table->string('mot_de_passe'); // hashed
            $table->enum('role', ['ADMIN', 'CLIENT', 'LIVREUR', 'ENTREPRISE', 'EMPLOYE']);
            $table->enum('statut_compte', ['ACTIF', 'SUSPENDU'])->default('ACTIF');
            $table->timestamp('date_creation')->useCurrent();
            $table->rememberToken();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('utilisateurs');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('livreurs', function (Blueprint $table) {
            $table->foreignId('id')->primary()->constrained('utilisateurs')->cascadeOnDelete();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->decimal('note_moyenne', 3, 2)->default(0);
            $table->enum('type', ['EMPLOYE', 'INDEPENDANT'])->default('INDEPENDANT');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('livreurs');
    }
};

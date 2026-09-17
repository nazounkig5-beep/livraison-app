<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Table fille : id = FK vers utilisateurs (héritage 1,1 - 0,1)
        Schema::create('clients', function (Blueprint $table) {
            $table->foreignId('id')->primary()->constrained('utilisateurs')->cascadeOnDelete();
            $table->string('adresse_facturation')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clients');
    }
};

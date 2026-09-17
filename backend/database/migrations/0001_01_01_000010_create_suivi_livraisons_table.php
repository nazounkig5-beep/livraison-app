<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('suivi_livraisons', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_mission')->constrained('missions')->cascadeOnDelete();
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->timestamp('timestamp')->useCurrent();
            $table->string('evenement')->nullable(); // ex: "prise_en_charge", "position", "livree"
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('suivi_livraisons');
    }
};

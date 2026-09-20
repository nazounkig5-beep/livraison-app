<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('demande_livraisons', function (Blueprint $table) {
            $table->decimal('latitude_arrivee', 10, 7)->nullable()->after('adresse_arrivee');
            $table->decimal('longitude_arrivee', 10, 7)->nullable()->after('latitude_arrivee');
        });
    }

    public function down(): void
    {
        Schema::table('demande_livraisons', function (Blueprint $table) {
            $table->dropColumn(['latitude_arrivee', 'longitude_arrivee']);
        });
    }
};

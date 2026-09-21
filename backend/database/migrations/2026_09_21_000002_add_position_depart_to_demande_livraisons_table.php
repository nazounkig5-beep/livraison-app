<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('demande_livraisons', function (Blueprint $table) {
            $table->decimal('latitude_depart', 10, 7)->nullable()->after('adresse_depart');
            $table->decimal('longitude_depart', 10, 7)->nullable()->after('latitude_depart');
        });
    }

    public function down(): void
    {
        Schema::table('demande_livraisons', function (Blueprint $table) {
            $table->dropColumn(['latitude_depart', 'longitude_depart']);
        });
    }
};

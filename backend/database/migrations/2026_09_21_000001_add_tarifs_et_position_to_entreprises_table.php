<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('entreprises', function (Blueprint $table) {
            $table->decimal('latitude', 10, 7)->nullable()->after('nom');
            $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
            $table->decimal('frais_base', 10, 2)->nullable()->after('longitude');
            $table->decimal('prix_par_km', 10, 2)->nullable()->after('frais_base');
        });
    }

    public function down(): void
    {
        Schema::table('entreprises', function (Blueprint $table) {
            $table->dropColumn(['latitude', 'longitude', 'frais_base', 'prix_par_km']);
        });
    }
};

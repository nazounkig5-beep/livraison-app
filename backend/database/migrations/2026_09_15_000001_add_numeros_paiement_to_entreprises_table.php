<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('entreprises', function (Blueprint $table) {
            $table->string('numero_orange')->nullable()->after('nom');
            $table->string('numero_moov')->nullable()->after('numero_orange');
        });
    }

    public function down(): void
    {
        Schema::table('entreprises', function (Blueprint $table) {
            $table->dropColumn(['numero_orange', 'numero_moov']);
        });
    }
};

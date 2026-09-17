<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('paiements', function (Blueprint $table) {
            $table->string('provider')->nullable()->after('mode');
            $table->string('reference_externe')->nullable()->unique()->after('provider');
            $table->string('lien_paiement')->nullable()->after('reference_externe');
        });
    }

    public function down(): void
    {
        Schema::table('paiements', function (Blueprint $table) {
            $table->dropColumn(['provider', 'reference_externe', 'lien_paiement']);
        });
    }
};

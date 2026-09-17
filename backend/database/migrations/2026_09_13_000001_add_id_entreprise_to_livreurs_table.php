<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('livreurs', function (Blueprint $table) {
            $table->foreignId('id_entreprise')->nullable()->after('id')->constrained('entreprises')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('livreurs', function (Blueprint $table) {
            $table->dropConstrainedForeignId('id_entreprise');
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('abonnements', function (Blueprint $table) {
            $table->decimal('montant', 10, 2)->after('id_tarif')->default(0);
            $table->enum('mode_paiement', ['EN_LIGNE', 'CASH'])->after('statut')->default('CASH');
            $table->enum('statut_paiement', ['EN_ATTENTE', 'CONFIRME'])->after('mode_paiement')->default('EN_ATTENTE');
        });
    }

    public function down(): void
    {
        Schema::table('abonnements', function (Blueprint $table) {
            $table->dropColumn(['montant', 'mode_paiement', 'statut_paiement']);
        });
    }
};

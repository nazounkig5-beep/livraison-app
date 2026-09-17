<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('entreprises', function (Blueprint $table) {
            $table->string('cinetpay_site_id')->nullable()->after('numero_moov');
            $table->text('cinetpay_api_key')->nullable()->after('cinetpay_site_id');
        });
    }

    public function down(): void
    {
        Schema::table('entreprises', function (Blueprint $table) {
            $table->dropColumn(['cinetpay_site_id', 'cinetpay_api_key']);
        });
    }
};

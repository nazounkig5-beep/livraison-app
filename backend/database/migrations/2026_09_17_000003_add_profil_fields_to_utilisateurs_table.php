<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('utilisateurs', function (Blueprint $table) {
            $table->string('telephone')->nullable()->after('email');
            $table->string('ville')->nullable()->after('telephone');
            $table->text('adresse')->nullable()->after('ville');
            $table->string('photo')->nullable()->after('adresse');
        });
    }

    public function down(): void
    {
        Schema::table('utilisateurs', function (Blueprint $table) {
            $table->dropColumn(['telephone', 'ville', 'adresse', 'photo']);
        });
    }
};

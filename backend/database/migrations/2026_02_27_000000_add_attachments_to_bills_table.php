<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('bills', function (Blueprint $table) {
            $table->json('attachments')->nullable()->after('attachment');
        });

        // Migrate existing single attachments to the new JSON array column
        DB::statement("UPDATE bills SET attachments = JSON_ARRAY(attachment) WHERE attachment IS NOT NULL AND attachment != ''");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Copy the first attachment back to attachment (lossy down migration, but acceptable for rollback)
        DB::statement("UPDATE bills SET attachment = JSON_UNQUOTE(JSON_EXTRACT(attachments, '$[0]')) WHERE attachments IS NOT NULL AND JSON_LENGTH(attachments) > 0");

        Schema::table('bills', function (Blueprint $table) {
            $table->dropColumn('attachments');
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('securities_tracking', function (Blueprint $table) {
            $table->string('paid_by')->nullable();
            $table->string('cheque_name')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('securities_tracking', function (Blueprint $table) {
            $table->dropColumn(['paid_by', 'cheque_name']);
        });
    }
};

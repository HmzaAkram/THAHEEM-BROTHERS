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
        Schema::table('securities_tracking', function (Blueprint $blueprint) {
            if (!Schema::hasColumn('securities_tracking', 'deposit_bank')) {
                $blueprint->string('deposit_bank')->nullable()->after('pay_order_no');
            }
            if (!Schema::hasColumn('securities_tracking', 'attachment')) {
                $blueprint->string('attachment')->nullable()->after('deposit_bank');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('securities_tracking', function (Blueprint $blueprint) {
            $blueprint->dropColumn(['deposit_bank', 'attachment']);
        });
    }
};

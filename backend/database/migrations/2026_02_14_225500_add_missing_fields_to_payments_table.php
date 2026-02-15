<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->decimal('adjustment', 15, 2)->default(0)->after('amount');
            $table->string('tracking_id')->nullable()->after('adjustment');
            $table->string('cheque_no')->nullable()->after('tracking_id');
            $table->string('pay_order_no')->nullable()->after('cheque_no');
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn(['adjustment', 'tracking_id', 'cheque_no', 'pay_order_no']);
        });
    }
};

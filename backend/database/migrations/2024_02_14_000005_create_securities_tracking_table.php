<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('securities_tracking', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->onDelete('cascade');
            $table->string('company_name');
            $table->string('gd_number');
            $table->integer('no_of_containers');
            $table->text('container_no');
            $table->decimal('amount_per_container', 15, 2);
            $table->decimal('total_amount', 15, 2);
            $table->integer('refund_days')->default(7);
            $table->string('port')->nullable();
            $table->boolean('is_document_submitted')->default(false);
            $table->date('refund_due_date');
            $table->boolean('is_refund_received')->default(false);
            $table->date('received_amount_date')->nullable();
            $table->string('pay_order_no')->nullable();
            $table->string('receiver_name')->nullable();
            $table->string('status')->default('Pending');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('securities_tracking');
    }
};

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
        Schema::create('sale_taxes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->onDelete('cascade');
            $table->string('company_name');
            $table->date('date');
            
            // Custom Fields for Sale Tax Invoice
            $table->string('ref_bill_no')->nullable();
            $table->string('clearing_forwarding_of')->nullable();
            $table->string('packages')->nullable();
            $table->string('igm_egm')->nullable();
            $table->date('igm_egm_date')->nullable();
            $table->string('index_no')->nullable();
            $table->string('gd_no')->nullable();
            $table->date('gd_date')->nullable();
            
            // Financial Fields
            $table->decimal('value', 15, 2)->default(0);
            $table->decimal('service_charges', 15, 2)->default(0);
            $table->decimal('sales_tax_percentage', 5, 2)->default(15);
            $table->string('words')->nullable(); // Amount in words
            
            $table->string('status')->default('Pending');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sale_taxes');
    }
};

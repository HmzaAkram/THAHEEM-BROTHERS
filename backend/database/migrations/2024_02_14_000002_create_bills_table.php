<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bills', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->onDelete('cascade');
            $table->string('company_name'); // Denormalized for quick access
            $table->string('bill_no')->nullable();
            $table->date('date');
            $table->string('job_number');
            $table->string('via')->nullable();
            $table->string('weight')->nullable();
            $table->string('packages')->nullable();
            $table->string('exporter')->nullable();
            $table->string('invoice_no')->nullable();
            $table->date('invoice_date')->nullable();
            $table->string('be_number')->nullable();
            $table->string('hawb')->nullable();
            $table->string('igm')->nullable();
            $table->string('index_no')->nullable(); // Rename index to index_no to avoid SQL reserved keyword issues
            $table->string('gd_number')->nullable();
            $table->integer('no_of_containers')->nullable();
            $table->string('container_no')->nullable();
            $table->decimal('total_amount', 15, 2)->default(0);
            $table->decimal('service_charges', 15, 2)->default(0);
            $table->decimal('sales_tax', 15, 2)->default(0);
            $table->decimal('advance_payment', 15, 2)->default(0);
            $table->decimal('grand_total', 15, 2)->default(0);
            $table->string('attachment_path')->nullable();
            $table->string('status')->default('Pending');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bills');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Adds performance indexes to bills, payments, and companies tables.
     * These indexes dramatically improve query performance, especially for:
     * - Filtering bills by company, date, status
     * - Finding bills by bill_no or job_number
     * - Loading company payments
     */
    public function up(): void
    {
        // PERFORMANCE FIX: Add indexes to frequently queried columns
        // Check for existing indexes before creating to avoid errors
        
        $connection = Schema::getConnection();
        $dbName = $connection->getDatabaseName();
        
        // Helper function to check if index exists
        $indexExists = function($table, $indexName) use ($connection, $dbName) {
            $result = $connection->select(
                "SELECT COUNT(*) as count FROM information_schema.statistics 
                 WHERE table_schema = ? AND table_name = ? AND index_name = ?",
                [$dbName, $table, $indexName]
            );
            return $result[0]->count > 0;
        };
        
        // Add indexes to bills table
        if (!$indexExists('bills', 'bills_bill_no_index')) {
            Schema::table('bills', function (Blueprint $table) {
                $table->index('bill_no', 'bills_bill_no_index');
            });
        }
        
        if (!$indexExists('bills', 'bills_date_index')) {
            Schema::table('bills', function (Blueprint $table) {
                $table->index('date', 'bills_date_index');
            });
        }
        
        if (!$indexExists('bills', 'bills_job_number_index')) {
            Schema::table('bills', function (Blueprint $table) {
                $table->index('job_number', 'bills_job_number_index');
            });
        }
        
        if (!$indexExists('bills', 'bills_status_index')) {
            Schema::table('bills', function (Blueprint $table) {
                $table->index('status', 'bills_status_index');
            });
        }
        
        if (!$indexExists('bills', 'bills_company_date_index')) {
            Schema::table('bills', function (Blueprint $table) {
                $table->index(['company_id', 'date'], 'bills_company_date_index');
            });
        }
        
        // Add indexes to payments table
        if (!$indexExists('payments', 'payments_date_index')) {
            Schema::table('payments', function (Blueprint $table) {
                $table->index('date', 'payments_date_index');
            });
        }
        
        if (!$indexExists('payments', 'payments_company_date_index')) {
            Schema::table('payments', function (Blueprint $table) {
                $table->index(['company_id', 'date'], 'payments_company_date_index');
            });
        }
        
        // Add indexes to companies table
        if (Schema::hasColumn('companies', 'username')) {
            if (!$indexExists('companies', 'companies_username_unique')) {
                Schema::table('companies', function (Blueprint $table) {
                    $table->unique('username', 'companies_username_unique');
                });
            }
        }
        
        if (!$indexExists('companies', 'companies_status_index')) {
            Schema::table('companies', function (Blueprint $table) {
                $table->index('status', 'companies_status_index');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bills', function (Blueprint $table) {
            $table->dropIndex('bills_bill_no_index');
            $table->dropIndex('bills_date_index');
            $table->dropIndex('bills_job_number_index');
            $table->dropIndex('bills_status_index');
            $table->dropIndex('bills_company_date_index');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->dropIndex('payments_date_index');
            $table->dropIndex('payments_company_date_index');
        });

        Schema::table('companies', function (Blueprint $table) {
            $table->dropUnique('companies_username_unique');
            $table->dropIndex('companies_status_index');
        });
    }
};

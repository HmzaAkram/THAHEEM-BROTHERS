<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Add additional composite indexes for better query performance
     */
    public function up(): void
    {
        $connection = Schema::getConnection();
        $dbName = $connection->getDatabaseName();
        
        $indexExists = function($table, $indexName) use ($connection, $dbName) {
            $result = $connection->select(
                "SELECT COUNT(*) as count FROM information_schema.statistics 
                 WHERE table_schema = ? AND table_name = ? AND index_name = ?",
                [$dbName, $table, $indexName]
            );
            return $result[0]->count > 0;
        };
        
        // PERFORMANCE FIX: Add composite index for company+status filtering
        if (!$indexExists('bills', 'bills_company_status_index')) {
            Schema::table('bills', function (Blueprint $table) {
                $table->index(['company_id', 'status'], 'bills_company_status_index');
            });
        }
        
        // Add fulltext index for search functionality (MySQL 5.6+)
        if (config('database.default') === 'mysql' && !$indexExists('bills', 'bills_search_fulltext')) {
            Schema::table('bills', function (Blueprint $table) {
                $table->fullText(['bill_no', 'job_number', 'gd_number'], 'bills_search_fulltext');
            });
        }
    }

    public function down(): void
    {
        Schema::table('bills', function (Blueprint $table) {
            $table->dropIndex('bills_company_status_index');
            if (config('database.default') === 'mysql') {
                $table->dropIndex('bills_search_fulltext');
            }
        });
    }
};

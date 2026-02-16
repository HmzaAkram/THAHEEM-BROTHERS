<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * SECURITY FIX: Hash all existing plaintext company passwords.
     * This is a one-time migration to secure existing data.
     */
    public function up(): void
    {
        // Get all companies with passwords
        $companies = DB::table('companies')
            ->whereNotNull('password')
            ->get();

        foreach ($companies as $company) {
            // Check if password is already hashed (bcrypt hashes start with $2y$)
            if (!str_starts_with($company->password, '$2y$')) {
                // Hash the plaintext password
                DB::table('companies')
                    ->where('id', $company->id)
                    ->update([
                        'password' => Hash::make($company->password),
                        'updated_at' => now(),
                    ]);
            }
        }
    }

    /**
     * Reverse the migrations.
     * 
     * WARNING: Passwords cannot be unhashed!
     * This migration is NOT reversible.
     */
    public function down(): void
    {
        // Cannot reverse password hashing - one-way operation
        // Users will need to reset their passwords if rolling back
        \Log::warning('Cannot reverse password hashing migration. Passwords remain hashed.');
    }
};

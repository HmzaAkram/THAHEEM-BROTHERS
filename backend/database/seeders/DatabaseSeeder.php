<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create Admin
        User::updateOrCreate(
            ['email' => 'admin@thaheem.com'],
            [
                'name' => 'Admin User',
                'password' => Hash::make('123'),
                'role' => 'admin',
            ]
        );

        // Create a Company
        $company = \App\Models\Company::updateOrCreate(
            ['username' => 'thaheem_co'],
            [
                'name' => 'THAHEEM BROTHERS',
                'email' => 'company@thaheem.com',
                'phone' => '0300-1234567',
                'address' => 'Main Boulevard, Lahore',
                'city' => 'Lahore',
                'ntn' => '1234567-8',
            ]
        );

        // Create Company User
        User::updateOrCreate(
            ['email' => 'company@thaheem.com'],
            [
                'name' => 'Company Admin',
                'password' => Hash::make('123'),
                'role' => 'company',
                'company_id' => $company->id,
            ]
        );

        // Create some Bills
        $bill = \App\Models\Bill::updateOrCreate(
            ['bill_no' => 'INV-001'],
            [
                'company_id' => $company->id,
                'company_name' => $company->name,
                'date' => now()->subDays(10)->format('Y-m-d'),
                'job_number' => 'JOB-101',
                'total_amount' => 50000,
                'service_charges' => 5000,
                'sales_tax' => 800,
                'advance_payment' => 0,
                'grand_total' => 55800,
                'status' => 'Unpaid',
            ]
        );

        $bill->items()->updateOrCreate(
            ['description' => 'Clearing Charges'],
            ['amount' => 50000]
        );

        // Create a Payment
        \App\Models\Payment::updateOrCreate(
            ['reference' => 'REF-123'],
            [
                'company_id' => $company->id,
                'company_name' => $company->name,
                'date' => now()->subDays(5)->format('Y-m-d'),
                'amount' => 20000,
                'method' => 'Cash',
            ]
        );
    }
}


<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create admin user with password "123"
        User::updateOrCreate(
            ['email' => 'admin@thaheembrothers.com'],
            [
                'name' => 'Admin User',
                'email' => 'admin@thaheembrothers.com',
                'password' => '123', // Will be auto-hashed by model cast
                'role' => 'admin',
                'company_id' => null,
            ]
        );

        $this->command->info('Admin user created successfully!');
        $this->command->info('Email: admin@thaheembrothers.com');
        $this->command->info('Password: 123');
    }
}

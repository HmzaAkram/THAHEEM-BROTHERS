<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use App\Models\Company;
use Illuminate\Support\Facades\Hash;

echo "--- Admin Test ---\n";
$admin = User::where('email', 'admin@thaheem.com')->first();
if ($admin) {
    $match = Hash::check('123', $admin->password);
    echo "Admin Email: {$admin->email}\n";
    echo "Password Hashed in DB: " . (str_starts_with($admin->password, '$2y$') ? "YES" : "NO") . "\n";
    echo "Password Match (123): " . ($match ? "YES" : "NO") . "\n";
}

echo "\n--- Company Test ---\n";
$co = Company::where('username', 'thaheem_co')->first();
if ($co) {
    echo "Company Username: {$co->username}\n";
    echo "Password in DB (Plain): {$co->password}\n";
    echo "Password Match (password123): " . ($co->password === 'password123' ? "YES" : "NO") . "\n";
}

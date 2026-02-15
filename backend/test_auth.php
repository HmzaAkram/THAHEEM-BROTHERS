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
    echo "Password Match (123): " . ($match ? "YES" : "NO") . "\n";
} else {
    echo "Admin not found\n";
}

echo "\n--- Company Test ---\n";
$co = Company::where('username', 'thaheem_co')->first();
if ($co) {
    // Force set password for test
    $co->password = Hash::make('password123');
    $co->save();
    
    $match = Hash::check('password123', $co->password);
    echo "Company Name: {$co->name}\n";
    echo "Company Username: {$co->username}\n";
    echo "Password Match (password123): " . ($match ? "YES" : "NO") . "\n";
    
    $tokenObj = $co->createToken('test_token');
    echo "Token generated: {$tokenObj->plainTextToken}\n";
} else {
    echo "Company 'thaheem_co' not found\n";
}

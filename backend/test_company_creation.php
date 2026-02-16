<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    $data = [
        'name' => 'Test Company ' . time(),
        'email' => 'test' . time() . '@example.com',
        'password' => 'password123',
        'status' => 'Active',
        'username' => 'testuser' . time()
    ];

    echo "Attempting to create company with password: " . $data['password'] . "\n";

    $company = \App\Models\Company::create($data);

    echo "Created Company ID: " . $company->id . "\n";
    echo "Stored Password Hash: " . $company->password . "\n";
    echo "Stored Status: " . $company->status . "\n";

    if (!empty($company->password) && $company->password !== 'password123') {
        echo "SUCCESS: Password is hashed and saved.\n";
    } else {
        echo "FAILURE: Password is missing or not hashed.\n";
    }

    // Cleanup
    $company->delete();
    echo "Cleaned up test company.\n";

} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

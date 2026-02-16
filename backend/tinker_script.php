
try {
    $data = [
        'name' => 'Test Company ' . time(),
        'email' => 'test' . time() . '@example.com',
        'password' => 'password123',
        'status' => 'Active',
        'username' => 'testuser' . time()
    ];

    echo "Attempting to create company with password: " . $data['password'] . PHP_EOL;

    $company = \App\Models\Company::create($data);

    echo "Created Company ID: " . $company->id . PHP_EOL;
    echo "Stored Password Hash: " . $company->password . PHP_EOL;
    echo "Stored Status: " . $company->status . PHP_EOL;

    if (!empty($company->password) && $company->password !== 'password123') {
        echo "SUCCESS: Password is hashed and saved." . PHP_EOL;
    } else {
        echo "FAILURE: Password is missing or not hashed." . PHP_EOL;
    }

    // Cleanup
    $company->delete();
    echo "Cleaned up test company." . PHP_EOL;

} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . PHP_EOL;
}

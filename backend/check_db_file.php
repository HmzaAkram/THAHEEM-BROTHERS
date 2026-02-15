<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Schema;

$exists = Schema::hasColumn('companies', 'identifier');
$columns = Schema::getColumnListing('companies');

$result = [
    'exists' => $exists,
    'columns' => $columns,
    'time' => date('Y-m-d H:i:s')
];

file_put_contents('db_check.json', json_encode($result, JSON_PRETTY_PRINT));
echo "Check completed.";

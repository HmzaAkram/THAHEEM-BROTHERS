<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "Default DB Connection: " . config('database.default') . "\n";
echo "MySQL Host: " . config('database.connections.mysql.host') . "\n";
echo "MySQL Database: " . config('database.connections.mysql.database') . "\n";

$mysqldump = 'mysqldump';
$output = [];
$returnVar = 0;
exec($mysqldump . ' --version 2>&1', $output, $returnVar);
echo "mysqldump --version output: " . implode("\n", $output) . "\n";
echo "mysqldump return code: " . $returnVar . "\n";

$possiblePaths = [
    'C:\\xampp\\mysql\\bin\\mysqldump.exe',
    'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe',
];
foreach ($possiblePaths as $p) {
    echo "Checking path $p: " . (file_exists($p) ? "EXISTS" : "MISSING") . "\n";
}

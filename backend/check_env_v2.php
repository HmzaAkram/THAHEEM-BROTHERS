<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$log = "";
$log .= "Default DB Connection: " . config('database.default') . "\n";
$log .= "MySQL Host: " . config('database.connections.mysql.host') . "\n";
$log .= "MySQL Database: " . config('database.connections.mysql.database') . "\n";

$mysqldump = 'mysqldump';
$output = [];
$returnVar = 0;
exec($mysqldump . ' --version 2>&1', $output, $returnVar);
$log .= "mysqldump --version output: " . implode("\n", $output) . "\n";
$log .= "mysqldump return code: " . $returnVar . "\n";

$possiblePaths = [
    'C:\\xampp\\mysql\\bin\\mysqldump.exe',
    'C:\\xampp\\mysql\\bin\\mysql.exe',
    'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe',
];
foreach ($possiblePaths as $p) {
    $log .= "Checking path $p: " . (file_exists($p) ? "EXISTS" : "MISSING") . "\n";
}

file_put_contents('env_check_log.txt', $log);
echo "Log written to env_check_log.txt\n";

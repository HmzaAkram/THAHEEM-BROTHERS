<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$bills = \App\Models\Bill::orderBy('date', 'desc')->get();
echo "Total Bills: " . $bills->count() . "\n";
echo str_pad("ID", 5) . str_pad("Date", 25) . str_pad("Job #", 10) . str_pad("Status", 15) . "Company\n";
echo str_repeat("-", 80) . "\n";
foreach ($bills as $bill) {
    if ($bill->date >= '2026-03-01' || $bill->date >= '2026-12-01') {
        echo str_pad($bill->id, 5) . 
             str_pad($bill->date, 25) . 
             str_pad($bill->job_number ?? 'N/A', 10) . 
             str_pad($bill->status, 15) . 
             $bill->company_name . "\n";
    }
}

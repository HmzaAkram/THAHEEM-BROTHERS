<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Bill;
use App\Models\Payment;

// Fix Bills with date 2026-12-03 (intended to be March 12, 2026)
$billsToFix = Bill::where('date', 'LIKE', '2026-12-03%')->get();
echo "Found " . $billsToFix->count() . " bills to fix.\n";

foreach ($billsToFix as $bill) {
    echo "Fixing Bill ID: {$bill->id}, Old Date: {$bill->date}, New Date: 2026-03-12\n";
    $bill->date = '2026-03-12';
    $bill->save();
}

// Also check for any other 'December' dates that might be flipped March dates
// (e.g., 2026-12-01 should be 2026-01-12? No, user said March 12th)

// Let's check if there are payments with similar issues
$paymentsToFix = Payment::where('date', 'LIKE', '2026-12-03%')->get();
echo "Found " . $paymentsToFix->count() . " payments to fix.\n";
foreach ($paymentsToFix as $payment) {
    echo "Fixing Payment ID: {$payment->id}, Old Date: {$payment->date}, New Date: 2026-03-12\n";
    $payment->date = '2026-03-12';
    $payment->save();
}

echo "Data fix completed.\n";

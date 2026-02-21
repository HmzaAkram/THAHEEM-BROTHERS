<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$users = \App\Models\User::all();
echo "Users: " . $users->toJson() . "\n";
$companies = \App\Models\Company::all();
echo "Companies: " . $companies->toJson() . "\n";

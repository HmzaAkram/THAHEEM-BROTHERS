<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

try {
    if (!Schema::hasColumn('companies', 'identifier')) {
        Schema::table('companies', function (Blueprint $table) {
            $table->string('identifier')->nullable()->after('id');
        });
        echo "Column 'identifier' added successfully.\n";
    } else {
        echo "Column 'identifier' already exists.\n";
    }
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

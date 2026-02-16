<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CompanyController;
use App\Http\Controllers\BillController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\SecurityController;
use App\Http\Controllers\BackupController;

// Public routes
Route::post('/login', [AuthController::class, 'login'])
    ->middleware('throttle:5,1');  // SECURITY: Rate limiting - 5 attempts per minute

Route::middleware('auth.token')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    Route::apiResource('companies', CompanyController::class);
    Route::apiResource('bills', BillController::class);
    Route::apiResource('payments', PaymentController::class);
    Route::apiResource('securities', SecurityController::class);

    // Backup Routes
    Route::get('/backup/export', [BackupController::class, 'export']);
    Route::post('/backup/import', [BackupController::class, 'import']);
});

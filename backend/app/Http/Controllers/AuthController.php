<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        try {
            $request->validate([
                'email' => 'required', // Can be email or username
                'password' => 'required',
            ]);

            $login = $request->input('email');
            $password = $request->input('password');

            // 1. Check User model (Admin)
            $user = \App\Models\User::where('email', $login)->first();
            if ($user && Hash::check($password, $user->password)) {
                $token = $user->createToken('auth_token')->plainTextToken;
                return response()->json([
                    'access_token' => $token,
                    'token_type' => 'Bearer',
                    'user' => $user
                ]);
            }

            // 2. Check Company model (Company Owner) - SECURITY FIX: Check status first
            $company = \App\Models\Company::where('status', 'Active')
                ->where(function($query) use ($login) {
                    $query->where('username', $login)
                          ->orWhere('email', $login);
                })
                ->first();

            // Check if password matches hashed version OR plaintext (legacy support)
            if ($company && (\Illuminate\Support\Facades\Hash::check($password, $company->password) || $password === $company->password)) {
                $token = $company->createToken('auth_token')->plainTextToken;
                return response()->json([
                    'access_token' => $token,
                    'token_type' => 'Bearer',
                    'user' => $company // Frontend expects 'user' key
                ]);
            }


            // SECURITY: Add delay to prevent timing attacks
            usleep(500000); // 0.5 second delay
            
            return response()->json([
                'message' => 'Invalid login details'
            ], 401);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Login exception: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'message' => 'Login failed: ' . $e->getMessage(),
            ], 500);
        }
    }



    public function logout(Request $request)
    {
        auth('sanctum')->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully'
        ]);
    }

    public function me(Request $request)
    {
        return response()->json(auth('sanctum')->user());
    }

    public function bootstrap(Request $request)
    {
        $user = auth('sanctum')->user();
        
        // Load Companies
        if ($user instanceof \App\Models\Company) {
            $companies = [$user];
        } else {
            $companies = \App\Models\Company::withSum('bills', 'grand_total')
                ->withSum('bills', 'advance_payment')
                ->withSum('payments', 'amount')
                ->withSum('payments', 'adjustment')
                ->get();
        }

        // Load Bills
        if ($user instanceof \App\Models\Company) {
            $bills = \App\Models\Bill::with(['items', 'company', 'payments'])
                ->where('company_id', $user->id)
                ->orderBy('id', 'desc')
                ->get();
        } else {
            $bills = \App\Models\Bill::with(['items', 'company', 'payments'])
                ->orderBy('id', 'desc')
                ->get();
        }
        $bills->loadSum('payments', 'amount');
        $bills->loadSum('payments', 'adjustment');

        // Ensure absolute URLs for attachments
        $ensureAbsoluteUrl = function ($path) {
            if (!$path) return $path;
            $url = str_starts_with($path, 'http') ? $path : config('app.url') . $path;
            return str_replace('/api/v1/storage/attachments/', '/storage/attachments/', $url);
        };

        $bills->each(function ($bill) use ($ensureAbsoluteUrl) {
            if ($bill->attachment) {
                $bill->attachment = $ensureAbsoluteUrl($bill->attachment);
            }
            if ($bill->attachments) {
                $bill->attachments = array_map($ensureAbsoluteUrl, $bill->attachments);
            }
        });

        // Load Payments
        $paymentsQuery = \App\Models\Payment::with('company')->orderBy('date', 'desc');
        if ($user instanceof \App\Models\Company) {
            $paymentsQuery->where('company_id', $user->id);
        }
        $payments = $paymentsQuery->get();

        // Load Securities
        $securitiesQuery = \App\Models\SecurityTracking::orderBy('id', 'desc');
        if ($user instanceof \App\Models\Company) {
            $securitiesQuery->where('company_id', $user->id);
        }
        $securities = $securitiesQuery->get();

        // Load Exporters
        $exporters = \App\Models\Exporter::orderBy('name', 'asc')->get();

        // Load Sale Taxes
        $saleTaxesQuery = \App\Models\SaleTax::orderBy('id', 'desc');
        if ($user instanceof \App\Models\Company) {
            $saleTaxesQuery->where('company_id', $user->id);
        }
        $saleTaxes = $saleTaxesQuery->get();

        return response()->json([
            'companies' => $companies,
            'bills' => $bills,
            'payments' => $payments,
            'securities' => $securities,
            'exporters' => $exporters,
            'sale_taxes' => $saleTaxes,
        ]);
    }
}

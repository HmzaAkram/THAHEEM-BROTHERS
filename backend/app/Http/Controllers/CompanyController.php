<?php

namespace App\Http\Controllers;

use App\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class CompanyController extends Controller
{
    public function index()
    {
        $user = auth('sanctum')->user();
        if ($user instanceof \App\Models\Company) {
            return response()->json([$user]);
        }
        
        // PERFORMANCE FIX: Prevent N+1 query in balance calculation
        // Load aggregated sums for bills and payments to avoid multiple queries
        return response()->json(
            Company::withSum('bills', 'grand_total')
                ->withSum('bills', 'advance_payment')
                ->withSum('payments', 'amount')
                ->withSum('payments', 'adjustment')
                ->get()
        );
    }

    public function store(Request $request)
    {
        $user = auth('sanctum')->user();
        if (!$user instanceof \App\Models\User || $user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }

        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'nullable|email|unique:companies,email',
                'phone' => 'nullable|string|max:20',
                'address' => 'nullable|string|max:500',
                'city' => 'nullable|string|max:100',
                'ntn' => 'nullable|string|max:50',
                'username' => 'nullable|string|max:50|unique:companies,username|regex:/^[a-zA-Z0-9_]+$/',
                'password' => 'nullable|string',
                'status' => 'nullable|string|in:Active,Inactive',
            ]);

            // Generate C-ID identifier (e.g., C1, C2, C3)
            // Resilience: Only add if column exists to avoid SQL errors
            if (\Illuminate\Support\Facades\Schema::hasColumn('companies', 'identifier')) {
                $lastCompany = Company::orderBy('id', 'desc')->first();
                $nextId = $lastCompany ? ($lastCompany->id + 1) : 1;
                $validated['identifier'] = 'C' . $nextId;
            }

            // Password is automatically hashed via Company model's 'hashed' cast
            // No manual hashing needed - Laravel handles it securely

            $company = Company::create($validated);


            return response()->json($company, 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed: ' . implode(', ', \Illuminate\Support\Arr::flatten($e->errors())),
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Backend error: ' . $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    }

    public function show(Company $company)
    {
        return response()->json($company->load(['bills', 'payments', 'securities']));
    }

    public function update(Request $request, $id)
    {
        $user = auth('sanctum')->user();
        if (!$user instanceof \App\Models\User || $user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }

        $company = Company::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|unique:companies,email,' . $id,
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
            'city' => 'nullable|string|max:100',
            'ntn' => 'nullable|string|max:50',
            'username' => 'nullable|string|max:50|unique:companies,username,' . $id . '|regex:/^[a-zA-Z0-9_]+$/',
            'password' => 'nullable|string',
            'status' => 'nullable|string|in:Active,Inactive',
        ]);

        // Password is automatically hashed via Company model's 'hashed' cast
        // No manual hashing needed - Laravel handles it securely
        $company->update($validated);


        return response()->json($company);
    }

    public function destroy($id)
    {
        $user = auth('sanctum')->user();
        if (!$user instanceof \App\Models\User || $user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }

        $company = Company::findOrFail($id);
        $company->delete();
        return response()->json(null, 204);
    }

    public function requestLedgerEmail(Request $request)
    {
        $user = auth('sanctum')->user();
        
        // Ensure only a company can request their own ledger, or admin
        if ($user instanceof \App\Models\Company) {
            $company = $user;
        } elseif ($user instanceof \App\Models\User && $user->role === 'admin') {
             // If admin requests, they might need to specify company_id, but for now we assume this endpoint is for Companies primarily
             return response()->json(['message' => 'This endpoint is for company use.'], 403);
        } else {
            return response()->json(['message' => 'Unauthorized.'], 401);
        }

        if (!$company->email) {
            return response()->json(['message' => 'No registered email address found.'], 400);
        }

        try {
            // Fetch Ledger Data
            // We need to replicate the frontend logic: fetch bills and payments, sort, calculate balance
            // Or simpler: Just send a basic summary and a list of last 20 transactions
            
            $bills = $company->bills()->get(); // Assuming relationship exists
            $payments = $company->payments()->get(); // Assuming relationship exists
            
            $totalBilled = $bills->sum('grand_total');
            $totalPaid = $payments->sum('amount') + $payments->sum('adjustment');
            $balance = $totalBilled - $totalPaid;

            // Simple HTML Email Content
            $html = "
                <h1>Account Ledger Summary</h1>
                <p><strong>Company:</strong> {$company->name}</p>
                <p><strong>Date:</strong> " . date('Y-m-d') . "</p>
                <hr>
                <p><strong>Total Billed:</strong> PKR " . number_format($totalBilled) . "</p>
                <p><strong>Total Paid:</strong> PKR " . number_format($totalPaid) . "</p>
                <p><strong>Current Outstanding Balance:</strong> PKR " . number_format($balance) . "</p>
                <hr>
                <p>Please log in to your portal to view the detailed transaction history.</p>
                <p>Regards,<br>Thaheem Brothers Admin</p>
            ";

            // Send Email using raw Mail facade for simplicity (or create a Mailable class if preferred)
            \Illuminate\Support\Facades\Mail::html($html, function ($message) use ($company) {
                $message->to($company->email)
                        ->subject('Your Account Ledger Summary - Thaheem Brothers');
            });

            return response()->json(['message' => 'Ledger summary sent to ' . $company->email]);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to send email: ' . $e->getMessage()], 500);
        }
    }
}

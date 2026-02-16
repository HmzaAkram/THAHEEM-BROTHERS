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
                'password' => 'nullable|string|min:6',
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
            'password' => 'nullable|string|min:6',
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
}

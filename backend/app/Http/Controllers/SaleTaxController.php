<?php

namespace App\Http\Controllers;

use App\Models\SaleTax;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SaleTaxController extends Controller
{
    public function index()
    {
        $user = auth('sanctum')->user();
        
        if ($user instanceof \App\Models\Company) {
            $saleTaxes = SaleTax::with(['company'])
                ->where('company_id', $user->id)
                ->orderBy('id', 'desc')
                ->get();
        } else {
            $saleTaxes = SaleTax::with(['company'])
                ->orderBy('id', 'desc')
                ->get();
        }

        return response()->json($saleTaxes);
    }

    public function store(Request $request)
    {
        $user = auth('sanctum')->user();
        if (!$user instanceof \App\Models\User || $user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }

        $validated = $request->validate([
            'company_id' => 'required|exists:companies,id',
            'company_name' => 'required|string',
            'date' => 'required|date',
            'ref_bill_no' => 'nullable|string',
            'clearing_forwarding_of' => 'nullable|string',
            'packages' => 'nullable|string',
            'igm_egm' => 'nullable|string',
            'igm_egm_date' => 'nullable|date',
            'index_no' => 'nullable|string',
            'gd_no' => 'nullable|string',
            'gd_date' => 'nullable|date',
            'value' => 'numeric',
            'service_charges' => 'numeric',
            'sales_tax_percentage' => 'numeric',
            'words' => 'nullable|string',
            'status' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($validated) {
            $saleTax = SaleTax::create($validated);
            $saleTax->load(['company']);
            return response()->json($saleTax, 201);
        });
    }

    public function show(SaleTax $saleTax)
    {
        $user = auth('sanctum')->user();
        if ($user instanceof \App\Models\Company && $saleTax->company_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        return response()->json($saleTax->load(['company']));
    }

    public function update(Request $request, SaleTax $saleTax)
    {
        $user = auth('sanctum')->user();
        if (!$user instanceof \App\Models\User || $user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }

        $validated = $request->validate([
            'company_id' => 'sometimes|exists:companies,id',
            'company_name' => 'sometimes|string',
            'date' => 'sometimes|date',
            'ref_bill_no' => 'nullable|string',
            'clearing_forwarding_of' => 'nullable|string',
            'packages' => 'nullable|string',
            'igm_egm' => 'nullable|string',
            'igm_egm_date' => 'nullable|date',
            'index_no' => 'nullable|string',
            'gd_no' => 'nullable|string',
            'gd_date' => 'nullable|date',
            'value' => 'numeric',
            'service_charges' => 'numeric',
            'sales_tax_percentage' => 'numeric',
            'words' => 'nullable|string',
            'status' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($saleTax, $validated) {
            $saleTax->update($validated);
            $saleTax->refresh();
            $saleTax->load(['company']);
            return response()->json($saleTax);
        });
    }

    public function destroy(SaleTax $saleTax)
    {
        $user = auth('sanctum')->user();
        if (!$user instanceof \App\Models\User || $user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }

        $saleTax->delete();
        return response()->json(null, 204);
    }
    
    public function updateStatus(Request $request, SaleTax $saleTax)
    {
        $user = auth('sanctum')->user();
        if (!$user instanceof \App\Models\User || $user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }

        $validated = $request->validate([
            'status' => 'required|in:Pending,Completed',
        ]);

        $saleTax->update(['status' => $validated['status']]);
        return response()->json($saleTax);
    }
}

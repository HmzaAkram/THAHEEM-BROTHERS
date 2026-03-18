<?php

namespace App\Http\Controllers;

use App\Models\SecurityTracking;
use Illuminate\Http\Request;

class SecurityController extends Controller
{
    public function index()
    {
        $user = auth('sanctum')->user();
        if ($user instanceof \App\Models\Company) {
            return response()->json(SecurityTracking::where('company_id', $user->id)->get());
        }
        return response()->json(SecurityTracking::all());
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
            'gd_number' => 'required|string',
            'no_of_containers' => 'required|integer',
            'container_no' => 'required|string',
            'amount_per_container' => 'required|numeric',
            'refund_days' => 'required|integer',
            'port' => 'nullable|string',
            'is_document_submitted' => 'boolean',
            'refund_due_date' => 'required|date',
            'receiver_name' => 'nullable|string',
            'receiver_contact' => 'nullable|string',
            'is_refund_received' => 'boolean',
            'received_amount_date' => 'nullable|date',
            'pay_order_no' => 'nullable|string',
            'paid_by' => 'nullable|string',
            'cheque_name' => 'nullable|string',
            'deposit_bank' => 'nullable|string',
            'attachment' => 'nullable|file|mimes:jpeg,png,jpg,pdf|max:2048',
        ]);

        $validated['total_amount'] = $validated['no_of_containers'] * $validated['amount_per_container'];

        if ($request->hasFile('attachment')) {
            $path = $request->file('attachment')->store('securities', 'public');
            $validated['attachment'] = $path;
        } else {
            unset($validated['attachment']);
        }

        $security = SecurityTracking::create($validated);
        return response()->json($security, 201);
    }

    public function update(Request $request, SecurityTracking $security)
    {
        $user = auth('sanctum')->user();
        if (!$user instanceof \App\Models\User || $user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }

        $validated = $request->validate([
            'is_document_submitted' => 'nullable|boolean',
            'is_refund_received' => 'nullable|boolean',
            'received_amount_date' => 'nullable|date',
            'pay_order_no' => 'nullable|string',
            'status' => 'nullable|string',
            'receiver_name' => 'nullable|string',
            'receiver_contact' => 'nullable|string',
            'port' => 'nullable|string',
            'refund_days' => 'nullable|integer',
            'paid_by' => 'nullable|string',
            'cheque_name' => 'nullable|string',
            'deposit_bank' => 'nullable|string',
            'attachment' => 'nullable|file|mimes:jpeg,png,jpg,pdf|max:2048',
        ]);

        if ($request->hasFile('attachment')) {
            $path = $request->file('attachment')->store('securities', 'public');
            $validated['attachment'] = $path;
        } else {
            unset($validated['attachment']);
        }

        // Convert string booleans from FormData if necessary
        if (isset($validated['is_document_submitted'])) {
            $validated['is_document_submitted'] = filter_var($validated['is_document_submitted'], FILTER_VALIDATE_BOOLEAN);
        }
        if (isset($validated['is_refund_received'])) {
            $validated['is_refund_received'] = filter_var($validated['is_refund_received'], FILTER_VALIDATE_BOOLEAN);
        }

        $security->update($validated);
        return response()->json($security);
    }

    public function destroy(SecurityTracking $security)
    {
        $user = auth('sanctum')->user();
        if (!$user instanceof \App\Models\User || $user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }

        $security->delete();
        return response()->json(null, 204);
    }
}

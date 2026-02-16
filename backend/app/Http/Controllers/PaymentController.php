<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function index()
    {
        $user = auth('sanctum')->user();
        
        // PERFORMANCE FIX: Add pagination and eager loading to prevent memory exhaustion
        $query = \App\Models\Payment::with('company')  // Eager load company relationship
            ->orderBy('date', 'desc');
        
        if ($user instanceof \App\Models\Company) {
            $query->where('company_id', $user->id);
        }
        
        return response()->json($query->paginate(50));  // 50 payments per page
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'company_id' => 'required|exists:companies,id',
            'company_name' => 'required|string',
            'date' => 'required|date',
            'amount' => 'required|numeric',
            'reference' => 'nullable|string',
            'method' => 'nullable|string',
            'description' => 'nullable|string',
            'bill_id' => 'nullable|exists:bills,id',
            'adjustment' => 'nullable|numeric',
            'tracking_id' => 'nullable|string',
            'cheque_no' => 'nullable|string',
            'pay_order_no' => 'nullable|string',
        ]);

        $payment = Payment::create($validated);
        return response()->json($payment, 201);
    }

    public function destroy(Payment $payment)
    {
        $user = auth('sanctum')->user();
        if ($user instanceof \App\Models\Company && $payment->company_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $payment->delete();
        return response()->json(null, 204);
    }
}

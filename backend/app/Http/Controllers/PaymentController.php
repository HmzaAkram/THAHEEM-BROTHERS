<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        if ($user instanceof \App\Models\Company) {
            return response()->json(Payment::where('company_id', $user->id)->get());
        }
        return response()->json(Payment::all());
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
        $user = auth()->user();
        if ($user instanceof \App\Models\Company && $payment->company_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $payment->delete();
        return response()->json(null, 204);
    }
}

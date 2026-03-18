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
        $user = auth('sanctum')->user();
        if (!$user instanceof \App\Models\User || $user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }

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

        // If bill_id is provided, proceed with standard single-bill payment logic
        if (!empty($validated['bill_id'])) {
            $payment = Payment::create($validated);
            return response()->json($payment, 201);
        }

        // Lumpsum payment logic: Clear opening balance first, then bills
        return \Illuminate\Support\Facades\DB::transaction(function () use ($validated) {
            $company = \App\Models\Company::findOrFail($validated['company_id']);
            $totalAmount = (float)$validated['amount'];
            $remainingPayment = $totalAmount;
            
            // 1. Calculate how much of the opening balance is still outstanding
            $openingBalance = (float)($company->opening_balance ?? 0);
            $clearedOpening = (float)Payment::where('company_id', $company->id)
                ->whereNull('bill_id')
                ->sum('amount');
            
            $remainingOpening = max(0, $openingBalance - $clearedOpening);
            
            // 2. If there's an opening balance to clear, use this payment for it
            $appliedToOpening = 0;
            if ($remainingOpening > 0) {
                $appliedToOpening = min($remainingPayment, $remainingOpening);
                $remainingPayment -= $appliedToOpening;
            }

            // 3. Clear outstanding bills with the remaining amount
            $createdPayments = [];
            if ($remainingPayment > 0) {
                // Fetch all bills with outstanding balance, oldest first
                $bills = \App\Models\Bill::where('company_id', $company->id)
                    ->get()
                    ->filter(function($bill) {
                        return $bill->grand_total > $bill->paid_amount;
                    })
                    ->sortBy('date');

                foreach ($bills as $bill) {
                    if ($remainingPayment <= 0) break;

                    $amountNeeded = $bill->grand_total - $bill->paid_amount;
                    $toApply = min($remainingPayment, $amountNeeded);

                    if ($toApply > 0) {
                        $billPaymentData = array_merge($validated, [
                            'amount' => $toApply,
                            'bill_id' => $bill->id,
                            'description' => ($validated['description'] ?? '') . " (Auto-distributed from Lumpsum)",
                        ]);
                        $createdPayments[] = Payment::create($billPaymentData);
                        $remainingPayment -= $toApply;
                    }
                }
            }

            // 4. Create the "General" payment record for opening balance + any extra surplus
            // We combine the opening balance portion and any remaining surplus into one record
            $generalAmount = $appliedToOpening + $remainingPayment;
            
            if ($generalAmount > 0 || (empty($createdPayments) && $totalAmount == 0)) {
                $generalPaymentData = array_merge($validated, [
                    'amount' => $generalAmount,
                    'bill_id' => null,
                ]);
                $finalPayment = Payment::create($generalPaymentData);
                return response()->json($finalPayment, 201);
            }

            // Return the first created payment if no general payment was made
            return response()->json($createdPayments[0] ?? null, 201);
        });
    }

    public function update(Request $request, Payment $payment)
    {
        $user = auth('sanctum')->user();
        if (!$user instanceof \App\Models\User || $user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }

        $validated = $request->validate([
            'company_id' => 'sometimes|required|exists:companies,id',
            'company_name' => 'sometimes|required|string',
            'date' => 'sometimes|required|date',
            'amount' => 'sometimes|required|numeric',
            'reference' => 'nullable|string',
            'method' => 'nullable|string',
            'description' => 'nullable|string',
            'bill_id' => 'nullable|exists:bills,id',
            'adjustment' => 'nullable|numeric',
            'tracking_id' => 'nullable|string',
            'cheque_no' => 'nullable|string',
            'pay_order_no' => 'nullable|string',
        ]);

        $payment->update($validated);
        return response()->json($payment);
    }

    public function destroy(Payment $payment)
    {
        $user = auth('sanctum')->user();
        if (!$user instanceof \App\Models\User || $user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }

        $payment->delete();
        return response()->json(null, 204);
    }
}

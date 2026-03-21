<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    private function reevaluateBillStatus($billId)
    {
        if (!$billId) return;
        $bill = \App\Models\Bill::find($billId);
        if (!$bill) return;

        $paid = $bill->paid_amount;
        $newStatus = 'Unpaid';
        if ($paid > 0) $newStatus = 'Partial';
        if ($paid >= $bill->grand_total && $bill->grand_total > 0) {
            $newStatus = 'Paid';
        }

        \Illuminate\Support\Facades\DB::table('bills')
            ->where('id', $billId)
            ->update(['status' => $newStatus]);
    }

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

        return \Illuminate\Support\Facades\DB::transaction(function () use ($validated) {
            $company = \App\Models\Company::findOrFail($validated['company_id']);
            $totalAmount = (float)$validated['amount'];
            $remainingPayment = $totalAmount;
            $createdPayments = [];
            $affectedBillIds = [];
            
            // 1. ALWAYS Clear opening balance first if it exists
            $openingBalance = (float)($company->opening_balance ?? 0);
            $clearedOpening = (float)Payment::where('company_id', $company->id)
                ->whereNull('bill_id')
                ->sum('amount');
            
            $remainingOpening = max(0, $openingBalance - $clearedOpening);
            
            if ($remainingOpening > 0 && $remainingPayment > 0) {
                $appliedToOpening = min($remainingPayment, $remainingOpening);
                
                $obPaymentData = array_merge($validated, [
                    'amount' => $appliedToOpening,
                    'adjustment' => 0, // Adjustment should not apply to OB clearing
                    'bill_id' => null, // null marks it as OB/General
                    'description' => ($validated['description'] ?? '') . " (Applied to opening balance)",
                ]);
                $createdPayments[] = Payment::create($obPaymentData);
                $remainingPayment -= $appliedToOpening;
            }

            // 2. If bill_id is provided, apply the remainder to THAT bill
            if (!empty($validated['bill_id']) && ($remainingPayment > 0 || (float)($validated['adjustment'] ?? 0) > 0)) {
                $bill = \App\Models\Bill::findOrFail($validated['bill_id']);
                $amountNeeded = $bill->grand_total - $bill->paid_amount;
                // If the payment was hijacked for OB, the remaining amount might be less than originally planned
                $toApply = min($remainingPayment, $amountNeeded);

                $billPaymentData = array_merge($validated, [
                    'amount' => $toApply,
                    'bill_id' => $bill->id,
                    // Keep the original adjustment here, as it was intended for this bill
                ]);
                $createdPayments[] = Payment::create($billPaymentData);
                $affectedBillIds[] = $bill->id;
                $remainingPayment -= $toApply;
            } 
            // 3. Lumpsum mode (or remainder from specific bill) distributed to other bills oldest first
            elseif (empty($validated['bill_id']) && $remainingPayment > 0) {
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
                            'adjustment' => 0, // No adjustments in auto-lumpsum distribution
                            'bill_id' => $bill->id,
                            'description' => ($validated['description'] ?? '') . " (Auto-distributed)",
                        ]);
                        $createdPayments[] = Payment::create($billPaymentData);
                        $affectedBillIds[] = $bill->id;
                        $remainingPayment -= $toApply;
                    }
                }
            }

            // 4. Any remaining surplus goes to a General/Advance record
            // If we already applied the adjustment to a bill (step 2), we should set it to 0 here
            $finalAdjustment = (empty($validated['bill_id'])) ? (float)($validated['adjustment'] ?? 0) : 0;

            if ($remainingPayment > 0 || (empty($createdPayments) && $totalAmount == 0)) {
                $generalPaymentData = array_merge($validated, [
                    'amount' => $remainingPayment,
                    'adjustment' => $finalAdjustment,
                    'bill_id' => null,
                ]);
                $finalPayment = Payment::create($generalPaymentData);
                
                // Reevaluate all affected bills
                foreach (array_unique($affectedBillIds) as $bId) {
                    $this->reevaluateBillStatus($bId);
                }
                
                return response()->json($finalPayment, 201);
            }

            // Reevaluate all affected bills
            foreach (array_unique($affectedBillIds) as $bId) {
                $this->reevaluateBillStatus($bId);
            }

            // Return the first created payment or the summary of what happened
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

        $oldBillId = $payment->bill_id;
        $payment->update($validated);
        $newBillId = $payment->bill_id;

        $this->reevaluateBillStatus($oldBillId);
        if ($oldBillId !== $newBillId) {
            $this->reevaluateBillStatus($newBillId);
        }

        return response()->json($payment);
    }

    public function destroy(Payment $payment)
    {
        $user = auth('sanctum')->user();
        if (!$user instanceof \App\Models\User || $user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }

        $billId = $payment->bill_id;
        $payment->delete();
        $this->reevaluateBillStatus($billId);
        return response()->json(null, 204);
    }
}

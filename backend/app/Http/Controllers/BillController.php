<?php

namespace App\Http\Controllers;

use App\Models\Bill;
use App\Models\BillItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BillController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        if ($user instanceof \App\Models\Company) {
            return response()->json(Bill::with('items')->where('company_id', $user->id)->orderBy('id', 'desc')->get());
        }
        return response()->json(Bill::with('items')->orderBy('id', 'desc')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'company_id' => 'required|exists:companies,id',
            'company_name' => 'required|string',
            'bill_no' => 'nullable|string',
            'date' => 'required|date',
            'job_number' => 'nullable|string',
            'via' => 'nullable|string',
            'weight' => 'nullable|string',
            'packages' => 'nullable|string',
            'exporter' => 'nullable|string',
            'invoice_no' => 'nullable|string',
            'invoice_date' => 'nullable|date',
            'be_number' => 'nullable|string',
            'hawb' => 'nullable|string',
            'igm' => 'nullable|string',
            'index_no' => 'nullable|string',
            'gd_number' => 'nullable|string',
            'no_of_containers' => 'nullable|integer',
            'container_no' => 'nullable|string',
            'total_amount' => 'required|numeric',
            'service_charges' => 'required|numeric',
            'sales_tax' => 'required|numeric',
            'advance_payment' => 'required|numeric',
            'grand_total' => 'required|numeric',
            'status' => 'nullable|string',
            'attachment' => 'nullable|string',
            'items' => 'required|array',
            'items.*.description' => 'required|string',
            'items.*.notes' => 'nullable|string',
            'items.*.amount' => 'required|numeric',
            'items.*.invoice_no' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($validated) {
            $billData = collect($validated)->except('items')->toArray();
            $bill = Bill::create($billData);

            foreach ($validated['items'] as $itemData) {
                $bill->items()->create($itemData);
            }

            return response()->json($bill->load('items'), 201);
        });
    }

    public function show(Bill $bill)
    {
        $user = auth()->user();
        if ($user instanceof \App\Models\Company && $bill->company_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        return response()->json($bill->load('items'));
    }

    public function update(Request $request, Bill $bill)
    {
        $user = auth()->user();
        if ($user instanceof \App\Models\Company && $bill->company_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'status' => 'required|string',
        ]);

        $bill->update($validated);
        return response()->json($bill);
    }

    public function destroy(Bill $bill)
    {
        $user = auth()->user();
        if ($user instanceof \App\Models\Company && $bill->company_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $bill->delete();
        return response()->json(null, 204);
    }
}

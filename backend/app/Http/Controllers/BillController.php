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
        $user = auth('sanctum')->user();
        
        // PERFORMANCE FIX: Eager load relationships to prevent N+1 queries
        // Also added pagination to prevent memory exhaustion with large datasets
        if ($user instanceof \App\Models\Company) {
            $bills = Bill::with(['items', 'company', 'payments'])
                ->where('company_id', $user->id)
                ->orderBy('id', 'desc')
                ->paginate(50);  // 50 bills per page
        } else {
            $bills = Bill::with(['items', 'company', 'payments'])
                ->orderBy('id', 'desc')
                ->paginate(50);  // 50 bills per page
        }

        // Load payment sums to optimize appended attributes
        $bills->getCollection()->loadSum('payments', 'amount');
        $bills->getCollection()->loadSum('payments', 'adjustment');

        $bills->getCollection()->each(function ($bill) {
            if ($bill->attachment) {
                $bill->attachment = $this->ensureAbsoluteUrl($bill->attachment);
            }
        });

        return response()->json($bills);
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
            'note' => 'nullable|string',
            'items' => 'required|array',
            'items.*.description' => 'required|string',
            'items.*.notes' => 'nullable|string',
            'items.*.amount' => 'required|numeric',
            'items.*.invoice_no' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($validated, $request) {
            $billData = collect($validated)->except(['items', 'attachment'])->toArray();
            
            // SECURITY FIX: Proper file upload validation
            if ($request->filled('attachment')) {
                $attachmentData = $request->input('attachment');
                if (str_starts_with($attachmentData, 'data:')) {
                    // Parse MIME type from base64 string
                    $mimeTypePart = explode(':', substr($attachmentData, 0, strpos($attachmentData, ';')))[1];
                    $format = explode('/', $mimeTypePart)[1];
                    $image = str_replace(' ', '+', explode(',', $attachmentData)[1]);
                    
                    // Decode and validate MIME type
                    $decodedData = base64_decode($image);
                    $finfo = new \finfo(FILEINFO_MIME_TYPE);
                    $actualMimeType = $finfo->buffer($decodedData);
                    
                    // SECURITY: Only allow PDF files
                    $allowedMimes = [
                        'application/pdf' => 'pdf',
                    ];
                    
                    if (!isset($allowedMimes[$actualMimeType])) {
                        return response()->json([
                            'message' => 'Invalid file type. Only PDF files are allowed.',
                            'errors' => ['attachment' => ['Only PDF files are supported']]
                        ], 422);
                    }
                    
                    // SECURITY: Check file size (no limit as requested)
                    // if (strlen($decodedData) > 50 * 1024 * 1024) { ... }
                    
                    $extension = 'pdf';
                    
                    // SECURITY: Use UUID for unpredictable filenames
                    $fileName = 'bill_' . \Illuminate\Support\Str::uuid() . '.' . $extension;
                    
                    // Store in public storage (accessible via URL)
                    \Illuminate\Support\Facades\Storage::disk('public')->put('attachments/' . $fileName, $decodedData);
                    $url = \Illuminate\Support\Facades\Storage::url('attachments/' . $fileName);
                    $billData['attachment'] = str_starts_with($url, 'http') ? $url : config('app.url') . $url;
                } else {
                    $billData['attachment'] = $attachmentData;
                }
            }

            $bill = Bill::create($billData);

            foreach ($validated['items'] as $itemData) {
                $bill->items()->create($itemData);
            }

            $bill->load(['items', 'company']);
            
            // Ensure return absolute URL for attachment if it exists
            if ($bill->attachment) {
                $bill->attachment = $this->ensureAbsoluteUrl($bill->attachment);
            }

            return response()->json($bill, 201);
        });
    }

    public function show(Bill $bill)
    {
        $user = auth('sanctum')->user();
        if ($user instanceof \App\Models\Company && $bill->company_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        if ($bill->attachment) {
            $bill->attachment = $this->ensureAbsoluteUrl($bill->attachment);
        }

        return response()->json($bill->load(['items', 'company']));
    }

    private function ensureAbsoluteUrl($path)
    {
        if (!$path || str_starts_with($path, 'http')) {
            return $path;
        }
        return config('app.url') . $path;
    }

    public function update(Request $request, Bill $bill)
    {
        $user = auth('sanctum')->user();
        if ($user instanceof \App\Models\Company && $bill->company_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'company_id' => 'sometimes|exists:companies,id',
            'company_name' => 'sometimes|string',
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
            'attachment' => 'nullable|string', // Can be null (no change) or base64 (new file)
            'note' => 'nullable|string',
            'items' => 'required|array',
            'items.*.description' => 'required|string',
            'items.*.notes' => 'nullable|string',
            'items.*.amount' => 'required|numeric',
            'items.*.invoice_no' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($validated, $request, $bill) {
            $billData = collect($validated)->except(['items', 'attachment'])->toArray();

            // Handle Attachment Update
            if ($request->filled('attachment')) {
                 $attachmentData = $request->input('attachment');
                 
                 // If it's a new base64 string, process it
                 if (str_starts_with($attachmentData, 'data:')) {
                    // Start of Base64 processing (Similiar to store method)
                    $mimeTypePart = explode(':', substr($attachmentData, 0, strpos($attachmentData, ';')))[1];
                    $image = str_replace(' ', '+', explode(',', $attachmentData)[1]);
                    $decodedData = base64_decode($image);
                    $finfo = new \finfo(FILEINFO_MIME_TYPE);
                    $actualMimeType = $finfo->buffer($decodedData);
                     
                    $allowedMimes = ['application/pdf' => 'pdf'];
                     
                    if (!isset($allowedMimes[$actualMimeType])) {
                         return response()->json([
                            'message' => 'Invalid file type. Only PDF files are allowed.',
                            'errors' => ['attachment' => ['Only PDF files are supported']]
                        ], 422);
                    }
                     
                    $extension = 'pdf';
                    $fileName = 'bill_' . \Illuminate\Support\Str::uuid() . '.' . $extension;
                    \Illuminate\Support\Facades\Storage::disk('public')->put('attachments/' . $fileName, $decodedData);
                    $url = \Illuminate\Support\Facades\Storage::url('attachments/' . $fileName);
                    $billData['attachment'] = str_starts_with($url, 'http') ? $url : config('app.url') . $url;
                 } 
                 // If it's not base64, we assume it's the existing URL or path, so we don't update the field
                 // OR if explicitly null passed (cleared), but frontend sends null in that case? 
                 // For now, if it's existing URL string, we just ignore updating it to keep current value 
                 // unless we want to allow 'clearing' it, which isn't in requirements yet.
            }

            $bill->update($billData);

            // Sync Items: Delete all and recreate to ensure perfect sync
            $bill->items()->delete();
            foreach ($validated['items'] as $itemData) {
                $bill->items()->create($itemData);
            }

            $bill->refresh();
            $bill->load(['items', 'company']);
            
            if ($bill->attachment) {
                $bill->attachment = $this->ensureAbsoluteUrl($bill->attachment);
            }

            return response()->json($bill);
        });
    }

    public function destroy(Bill $bill)
    {
        $user = auth('sanctum')->user();
        if ($user instanceof \App\Models\Company && $bill->company_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $bill->delete();
        return response()->json(null, 204);
    }
    public function getAttachment($filename)
    {
        $filename = urldecode($filename);
        $path = 'attachments/' . $filename;
        
        // Debugging
        \Illuminate\Support\Facades\Log::info("Checking attachment path: " . $path);
        
        if (!\Illuminate\Support\Facades\Storage::disk('public')->exists($path)) {
             \Illuminate\Support\Facades\Log::error("Attachment not found: " . $path);
            abort(404);
        }

        $file = \Illuminate\Support\Facades\Storage::disk('public')->get($path);
        $type = \Illuminate\Support\Facades\Storage::disk('public')->mimeType($path);

        return response($file, 200)
            ->header('Content-Type', $type)
            ->header('Access-Control-Allow-Origin', '*')
            ->header('Access-Control-Allow-Methods', 'GET')
            ->header('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With');
    }
}

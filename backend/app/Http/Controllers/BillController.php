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
        $request = request();
        
        // PERFORMANCE FIX: Eager load relationships to prevent N+1 queries
        // Also added pagination to prevent memory exhaustion with large datasets
        if ($request->has('all') && $request->input('all') == 'true') {
            if ($user instanceof \App\Models\Company) {
                $bills = Bill::with(['items', 'company', 'payments'])
                    ->where('company_id', $user->id)
                    ->orderBy('id', 'desc')
                    ->get();
            } else {
                $bills = Bill::with(['items', 'company', 'payments'])
                    ->orderBy('id', 'desc')
                    ->get();
            }
            
            // Add pagination metadata wrapper for consistency if needed, 
            // but for 'all' we just return the collection for now
            $bills->loadSum('payments', 'amount');
            $bills->loadSum('payments', 'adjustment');
            
            // Format URLs
            $bills->each(function ($bill) {
                if ($bill->attachment) $bill->attachment = $this->ensureAbsoluteUrl($bill->attachment);
                if ($bill->attachments) {
                    $bill->attachments = array_map(function($path) {
                        return $this->ensureAbsoluteUrl($path);
                    }, $bill->attachments);
                }
            });
            
            return response()->json($bills);
        }

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
            if ($bill->attachments) {
                $bill->attachments = array_map(function($path) {
                    return $this->ensureAbsoluteUrl($path);
                }, $bill->attachments);
            }
        });

        return response()->json($bills);
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
            'bill_no' => 'nullable|string',
            'date' => 'required|date',
            'job_number' => 'nullable|string|unique:bills,job_number',
            'via' => 'nullable|string',
            'weight' => 'nullable|string',
            'packages' => 'nullable|string',
            'exporter' => 'nullable|string',
            'invoice_no' => 'nullable|string',
            'invoice_date' => 'nullable|date',
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
            'attachments' => 'nullable|array',
            'attachments.*' => 'nullable|string',
            'note' => 'nullable|string',
            'items' => 'required|array',
            'items.*.description' => 'required|string',
            'items.*.notes' => 'nullable|string',
            'items.*.amount' => 'required|numeric',
            'items.*.invoice_no' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($validated, $request) {
            $billData = collect($validated)->except(['items', 'attachment', 'attachments'])->toArray();
            
            // SECURITY FIX: Proper file upload validation
            // Keeping original attachment logic for backwards compatibility mapping
            if ($request->filled('attachment')) {
                $attachmentData = $request->input('attachment');
                if (str_starts_with($attachmentData, 'data:')) {
                    $url = $this->processBase64Attachment($attachmentData);
                    if ($url instanceof \Illuminate\Http\JsonResponse) return $url;
                    $billData['attachment'] = $url;
                } else {
                    $billData['attachment'] = $attachmentData;
                }
            }
            
            // Multiple Attachments logic
            $attachmentsArr = [];
            if ($request->filled('attachments') && is_array($request->input('attachments'))) {
                 foreach ($request->input('attachments') as $attachmentData) {
                      if (str_starts_with($attachmentData, 'data:')) {
                           $url = $this->processBase64Attachment($attachmentData);
                           if ($url instanceof \Illuminate\Http\JsonResponse) return $url;
                           $attachmentsArr[] = $url;
                      } else {
                           $attachmentsArr[] = $attachmentData;
                      }
                 }
            }
            
            // If the old attachment was uploaded but not new ones, populate the new ones list
            if (isset($billData['attachment']) && empty($attachmentsArr)) {
                 $attachmentsArr[] = $billData['attachment'];
            }
            
            $billData['attachments'] = empty($attachmentsArr) ? null : $attachmentsArr;

            $bill = Bill::create($billData);

            foreach ($validated['items'] as $itemData) {
                $bill->items()->create($itemData);
            }

            $bill->load(['items', 'company']);
            
            // Ensure return absolute URL for attachment if it exists
            if ($bill->attachment) {
                $bill->attachment = $this->ensureAbsoluteUrl($bill->attachment);
            }
            if ($bill->attachments) {
                $bill->attachments = array_map(function($path) {
                    return $this->ensureAbsoluteUrl($path);
                }, $bill->attachments);
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
        if ($bill->attachments) {
            $bill->attachments = array_map(function($path) {
                return $this->ensureAbsoluteUrl($path);
            }, $bill->attachments);
        }

        return response()->json($bill->load(['items', 'company']));
    }

    private function ensureAbsoluteUrl($path)
    {
        if (!$path) {
            return $path;
        }
        
        $url = str_starts_with($path, 'http') ? $path : config('app.url') . $path;
        
        // Strip the incorrect /api/v1 prefix from old attachment URLs
        return str_replace('/api/v1/storage/attachments/', '/storage/attachments/', $url);
    }

    private function processBase64Attachment($attachmentData)
    {
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
         
        // SECURITY: Check file size (limit to 10MB)
        if (strlen($decodedData) > 10 * 1024 * 1024) {
            return response()->json([
                'message' => 'File size exceeds the 10MB limit.',
                'errors' => ['attachment' => ['File size exceeds 10MB']]
            ], 422);
        }

        $extension = 'pdf';
        $fileName = 'bill_' . \Illuminate\Support\Str::uuid() . '.' . $extension;
        \Illuminate\Support\Facades\Storage::disk('public')->put('attachments/' . $fileName, $decodedData);
        // Use direct storage URL
        $url = '/storage/attachments/' . $fileName;
        return config('app.url') . $url;
    }

    public function update(Request $request, Bill $bill)
    {
        $user = auth('sanctum')->user();
        if (!$user instanceof \App\Models\User || $user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }

        $validated = $request->validate([
            'company_id' => 'sometimes|exists:companies,id',
            'company_name' => 'sometimes|string',
            'bill_no' => 'nullable|string',
            'date' => 'required|date',
            'job_number' => 'nullable|string|unique:bills,job_number,' . $bill->id,
            'via' => 'nullable|string',
            'weight' => 'nullable|string',
            'packages' => 'nullable|string',
            'exporter' => 'nullable|string',
            'invoice_no' => 'nullable|string',
            'invoice_date' => 'nullable|date',
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
            'attachments' => 'nullable|array',
            'attachments.*' => 'nullable|string',
            'note' => 'nullable|string',
            'items' => 'required|array',
            'items.*.description' => 'required|string',
            'items.*.notes' => 'nullable|string',
            'items.*.amount' => 'required|numeric',
            'items.*.invoice_no' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($validated, $request, $bill) {
            $billData = collect($validated)->except(['items', 'attachment', 'attachments'])->toArray();

            // Handle Attachment Update (Legacy)
            if ($request->filled('attachment')) {
                 $attachmentData = $request->input('attachment');
                 if (str_starts_with($attachmentData, 'data:')) {
                     $url = $this->processBase64Attachment($attachmentData);
                     if ($url instanceof \Illuminate\Http\JsonResponse) return $url;
                     $billData['attachment'] = $url;
                 } 
            }
            
            // Multiple Attachments logic
            $attachmentsArr = [];
            if ($request->has('attachments') && is_array($request->input('attachments'))) {
                 foreach ($request->input('attachments') as $attachmentData) {
                      if (str_starts_with($attachmentData, 'data:')) {
                           $url = $this->processBase64Attachment($attachmentData);
                           if ($url instanceof \Illuminate\Http\JsonResponse) return $url;
                           $attachmentsArr[] = $url;
                      } else {
                           $attachmentsArr[] = $attachmentData;
                      }
                 }
                 $billData['attachments'] = empty($attachmentsArr) ? null : $attachmentsArr;
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
            if ($bill->attachments) {
                $bill->attachments = array_map(function($path) {
                    return $this->ensureAbsoluteUrl($path);
                }, $bill->attachments);
            }

            return response()->json($bill);
        });
    }

    public function destroy(Bill $bill)
    {
        $user = auth('sanctum')->user();
        if (!$user instanceof \App\Models\User || $user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
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

    public function updateStatus(Request $request, Bill $bill)
    {
        $user = auth('sanctum')->user();
        if (!$user instanceof \App\Models\User || $user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }

        $validated = $request->validate([
            'status' => 'required|in:Paid,Unpaid,Partial,Draft', // Or whatever statuses you allow
        ]);

        $bill->update(['status' => $validated['status']]);
        return response()->json($bill);
    }
}

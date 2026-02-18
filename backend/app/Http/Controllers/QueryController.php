<?php

namespace App\Http\Controllers;

use App\Models\Query;
use App\Models\QueryMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class QueryController extends Controller
{
    // List queries
    public function index(Request $request)
    {
        $user = $request->user('sanctum');

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        if ($user instanceof \App\Models\User) {
            // Admin sees all queries
            $queries = Query::with(['company', 'messages' => function ($query) {
                $query->latest();
            }])->latest()->get();
        } else {
            // Company sees only their queries
            $queries = Query::where('company_id', $user->id)
                ->with(['messages' => function ($query) {
                    $query->latest();
                }])
                ->latest()
                ->get();
        }

        return response()->json($queries);
    }

    // Show a specific query with messages
    public function show(Request $request, $id)
    {
        $user = $request->user('sanctum');

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $query = Query::with(['company', 'messages' => function ($q) {
            $q->orderBy('created_at', 'asc');
        }])->findOrFail($id);

        if (!($user instanceof \App\Models\User) && $query->company_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($query);
    }

    // Create a new query (Company only)
    public function store(Request $request)
    {
        $user = $request->user('sanctum');

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        if ($user instanceof \App\Models\User) {
            return response()->json(['message' => 'Admins cannot create queries.'], 403);
        }

        $validated = $request->validate([
            'subject' => 'required|string|max:255',
            'message' => 'required|string',
        ]);

        return DB::transaction(function () use ($user, $validated) {
            $query = Query::create([
                'company_id' => $user->id,
                'subject' => $validated['subject'],
                'status' => 'pending',
            ]);

            QueryMessage::create([
                'query_id' => $query->id,
                'message' => $validated['message'],
                'sender_type' => 'company',
            ]);

            return response()->json($query->load('messages'), 201);
        });
    }

    // Send a message (Reply) - Both Admin and Company
    public function sendMessage(Request $request, $id)
    {
        $user = $request->user('sanctum');

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $query = Query::findOrFail($id);

        if ($user instanceof \App\Models\User) {
            $senderType = 'admin';
            // Update status to replied if admin replies
            $query->update(['status' => 'replied']);
        } else {
            if ($query->company_id !== $user->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
            $senderType = 'company';
            // If company replies, maybe set status back to pending? 
            // For now, let's keep it simple or set to 'pending' to notify admin.
            $query->update(['status' => 'pending']);
        }

        $validated = $request->validate([
            'message' => 'required|string',
        ]);

        $message = QueryMessage::create([
            'query_id' => $query->id,
            'message' => $validated['message'],
            'sender_type' => $senderType,
        ]);

        return response()->json($message);
    }
}

<?php

namespace App\Http\Middleware;

use Closure;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CheckToken
{
    public function handle(Request $request, Closure $next)
    {
        $token = $request->bearerToken();
        $logPath = storage_path('logs/auth_debug.log');
        $rawLogPath = storage_path('logs/auth_raw.log');
        $timestamp = date('Y-m-d H:i:s');

        // Ensure directory exists
        if (!file_exists(storage_path('logs'))) {
            mkdir(storage_path('logs'), 0755, true);
        }

        // Log RAW token for debugging
        $tokenDesc = ($token === null) ? 'NULL' : "'$token' (length: " . strlen($token) . ")";
        file_put_contents($rawLogPath, "[$timestamp] RAW TOKEN: $tokenDesc | Path: " . $request->path() . " | Method: " . $request->method() . "\n", FILE_APPEND);

        // Normalize token
        $token = $token ? trim($token) : null;

        // 1. Try Sanctum authentication first (for real production tokens)
        try {
            $user = Auth::guard('sanctum')->user();
            if ($user) {
                file_put_contents($logPath, "[$timestamp] Authenticated via Sanctum: Type " . get_class($user) . " ID " . $user->id . "\n", FILE_APPEND);
                Auth::setUser($user);
                $request->setUserResolver(fn () => $user);
                return $next($request);
            }
        } catch (\Exception $e) {
            file_put_contents($logPath, "[$timestamp] Sanctum check error: " . $e->getMessage() . "\n", FILE_APPEND);
        }

        // 2. Mock token logic (for debugging/legacy support)
        if ($token && str_ends_with($token, '_mock_token')) {
            $parts = explode('_', $token);
            if (count($parts) >= 2) {
                $type = $parts[0]; // user or company
                $id = $parts[1];

                if ($type === 'user') {
                    $entity = \App\Models\User::find($id);
                } elseif ($type === 'company') {
                    $entity = \App\Models\Company::find($id);
                }

                if (isset($entity)) {
                    file_put_contents($logPath, "[$timestamp] Authenticated $type ID $id (MOCK)\n", FILE_APPEND);
                    Auth::setUser($entity);
                    $request->setUserResolver(fn () => $entity);
                    return $next($request);
                }
                file_put_contents($logPath, "[$timestamp] Entity not found for $type ID $id (MOCK)\n", FILE_APPEND);
            }
            return response()->json(['message' => 'Unauthenticated: Invalid mock token.'], 401);
        }

        // 3. Fallback for hardcoded mock_token_123
        if ($token === 'mock_token_123') {
            $user = User::where('role', 'admin')->first();
            if ($user) {
                file_put_contents($logPath, "[$timestamp] Authenticated via legacy mock_token_123\n", FILE_APPEND);
                Auth::setUser($user);
                $request->setUserResolver(fn () => $user);
                return $next($request);
            }
            return response()->json(['message' => 'Unauthenticated: Admin user not found.'], 401);
        }

        file_put_contents($logPath, "[$timestamp] Unauthenticated: Token missing, invalid, or expired: " . ($token ?? 'NULL') . "\n", FILE_APPEND);
        return response()->json(['message' => 'Unauthenticated: Missing or invalid token.'], 401);
    }



}

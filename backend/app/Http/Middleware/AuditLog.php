<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * AuditLog Middleware
 * 
 * SECURITY: Logs all data modification requests (POST, PUT, PATCH, DELETE)
 * for compliance and security auditing purposes.
 */
class AuditLog
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);
        
        // Only log data-modifying requests
        if (in_array($request->method(), ['POST', 'PUT', 'PATCH', 'DELETE'])) {
            // Get authenticated user
            $user = auth('sanctum')->user();
            
            Log::channel('daily')->info('API Request', [
                'user_id' => $user?->id ?? 'guest',
                'user_type' => $user ? get_class($user) : 'none',
                'method' => $request->method(),
                'url' => $request->fullUrl(),
                'path' => $request->path(),
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'payload' => $request->except(['password', 'password_confirmation']),  // Exclude sensitive data
                'response_code' => $response->status(),
                'timestamp' => now()->toIso8601String(),
            ]);
        }
        
        return $response;
    }
}

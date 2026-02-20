<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * CheckToken Middleware
 * 
 * SECURITY: Uses Laravel Sanctum for secure token authentication.
 * All mock token logic has been removed for production security.
 */
class CheckToken
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // SECURITY: Use Sanctum authentication guard explicitly for API tokens
        // This ensures Bearer tokens are validated properly
        $user = auth('sanctum')->user();
        
        if (!$user) {
            $token = $request->bearerToken();
            if ($token) {
                // Manually check if token belongs to an alternative model like Company
                $accessToken = \Laravel\Sanctum\PersonalAccessToken::findToken($token);
                if ($accessToken && $accessToken->tokenable) {
                    // Authenticate the user for the current request
                    auth()->setUser($accessToken->tokenable);
                    // Also set it in sanctum guard if needed elsewhere
                    // auth('sanctum')->setUser($accessToken->tokenable);
                    return $next($request);
                }
            }
            
            \Illuminate\Support\Facades\Log::info('CheckToken failed', [
                'headers' => $request->headers->all(),
                'bearer_token' => $token,
            ]);
            
            return response()->json([
                'message' => 'Unauthenticated. Invalid or missing token.'
            ], 401);
        }
        
        // User is authenticated, proceed with request
        return $next($request);
    }
}

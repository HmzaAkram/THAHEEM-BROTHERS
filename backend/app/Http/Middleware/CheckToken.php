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
            $accessToken = \Laravel\Sanctum\PersonalAccessToken::findToken($token);
            
            \Illuminate\Support\Facades\Log::info('CheckToken failed', [
                'headers' => $request->headers->all(),
                'bearer_token' => $token,
                'access_token_db' => $accessToken,
                'tokenable' => $accessToken ? $accessToken->tokenable : 'null',
            ]);
            
            return response()->json([
                'message' => 'Unauthenticated. Invalid or missing token.'
            ], 401);
        }
        
        // User is authenticated, proceed with request
        return $next($request);
    }
}

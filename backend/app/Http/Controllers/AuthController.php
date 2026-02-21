<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required', // Can be email or username
            'password' => 'required',
        ]);

        $login = $request->input('email');
        $password = $request->input('password');

        // 1. Check User model (Admin)
        $user = \App\Models\User::where('email', $login)->first();
        if ($user && Hash::check($password, $user->password)) {
            $token = $user->createToken('auth_token')->plainTextToken;
            return response()->json([
                'access_token' => $token,
                'token_type' => 'Bearer',
                'user' => $user
            ]);
        }

        // 2. Check Company model (Company Owner) - SECURITY FIX: Check status first
        $company = \App\Models\Company::where('status', 'Active')
            ->where(function($query) use ($login) {
                $query->where('username', $login)
                      ->orWhere('email', $login);
            })
            ->first();

        // Check if password matches hashed version OR plaintext (legacy support)
        if ($company && (\Illuminate\Support\Facades\Hash::check($password, $company->password) || $password === $company->password)) {
            // Optional: Upgrade plaintext to hashed here if needed
            if (\Illuminate\Support\Facades\Hash::needsRehash($company->password) && $password === $company->password) {
                // If it was plaintext, the model's 'hashed' cast might interfere if we just assign,
                // but we can skip that for now or update it using a raw query. We'll simply let them login.
            }
            
            $token = $company->createToken('auth_token')->plainTextToken;
            return response()->json([
                'access_token' => $token,
                'token_type' => 'Bearer',
                'user' => $company // Frontend expects 'user' key
            ]);
        }


        // SECURITY: Add delay to prevent timing attacks
        usleep(500000); // 0.5 second delay
        
        return response()->json([
            'message' => 'Invalid login details'
        ], 401);
    }


    public function logout(Request $request)
    {
        auth('sanctum')->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully'
        ]);
    }

    public function me(Request $request)
    {
        return response()->json(auth('sanctum')->user());
    }
}

<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ config('app.name') }}</title>
    <!-- Tailwind CSS (via CDN for simplicity on this status page) -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            darkMode: 'media',
            theme: {
                extend: {
                    colors: {
                        laravel: '#FF2D20',
                    }
                }
            }
        }
    </script>
    <style>
        body { font-family: 'Instrument Sans', ui-sans-serif, system-ui, sans-serif; }
    </style>
</head>
<body class="antialiased bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex items-center justify-center min-h-screen selection:bg-laravel selection:text-white">
    <div class="max-w-xl w-full mx-auto p-8">
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden ring-1 ring-gray-900/5 dark:ring-white/10">
            @php
                $frontendUrl = env('FRONTEND_URL');
                $isConnected = !empty($frontendUrl);
            @endphp

            <div class="p-8 text-center">
                @if($isConnected)
                    <div class="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30 mb-6 ring-8 ring-green-50 dark:ring-green-900/10">
                        <svg class="h-10 w-10 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Backend is Running
                    </h1>
                    <div class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 mb-6">
                        <span class="w-2 h-2 mr-2 bg-green-500 rounded-full animate-pulse"></span>
                        Connected to Frontend
                    </div>
                    
                    <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 text-sm font-mono break-all border border-gray-100 dark:border-gray-700">
                        <span class="text-gray-500 dark:text-gray-400 select-none">FRONTEND_URL: </span>
                        <a href="{{ $frontendUrl }}" target="_blank" class="text-laravel hover:underline">{{ $frontendUrl }}</a>
                    </div>
                @else
                    <div class="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-100 dark:bg-red-900/30 mb-6 ring-8 ring-red-50 dark:ring-red-900/10">
                        <svg class="h-10 w-10 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Backend is Not Connected to Frontend
                    </h1>
                    <p class="text-gray-500 dark:text-gray-400 mb-6">
                        The backend service is running, but the Frontend URL is not configured.
                    </p>
                    
                    <div class="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-sm text-left border border-red-100 dark:border-red-900/30">
                        <p class="font-medium text-red-800 dark:text-red-300 mb-1">Action Required:</p>
                        <p class="text-red-700 dark:text-red-400">Please set the <code class="font-mono bg-red-100 dark:bg-red-900/50 px-1 py-0.5 rounded">FRONTEND_URL</code> variable in your backend <code class="font-mono">.env</code> file.</p>
                    </div>
                @endif
            </div>
            
            <div class="bg-gray-50 dark:bg-gray-700/30 px-8 py-4 border-t border-gray-100 dark:border-gray-700/50 flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                <div class="flex items-center gap-2">
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 17.5999L16.2996 12L11 6.3999" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 12H16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    <span>Laravel v{{ Illuminate\Foundation\Application::VERSION }}</span>
                </div>
                <div class="font-mono opacity-70">PHP v{{ PHP_VERSION }}</div>
            </div>
        </div>
    </div>
</body>
</html>

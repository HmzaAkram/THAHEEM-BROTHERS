import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // Check if this is an API proxy request
    if (request.nextUrl.pathname.startsWith('/api-proxy/')) {
        // Get the destination path
        const path = request.nextUrl.pathname.replace('/api-proxy/', '');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

        // Construct the target URL (maintaining query string)
        const targetUrl = new URL(`${apiUrl}/${path}${request.nextUrl.search}`);

        // Create a new headers object to append our token
        const requestHeaders = new Headers(request.headers);

        // Attempt to get token from HttpOnly cookie
        const token = request.cookies.get('auth_token')?.value;
        if (token) {
            requestHeaders.set('Authorization', `Bearer ${token}`);
        }

        // Rewrite to the backend
        return NextResponse.rewrite(targetUrl, {
            request: {
                headers: requestHeaders,
            },
        });
    }

    return NextResponse.next();
}

export const config = {
    matcher: '/api-proxy/:path*',
};

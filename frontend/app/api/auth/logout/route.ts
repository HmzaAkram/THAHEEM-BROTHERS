import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
        const token = request.cookies.get('auth_token')?.value;

        // Optionally alert Laravel to revoke token
        if (token) {
            await fetch(`${apiUrl}/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            }).catch(console.error);
        }

        const response = NextResponse.json({ ok: true, message: 'Logged out successfully' });
        response.cookies.delete('auth_token');
        return response;
    } catch (error) {
        return NextResponse.json({ ok: false, message: 'Logout failed' }, { status: 500 });
    }
}

/**
 * Centralized API service for handling all requests to the Laravel backend.
 * Provides unified error handling, token management, and property naming conversion.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

class ApiService {
    private static getHeaders(token?: string | null) {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        return headers;
    }

    private static async handleResponse(response: Response) {
        if (response.status === 204) {
            return { ok: true, status: 204 };
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('API Error:', response.status, errorData);
            return {
                ok: false,
                status: response.status,
                message: errorData.message || 'Something went wrong',
                data: errorData,
            };
        }

        const data = await response.json();
        return {
            ok: true,
            status: response.status,
            data: this.snakeToCamel(data),
        };
    }

    static async get(endpoint: string, token?: string | null) {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'GET',
                headers: this.getHeaders(token),
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Fetch error:', error);
            return { ok: false, message: 'Connection failed. Please check your network or server.' };
        }
    }

    static async post(endpoint: string, body: any, token?: string | null) {
        try {
            const snakeBody = this.camelToSnake(body);
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: this.getHeaders(token),
                body: JSON.stringify(snakeBody),
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Fetch error:', error);
            return { ok: false, message: 'Connection failed. Please check your network or server.' };
        }
    }

    static async put(endpoint: string, body: any, token?: string | null) {
        try {
            const snakeBody = this.camelToSnake(body);
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'PUT',
                headers: this.getHeaders(token),
                body: JSON.stringify(snakeBody),
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Fetch error:', error);
            return { ok: false, message: 'Connection failed. Please check your network or server.' };
        }
    }

    static async delete(endpoint: string, token?: string | null) {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'DELETE',
                headers: this.getHeaders(token),
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Fetch error:', error);
            return { ok: false, message: 'Connection failed. Please check your network or server.' };
        }
    }

    // Naming conversion helpers
    private static camelToSnake(obj: any): any {
        if (obj === null || typeof obj !== 'object' || obj instanceof File || obj instanceof Blob) {
            return obj;
        }

        if (Array.isArray(obj)) {
            return obj.map(v => this.camelToSnake(v));
        }

        return Object.keys(obj).reduce((acc, key) => {
            const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            acc[snakeKey] = this.camelToSnake(obj[key]);
            return acc;
        }, {} as any);
    }

    private static snakeToCamel(obj: any): any {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }

        if (Array.isArray(obj)) {
            return obj.map(v => this.snakeToCamel(v));
        }

        return Object.keys(obj).reduce((acc, key) => {
            const camelKey = key.replace(/(_\w)/g, m => m[1].toUpperCase());
            acc[camelKey] = this.snakeToCamel(obj[key]);
            return acc;
        }, {} as any);
    }
}

export default ApiService;

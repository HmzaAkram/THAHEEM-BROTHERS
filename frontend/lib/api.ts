/**
 * Centralized API service for handling all requests to the Laravel backend.
 * Supports automatic JSON ↔ FormData switching for file uploads.
 */

const IS_CLIENT = typeof window !== 'undefined';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export interface ApiResponse<T = any> {
    ok: boolean;
    status?: number;
    message?: string;
    data?: T;
}

class ApiService {
    // ─────────────────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────────────────
    private static getHeaders(token?: string | null): Record<string, string> {
        const headers: Record<string, string> = {
            'Accept': 'application/json',
        };
        // Content-Type is NOT set here – it will be added automatically
        // for JSON requests, and omitted for FormData (browser sets boundary).

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    }

    private static async handleResponse(response: Response): Promise<ApiResponse> {
        if (response.status === 204) {
            return { ok: true, status: 204 };
        }

        if (response.status === 401 && typeof window !== 'undefined') {
            window.dispatchEvent(new Event('auth:unauthorized'));
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

    // ─────────────────────────────────────────────────────────────────────
    // HTTP methods
    // ─────────────────────────────────────────────────────────────────────
    static async get(endpoint: string, token?: string | null): Promise<ApiResponse> {
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

    static async post(endpoint: string, body: any, token?: string | null): Promise<ApiResponse> {
        try {
            const hasFiles = this.containsFiles(body);
            const snakeBody = this.camelToSnake(body);

            let requestBody: BodyInit;
            const headers = this.getHeaders(token);

            if (hasFiles) {
                const formData = new FormData();
                this.buildFormData(formData, snakeBody);
                requestBody = formData;
                // Remove Content-Type so the browser sets it with the correct boundary
                delete headers['Content-Type'];
            } else {
                headers['Content-Type'] = 'application/json';
                requestBody = JSON.stringify(snakeBody);
            }

            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers,
                body: requestBody,
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Fetch error:', error);
            return { ok: false, message: 'Connection failed. Please check your network or server.' };
        }
    }

    static async put(endpoint: string, body: any, token?: string | null): Promise<ApiResponse> {
        try {
            const hasFiles = this.containsFiles(body);
            const snakeBody = this.camelToSnake(body);

            let requestBody: BodyInit;
            const headers = this.getHeaders(token);

            if (hasFiles) {
                const formData = new FormData();
                this.buildFormData(formData, snakeBody);
                // Laravel needs this workaround for PUT/PATCH with files
                formData.append('_method', 'PUT');
                requestBody = formData;
                delete headers['Content-Type'];
                // Use POST method because browser can't send multipart PUT
                const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                    method: 'POST',
                    headers,
                    body: requestBody,
                });
                return await this.handleResponse(response);
            } else {
                headers['Content-Type'] = 'application/json';
                requestBody = JSON.stringify(snakeBody);
                const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                    method: 'PUT',
                    headers,
                    body: requestBody,
                });
                return await this.handleResponse(response);
            }
        } catch (error) {
            console.error('Fetch error:', error);
            return { ok: false, message: 'Connection failed. Please check your network or server.' };
        }
    }

    static async delete(endpoint: string, token?: string | null): Promise<ApiResponse> {
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

    static async patch(endpoint: string, body: any, token?: string | null): Promise<ApiResponse> {
        try {
            const hasFiles = this.containsFiles(body);
            const snakeBody = this.camelToSnake(body);

            let requestBody: BodyInit;
            const headers = this.getHeaders(token);

            if (hasFiles) {
                const formData = new FormData();
                this.buildFormData(formData, snakeBody);
                formData.append('_method', 'PATCH');
                requestBody = formData;
                delete headers['Content-Type'];
                const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                    method: 'POST',
                    headers,
                    body: requestBody,
                });
                return await this.handleResponse(response);
            } else {
                headers['Content-Type'] = 'application/json';
                requestBody = JSON.stringify(snakeBody);
                const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                    method: 'PATCH',
                    headers,
                    body: requestBody,
                });
                return await this.handleResponse(response);
            }
        } catch (error) {
            console.error('Fetch error:', error);
            return { ok: false, message: 'Connection failed. Please check your network or server.' };
        }
    }


    // ─────────────────────────────────────────────────────────────────────
    // File detection and FormData building
    // ─────────────────────────────────────────────────────────────────────
    private static containsFiles(obj: any): boolean {
        if (obj === null || typeof obj !== 'object') return false;
        if (obj instanceof File || obj instanceof Blob) return true;
        if (Array.isArray(obj)) {
            return obj.some(item => this.containsFiles(item));
        }
        return Object.values(obj).some(value => this.containsFiles(value));
    }

    private static buildFormData(formData: FormData, data: any, parentKey?: string): void {
        if (data === null || data === undefined) return;

        if (data instanceof File || data instanceof Blob) {
            formData.append(parentKey!, data);
        } else if (Array.isArray(data)) {
            data.forEach((item, index) => {
                const key = parentKey ? `${parentKey}[${index}]` : `${index}`;
                this.buildFormData(formData, item, key);
            });
        } else if (typeof data === 'object') {
            Object.entries(data).forEach(([key, value]) => {
                const formKey = parentKey ? `${parentKey}[${key}]` : key;
                this.buildFormData(formData, value, formKey);
            });
        } else {
            // primitive (string, number, boolean)
            formData.append(parentKey!, String(data));
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // Naming conversion helpers (camel ↔ snake)
    // ─────────────────────────────────────────────────────────────────────
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
// Singleton Paxos HTTP client

import { getPaxosAccessToken } from './auth';

class PaxosClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.PAXOS_BASE_URL || 'https://api.sandbox.paxos.com/v2';
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = await getPaxosAccessToken();
    const url = `${this.baseUrl}${path}`;

    const res = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: res.statusText }));
      throw { status: res.status, ...error };
    }

    if (res.status === 204) return {} as T;
    return res.json();
  }

  async get<T>(path: string, params?: Record<string, string>): Promise<T> {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<T>(`${path}${query}`);
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined });
  }

  async patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined });
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined });
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' });
  }
}

// Singleton
let client: PaxosClient | null = null;
export function getPaxosClient(): PaxosClient {
  if (!client) client = new PaxosClient();
  return client;
}

import { Task, AppInfo } from '../types';

const API_BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  getTasks: () => request<Task[]>(`${API_BASE}/tasks`),

  getTask: (id: number) => request<Task>(`${API_BASE}/tasks/${id}`),

  createTask: (data: { title: string; description?: string }) =>
    request<Task>(`${API_BASE}/tasks`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateTask: (id: number, data: Partial<Task>) =>
    request<Task>(`${API_BASE}/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteTask: (id: number) =>
    request<{ message: string; task: Task }>(`${API_BASE}/tasks/${id}`, {
      method: 'DELETE',
    }),

  getInfo: () => request<AppInfo>(`${API_BASE}/info`),

  getHealth: () => request<{ status: string }>('/health'),
};

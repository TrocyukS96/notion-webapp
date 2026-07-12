import axios, {
  isAxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
} from 'axios'
import type { CreateTaskData, Task, User } from '../components/types'
import { resolveTelegramUserId } from '../utils/telegramUser'

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'https://tg-notion-server.onrender.com'

export interface NotionAuthStatus {
  authorized: boolean
  message?: string
  has_refresh_token?: boolean
  notion_workspace_id?: string
  selected_database_id?: string
}

export interface NotionDatabase {
  id: string
  title: string
  url?: string
}

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.client.interceptors.request.use((config) => {
      const telegramId = resolveTelegramUserId()

      if (telegramId) {
        config.params = {
          ...config.params,
          telegram_id: telegramId,
        }
      }

      return config
    })
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config)
    return response.data
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config)
    return response.data
  }

  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config)
    return response.data
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config)
    return response.data
  }
}

export const api = new ApiClient()

export const tasksApi = {
  getTasks: () => api.get<Task[]>('/tasks'),
  createTask: (data: CreateTaskData) => api.post<Task>('/tasks', data),
  updateTask: (taskId: string, data: Partial<CreateTaskData>) =>
    api.patch<Task>(`/tasks/${taskId}`, data),
  deleteTask: (taskId: string) => api.delete<void>(`/tasks/${taskId}`),
}

export const columnsApi = {
  list: () => api.get<string[]>('/columns'),
  create: (title: string) => api.post<{ status: string; title: string }>('/columns', { title }),
  delete: (title: string) =>
    api.delete<{ status: string; title: string }>('/columns', { data: { title } }),
}

export const userApi = {
  getMe: () => api.get<User>('/users/me'),
}

export interface NotionLogoutResponse {
  status: string
  authorized: boolean
  message?: string
}

export const authApi = {
  getNotionStatus: () => api.get<NotionAuthStatus>('/notion/status'),
  logoutNotion: () => api.delete<NotionLogoutResponse>('/notion/session'),
  getNotionLoginUrl: (telegramId: number) =>
    `${API_BASE_URL}/notion/login?telegram_id=${telegramId}`,
}

export const databaseApi = {
  getSelected: () => api.get<NotionDatabase>('/notion/databases/selected'),
  search: (query: string) =>
    api.get<NotionDatabase[]>('/notion/databases/search', {
      params: { query },
    }),
  select: (databaseId: string) =>
    api.post<{ status: string }>('/notion/databases/select', {
      database_id: databaseId,
    }),
}

export function isNotionAuthError(error: unknown): boolean {
  if (!isAxiosError(error)) {
    return false
  }

  const status = error.response?.status
  return status === 401 || status === 403
}

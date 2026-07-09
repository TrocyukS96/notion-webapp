import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios'
import type { CreateTaskData, Task, User } from '../components/types'

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'https://tg-notion-server.onrender.com'

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
      const tg = window.Telegram?.WebApp
      const user = tg?.initDataUnsafe?.user

      if (user?.id) {
        config.params = {
          ...config.params,
          telegram_id: user.id,
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

export const userApi = {
  getMe: () => api.get<User>('/users/me'),
}

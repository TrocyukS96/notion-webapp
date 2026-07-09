export interface Task {
  id: string
  title: string
  description?: string
  status: string
  due_date?: string
  url?: string
}

export interface CreateTaskData {
  title: string
  description?: string
  status: string
  due_date?: string
}

export interface User {
  id: number
  telegram_id: number
  notion_access_token?: string
  selected_database_id?: string
}

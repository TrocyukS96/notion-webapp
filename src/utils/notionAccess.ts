import type { NotionAuthStatus } from '../api/client'
import { databaseApi, isNotionAuthError } from '../api/client'

export type AppStep = 'loading' | 'auth' | 'select-db' | 'board'

function isForceAuthFromUrl(): boolean {
  const params = new URLSearchParams(window.location.search)
  return params.get('force_auth') === '1'
}

export function isNotionAuthorized(status: NotionAuthStatus): boolean {
  if (isForceAuthFromUrl()) {
    return false
  }

  return status.authorized === true
}

export function canAccessKanban(status: NotionAuthStatus): boolean {
  return isNotionAuthorized(status) && Boolean(status.selected_database_id)
}

export function stepFromStatus(status: NotionAuthStatus): AppStep {
  if (!isNotionAuthorized(status)) {
    return 'auth'
  }

  if (!status.selected_database_id) {
    return 'select-db'
  }

  return 'board'
}

export function authMessageFromStatus(
  status: NotionAuthStatus,
  fromOAuth = false,
): string | null {
  if (isNotionAuthorized(status)) {
    return null
  }

  if (fromOAuth) {
    return 'Авторизация Notion не завершена. Подключите Notion снова.'
  }

  return status.message ?? 'Подключите Notion, чтобы открыть канбан-доску.'
}

export async function verifyNotionConnection(): Promise<boolean> {
  try {
    await databaseApi.search('')
    return true
  } catch (error) {
    return !isNotionAuthError(error)
  }
}

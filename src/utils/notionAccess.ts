import {
  authApi,
  databaseApi,
  isNotionAuthError,
  type NotionAuthStatus,
} from '../api/client'
import { isOAuthSuccessStartParam } from './oauthReturn'

export type AppStep = 'loading' | 'auth' | 'select-db' | 'board'

const OAUTH_STATUS_RETRY_DELAYS_MS = [0, 400, 800, 1200, 1600, 2000]

function isForceAuthFromUrl(): boolean {
  const params = new URLSearchParams(window.location.search)
  return params.get('force_auth') === '1'
}

export function isNotionAuthorized(status: NotionAuthStatus): boolean {
  if (isOAuthSuccessStartParam()) {
    return status.authorized === true
  }

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

export async function fetchNotionStatus(
  options?: { fromOAuth?: boolean },
): Promise<NotionAuthStatus> {
  const delays = options?.fromOAuth
    ? OAUTH_STATUS_RETRY_DELAYS_MS
    : [0]

  let lastStatus: NotionAuthStatus = { authorized: false }

  for (const delay of delays) {
    if (delay > 0) {
      await new Promise((resolve) => window.setTimeout(resolve, delay))
    }

    lastStatus = await authApi.getNotionStatus()
    if (lastStatus.authorized === true) {
      return lastStatus
    }
  }

  return lastStatus
}

export async function verifyNotionConnection(): Promise<boolean> {
  try {
    await databaseApi.search('')
    return true
  } catch (error) {
    return !isNotionAuthError(error)
  }
}

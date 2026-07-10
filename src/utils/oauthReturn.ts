export type OAuthReturnStatus = 'success' | 'error'

export interface OAuthReturnState {
  status: OAuthReturnStatus
  error?: string
}

const OAUTH_QUERY_KEYS = ['notion_auth', 'error', 'telegram_id'] as const

function readStartParam(): string | null {
  const initDataUnsafe = window.Telegram?.WebApp?.initDataUnsafe as
    | { start_param?: string }
    | undefined
  const fromSdk = initDataUnsafe?.start_param
  if (fromSdk) return fromSdk

  const searchParams = new URLSearchParams(window.location.search)
  const fromQuery = searchParams.get('tgWebAppStartParam')
  if (fromQuery) return fromQuery

  const hashParams = new URLSearchParams(window.location.hash.slice(1))
  return hashParams.get('tgWebAppStartParam')
}

export function readOAuthReturnState(): OAuthReturnState | null {
  const params = new URLSearchParams(window.location.search)
  const notionAuth = params.get('notion_auth')

  if (notionAuth === 'success') {
    return { status: 'success' }
  }

  if (notionAuth === 'error') {
    return {
      status: 'error',
      error: params.get('error') ?? 'Не удалось подключить Notion',
    }
  }

  const startParam = readStartParam()
  if (startParam === 'notion_auth_ok') {
    return { status: 'success' }
  }

  if (startParam === 'notion_auth_error') {
    return {
      status: 'error',
      error: 'Не удалось подключить Notion',
    }
  }

  return null
}

export function clearOAuthReturnParams(): void {
  const url = new URL(window.location.href)

  for (const key of OAUTH_QUERY_KEYS) {
    url.searchParams.delete(key)
  }

  url.searchParams.delete('tgWebAppStartParam')

  const hashParams = new URLSearchParams(url.hash.slice(1))
  hashParams.delete('tgWebAppStartParam')

  const nextHash = hashParams.toString()
  url.hash = nextHash ? `#${nextHash}` : ''

  window.history.replaceState({}, '', url.toString())
}

export const TELEGRAM_APP_LINK =
  import.meta.env.VITE_TELEGRAM_APP_LINK?.trim() || ''

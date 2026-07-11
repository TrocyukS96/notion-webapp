export type OAuthReturnStatus = 'success' | 'error'

export interface OAuthReturnState {
  status: OAuthReturnStatus
  error?: string
}

const OAUTH_QUERY_KEYS = ['notion_auth', 'error', 'telegram_id', 'force_auth'] as const
const OAUTH_SUCCESS_START_PARAM = 'notion_auth_ok'
const OAUTH_ERROR_START_PARAM = 'notion_auth_error'

const BASE_TELEGRAM_APP_LINK =
  import.meta.env.VITE_TELEGRAM_APP_LINK?.trim() || ''

export const TELEGRAM_APP_LINK = BASE_TELEGRAM_APP_LINK

export function getOAuthSuccessTelegramLink(): string {
  if (!BASE_TELEGRAM_APP_LINK) return ''

  const url = new URL(BASE_TELEGRAM_APP_LINK)
  url.searchParams.set('startapp', OAUTH_SUCCESS_START_PARAM)
  return url.toString()
}

function readStartParamFromInitData(initData: string): string | null {
  try {
    const params = new URLSearchParams(initData)
    return params.get('start_param')
  } catch {
    return null
  }
}

export function readStartParam(): string | null {
  const webApp = window.Telegram?.WebApp

  const fromUnsafe = (
    webApp?.initDataUnsafe as { start_param?: string } | undefined
  )?.start_param
  if (fromUnsafe) return fromUnsafe

  if (webApp?.initData) {
    const fromInitData = readStartParamFromInitData(webApp.initData)
    if (fromInitData) return fromInitData
  }

  const searchParams = new URLSearchParams(window.location.search)
  const fromQuery = searchParams.get('tgWebAppStartParam')
  if (fromQuery) return fromQuery

  const hashParams = new URLSearchParams(window.location.hash.slice(1))
  const fromHash = hashParams.get('tgWebAppStartParam')
  if (fromHash) return fromHash

  return null
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
  if (startParam === OAUTH_SUCCESS_START_PARAM) {
    return { status: 'success' }
  }

  if (startParam === OAUTH_ERROR_START_PARAM) {
    return {
      status: 'error',
      error: 'Не удалось подключить Notion',
    }
  }

  return null
}

export function isOAuthSuccessStartParam(): boolean {
  return readStartParam() === OAUTH_SUCCESS_START_PARAM
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

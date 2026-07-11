import { useEffect, useState } from 'react'
import {
  isTelegramWebApp,
  resolveTelegramUser,
  resolveTelegramUserId,
  type TelegramUserData,
} from '../utils/telegramUser'

interface TelegramWebApp {
  ready: () => void
  close: () => void
  expand: () => void
  openLink: (url: string) => void
  initData: string
  initDataUnsafe: {
    user?: TelegramUserData
    query_id?: string
    auth_date?: string
    hash?: string
  }
  themeParams: {
    bg_color?: string
    text_color?: string
    hint_color?: string
    link_color?: string
    button_color?: string
    button_text_color?: string
  }
  colorScheme: 'light' | 'dark'
  isExpanded: boolean
  onEvent: (eventType: string, eventHandler: () => void) => void
}

declare global {
  interface Window {
    Telegram: {
      WebApp: TelegramWebApp
    }
  }
}

interface UseTelegramReturn {
  tg: TelegramWebApp | null
  user: TelegramUserData | null
  telegramUserId: number | null
  isInTelegram: boolean
  isReady: boolean
  close: () => void
  expand: () => void
  theme: 'light' | 'dark'
}

export function useTelegram(): UseTelegramReturn {
  const [tg, setTg] = useState<TelegramWebApp | null>(null)
  const [user, setUser] = useState<TelegramUserData | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const syncUser = () => {
      const resolvedUser = resolveTelegramUser()
      if (resolvedUser) {
        setUser(resolvedUser)
      }
    }

    const tgInstance = window.Telegram?.WebApp

    if (tgInstance) {
      tgInstance.ready()
      tgInstance.expand()
      setTg(tgInstance)
      syncUser()

      setTheme(tgInstance.colorScheme || 'light')
      document.documentElement.dataset.theme = tgInstance.colorScheme || 'light'

      tgInstance.onEvent('themeChanged', () => {
        const nextTheme = tgInstance.colorScheme || 'light'
        setTheme(nextTheme)
        document.documentElement.dataset.theme = nextTheme
      })
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      document.documentElement.dataset.theme = prefersDark ? 'dark' : 'light'
    }

    setIsReady(true)

    const retryTimers = [150, 500, 1000].map((delay) =>
      window.setTimeout(syncUser, delay),
    )

    return () => {
      retryTimers.forEach((timer) => window.clearTimeout(timer))
    }
  }, [])

  const close = () => {
    tg?.close()
  }

  const expand = () => {
    tg?.expand()
  }

  const telegramUserId = resolveTelegramUserId()
  const isInTelegram = isTelegramWebApp()

  return { tg, user, telegramUserId, isInTelegram, isReady, close, expand, theme }
}

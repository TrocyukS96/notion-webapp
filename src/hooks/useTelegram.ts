import { useEffect, useState } from 'react'
import type { User as TelegramSdkUser } from '@telegram-apps/sdk-react'

interface TelegramUser extends TelegramSdkUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
}

interface TelegramWebApp {
  ready: () => void
  close: () => void
  expand: () => void
  initData: string
  initDataUnsafe: {
    user?: TelegramUser
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
  user: TelegramUser | null
  isReady: boolean
  close: () => void
  expand: () => void
  theme: 'light' | 'dark'
}

export function useTelegram(): UseTelegramReturn {
  const [tg, setTg] = useState<TelegramWebApp | null>(null)
  const [user, setUser] = useState<TelegramUser | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const tgInstance = window.Telegram?.WebApp

    if (tgInstance) {
      tgInstance.ready()
      setTg(tgInstance)
      setIsReady(true)

      if (tgInstance.initDataUnsafe?.user) {
        setUser(tgInstance.initDataUnsafe.user)
      }

      setTheme(tgInstance.colorScheme || 'light')

      tgInstance.onEvent('themeChanged', () => {
        setTheme(tgInstance.colorScheme || 'light')
      })
    }
  }, [])

  const close = () => {
    tg?.close()
  }

  const expand = () => {
    tg?.expand()
  }

  return { tg, user, isReady, close, expand, theme }
}

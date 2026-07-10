import type React from 'react'

interface LoadingScreenProps {
  message?: string
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Загрузка…',
}) => (
  <div className="flex min-h-[60svh] flex-col items-center justify-center gap-6 p-6">
    <div
      className="h-10 w-10 animate-spin rounded-full border-[3px] border-solid"
      style={{
        borderColor: 'var(--tg-theme-section-separator-color, #e5e7eb)',
        borderTopColor: 'var(--tg-theme-button-color, #3390ec)',
      }}
      role="status"
      aria-label={message}
    />

    <p className="text-sm text-[var(--tg-theme-hint-color,#6b7280)]">{message}</p>

    <div className="flex w-full max-w-sm animate-pulse flex-col gap-3">
      <div
        className="h-4 w-3/5 rounded-md"
        style={{ backgroundColor: 'var(--tg-theme-section-separator-color, #e5e7eb)' }}
      />
      <div
        className="h-12 w-full rounded-xl"
        style={{ backgroundColor: 'var(--tg-theme-section-separator-color, #e5e7eb)' }}
      />
      <div
        className="h-12 w-full rounded-xl"
        style={{ backgroundColor: 'var(--tg-theme-section-separator-color, #e5e7eb)' }}
      />
    </div>
  </div>
)

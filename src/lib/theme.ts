import { useEffect, useState } from 'react'

export type ThemeChoice = 'light' | 'dark' | 'system'

function readChoice(): ThemeChoice {
  try {
    const t = localStorage.getItem('theme')
    if (t === 'light' || t === 'dark' || t === 'system') return t
  } catch {
    // Storage can be blocked; fall back to system.
  }
  return 'system'
}

function apply(choice: ThemeChoice) {
  const dark =
    choice === 'dark' || (choice === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', dark)
  // Match the phone's status/address bar to the app background.
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0f0e14' : '#f3f1fb')
}

export function useTheme() {
  const [choice, setChoice] = useState<ThemeChoice>(readChoice)

  useEffect(() => {
    apply(choice)
    try {
      localStorage.setItem('theme', choice)
    } catch {
      // Ignore; the theme still applies for this visit.
    }
    if (choice !== 'system') return
    const mq = matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => apply('system')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [choice])

  return { choice, setChoice }
}

import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../lib/theme'

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { dark, toggle } = useTheme()
  return (
    <button onClick={toggle} className={`p-2 rounded-[3px] text-ink-2 hover:text-ink hover:bg-paper-2 ${className}`}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'} title={dark ? 'Light mode' : 'Dark mode'}>
      {dark ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  )
}

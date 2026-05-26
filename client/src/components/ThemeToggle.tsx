import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { Button } from '@/components/ui/Button'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="h-6 text-xs hover:bg-opacity-20"
      aria-label={`切换到${theme === 'dark' ? '浅色' : '深色'}主题`}
    >
      {theme === 'dark' ? (
        <Sun className="w-3.5 h-3.5 mr-1" />
      ) : (
        <Moon className="w-3.5 h-3.5 mr-1" />
      )}
      {theme === 'dark' ? '浅色' : '深色'}
    </Button>
  )
}

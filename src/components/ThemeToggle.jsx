import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../ThemeContext.jsx';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="w-full flex items-center justify-center gap-2 p-3 rounded-md bg-surface2 text-muted hover:bg-surface2 hover:bg-surface2 transition-colors"
    >
      {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      <span className="font-semibold text-sm">{theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}</span>
    </button>
  );
}
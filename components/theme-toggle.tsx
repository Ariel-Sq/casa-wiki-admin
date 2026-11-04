'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

/**
 * Light/dark switch for the panel. The preference is stored per origin, so it
 * doesn't change the storefront's theme.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === 'dark';

  return (
    <button
      type="button"
      aria-label={isDark ? 'Usar tema claro' : 'Usar tema oscuro'}
      title={isDark ? 'Tema claro' : 'Tema oscuro'}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="rounded-full p-2 transition-colors hover:bg-muted"
    >
      {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </button>
  );
}

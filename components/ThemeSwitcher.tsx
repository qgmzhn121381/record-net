'use client';

import { Theme } from '@/lib/themes';

interface ThemeSwitcherProps {
  themes: Theme[];
  currentTheme: string;
  onThemeChange: (themeId: string) => void;
}

export default function ThemeSwitcher({ themes, currentTheme, onThemeChange }: ThemeSwitcherProps) {
  return (
    <div className="theme-switcher">
      {themes.map((t) => (
        <button
          key={t.id}
          onClick={() => onThemeChange(t.id)}
          className="theme-dot"
          style={{
            background: t.background,
            borderColor: currentTheme === t.id ? t.accent : 'transparent',
            transform: currentTheme === t.id ? 'scale(1.2)' : 'scale(1)',
          }}
          title={t.name}
        />
      ))}
    </div>
  );
}

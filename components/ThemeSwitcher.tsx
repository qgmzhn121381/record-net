'use client';

import { Theme } from '@/lib/themes';

interface ThemeSwitcherProps {
  themes: Theme[];
  currentTheme: string;
  onThemeChange: (themeId: string) => void;
}

export default function ThemeSwitcher({ themes, currentTheme, onThemeChange }: ThemeSwitcherProps) {
  return (
    <div className="flex gap-2">
      {themes.map((t) => (
        <button
          key={t.id}
          onClick={() => onThemeChange(t.id)}
          className="w-7 h-7 rounded-full border-2 transition-all duration-200 hover:scale-110"
          style={{
            background: t.background,
            borderColor: currentTheme === t.id ? t.accent : 'transparent',
          }}
          title={t.name}
        />
      ))}
    </div>
  );
}

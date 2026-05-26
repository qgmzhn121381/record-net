export interface Theme {
  id: string;
  name: string;
  background: string;
  card: string;
  accent: string;
  text: string;
  textSecondary: string;
  border: string;
}

export const themes: Theme[] = [
  {
    id: 'blue',
    name: '深蓝',
    background: '#0f172a',
    card: '#1e293b',
    accent: '#3b82f6',
    text: '#f8fafc',
    textSecondary: '#94a3b8',
    border: '#334155',
  },
  {
    id: 'orange',
    name: '暖橙',
    background: '#1a0f00',
    card: '#2d1a00',
    accent: '#f97316',
    text: '#fef3c7',
    textSecondary: '#d97706',
    border: '#451a03',
  },
  {
    id: 'pink',
    name: '粉色',
    background: '#1a0f14',
    card: '#2d1a22',
    accent: '#ec4899',
    text: '#fce7f3',
    textSecondary: '#db2777',
    border: '#4a1942',
  },
  {
    id: 'green',
    name: '绿色',
    background: '#0a1a0f',
    card: '#1a2d1e',
    accent: '#22c55e',
    text: '#dcfce7',
    textSecondary: '#16a34a',
    border: '#14532d',
  },
];

export const defaultTheme = themes[0];

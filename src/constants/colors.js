// Color constants used across the entire project
export const COLORS = {
  dark: '#111111',
  card: '#1A1A1A',
  accent: '#C59C82',
  accentLight: '#DDC5B0',
  accentDark: '#A68B6A',
  textMuted: '#A1A1A1',
  textLight: '#E5E5E5',
  white: '#FFFFFF',
}

export const API_BASE = import.meta.env.DEV ? `http://${window.location.hostname}:5001/api` : 'https://hoh108.com/api'

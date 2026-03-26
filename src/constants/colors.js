// Color constants used across the entire project
// Interiorplus-inspired light, clean, premium palette
export const COLORS = {
  // Primary palette
  dark: '#0F172A',
  card: '#1A1A1A',
  accent: '#C59C82',
  accentLight: '#DDC5B0',
  accentDark: '#A68B6A',

  // Light theme
  white: '#FFFFFF',
  canvas: '#FAF5F2',
  linen: '#F6F6F6',
  stone: '#64748B',
  earth: '#4d3d30',

  // Text
  textMuted: '#64748B',
  textLight: '#E5E5E5',
  textDark: '#0F172A',

  // Borders
  border: 'rgba(15, 23, 42, 0.08)',
  borderHover: 'rgba(27, 26, 26, 0.15)',
}

export const API_BASE = import.meta.env.DEV ? `http://${window.location.hostname}:5001/api` : 'https://hoh108.com/api'

export interface UniversityTheme {
  primary: string
  secondary: string
  accent: string
  /** Color used for logo/navbar accents — always legible on a dark translucent navbar */
  navAccent: string
  bg: string
  inputBg: string
  text: string
  subtext: string
  buttonGradient: string
  fadeSide: string
}

export const UNIVERSITY_THEMES: Record<string, UniversityTheme> = {
  kent: {
    primary: '#002664',
    secondary: '#EAAA00',
    accent: '#EAAA00',
    navAccent: '#EAAA00',
    bg: '#f0f4ff',
    inputBg: '#d6e0f5',
    text: '#001133',
    subtext: '#334477',
    buttonGradient: 'linear-gradient(135deg, #002664 0%, #0044aa 100%)',
    fadeSide: '#f0f4ff',
  },
  osu: {
    primary: '#BA0C2F',
    secondary: '#666666',
    accent: '#BA0C2F',
    navAccent: '#e03050',
    bg: '#fff5f7',
    inputBg: '#f5d0d8',
    text: '#3b0010',
    subtext: '#7a2030',
    buttonGradient: 'linear-gradient(135deg, #BA0C2F 0%, #8a0020 100%)',
    fadeSide: '#fff5f7',
  },
  ysu: {
    primary: '#CC0000',
    secondary: '#333333',
    accent: '#CC0000',
    navAccent: '#e03030',
    bg: '#fff5f5',
    inputBg: '#f5d0d0',
    text: '#3b0000',
    subtext: '#7a2020',
    buttonGradient: 'linear-gradient(135deg, #CC0000 0%, #990000 100%)',
    fadeSide: '#fff5f5',
  },
  other: {
    primary: '#fd8b00',
    secondary: '#8c4a00',
    accent: '#fd8b00',
    navAccent: '#fd8b00',
    bg: '#fff5ed',
    inputBg: '#ffd6ab',
    text: '#452800',
    subtext: '#5c5b5b',
    buttonGradient: 'linear-gradient(135deg, #fd8b00 0%, #8c4a00 100%)',
    fadeSide: '#fff5ed',
  },
}

export function getTheme(universityId: string): UniversityTheme {
  return UNIVERSITY_THEMES[universityId] ?? UNIVERSITY_THEMES.other
}

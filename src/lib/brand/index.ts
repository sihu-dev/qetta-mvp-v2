/**
 * Qetta Brand Constants
 * 브랜드 아이덴티티 및 스타일 가이드
 */

export const BRAND = {
  name: 'Qetta',
  slogan: 'in·ev·it·able',
  tagline: 'Data Flows. Evidence Follows.',
  description: '증빙 자동화 및 기술조합 추천 플랫폼',

  colors: {
    primary: '#9333ea',
    primaryHover: '#7e22ce',
    primaryLight: '#a855f7',
    secondary: '#6366f1',
    background: '#faf5ff',
    backgroundDark: '#1e1b4b',
    text: '#1f2937',
    textLight: '#6b7280',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
  },

  fonts: {
    sans: '"Inter", system-ui, sans-serif',
    mono: '"JetBrains Mono", monospace',
  },

  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
  },
} as const;

export const BRAND_COLORS = {
  // Tailwind CSS 클래스 매핑
  primary: {
    bg: 'bg-purple-600',
    bgHover: 'hover:bg-purple-700',
    text: 'text-purple-600',
    border: 'border-purple-600',
  },
  secondary: {
    bg: 'bg-indigo-600',
    bgHover: 'hover:bg-indigo-700',
    text: 'text-indigo-600',
    border: 'border-indigo-600',
  },
} as const;

export const SOCIAL_LINKS = {
  github: 'https://github.com/qetta',
  twitter: 'https://twitter.com/qetta',
  linkedin: 'https://linkedin.com/company/qetta',
} as const;

export const METADATA = {
  title: 'Qetta - in·ev·it·able',
  description: BRAND.tagline,
  keywords: ['증빙', '자동화', '기술조합', 'AI', '문서생성', 'Evidence', 'Tech Stack'],
  openGraph: {
    title: 'Qetta',
    description: BRAND.tagline,
    type: 'website',
    locale: 'ko_KR',
  },
} as const;

// 3-Tier Intelligence 설정
export const INTELLIGENCE_TIERS = {
  rule: {
    name: 'Rule-based',
    percentage: 95,
    responseTime: '<100ms',
    cost: '₩0',
  },
  ml: {
    name: 'ML-based',
    percentage: 4,
    responseTime: '<500ms',
    cost: '₩500K/년',
  },
  claude: {
    name: 'Claude API',
    percentage: 1,
    responseTime: '<10s',
    cost: '₩6M/년 (cap)',
  },
} as const;

// 문서 포맷 설정
export const DOCUMENT_FORMATS = {
  proposal: {
    extension: 'docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    icon: '📄',
  },
  quotation: {
    extension: 'xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    icon: '📊',
  },
  presentation: {
    extension: 'pptx',
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    icon: '📽️',
  },
  evidence: {
    extension: 'zip',
    mimeType: 'application/zip',
    icon: '🗄️',
  },
} as const;

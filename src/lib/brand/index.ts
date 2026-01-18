/**
 * Qetta Brand Constants
 * 브랜드 아이덴티티 및 스타일 가이드
 *
 * Brand Guidelines:
 * - 이모지/인공적 아이콘 사용 금지
 * - SVG 아이콘 또는 Heroicons 사용
 * - 일관된 워딩 사용 (아래 SERVICE_WORDING 참조)
 */

export const BRAND = {
  name: 'Qetta',
  slogan: 'in·ev·it·able',
  tagline: 'Data Flows. Evidence Follows.',
  description: '제조 데이터에서 정부 증빙까지, AI가 자동으로',
  shortDesc: '스마트팩토리 증빙 자동화 플랫폼',

  // 핵심 가치 제안
  cvp: {
    cost: 'MES 대비 99% 비용 절감',
    defect: '불량률 30% 감소',
    downtime: '설비 정지 80% 감소',
    roi: 'ROI 0.7개월',
  },

  colors: {
    // Salient Template Colors (Blue-based)
    primary: '#2563eb',       // blue-600
    primaryHover: '#1d4ed8',  // blue-700
    primaryLight: '#3b82f6',  // blue-500
    secondary: '#0ea5e9',     // sky-500
    background: '#f8fafc',    // slate-50
    backgroundDark: '#0f172a', // slate-900
    text: '#1e293b',          // slate-800
    textLight: '#64748b',     // slate-500
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

/**
 * 서비스 워딩 일관성
 * 모든 UI에서 동일한 용어 사용
 */
export const SERVICE_WORDING = {
  // 핵심 기능
  evidenceRegistry: {
    name: 'Evidence Registry',
    nameKo: '증빙 레지스트리',
    desc: 'Gov ZIP 패키지로 변조 탐지 가능한 증빙 보관',
  },
  techCombiner: {
    name: 'Tech Combiner',
    nameKo: '기술조합',
    desc: 'AI 기반 최적 기술 스택 추천',
  },
  documentSkills: {
    name: 'Document Skills',
    nameKo: '문서 자동생성',
    desc: '제안서, 견적서, 발표자료 자동 생성',
  },

  // 입찰 관련
  tender: {
    collect: '입찰 수집',
    analyze: '적합도 분석',
    generate: '문서 생성',
    sources: {
      g2b: '나라장터',
      ungm: 'UN Global Marketplace',
      sam: 'SAM.gov',
      kz: 'Kazakhstan Goszakup',
    },
  },

  // 상태 표시
  status: {
    new: '신규',
    analyzing: '분석중',
    analyzed: '분석완료',
    interested: '관심',
    applied: '제출완료',
    won: '낙찰',
    lost: '유찰',
  },

  // 적합도 등급
  fitGrade: {
    A: '적극 권장',
    B: '권장',
    C: '검토 필요',
    D: '주의 필요',
    F: '비권장',
  },
} as const;

export const BRAND_COLORS = {
  // Tailwind CSS 클래스 매핑 (Salient Template - Blue)
  primary: {
    bg: 'bg-blue-600',
    bgHover: 'hover:bg-blue-700',
    text: 'text-blue-600',
    border: 'border-blue-600',
    ring: 'ring-blue-600',
    focus: 'focus:ring-blue-500',
  },
  secondary: {
    bg: 'bg-sky-500',
    bgHover: 'hover:bg-sky-600',
    text: 'text-sky-500',
    border: 'border-sky-500',
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

// 문서 포맷 설정 (아이콘은 Heroicons 사용)
export const DOCUMENT_FORMATS = {
  proposal: {
    extension: 'docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    label: '제안서',
    // Use: DocumentTextIcon from @heroicons/react/24/outline
  },
  quotation: {
    extension: 'xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    label: '견적서',
    // Use: TableCellsIcon from @heroicons/react/24/outline
  },
  presentation: {
    extension: 'pptx',
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    label: '발표자료',
    // Use: PresentationChartBarIcon from @heroicons/react/24/outline
  },
  evidence: {
    extension: 'zip',
    mimeType: 'application/zip',
    label: '증빙 패키지',
    // Use: ArchiveBoxIcon from @heroicons/react/24/outline
  },
} as const;

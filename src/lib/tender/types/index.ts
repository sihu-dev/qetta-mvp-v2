/**
 * Qetta Tender Module Types
 * v4.0 - Bid Collection & Document Generation
 */

// Bid Source Platforms
export type BidSource = 'g2b' | 'ungm' | 'sam' | 'kz';

// Bid Status Lifecycle
export type BidStatus =
  | 'new'
  | 'analyzing'
  | 'interested'
  | 'applied'
  | 'won'
  | 'lost'
  | 'expired';

// Competition Level
export type CompetitionLevel = 'low' | 'medium' | 'high';

// Document Types
export type DocumentType = 'proposal' | 'quotation' | 'presentation' | 'package';
export type DocumentFormat = 'docx' | 'xlsx' | 'pptx' | 'pdf' | 'zip';

// Currency Types
export type Currency = 'KRW' | 'USD' | 'EUR' | 'KZT' | 'CHF';

/**
 * Bid Raw Data - 소스별 원본 데이터 구조
 */
export interface BidRawData {
  // G2B (나라장터)
  bidNtceNo?: string;
  bidNtceNm?: string;
  ntceInsttNm?: string;
  presmptPrce?: number;
  bidNtceDt?: string;
  bidClseDt?: string;
  bidNtceUrl?: string;

  // UNGM (UN Global Marketplace)
  referenceNumber?: string;
  description?: string;
  organization?: string;
  estimatedValue?: number;
  deadline?: string;
  documentLinks?: string[];

  // SAM.gov
  noticeId?: string;
  solicitationNumber?: string;
  title?: string;
  agency?: string;
  postedDate?: string;
  responseDeadline?: string;
  naicsCode?: string;
  placeOfPerformance?: string;

  // Kazakhstan (KZ)
  annoNum?: string;
  annoName?: string;
  customerName?: string;
  sumTru?: number;
  startDate?: string;
  endDate?: string;

  // Common/Extended fields
  attachments?: Array<{
    name: string;
    url: string;
    size?: number;
  }>;
  categories?: string[];
  keywords?: string[];
  contact?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  [key: string]: unknown; // Allow additional source-specific fields
}

/**
 * Bid Entity - 입찰 공고
 */
export interface Bid {
  id: string;
  org_id: string;
  source: BidSource;
  external_id: string;
  title: string;
  description: string | null;
  budget: number | null;
  currency: Currency;
  deadline: string | null;
  status: BidStatus;
  fit_score: number | null;
  raw_data: BidRawData;
  created_at: string;
  updated_at: string;
}

/**
 * Bid Analysis Result - 입찰 분석 결과
 */
export interface BidAnalysis {
  id: string;
  bid_id: string;
  org_id: string;
  qualifications_met: QualificationCheck[];
  required_documents: RequiredDocument[];
  competition_level: CompetitionLevel;
  win_probability: number;
  recommendations: Recommendation[];
  analyzed_at: string;
}

export interface QualificationCheck {
  requirement: string;
  met: boolean;
  note?: string;
}

export interface RequiredDocument {
  name: string;
  format: DocumentFormat[];
  mandatory: boolean;
  deadline?: string;
}

export interface Recommendation {
  type: 'strength' | 'weakness' | 'opportunity' | 'threat';
  content: string;
  priority: 'high' | 'medium' | 'low';
}

/**
 * Generated Document - 생성된 문서
 */
export interface GeneratedDocument {
  id: string;
  bid_id: string | null;
  org_id: string;
  doc_type: DocumentType;
  format: DocumentFormat;
  file_path: string;
  file_size: number;
  generated_at: string;
}

/**
 * Collector Config - 수집기 설정
 */
export interface CollectorConfig {
  source: BidSource;
  api_key?: string;
  api_url: string;
  rate_limit: number; // requests per minute
  enabled: boolean;
}

/**
 * Collect Result - 수집 결과
 */
export interface CollectResult {
  source: BidSource;
  success: boolean;
  count: number;
  errors: string[];
  collected_at: string;
}

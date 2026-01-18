/**
 * Bid Analyzer - 입찰 공고 분석기
 * Analyzes bid requirements, qualifications, and opportunity assessment
 */

import type {
  Bid,
  BidAnalysis,
  CompetitionLevel,
  QualificationCheck,
  RequiredDocument,
  Recommendation,
} from '../types';

export interface CompanyProfile {
  business_number?: string;
  company_name?: string;
  certifications: string[];
  experience_years: number;
  past_wins: number;
  revenue: number;
  employee_count?: number;
  specializations?: string[];
}

export interface AnalyzeOptions {
  checkQualifications: boolean;
  estimateCompetition: boolean;
  generateRecommendations: boolean;
  extractDocuments: boolean;
  useAI?: boolean;
}

const DEFAULT_OPTIONS: AnalyzeOptions = {
  checkQualifications: true,
  estimateCompetition: true,
  generateRecommendations: true,
  extractDocuments: true,
  useAI: false,
};

/**
 * Analyze a bid for fit and opportunity
 */
export async function analyzeBid(
  bid: Bid,
  companyProfile: CompanyProfile,
  options: Partial<AnalyzeOptions> = {}
): Promise<BidAnalysis> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const qualifications = opts.checkQualifications
    ? await checkQualifications(bid, companyProfile)
    : [];

  const competitionLevel = opts.estimateCompetition
    ? await estimateCompetition(bid)
    : 'medium';

  const requiredDocuments = opts.extractDocuments
    ? extractRequiredDocuments(bid)
    : [];

  const recommendations = opts.generateRecommendations
    ? await generateRecommendations(bid, companyProfile, qualifications, competitionLevel)
    : [];

  const winProbability = calculateWinProbability(
    qualifications,
    competitionLevel,
    companyProfile
  );

  return {
    id: '',
    bid_id: bid.id,
    org_id: bid.org_id,
    qualifications_met: qualifications,
    required_documents: requiredDocuments,
    competition_level: competitionLevel,
    win_probability: winProbability,
    recommendations,
    analyzed_at: new Date().toISOString(),
  };
}

/**
 * Check company qualifications against bid requirements
 */
async function checkQualifications(
  bid: Bid,
  profile: CompanyProfile
): Promise<QualificationCheck[]> {
  const checks: QualificationCheck[] = [];
  const title = bid.title.toLowerCase();
  const description = (bid.description || '').toLowerCase();
  const combinedText = `${title} ${description}`;

  // 1. Business registration check
  checks.push({
    requirement: '사업자등록증 보유',
    met: !!profile.business_number,
    note: profile.business_number ? '등록 확인됨' : '사업자등록 필요',
  });

  // 2. Financial capacity check
  if (bid.budget) {
    const requiredCapacity = bid.budget * 0.1;
    const hasSufficientRevenue = profile.revenue >= requiredCapacity;
    checks.push({
      requirement: '재정 능력',
      met: hasSufficientRevenue,
      note: hasSufficientRevenue
        ? `충분한 매출 (${formatCurrency(profile.revenue)})`
        : `추정가 대비 매출 부족 (필요: ${formatCurrency(requiredCapacity)})`,
    });
  }

  // 3. Experience check
  const requiresExperience = /경력|경험|실적|수행/.test(combinedText);
  if (requiresExperience) {
    const hasExperience = profile.experience_years >= 3;
    checks.push({
      requirement: '관련 경력/실적',
      met: hasExperience,
      note: `${profile.experience_years}년 경력, ${profile.past_wins}건 수주 실적`,
    });
  }

  // 4. Certification checks based on bid content
  const certificationChecks = detectCertificationRequirements(combinedText, profile.certifications);
  checks.push(...certificationChecks);

  // 5. Employee count check for large projects
  if (bid.budget && bid.budget > 500000000 && profile.employee_count) {
    const hasEnoughStaff = profile.employee_count >= 10;
    checks.push({
      requirement: '인력 규모',
      met: hasEnoughStaff,
      note: `현재 ${profile.employee_count}명 (대규모 사업 권장: 10명 이상)`,
    });
  }

  // 6. Specialization match
  if (profile.specializations && profile.specializations.length > 0) {
    const matchScore = calculateSpecializationMatch(combinedText, profile.specializations);
    checks.push({
      requirement: '전문분야 적합성',
      met: matchScore >= 0.3,
      note: `적합도 ${Math.round(matchScore * 100)}%`,
    });
  }

  return checks;
}

/**
 * Detect certification requirements from bid text
 */
function detectCertificationRequirements(
  text: string,
  companyCerts: string[]
): QualificationCheck[] {
  const checks: QualificationCheck[] = [];
  const lowerCerts = companyCerts.map((c) => c.toLowerCase());

  const certPatterns: Array<{ pattern: RegExp; name: string; keywords: string[] }> = [
    {
      pattern: /iso\s*9001|품질경영/i,
      name: 'ISO 9001 (품질경영)',
      keywords: ['iso9001', 'iso 9001', '품질경영'],
    },
    {
      pattern: /iso\s*14001|환경경영/i,
      name: 'ISO 14001 (환경경영)',
      keywords: ['iso14001', 'iso 14001', '환경경영'],
    },
    {
      pattern: /iso\s*27001|정보보안|isms/i,
      name: 'ISO 27001 (정보보안)',
      keywords: ['iso27001', 'iso 27001', '정보보안', 'isms'],
    },
    {
      pattern: /직접생산|중소기업|소기업|중기업/i,
      name: '중소기업 확인서',
      keywords: ['중소기업', '소기업', '중기업'],
    },
    {
      pattern: /sw사업자|소프트웨어사업자/i,
      name: 'SW사업자 신고',
      keywords: ['sw사업자', '소프트웨어사업자'],
    },
    {
      pattern: /벤처기업|벤처확인/i,
      name: '벤처기업 인증',
      keywords: ['벤처기업', '벤처'],
    },
    {
      pattern: /이노비즈|innobiz/i,
      name: '이노비즈 인증',
      keywords: ['이노비즈', 'innobiz'],
    },
  ];

  for (const cert of certPatterns) {
    if (cert.pattern.test(text)) {
      const hasCert = cert.keywords.some((k) =>
        lowerCerts.some((c) => c.includes(k))
      );
      checks.push({
        requirement: cert.name,
        met: hasCert,
        note: hasCert ? '보유' : '미보유 - 취득 검토 필요',
      });
    }
  }

  return checks;
}

/**
 * Calculate specialization match score
 */
function calculateSpecializationMatch(text: string, specializations: string[]): number {
  if (!specializations.length) return 0;

  let matchCount = 0;
  for (const spec of specializations) {
    const keywords = spec.toLowerCase().split(/\s+/);
    for (const keyword of keywords) {
      if (keyword.length >= 2 && text.includes(keyword)) {
        matchCount++;
        break;
      }
    }
  }

  return matchCount / specializations.length;
}

/**
 * Estimate competition level based on bid characteristics
 */
async function estimateCompetition(bid: Bid): Promise<CompetitionLevel> {
  let score = 50; // Base score

  // Budget factor
  if (bid.budget) {
    if (bid.budget > 1000000000) {
      score += 20; // High budget = more competition
    } else if (bid.budget > 500000000) {
      score += 10;
    } else if (bid.budget < 100000000) {
      score -= 15; // Lower budget = less competition
    }
  }

  // Deadline factor
  if (bid.deadline) {
    const daysUntilDeadline = Math.floor(
      (new Date(bid.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (daysUntilDeadline < 7) {
      score -= 20; // Tight deadline = less competition
    } else if (daysUntilDeadline > 30) {
      score += 10; // Long deadline = more competition
    }
  }

  // Source factor
  if (bid.source === 'g2b') {
    score += 10; // G2B is very competitive
  } else if (bid.source === 'kz' || bid.source === 'ungm') {
    score -= 10; // International bids have niche competition
  }

  // Title keywords factor
  const title = bid.title.toLowerCase();
  if (/스마트|ai|인공지능|빅데이터|클라우드/.test(title)) {
    score += 15; // Hot tech areas are competitive
  }
  if (/유지보수|운영|관리/.test(title)) {
    score -= 10; // Maintenance contracts less competitive
  }

  // Map score to level
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

/**
 * Extract required documents from bid
 */
function extractRequiredDocuments(bid: Bid): RequiredDocument[] {
  const documents: RequiredDocument[] = [];
  const text = `${bid.title} ${bid.description || ''}`.toLowerCase();

  const docPatterns: Array<{
    pattern: RegExp;
    name: string;
    format: RequiredDocument['format'];
    mandatory: boolean;
  }> = [
    { pattern: /제안서|기술제안/, name: '기술제안서', format: ['docx', 'pdf'], mandatory: true },
    { pattern: /가격제안|입찰서/, name: '가격제안서', format: ['xlsx', 'pdf'], mandatory: true },
    { pattern: /사업자등록/, name: '사업자등록증 사본', format: ['pdf'], mandatory: true },
    { pattern: /인감증명/, name: '인감증명서', format: ['pdf'], mandatory: true },
    { pattern: /납세증명/, name: '납세증명서', format: ['pdf'], mandatory: false },
    { pattern: /이행보증|계약보증/, name: '이행보증보험증권', format: ['pdf'], mandatory: false },
    { pattern: /재무제표|재무현황/, name: '재무제표', format: ['xlsx', 'pdf'], mandatory: false },
    { pattern: /실적증명|수행실적/, name: '실적증명서', format: ['pdf'], mandatory: false },
    { pattern: /프레젠테이션|발표/, name: '제안발표자료', format: ['pptx'], mandatory: false },
  ];

  for (const doc of docPatterns) {
    if (doc.pattern.test(text)) {
      documents.push({
        name: doc.name,
        format: doc.format,
        mandatory: doc.mandatory,
        deadline: bid.deadline || undefined,
      });
    }
  }

  // Add default minimum documents if none detected
  if (documents.length === 0) {
    documents.push(
      { name: '제안서', format: ['docx', 'pdf'], mandatory: true },
      { name: '가격제안서', format: ['xlsx'], mandatory: true },
      { name: '사업자등록증', format: ['pdf'], mandatory: true }
    );
  }

  return documents;
}

/**
 * Generate strategic recommendations
 */
async function generateRecommendations(
  bid: Bid,
  profile: CompanyProfile,
  qualifications: QualificationCheck[],
  competition: CompetitionLevel
): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];

  // Analyze qualification gaps
  const unmetQuals = qualifications.filter((q) => !q.met);
  const metQuals = qualifications.filter((q) => q.met);

  // Strength recommendations
  if (metQuals.length >= qualifications.length * 0.8) {
    recommendations.push({
      type: 'strength',
      content: `자격 요건 ${Math.round((metQuals.length / qualifications.length) * 100)}% 충족 - 입찰 적합`,
      priority: 'high',
    });
  }

  if (profile.past_wins > 5) {
    recommendations.push({
      type: 'strength',
      content: `${profile.past_wins}건의 수주 실적으로 신뢰도 확보`,
      priority: 'medium',
    });
  }

  // Weakness recommendations
  for (const qual of unmetQuals) {
    recommendations.push({
      type: 'weakness',
      content: `${qual.requirement} 미충족: ${qual.note || '확인 필요'}`,
      priority: qual.requirement.includes('재정') || qual.requirement.includes('등록') ? 'high' : 'medium',
    });
  }

  // Opportunity recommendations
  if (competition === 'low') {
    recommendations.push({
      type: 'opportunity',
      content: '경쟁 강도 낮음 - 수주 가능성 높음',
      priority: 'high',
    });
  }

  if (bid.deadline) {
    const daysLeft = Math.floor(
      (new Date(bid.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (daysLeft > 14 && daysLeft < 30) {
      recommendations.push({
        type: 'opportunity',
        content: `마감까지 ${daysLeft}일 - 충분한 준비 시간 확보`,
        priority: 'medium',
      });
    }
  }

  // Budget opportunity
  if (bid.budget && profile.revenue) {
    const budgetRatio = bid.budget / profile.revenue;
    if (budgetRatio >= 0.1 && budgetRatio <= 0.5) {
      recommendations.push({
        type: 'opportunity',
        content: '사업 규모가 회사 역량에 적합',
        priority: 'medium',
      });
    }
  }

  // Threat recommendations
  if (competition === 'high') {
    recommendations.push({
      type: 'threat',
      content: '경쟁 강도 높음 - 차별화 전략 필요',
      priority: 'high',
    });
  }

  if (unmetQuals.length > qualifications.length * 0.3) {
    recommendations.push({
      type: 'threat',
      content: '자격 요건 미충족률 높음 - 입찰 재검토 권장',
      priority: 'high',
    });
  }

  return recommendations;
}

/**
 * Calculate win probability score
 */
function calculateWinProbability(
  qualifications: QualificationCheck[],
  competition: CompetitionLevel,
  profile: CompanyProfile
): number {
  if (qualifications.length === 0) return 50;

  // Base score from qualifications
  const qualScore = qualifications.filter((q) => q.met).length / qualifications.length;

  // Competition multiplier
  const competitionMultiplier =
    competition === 'low' ? 1.3 : competition === 'medium' ? 1.0 : 0.7;

  // Experience bonus
  const experienceBonus = Math.min(profile.experience_years * 0.02, 0.2);

  // Past wins bonus
  const winsBonus = Math.min(profile.past_wins * 0.01, 0.1);

  // Calculate final score
  const rawScore = qualScore * competitionMultiplier + experienceBonus + winsBonus;
  const finalScore = Math.round(Math.min(rawScore, 1) * 100);

  return Math.max(5, Math.min(95, finalScore)); // Clamp between 5-95%
}

/**
 * Format currency for display
 */
function formatCurrency(amount: number): string {
  if (amount >= 100000000) {
    return `${(amount / 100000000).toFixed(1)}억원`;
  }
  if (amount >= 10000) {
    return `${(amount / 10000).toFixed(0)}만원`;
  }
  return `${amount}원`;
}

export { type CompanyProfile as CompanyProfileType };

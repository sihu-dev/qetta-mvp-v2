/**
 * Ultra Thinking - Tech Combiner
 * Qetta의 핵심 AGI 모듈: "inevitable" 기술 조합 추천
 *
 * 비즈니스 요구사항을 분석하여 최적의 기술 스택 조합을 추천합니다.
 * 3-Tier Intelligence: Tier 3 (Claude API)
 */

import Anthropic from '@anthropic-ai/sdk';
import { createComponentLogger } from '@/lib/logging/structured-logger';
import type {
  BusinessRequirement,
  TechCombination,
  TechRecommendation,
} from '../types';

const log = createComponentLogger('TechCombiner');

const anthropic = new Anthropic();

const SYSTEM_PROMPT = `당신은 기술 아키텍트 전문가입니다.
비즈니스 요구사항을 분석하여 최적의 기술 스택 조합을 추천하세요.

응답 형식 (JSON):
{
  "combinations": [
    {
      "id": "combo-1",
      "name": "조합명",
      "technologies": {
        "frontend": ["..."],
        "backend": ["..."],
        "database": ["..."],
        "infra": ["..."],
        "ai": ["..."]
      },
      "scores": {
        "businessFit": 0-100,
        "technicalExcellence": 0-100,
        "costEfficiency": 0-100,
        "risk": 0-100
      },
      "swot": {
        "strengths": ["..."],
        "weaknesses": ["..."],
        "opportunities": ["..."],
        "threats": ["..."]
      },
      "costAnalysis": {
        "initial": 원단위,
        "monthly": 원단위,
        "annual": 원단위
      },
      "risks": [
        {"description": "...", "probability": "low|medium|high", "mitigation": "..."}
      ],
      "implementationRoadmap": [
        {"phase": 1, "weeks": 4, "tasks": ["..."]}
      ]
    }
  ],
  "bestChoice": "combo-id",
  "reasoning": "선택 근거"
}`;

export class TechCombiner {
  /**
   * 기술 스택 추천
   */
  async recommend(requirement: BusinessRequirement): Promise<TechRecommendation> {
    const prompt = this.buildPrompt(requirement);

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    });

    return this.parseResponse(response);
  }

  /**
   * 빠른 기술 스택 검증 (Tier 1: Rule-based)
   */
  validateStack(combination: TechCombination): {
    valid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    // 프론트엔드 검증
    if (combination.technologies.frontend.length === 0) {
      issues.push('프론트엔드 기술이 지정되지 않았습니다.');
    }

    // 백엔드 검증
    if (combination.technologies.backend.length === 0) {
      issues.push('백엔드 기술이 지정되지 않았습니다.');
    }

    // 데이터베이스 검증
    if (combination.technologies.database.length === 0) {
      issues.push('데이터베이스가 지정되지 않았습니다.');
    }

    // 비용 효율성 검증
    if (combination.scores.costEfficiency < 30) {
      issues.push('비용 효율성이 낮습니다. 대안 검토가 필요합니다.');
    }

    // 리스크 검증
    if (combination.scores.risk > 70) {
      issues.push('리스크 점수가 높습니다. 위험 완화 전략이 필요합니다.');
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  /**
   * 기술 스택 호환성 검사 (Tier 1: Rule-based)
   */
  checkCompatibility(
    frontend: string[],
    backend: string[],
    database: string[]
  ): { compatible: boolean; warnings: string[] } {
    const warnings: string[] = [];

    // Next.js + Node.js 호환성
    const hasNext = frontend.some((f) => f.toLowerCase().includes('next'));
    const hasNode = backend.some((b) => b.toLowerCase().includes('node'));

    if (hasNext && !hasNode) {
      warnings.push('Next.js는 Node.js 백엔드와 함께 사용하는 것이 좋습니다.');
    }

    // React Native + Web 혼용 주의
    const hasReactNative = frontend.some((f) =>
      f.toLowerCase().includes('react native')
    );
    const hasReactWeb = frontend.some(
      (f) =>
        f.toLowerCase().includes('react') &&
        !f.toLowerCase().includes('native')
    );

    if (hasReactNative && hasReactWeb) {
      warnings.push(
        'React Native와 React Web을 함께 사용 시 코드 공유 전략이 필요합니다.'
      );
    }

    // PostgreSQL + pgvector 필수
    const hasPgvector = database.some((d) =>
      d.toLowerCase().includes('pgvector')
    );
    const hasPostgres = database.some((d) =>
      d.toLowerCase().includes('postgres')
    );

    if (hasPgvector && !hasPostgres) {
      warnings.push('pgvector는 PostgreSQL 확장입니다. PostgreSQL이 필요합니다.');
    }

    return {
      compatible: warnings.length === 0,
      warnings,
    };
  }

  /**
   * 비용 추정 (Tier 2: ML/계산 기반)
   */
  estimateCost(
    combination: TechCombination,
    teamSize: number,
    durationMonths: number
  ): {
    development: number;
    infrastructure: number;
    maintenance: number;
    total: number;
  } {
    const { costAnalysis } = combination;

    // 개발 비용 (초기 비용 기반)
    const development = costAnalysis.initial * (teamSize / 5);

    // 인프라 비용
    const infrastructure = costAnalysis.monthly * durationMonths;

    // 유지보수 비용 (연간의 20%)
    const maintenance = costAnalysis.annual * 0.2 * (durationMonths / 12);

    return {
      development: Math.round(development),
      infrastructure: Math.round(infrastructure),
      maintenance: Math.round(maintenance),
      total: Math.round(development + infrastructure + maintenance),
    };
  }

  private buildPrompt(req: BusinessRequirement): string {
    return `다음 비즈니스 요구사항에 맞는 기술 스택을 3개 이상 추천해주세요:

프로젝트 유형: ${req.projectType}
예산: ${req.budget.toLocaleString()}원
일정: ${req.timeline}
팀 구성:
- 프론트엔드: ${req.teamExperience.frontend || 0}명
- 백엔드: ${req.teamExperience.backend || 0}명
- DevOps: ${req.teamExperience.devops || 0}명
- AI: ${req.teamExperience.ai || 0}명

제약사항: ${req.constraints.join(', ') || '없음'}
우선순위: ${req.priorities.join(' > ')}

각 조합에 대해 다음을 포함해주세요:
1. 기술 스택 (프론트엔드, 백엔드, DB, 인프라, AI)
2. 점수 (비즈니스 적합도, 기술적 우수성, 비용 효율성, 리스크)
3. SWOT 분석
4. 비용 분석 (초기, 월간, 연간)
5. 리스크와 완화 방안
6. 구현 로드맵 (단계별 주차, 작업)`;
  }

  private parseResponse(response: Anthropic.Message): TechRecommendation {
    try {
      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type');
      }

      // JSON 블록 추출
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        combinations: parsed.combinations || [],
        bestChoice: parsed.bestChoice || parsed.combinations?.[0]?.id || '',
        reasoning: parsed.reasoning || '',
      };
    } catch (error) {
      log.error('Failed to parse Tech Combiner response', error);
      return {
        combinations: [],
        bestChoice: '',
        reasoning: 'Failed to parse response',
      };
    }
  }
}

export const techCombiner = new TechCombiner();

/**
 * 간편 API: 기술 스택 추천
 */
export async function recommendTechStack(
  requirement: BusinessRequirement
): Promise<TechRecommendation> {
  return techCombiner.recommend(requirement);
}

/**
 * 간편 API: 기술 스택 검증
 */
export function validateTechStack(combination: TechCombination) {
  return techCombiner.validateStack(combination);
}

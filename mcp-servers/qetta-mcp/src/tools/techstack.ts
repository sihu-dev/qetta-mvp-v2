/**
 * Tech Stack Tools
 * AGI 기술조합 추천 도구
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import Anthropic from '@anthropic-ai/sdk';

// 기술 카탈로그
const TECH_CATALOG = {
  frontend: [
    { name: 'Next.js 15', score: 5, tags: ['react', 'ssr', 'app-router'], cost: 'free' },
    { name: 'React 19', score: 5, tags: ['spa', 'hooks', 'concurrent'], cost: 'free' },
    { name: 'Vue 3', score: 4, tags: ['progressive', 'composition'], cost: 'free' },
    { name: 'Svelte', score: 4, tags: ['compiler', 'small-bundle'], cost: 'free' },
  ],
  backend: [
    { name: 'Supabase Edge Functions', score: 5, tags: ['serverless', 'deno', 'typescript'], cost: '$25/mo' },
    { name: 'Node.js', score: 4, tags: ['npm', 'express', 'fastify'], cost: 'free' },
    { name: 'Python FastAPI', score: 4, tags: ['async', 'openapi', 'pydantic'], cost: 'free' },
    { name: 'Go', score: 4, tags: ['performance', 'concurrency'], cost: 'free' },
  ],
  database: [
    { name: 'Supabase PostgreSQL', score: 5, tags: ['rls', 'realtime', 'pgvector'], cost: '$25/mo' },
    { name: 'PlanetScale', score: 4, tags: ['mysql', 'serverless', 'branching'], cost: '$29/mo' },
    { name: 'MongoDB Atlas', score: 4, tags: ['nosql', 'flexible-schema'], cost: '$57/mo' },
    { name: 'Redis', score: 4, tags: ['cache', 'pubsub', 'fast'], cost: '$7/mo' },
  ],
  ai_ml: [
    { name: 'Claude API', score: 5, tags: ['llm', 'reasoning', 'coding'], cost: '₩6M/year cap' },
    { name: 'pgvector', score: 5, tags: ['embedding', 'similarity', 'postgresql'], cost: 'included' },
    { name: 'OpenAI API', score: 4, tags: ['gpt', 'embeddings', 'vision'], cost: 'usage-based' },
    { name: 'Hugging Face', score: 4, tags: ['models', 'inference', 'open-source'], cost: '$9/mo' },
  ],
  infrastructure: [
    { name: 'Vercel', score: 5, tags: ['deploy', 'edge', 'preview'], cost: '$20/mo' },
    { name: 'AWS', score: 4, tags: ['ec2', 's3', 'lambda'], cost: 'usage-based' },
    { name: 'GCP', score: 4, tags: ['cloud-run', 'gke', 'bigquery'], cost: 'usage-based' },
    { name: 'Cloudflare', score: 4, tags: ['cdn', 'workers', 'r2'], cost: '$5/mo' },
  ],
};

// 키워드-기술 매핑
const KEYWORD_MAPPINGS: Record<string, string[]> = {
  실시간: ['Supabase PostgreSQL', 'Redis', 'Next.js 15'],
  센서: ['Supabase Edge Functions', 'pgvector', 'Redis'],
  문서: ['Next.js 15', 'Supabase PostgreSQL', 'Claude API'],
  검색: ['pgvector', 'Supabase PostgreSQL', 'Claude API'],
  알람: ['Supabase PostgreSQL', 'Redis', 'Supabase Edge Functions'],
  정부: ['Supabase PostgreSQL', 'Next.js 15', 'Vercel'],
  증빙: ['Supabase PostgreSQL', 'Supabase Edge Functions', 'Next.js 15'],
  ai: ['Claude API', 'pgvector', 'Supabase Edge Functions'],
  대용량: ['Supabase PostgreSQL', 'Redis', 'Cloudflare'],
  보안: ['Supabase PostgreSQL', 'Vercel', 'Next.js 15'],
};

export const techTools: Tool[] = [
  {
    name: 'tech_recommend_stack',
    description: '비즈니스 요구사항을 분석하여 최적의 기술 스택 추천 (3-Tier Intelligence)',
    inputSchema: {
      type: 'object',
      properties: {
        requirements: {
          type: 'string',
          description: '비즈니스 요구사항 설명',
        },
        constraints: {
          type: 'object',
          properties: {
            budget: { type: 'string', description: '예산 범위' },
            timeline: { type: 'string', description: '개발 기간' },
            team_size: { type: 'number', description: '개발팀 규모' },
          },
          description: '제약 조건 (선택)',
        },
        tier: {
          type: 'string',
          enum: ['rule', 'ml', 'claude'],
          description: '분석 티어 (기본값: rule)',
        },
      },
      required: ['requirements'],
    },
  },
  {
    name: 'tech_validate_stack',
    description: '기술 스택 호환성 검증',
    inputSchema: {
      type: 'object',
      properties: {
        stack: {
          type: 'array',
          items: { type: 'string' },
          description: '검증할 기술 목록',
        },
      },
      required: ['stack'],
    },
  },
  {
    name: 'tech_estimate_cost',
    description: '기술 스택 비용 추정',
    inputSchema: {
      type: 'object',
      properties: {
        stack: {
          type: 'array',
          items: { type: 'string' },
          description: '비용 추정할 기술 목록',
        },
        scale: {
          type: 'string',
          enum: ['startup', 'growth', 'enterprise'],
          description: '규모 (기본값: startup)',
        },
      },
      required: ['stack'],
    },
  },
  {
    name: 'tech_swot_analysis',
    description: '기술 스택 SWOT 분석',
    inputSchema: {
      type: 'object',
      properties: {
        stack: {
          type: 'array',
          items: { type: 'string' },
          description: 'SWOT 분석할 기술 목록',
        },
        context: {
          type: 'string',
          description: '비즈니스 컨텍스트',
        },
      },
      required: ['stack'],
    },
  },
];

export async function handleTechTool(
  name: string,
  args: Record<string, unknown>
) {
  switch (name) {
    case 'tech_recommend_stack':
      return await recommendStack(args);
    case 'tech_validate_stack':
      return validateStack(args);
    case 'tech_estimate_cost':
      return estimateCost(args);
    case 'tech_swot_analysis':
      return await swotAnalysis(args);
    default:
      throw new Error(`Unknown tech tool: ${name}`);
  }
}

async function recommendStack(args: Record<string, unknown>) {
  const { requirements, constraints, tier = 'rule' } = args as {
    requirements: string;
    constraints?: { budget?: string; timeline?: string; team_size?: number };
    tier?: 'rule' | 'ml' | 'claude';
  };

  // Tier 1: Rule-based (95%)
  if (tier === 'rule') {
    return ruleBasedRecommendation(requirements, constraints);
  }

  // Tier 2: ML-based (4%) - 여기서는 간단한 유사도 기반
  if (tier === 'ml') {
    return mlBasedRecommendation(requirements, constraints);
  }

  // Tier 3: Claude API (1%)
  if (tier === 'claude') {
    return await claudeBasedRecommendation(requirements, constraints);
  }

  return ruleBasedRecommendation(requirements, constraints);
}

function ruleBasedRecommendation(
  requirements: string,
  constraints?: { budget?: string; timeline?: string; team_size?: number }
) {
  const keywords = requirements.toLowerCase();
  const matchedTechs = new Set<string>();

  // 키워드 매칭
  for (const [keyword, techs] of Object.entries(KEYWORD_MAPPINGS)) {
    if (keywords.includes(keyword)) {
      techs.forEach((t) => matchedTechs.add(t));
    }
  }

  // 기본 추천 (매칭 없을 경우)
  if (matchedTechs.size === 0) {
    matchedTechs.add('Next.js 15');
    matchedTechs.add('Supabase PostgreSQL');
    matchedTechs.add('Vercel');
  }

  // 카테고리별 정리
  const recommendation = {
    frontend: [] as string[],
    backend: [] as string[],
    database: [] as string[],
    ai_ml: [] as string[],
    infrastructure: [] as string[],
  };

  for (const tech of matchedTechs) {
    for (const [category, techs] of Object.entries(TECH_CATALOG)) {
      const found = techs.find((t) => t.name === tech);
      if (found) {
        recommendation[category as keyof typeof recommendation].push(tech);
      }
    }
  }

  // 빈 카테고리 채우기
  if (recommendation.frontend.length === 0) recommendation.frontend.push('Next.js 15');
  if (recommendation.backend.length === 0) recommendation.backend.push('Supabase Edge Functions');
  if (recommendation.database.length === 0) recommendation.database.push('Supabase PostgreSQL');

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            tier: 'rule',
            confidence: 0.85,
            recommendation,
            reasoning: `키워드 분석 결과 "${Array.from(matchedTechs).join(', ')}" 기술 추천`,
            constraints_applied: constraints || 'none',
            next_steps: [
              '1. 기술 스택 호환성 검증 (tech_validate_stack)',
              '2. 비용 추정 (tech_estimate_cost)',
              '3. SWOT 분석 (tech_swot_analysis)',
            ],
          },
          null,
          2
        ),
      },
    ],
  };
}

function mlBasedRecommendation(
  requirements: string,
  constraints?: { budget?: string; timeline?: string; team_size?: number }
) {
  // 실제 구현에서는 임베딩 유사도 검색 사용
  // 여기서는 가중치 기반 스코어링으로 시뮬레이션

  const keywords = requirements.toLowerCase();
  const scores: Record<string, number> = {};

  // 모든 기술에 대해 스코어 계산
  for (const [category, techs] of Object.entries(TECH_CATALOG)) {
    for (const tech of techs) {
      let score = tech.score;

      // 태그 매칭 보너스
      for (const tag of tech.tags) {
        if (keywords.includes(tag)) score += 2;
      }

      // 이름 매칭 보너스
      if (keywords.includes(tech.name.toLowerCase())) score += 3;

      scores[tech.name] = score;
    }
  }

  // 카테고리별 최고 점수 기술 선택
  const recommendation = {
    frontend: getTopByCategory('frontend', scores),
    backend: getTopByCategory('backend', scores),
    database: getTopByCategory('database', scores),
    ai_ml: getTopByCategory('ai_ml', scores),
    infrastructure: getTopByCategory('infrastructure', scores),
  };

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            tier: 'ml',
            confidence: 0.78,
            recommendation,
            scores: Object.entries(scores)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 10),
            reasoning: 'ML 기반 가중치 스코어링 적용',
          },
          null,
          2
        ),
      },
    ],
  };
}

async function claudeBasedRecommendation(
  requirements: string,
  constraints?: { budget?: string; timeline?: string; team_size?: number }
) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              error: 'ANTHROPIC_API_KEY not configured',
              fallback: 'Using rule-based recommendation instead',
              ...JSON.parse((ruleBasedRecommendation(requirements, constraints).content[0] as { text: string }).text),
            },
            null,
            2
          ),
        },
      ],
    };
  }

  try {
    const anthropic = new Anthropic({ apiKey });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `기술 스택 추천 요청:

요구사항: ${requirements}

제약조건: ${JSON.stringify(constraints || {})}

다음 형식으로 JSON 응답해주세요:
{
  "recommendation": {
    "frontend": ["기술명"],
    "backend": ["기술명"],
    "database": ["기술명"],
    "ai_ml": ["기술명"],
    "infrastructure": ["기술명"]
  },
  "reasoning": "추천 이유",
  "swot": {
    "strengths": ["강점"],
    "weaknesses": ["약점"],
    "opportunities": ["기회"],
    "threats": ["위협"]
  },
  "estimated_cost": {
    "initial": "초기 비용",
    "monthly": "월 운영비"
  },
  "roadmap": [
    {"phase": 1, "duration": "기간", "tasks": ["작업"]}
  ]
}`,
        },
      ],
    });

    const textContent = response.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude');
    }

    // JSON 추출
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: textContent.text };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              tier: 'claude',
              confidence: 0.92,
              ...result,
              api_usage: {
                input_tokens: response.usage.input_tokens,
                output_tokens: response.usage.output_tokens,
              },
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              error: `Claude API error: ${message}`,
              fallback: 'Using rule-based recommendation instead',
              ...JSON.parse((ruleBasedRecommendation(requirements, constraints).content[0] as { text: string }).text),
            },
            null,
            2
          ),
        },
      ],
    };
  }
}

function validateStack(args: Record<string, unknown>) {
  const { stack } = args as { stack: string[] };

  const issues: string[] = [];
  const warnings: string[] = [];

  // 호환성 체크
  const incompatible: [string, string][] = [
    ['Vue 3', 'React 19'],
    ['Svelte', 'React 19'],
    ['MongoDB Atlas', 'pgvector'],
  ];

  for (const [a, b] of incompatible) {
    if (stack.includes(a) && stack.includes(b)) {
      issues.push(`${a}와 ${b}는 함께 사용하기 어렵습니다`);
    }
  }

  // 권장 조합 체크
  if (stack.includes('Next.js 15') && !stack.includes('React 19')) {
    warnings.push('Next.js 15는 React 19를 권장합니다');
  }

  if (stack.includes('pgvector') && !stack.includes('Supabase PostgreSQL')) {
    warnings.push('pgvector는 Supabase PostgreSQL과 함께 사용하면 더 쉽습니다');
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            valid: issues.length === 0,
            stack,
            issues,
            warnings,
            recommendation: issues.length > 0 ? '호환성 문제를 해결한 후 진행하세요' : '검증 통과',
          },
          null,
          2
        ),
      },
    ],
  };
}

function estimateCost(args: Record<string, unknown>) {
  const { stack, scale = 'startup' } = args as { stack: string[]; scale?: string };

  const multipliers: Record<string, number> = {
    startup: 1,
    growth: 3,
    enterprise: 10,
  };

  const multiplier = multipliers[scale] || 1;

  let monthlyBase = 0;
  const breakdown: Array<{ tech: string; cost: string; note: string }> = [];

  for (const tech of stack) {
    for (const [, techs] of Object.entries(TECH_CATALOG)) {
      const found = techs.find((t) => t.name === tech);
      if (found) {
        const cost = found.cost;
        let monthly = 0;

        if (cost.includes('$')) {
          const match = cost.match(/\$(\d+)/);
          if (match) monthly = parseInt(match[1], 10);
        } else if (cost.includes('₩')) {
          const match = cost.match(/₩(\d+)M/);
          if (match) monthly = (parseInt(match[1], 10) * 1000000) / 12 / 1400; // 연간 -> 월간, 원화 -> 달러
        }

        monthlyBase += monthly;
        breakdown.push({
          tech,
          cost: found.cost,
          note: monthly > 0 ? `~$${monthly}/mo` : 'Free/Usage-based',
        });
      }
    }
  }

  const monthlyTotal = Math.round(monthlyBase * multiplier);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            scale,
            breakdown,
            estimate: {
              monthly: `$${monthlyTotal}/month`,
              yearly: `$${monthlyTotal * 12}/year`,
              krw_monthly: `₩${Math.round(monthlyTotal * 1400).toLocaleString()}/월`,
            },
            notes: [
              '실제 비용은 사용량에 따라 달라질 수 있습니다',
              'Enterprise 플랜은 협상에 따라 할인 가능',
              'Free tier 활용으로 초기 비용 절감 가능',
            ],
          },
          null,
          2
        ),
      },
    ],
  };
}

async function swotAnalysis(args: Record<string, unknown>) {
  const { stack, context } = args as { stack: string[]; context?: string };

  // 기본 SWOT 분석 (Rule-based)
  const swot = {
    strengths: [] as string[],
    weaknesses: [] as string[],
    opportunities: [] as string[],
    threats: [] as string[],
  };

  // 강점 분석
  if (stack.includes('Next.js 15')) {
    swot.strengths.push('최신 React 기능 및 App Router 지원');
    swot.strengths.push('Server Components로 성능 최적화');
  }
  if (stack.includes('Supabase PostgreSQL')) {
    swot.strengths.push('RLS로 강력한 보안 제공');
    swot.strengths.push('실시간 기능 내장');
  }
  if (stack.includes('pgvector')) {
    swot.strengths.push('AI/ML 임베딩 검색 네이티브 지원');
  }
  if (stack.includes('Claude API')) {
    swot.strengths.push('최신 LLM 추론 능력');
  }

  // 약점 분석
  if (stack.includes('Supabase Edge Functions')) {
    swot.weaknesses.push('Deno 런타임 학습 필요');
  }
  if (stack.length > 5) {
    swot.weaknesses.push('기술 스택 복잡도 증가');
  }

  // 기회 분석
  swot.opportunities.push('AI 기반 자동화로 생산성 향상');
  swot.opportunities.push('클라우드 네이티브 아키텍처로 확장성 확보');

  // 위협 분석
  swot.threats.push('클라우드 서비스 가격 변동 리스크');
  swot.threats.push('Vendor lock-in 가능성');

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            stack,
            context: context || 'General analysis',
            swot,
            summary: `강점 ${swot.strengths.length}개, 약점 ${swot.weaknesses.length}개, 기회 ${swot.opportunities.length}개, 위협 ${swot.threats.length}개`,
            recommendation: swot.strengths.length > swot.weaknesses.length
              ? '✅ 전반적으로 적합한 기술 스택'
              : '⚠️ 약점 보완 필요',
          },
          null,
          2
        ),
      },
    ],
  };
}

// Helper function
function getTopByCategory(category: string, scores: Record<string, number>): string[] {
  const techs = TECH_CATALOG[category as keyof typeof TECH_CATALOG] || [];
  return techs
    .map((t) => ({ name: t.name, score: scores[t.name] || t.score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map((t) => t.name);
}

/**
 * Analysis Tools
 * AGI 데이터 분석 도구
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const analysisTools: Tool[] = [
  {
    name: 'analysis_events_summary',
    description: '이벤트 데이터 요약 분석 - 유형별 분포, 시간대별 패턴',
    inputSchema: {
      type: 'object',
      properties: {
        org_id: {
          type: 'string',
          description: '조직 ID',
        },
        period_start: {
          type: 'string',
          description: '시작일 (ISO8601)',
        },
        period_end: {
          type: 'string',
          description: '종료일 (ISO8601)',
        },
        asset_id: {
          type: 'string',
          description: '자산 ID (선택)',
        },
      },
      required: ['org_id', 'period_start', 'period_end'],
    },
  },
  {
    name: 'analysis_alarm_statistics',
    description: '알람 통계 분석 - 빈도, 코드별 분석, MTTR',
    inputSchema: {
      type: 'object',
      properties: {
        org_id: {
          type: 'string',
          description: '조직 ID',
        },
        period_start: {
          type: 'string',
          description: '시작일 (ISO8601)',
        },
        period_end: {
          type: 'string',
          description: '종료일 (ISO8601)',
        },
      },
      required: ['org_id', 'period_start', 'period_end'],
    },
  },
  {
    name: 'analysis_pattern_detection',
    description: '패턴 탐지 - 반복 패턴, 이상 징후, 주기성 분석',
    inputSchema: {
      type: 'object',
      properties: {
        org_id: {
          type: 'string',
          description: '조직 ID',
        },
        period_start: {
          type: 'string',
          description: '시작일 (ISO8601)',
        },
        period_end: {
          type: 'string',
          description: '종료일 (ISO8601)',
        },
      },
      required: ['org_id', 'period_start', 'period_end'],
    },
  },
  {
    name: 'analysis_search_memories',
    description: 'AGI 메모리 벡터 검색 - 유사 인사이트 및 학습 내용 검색',
    inputSchema: {
      type: 'object',
      properties: {
        org_id: {
          type: 'string',
          description: '조직 ID',
        },
        query: {
          type: 'string',
          description: '검색 쿼리',
        },
        type: {
          type: 'string',
          enum: ['event', 'action', 'insight', 'learning'],
          description: '메모리 유형 필터 (선택)',
        },
        limit: {
          type: 'number',
          description: '최대 결과 수 (기본값: 10)',
        },
      },
      required: ['org_id', 'query'],
    },
  },
  {
    name: 'analysis_store_insight',
    description: 'AGI 인사이트 저장 - 분석 결과를 insights 테이블에 저장',
    inputSchema: {
      type: 'object',
      properties: {
        org_id: {
          type: 'string',
          description: '조직 ID',
        },
        insight_type: {
          type: 'string',
          enum: ['reasoning', 'prediction', 'anomaly', 'recommendation'],
          description: '인사이트 유형',
        },
        content: {
          type: 'string',
          description: '인사이트 내용',
        },
        confidence: {
          type: 'number',
          description: '신뢰도 (0-1)',
        },
        tier: {
          type: 'string',
          enum: ['rule', 'ml', 'claude'],
          description: '분석 티어',
        },
        related_event_ids: {
          type: 'array',
          items: { type: 'string' },
          description: '관련 이벤트 ID 목록',
        },
      },
      required: ['org_id', 'insight_type', 'content', 'tier'],
    },
  },
];

export async function handleAnalysisTool(
  name: string,
  args: Record<string, unknown>,
  supabase: SupabaseClient
) {
  switch (name) {
    case 'analysis_events_summary':
      return await eventsSummary(args, supabase);
    case 'analysis_alarm_statistics':
      return await alarmStatistics(args, supabase);
    case 'analysis_pattern_detection':
      return await patternDetection(args, supabase);
    case 'analysis_search_memories':
      return await searchMemories(args, supabase);
    case 'analysis_store_insight':
      return await storeInsight(args, supabase);
    default:
      throw new Error(`Unknown analysis tool: ${name}`);
  }
}

async function eventsSummary(
  args: Record<string, unknown>,
  supabase: SupabaseClient
) {
  const { org_id, period_start, period_end, asset_id } = args as {
    org_id: string;
    period_start: string;
    period_end: string;
    asset_id?: string;
  };

  let query = supabase
    .from('events')
    .select('*')
    .eq('org_id', org_id)
    .gte('occurred_at', period_start)
    .lte('occurred_at', period_end);

  if (asset_id) {
    query = query.eq('asset_id', asset_id);
  }

  const { data: events, error } = await query;
  if (error) throw new Error(`Query failed: ${error.message}`);

  // 유형별 분포
  const byType = events?.reduce((acc, e) => {
    acc[e.event_type] = (acc[e.event_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  // 상태별 분포
  const byState = events?.reduce((acc, e) => {
    acc[e.machine_state] = (acc[e.machine_state] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  // 시간대별 분포 (시간별)
  const byHour = events?.reduce((acc, e) => {
    const hour = new Date(e.occurred_at).getHours();
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {} as Record<number, number>) || {};

  // 알람 수
  const alarmCount = events?.filter((e) => e.alarm_active).length || 0;

  // 가동률 계산 (running / total)
  const runningCount = byState['running'] || 0;
  const totalCount = events?.length || 1;
  const uptime = ((runningCount / totalCount) * 100).toFixed(1);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            summary: {
              totalEvents: events?.length || 0,
              alarmCount,
              uptime: `${uptime}%`,
            },
            distribution: {
              byType,
              byState,
              byHour,
            },
            insights: generateRuleBasedInsights(events || [], byState, alarmCount),
            tier: 'rule',
            confidence: 0.85,
          },
          null,
          2
        ),
      },
    ],
  };
}

async function alarmStatistics(
  args: Record<string, unknown>,
  supabase: SupabaseClient
) {
  const { org_id, period_start, period_end } = args as {
    org_id: string;
    period_start: string;
    period_end: string;
  };

  // 알람 이벤트 조회
  const { data: alarms, error } = await supabase
    .from('events')
    .select('*')
    .eq('org_id', org_id)
    .eq('alarm_active', true)
    .gte('occurred_at', period_start)
    .lte('occurred_at', period_end)
    .order('occurred_at', { ascending: true });

  if (error) throw new Error(`Query failed: ${error.message}`);

  // 알람 코드별 통계
  const byCode = alarms?.reduce((acc, a) => {
    const code = a.alarm_code || 'unknown';
    acc[code] = (acc[code] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  // 자산별 통계
  const byAsset = alarms?.reduce((acc, a) => {
    acc[a.asset_id] = (acc[a.asset_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  // 요일별 통계
  const byDayOfWeek = alarms?.reduce((acc, a) => {
    const day = new Date(a.occurred_at).getDay();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    acc[dayNames[day]] = (acc[dayNames[day]] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  // 가장 빈번한 알람 코드
  const topAlarmCodes = Object.entries(byCode)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            summary: {
              totalAlarms: alarms?.length || 0,
              uniqueCodes: Object.keys(byCode).length,
              affectedAssets: Object.keys(byAsset).length,
            },
            distribution: {
              byCode,
              byAsset,
              byDayOfWeek,
            },
            topAlarmCodes,
            recommendations: generateAlarmRecommendations(byCode, byAsset, byDayOfWeek),
            tier: 'rule',
          },
          null,
          2
        ),
      },
    ],
  };
}

async function patternDetection(
  args: Record<string, unknown>,
  supabase: SupabaseClient
) {
  const { org_id, period_start, period_end } = args as {
    org_id: string;
    period_start: string;
    period_end: string;
  };

  const { data: events, error } = await supabase
    .from('events')
    .select('*')
    .eq('org_id', org_id)
    .gte('occurred_at', period_start)
    .lte('occurred_at', period_end)
    .order('occurred_at', { ascending: true });

  if (error) throw new Error(`Query failed: ${error.message}`);

  const patterns: Array<{
    type: string;
    description: string;
    confidence: number;
    recommendation?: string;
  }> = [];

  // 반복 알람 패턴 감지
  const alarmSequence = events?.filter((e) => e.alarm_active) || [];
  if (alarmSequence.length >= 3) {
    // 연속 알람 검출
    const intervals: number[] = [];
    for (let i = 1; i < alarmSequence.length; i++) {
      const prev = new Date(alarmSequence[i - 1].occurred_at).getTime();
      const curr = new Date(alarmSequence[i].occurred_at).getTime();
      intervals.push(curr - prev);
    }

    // 일정 간격 패턴 검출
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const stdDev = Math.sqrt(
      intervals.reduce((a, b) => a + Math.pow(b - avgInterval, 2), 0) / intervals.length
    );
    const cv = stdDev / avgInterval; // 변동계수

    if (cv < 0.3) {
      patterns.push({
        type: 'periodic_alarm',
        description: `알람이 약 ${Math.round(avgInterval / 60000)}분 간격으로 반복 발생`,
        confidence: 1 - cv,
        recommendation: '센서 또는 장비 점검 필요',
      });
    }
  }

  // idle 증가 패턴 감지
  const dailyIdle = events?.reduce((acc, e) => {
    const date = e.occurred_at.split('T')[0];
    if (!acc[date]) acc[date] = { idle: 0, total: 0 };
    acc[date].total++;
    if (e.machine_state === 'idle') acc[date].idle++;
    return acc;
  }, {} as Record<string, { idle: number; total: number }>) || {};

  const idleRates = Object.entries(dailyIdle).map(([date, { idle, total }]) => ({
    date,
    rate: idle / total,
  }));

  if (idleRates.length >= 3) {
    const trend = calculateTrend(idleRates.map((r) => r.rate));
    if (trend > 0.1) {
      patterns.push({
        type: 'increasing_idle',
        description: 'idle 상태 비율이 증가 추세',
        confidence: Math.min(trend * 5, 0.95),
        recommendation: '생산성 저하 원인 분석 필요',
      });
    }
  }

  // error 상태 집중 시간대 감지
  const errorByHour = events?.reduce((acc, e) => {
    if (e.machine_state === 'error') {
      const hour = new Date(e.occurred_at).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
    }
    return acc;
  }, {} as Record<number, number>) || {};

  const peakErrorHour = Object.entries(errorByHour).sort((a, b) => b[1] - a[1])[0];
  if (peakErrorHour && peakErrorHour[1] >= 3) {
    patterns.push({
      type: 'error_concentration',
      description: `${peakErrorHour[0]}시에 error 발생 집중 (${peakErrorHour[1]}건)`,
      confidence: 0.8,
      recommendation: '해당 시간대 모니터링 강화',
    });
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            patterns,
            summary: {
              patternsFound: patterns.length,
              analyzedEvents: events?.length || 0,
              period: { start: period_start, end: period_end },
            },
            tier: 'rule',
          },
          null,
          2
        ),
      },
    ],
  };
}

async function searchMemories(
  args: Record<string, unknown>,
  supabase: SupabaseClient
) {
  const { org_id, query, type, limit = 10 } = args as {
    org_id: string;
    query: string;
    type?: string;
    limit?: number;
  };

  // 참고: 실제 구현에서는 임베딩 생성 후 search_memories 함수 호출
  // 여기서는 텍스트 검색으로 대체

  let dbQuery = supabase
    .from('memory_entries')
    .select('id, type, content, metadata, created_at')
    .eq('org_id', org_id)
    .ilike('content', `%${query}%`)
    .limit(limit);

  if (type) {
    dbQuery = dbQuery.eq('type', type);
  }

  const { data, error } = await dbQuery;
  if (error) throw new Error(`Query failed: ${error.message}`);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            results: data,
            count: data?.length || 0,
            query,
            note: '벡터 유사도 검색은 임베딩 생성 후 search_memories RPC 함수 사용',
          },
          null,
          2
        ),
      },
    ],
  };
}

async function storeInsight(
  args: Record<string, unknown>,
  supabase: SupabaseClient
) {
  const { org_id, insight_type, content, confidence, tier, related_event_ids } = args as {
    org_id: string;
    insight_type: string;
    content: string;
    confidence?: number;
    tier: string;
    related_event_ids?: string[];
  };

  const { data, error } = await supabase
    .from('agi_insights')
    .insert({
      org_id,
      insight_type,
      content,
      confidence: confidence || 0.5,
      tier,
      related_event_ids: related_event_ids || [],
      metadata: { stored_via: 'mcp_tool' },
    })
    .select()
    .single();

  if (error) throw new Error(`Insert failed: ${error.message}`);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            success: true,
            insight_id: data.id,
            message: '인사이트가 저장되었습니다.',
          },
          null,
          2
        ),
      },
    ],
  };
}

// Helper functions
function generateRuleBasedInsights(
  events: Record<string, unknown>[],
  byState: Record<string, number>,
  alarmCount: number
): string[] {
  const insights: string[] = [];

  if (alarmCount > events.length * 0.1) {
    insights.push(`⚠️ 알람 비율 높음 (${((alarmCount / events.length) * 100).toFixed(1)}%)`);
  }

  if ((byState['error'] || 0) > 0) {
    insights.push(`❌ error 상태 ${byState['error']}건 발생`);
  }

  if ((byState['idle'] || 0) > events.length * 0.3) {
    insights.push(`⏸️ idle 비율 높음 - 생산성 점검 필요`);
  }

  if (insights.length === 0) {
    insights.push('✅ 특이사항 없음');
  }

  return insights;
}

function generateAlarmRecommendations(
  byCode: Record<string, number>,
  byAsset: Record<string, number>,
  byDayOfWeek: Record<string, number>
): string[] {
  const recommendations: string[] = [];

  // 반복 알람 코드
  const frequentCodes = Object.entries(byCode).filter(([, count]) => count >= 3);
  for (const [code, count] of frequentCodes) {
    recommendations.push(`알람 코드 "${code}" ${count}회 반복 - 근본 원인 분석 필요`);
  }

  // 특정 자산 집중
  const problematicAssets = Object.entries(byAsset).filter(([, count]) => count >= 5);
  for (const [asset, count] of problematicAssets) {
    recommendations.push(`자산 "${asset}" 알람 ${count}건 - 집중 점검 권장`);
  }

  // 요일 패턴
  const peakDay = Object.entries(byDayOfWeek).sort((a, b) => b[1] - a[1])[0];
  if (peakDay && peakDay[1] >= 3) {
    recommendations.push(`${peakDay[0]}요일 알람 집중 (${peakDay[1]}건) - 해당 요일 모니터링 강화`);
  }

  return recommendations;
}

function calculateTrend(values: number[]): number {
  if (values.length < 2) return 0;
  const n = values.length;
  const sumX = (n * (n - 1)) / 2;
  const sumY = values.reduce((a, b) => a + b, 0);
  const sumXY = values.reduce((acc, y, x) => acc + x * y, 0);
  const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
  return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
}

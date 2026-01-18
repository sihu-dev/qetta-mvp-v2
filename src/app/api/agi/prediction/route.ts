/**
 * AGI Prediction API Route
 * /api/agi/prediction
 *
 * Predictive analytics engine for:
 * - Uptime forecasting
 * - Quality prediction
 * - Anomaly detection
 * - Maintenance scheduling
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import type { PredictionTarget, Prediction, Anomaly, AnomalyType } from '@/lib/agi/types';
import { metrics } from '@/lib/metrics';

export interface PredictionRequest {
  orgId: string;
  target: PredictionTarget;
  assetId?: string;
  horizon?: string; // e.g., '7d', '30d'
  includeAnomalies?: boolean;
}

export interface PredictionResponse {
  success: boolean;
  prediction?: Prediction;
  anomalies?: Anomaly[];
  tier: 'rule' | 'ml' | 'claude';
  metadata: {
    executionTime: number;
    dataPoints: number;
  };
}

/**
 * POST /api/agi/prediction - Generate predictions
 */
export async function POST(request: NextRequest): Promise<NextResponse<PredictionResponse>> {
  const startTime = Date.now();
  let statusCode = 200;

  try {
    const body: PredictionRequest = await request.json();
    const { orgId, target, assetId, horizon = '7d', includeAnomalies = true } = body;

    if (!orgId || !target) {
      statusCode = 400;
      return NextResponse.json(
        {
          success: false,
          tier: 'rule',
          metadata: { executionTime: Date.now() - startTime, dataPoints: 0 },
        },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Fetch historical data
    const query = supabase
      .from('events')
      .select('*')
      .eq('org_id', orgId)
      .order('occurred_at', { ascending: false })
      .limit(500);

    if (assetId) {
      query.eq('asset_id', assetId);
    }

    const { data: events, error } = await query;
    if (error) throw error;

    const dataPoints = events?.length || 0;

    // Generate prediction (Tier 1: Rule-based)
    const prediction = generatePrediction(target, horizon, events || []);

    // Detect anomalies
    let anomalies: Anomaly[] = [];
    if (includeAnomalies) {
      anomalies = detectAnomalies(events || []);
    }

    // Store significant insights
    if (anomalies.length > 0) {
      await supabase.from('agi_insights').insert(
        anomalies.map((a) => ({
          org_id: orgId,
          insight_type: 'anomaly',
          content: a.description,
          confidence: 0.7,
          tier: 'rule',
          related_event_ids: a.relatedEvents,
          metadata: { type: a.type, severity: a.severity },
        }))
      );
    }

    return NextResponse.json({
      success: true,
      prediction,
      anomalies,
      tier: 'rule',
      metadata: {
        executionTime: Date.now() - startTime,
        dataPoints,
      },
    });

  } catch (error) {
    console.error('Prediction Error:', error);
    statusCode = 500;
    return NextResponse.json(
      {
        success: false,
        tier: 'rule',
        metadata: { executionTime: Date.now() - Date.now(), dataPoints: 0 },
      },
      { status: 500 }
    );
  } finally {
    metrics.httpRequest('POST', '/api/agi/prediction', statusCode, (Date.now() - startTime) / 1000);
  }
}

interface EventData {
  id: string;
  occurred_at: string;
  machine_state: string;
  alarm_active: boolean;
  alarm_code?: string;
}

function generatePrediction(
  target: PredictionTarget,
  horizon: string,
  events: EventData[]
): Prediction {
  if (events.length === 0) {
    return {
      target,
      horizon,
      value: 0,
      confidence: 0.3,
      bounds: { lower: 0, upper: 0 },
    };
  }

  // Simple rule-based prediction
  switch (target) {
    case 'uptime': {
      const runningCount = events.filter((e) => e.machine_state === 'running').length;
      const uptimeRate = (runningCount / events.length) * 100;
      return {
        target,
        horizon,
        value: Math.round(uptimeRate),
        confidence: Math.min(0.85, 0.5 + (events.length / 1000)),
        bounds: {
          lower: Math.max(0, uptimeRate - 10),
          upper: Math.min(100, uptimeRate + 10),
        },
      };
    }

    case 'maintenance': {
      const alarmCount = events.filter((e) => e.alarm_active).length;
      const alarmRate = alarmCount / events.length;
      const daysToMaintenance = alarmRate > 0.2 ? 7 : alarmRate > 0.1 ? 14 : 30;
      return {
        target,
        horizon,
        value: daysToMaintenance,
        confidence: 0.7,
        bounds: {
          lower: Math.max(1, daysToMaintenance - 5),
          upper: daysToMaintenance + 10,
        },
      };
    }

    case 'defect': {
      const errorCount = events.filter((e) => e.machine_state === 'error').length;
      const defectRate = (errorCount / events.length) * 100;
      return {
        target,
        horizon,
        value: Math.round(defectRate),
        confidence: 0.6,
        bounds: {
          lower: Math.max(0, defectRate - 5),
          upper: Math.min(100, defectRate + 5),
        },
      };
    }

    default:
      return {
        target,
        horizon,
        value: 50,
        confidence: 0.5,
        bounds: { lower: 30, upper: 70 },
      };
  }
}

function detectAnomalies(events: EventData[]): Anomaly[] {
  const anomalies: Anomaly[] = [];

  if (events.length < 10) return anomalies;

  // Detect sudden alarm spikes (point anomaly)
  const recentAlarms = events.slice(0, 10).filter((e) => e.alarm_active).length;
  const historicalAlarmRate = events.slice(10).filter((e) => e.alarm_active).length / Math.max(events.length - 10, 1);

  if (recentAlarms / 10 > historicalAlarmRate * 2 && recentAlarms > 2) {
    anomalies.push({
      type: 'point' as AnomalyType,
      severity: recentAlarms > 5 ? 'high' : 'medium',
      description: `Unusual alarm spike detected: ${recentAlarms} alarms in recent 10 events`,
      timestamp: events[0].occurred_at,
      relatedEvents: events.slice(0, 10).filter((e) => e.alarm_active).map((e) => e.id),
    });
  }

  // Detect frequent state changes (contextual anomaly)
  let stateChanges = 0;
  for (let i = 1; i < Math.min(20, events.length); i++) {
    if (events[i].machine_state !== events[i - 1].machine_state) {
      stateChanges++;
    }
  }

  if (stateChanges > 10) {
    anomalies.push({
      type: 'contextual' as AnomalyType,
      severity: 'medium',
      description: `High frequency state changes: ${stateChanges} changes in recent 20 events`,
      timestamp: events[0].occurred_at,
      relatedEvents: events.slice(0, 20).map((e) => e.id),
    });
  }

  return anomalies;
}

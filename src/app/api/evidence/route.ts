/**
 * Evidence API Route
 * /api/evidence
 *
 * CRUD operations for evidence snapshots (Gov ZIP)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { buildGovZip, type GovZipOptions } from '@/lib/govzip';
import type { Event, Action } from '@/lib/agi/types';
import { metrics } from '@/lib/metrics';
import { parseJson, parseLimit } from '@/lib/api';
import { logger } from '@/lib/logging';

export interface CreateSnapshotRequest {
  orgId: string;
  periodStart: string;
  periodEnd: string;
  retentionYears?: number;
}

/**
 * GET /api/evidence - List evidence snapshots
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  let statusCode = 200;

  try {
    const searchParams = request.nextUrl.searchParams;
    const orgId = searchParams.get('orgId');
    const limit = parseLimit(searchParams.get('limit'));

    if (!orgId) {
      statusCode = 400;
      return NextResponse.json({ error: 'Missing orgId' }, { status: 400 });
    }

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('evidence_snapshots')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      snapshots: data || [],
      count: data?.length || 0,
    });

  } catch (error) {
    logger.error('Evidence List Error', error);
    statusCode = 500;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    metrics.httpRequest('GET', '/api/evidence', statusCode, (Date.now() - startTime) / 1000);
  }
}

/**
 * POST /api/evidence - Create a new evidence snapshot
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let statusCode = 200;

  try {
    const parsed = await parseJson<CreateSnapshotRequest>(request);
    if (!parsed.success) {
      return parsed.response;
    }
    const { orgId, periodStart, periodEnd, retentionYears = 5 } = parsed.data;

    if (!orgId || !periodStart || !periodEnd) {
      statusCode = 400;
      return NextResponse.json(
        { error: 'Missing required fields: orgId, periodStart, periodEnd' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Fetch events for the period
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .eq('org_id', orgId)
      .gte('occurred_at', periodStart)
      .lte('occurred_at', periodEnd)
      .order('occurred_at', { ascending: true });

    if (eventsError) throw eventsError;

    // Fetch actions for the period
    const { data: actions, error: actionsError } = await supabase
      .from('actions')
      .select('*')
      .eq('org_id', orgId)
      .gte('created_at', periodStart)
      .lte('created_at', periodEnd)
      .order('created_at', { ascending: true });

    if (actionsError) throw actionsError;

    // Map to proper types
    const typedEvents: Event[] = (events || []).map((e) => ({
      id: e.id,
      occurred_at: e.occurred_at,
      asset_id: e.asset_id?.toString() || '',
      event_type: e.event_type as Event['event_type'],
      machine_state: e.machine_state as Event['machine_state'],
      alarm_active: e.alarm_active || false,
      alarm_code: e.alarm_code || null,
      source: (e.source || 'sensor') as Event['source'],
      metadata: e.metadata || e.raw_payload || {},
    }));

    const typedActions: Action[] = (actions || []).map((a) => ({
      id: a.id,
      event_id: a.event_id || '',
      status: a.status as Action['status'],
      priority: (a.priority || 'medium') as Action['priority'],
      note: a.note || a.title || '',
      photo_paths: a.photo_paths || [],
      created_at: a.created_at,
      created_by: a.created_by || a.assigned_to || '',
      updated_at: a.updated_at,
    }));

    // Build Gov ZIP
    const options: GovZipOptions = {
      orgId,
      periodStart,
      periodEnd,
      events: typedEvents,
      actions: typedActions,
    };

    const result = await buildGovZip(options);

    if (!result.success) {
      statusCode = 500;
      return NextResponse.json(
        { error: result.error || 'Failed to build Gov ZIP' },
        { status: 500 }
      );
    }

    // Calculate hashes from manifest
    const manifestHash = result.manifest?.package_hash || '';
    const packageHash = result.manifest?.package_hash || '';

    // Store snapshot metadata
    const retentionUntil = new Date();
    retentionUntil.setFullYear(retentionUntil.getFullYear() + retentionYears);

    // Generate storage path
    const storagePath = `/evidence/${orgId}/${new Date().toISOString().split('T')[0]}_${Date.now()}.zip`;

    const { data: snapshot, error: insertError } = await supabase
      .from('evidence_snapshots')
      .insert({
        org_id: orgId,
        period_start: periodStart,
        period_end: periodEnd,
        gov_zip_hash: manifestHash,
        manifest_hash: manifestHash,
        package_hash: packageHash,
        storage_path: storagePath,
        event_count: typedEvents.length,
        action_count: typedActions.length,
        alarm_count: typedEvents.filter((e) => e.alarm_active).length,
        retention_until: retentionUntil.toISOString(),
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({
      success: true,
      snapshot,
      stats: {
        events: typedEvents.length,
        actions: typedActions.length,
        alarms: typedEvents.filter((e) => e.alarm_active).length,
      },
    });

  } catch (error) {
    logger.error('Evidence Create Error', error);
    statusCode = 500;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    metrics.httpRequest('POST', '/api/evidence', statusCode, (Date.now() - startTime) / 1000);
  }
}

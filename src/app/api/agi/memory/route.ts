/**
 * AGI Memory API Route
 * /api/agi/memory
 *
 * Vector memory search and storage using pgvector
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import type { MemoryEntry, MemoryType } from '@/lib/agi/types';
import { metrics } from '@/lib/metrics';
import { parseJson, parseLimit } from '@/lib/api';
import { logger } from '@/lib/logging';

export interface MemorySearchRequest {
  orgId: string;
  query: string;
  type?: MemoryType;
  limit?: number;
  threshold?: number;
}

export interface MemoryStoreRequest {
  orgId: string;
  type: MemoryType;
  content: string;
  metadata?: Record<string, unknown>;
}

/**
 * GET /api/agi/memory - Search memories
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  let statusCode = 200;

  try {
    const searchParams = request.nextUrl.searchParams;
    const orgId = searchParams.get('orgId');
    const query = searchParams.get('query');
    const type = searchParams.get('type') as MemoryType | null;
    const limit = parseLimit(searchParams.get('limit'), { defaultLimit: 10 });

    if (!orgId) {
      statusCode = 400;
      return NextResponse.json({ error: 'Missing orgId' }, { status: 400 });
    }

    const supabase = createServerClient();

    // If no query, return recent memories
    if (!query) {
      const queryBuilder = supabase
        .from('memory_entries')
        .select('*')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (type) {
        queryBuilder.eq('type', type);
      }

      const { data, error } = await queryBuilder;

      if (error) throw error;

      return NextResponse.json({
        success: true,
        memories: data || [],
        count: data?.length || 0,
      });
    }

    // Vector search requires embedding
    // TODO: Generate embedding from query using OpenAI/Claude
    // For now, return text-based search
    const { data, error } = await supabase
      .from('memory_entries')
      .select('*')
      .eq('org_id', orgId)
      .ilike('content', `%${query}%`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      query,
      memories: data || [],
      count: data?.length || 0,
      note: 'Text-based search (vector search pending embedding integration)',
    });

  } catch (error) {
    logger.error('Memory Search Error', error);
    statusCode = 500;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    metrics.httpRequest('GET', '/api/agi/memory', statusCode, (Date.now() - startTime) / 1000);
  }
}

/**
 * POST /api/agi/memory - Store a new memory
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let statusCode = 200;

  try {
    const parsed = await parseJson<MemoryStoreRequest>(request);
    if (!parsed.success) {
      return parsed.response;
    }
    const { orgId, type, content, metadata } = parsed.data;

    if (!orgId || !type || !content) {
      statusCode = 400;
      return NextResponse.json(
        { error: 'Missing required fields: orgId, type, content' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // TODO: Generate embedding using OpenAI/Claude
    // For now, store without embedding
    const memoryEntry: Partial<MemoryEntry> = {
      type,
      content,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
      },
      decay: {
        importance: 1.0,
        lastAccessed: new Date().toISOString(),
      },
    };

    const { data, error } = await supabase
      .from('memory_entries')
      .insert({
        org_id: orgId,
        ...memoryEntry,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      memory: data,
    });

  } catch (error) {
    logger.error('Memory Store Error', error);
    statusCode = 500;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    metrics.httpRequest('POST', '/api/agi/memory', statusCode, (Date.now() - startTime) / 1000);
  }
}

/**
 * DELETE /api/agi/memory - Delete a memory
 */
export async function DELETE(request: NextRequest) {
  const startTime = Date.now();
  let statusCode = 200;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      statusCode = 400;
      return NextResponse.json({ error: 'Missing memory id' }, { status: 400 });
    }

    const supabase = createServerClient();
    const { error } = await supabase
      .from('memory_entries')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });

  } catch (error) {
    logger.error('Memory Delete Error', error);
    statusCode = 500;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    metrics.httpRequest('DELETE', '/api/agi/memory', statusCode, (Date.now() - startTime) / 1000);
  }
}

/**
 * Tender Analyze API Route
 * /api/tender/analyze
 *
 * Analyze bids for company fit and recommendations
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { analyzeBid, type AnalyzeOptions } from '@/lib/tender/analyzers/bid-analyzer';
import type { Bid } from '@/lib/tender/types';

export interface AnalyzeRequest {
  bidId: string;
  orgId: string;
  companyProfile?: {
    business_number?: string;
    certifications: string[];
    experience_years: number;
    past_wins: number;
    revenue: number;
  };
  options?: Partial<AnalyzeOptions>;
}

/**
 * POST /api/tender/analyze - Analyze a bid
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body: AnalyzeRequest = await request.json();
    const { bidId, orgId, companyProfile, options } = body;

    if (!bidId || !orgId) {
      return NextResponse.json(
        { error: 'Missing required fields: bidId, orgId' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Fetch the bid
    const { data: bid, error: bidError } = await supabase
      .from('bids')
      .select('*')
      .eq('id', bidId)
      .single();

    if (bidError) throw bidError;
    if (!bid) {
      return NextResponse.json({ error: 'Bid not found' }, { status: 404 });
    }

    // Default company profile if not provided
    const profile = companyProfile || {
      business_number: '123-45-67890',
      certifications: ['ISO9001', 'ISO27001'],
      experience_years: 5,
      past_wins: 10,
      revenue: 5000000000, // 50억
    };

    // Update bid status to analyzing
    await supabase
      .from('bids')
      .update({ status: 'analyzing' })
      .eq('id', bidId);

    // Analyze the bid
    const typedBid: Bid = {
      id: bid.id,
      org_id: bid.org_id,
      source: bid.source,
      external_id: bid.external_id,
      title: bid.title,
      description: bid.description,
      budget: bid.budget,
      currency: bid.currency,
      deadline: bid.deadline,
      status: bid.status,
      fit_score: bid.fit_score,
      raw_data: bid.raw_data,
      created_at: bid.created_at,
      updated_at: bid.updated_at,
    };

    const analysis = await analyzeBid(typedBid, profile, {
      checkQualifications: options?.checkQualifications ?? true,
      estimateCompetition: options?.estimateCompetition ?? true,
      generateRecommendations: options?.generateRecommendations ?? true,
    });

    // Store the analysis
    const { data: savedAnalysis, error: saveError } = await supabase
      .from('bid_analyses')
      .insert({
        bid_id: bidId,
        org_id: orgId,
        qualifications_met: analysis.qualifications_met,
        required_documents: analysis.required_documents,
        competition_level: analysis.competition_level,
        win_probability: analysis.win_probability,
        recommendations: analysis.recommendations,
      })
      .select()
      .single();

    if (saveError) throw saveError;

    // Update bid with fit score and status
    await supabase
      .from('bids')
      .update({
        fit_score: analysis.win_probability,
        status: 'analyzed',
      })
      .eq('id', bidId);

    return NextResponse.json({
      success: true,
      analysis: savedAnalysis,
      summary: {
        fitScore: analysis.win_probability,
        competitionLevel: analysis.competition_level,
        qualificationsMet: analysis.qualifications_met.filter((q) => q.met).length,
        qualificationsTotal: analysis.qualifications_met.length,
        recommendationsCount: analysis.recommendations.length,
      },
      metadata: {
        executionTime: Date.now() - startTime,
      },
    });

  } catch (error) {
    console.error('Tender Analyze Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/tender/analyze - Get analysis for a bid
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const bidId = searchParams.get('bidId');
    const orgId = searchParams.get('orgId');

    if (!bidId && !orgId) {
      return NextResponse.json(
        { error: 'Either bidId or orgId is required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    let query = supabase
      .from('bid_analyses')
      .select('*, bids(*)');

    if (bidId) query = query.eq('bid_id', bidId);
    if (orgId) query = query.eq('org_id', orgId);

    const { data, error } = await query.order('analyzed_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      analyses: data || [],
      count: data?.length || 0,
    });

  } catch (error) {
    console.error('Tender Analysis List Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

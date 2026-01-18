/**
 * Tender Analyze API Route
 * /api/tender/analyze
 *
 * Analyze bids for company fit, competition, and recommendations
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import {
  analyzeBid,
  calculateFitScore,
  analyzeCompetitors,
  getRecommendationText,
  type AnalyzeOptions,
  type CompanyProfile,
} from '@/lib/tender/analyzers';
import type { Bid } from '@/lib/tender/types';
import { metrics } from '@/lib/metrics';
import { logger } from '@/lib/logging';
import { parseJson, parseLimit } from '@/lib/api';
import { DEMO_COMPANY_PROFILE } from '@/lib/config/constants';

export interface AnalyzeRequest {
  bidId: string;
  orgId: string;
  companyProfile?: CompanyProfile;
  options?: Partial<AnalyzeOptions>;
  includeCompetitors?: boolean;
  includeFitScore?: boolean;
}

/**
 * POST /api/tender/analyze - Analyze a bid
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let statusCode = 200;

  try {
    const parsed = await parseJson<AnalyzeRequest>(request);
    if (!parsed.success) {
      return parsed.response;
    }
    const {
      bidId,
      orgId,
      companyProfile,
      options,
      includeCompetitors = true,
      includeFitScore = true,
    } = parsed.data;

    if (!bidId || !orgId) {
      statusCode = 400;
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
      statusCode = 404;
      return NextResponse.json({ error: 'Bid not found' }, { status: 404 });
    }

    // Default company profile if not provided
    const profile: CompanyProfile = companyProfile || DEMO_COMPANY_PROFILE;

    // Update bid status to analyzing
    await supabase.from('bids').update({ status: 'analyzing' }).eq('id', bidId);

    // Convert to typed Bid
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

    // Run analysis
    logger.info('Starting bid analysis', { bidId, orgId });

    const analysis = await analyzeBid(typedBid, profile, {
      checkQualifications: options?.checkQualifications ?? true,
      estimateCompetition: options?.estimateCompetition ?? true,
      generateRecommendations: options?.generateRecommendations ?? true,
      extractDocuments: options?.extractDocuments ?? true,
    });

    // Calculate fit score
    const fitScore = includeFitScore
      ? calculateFitScore(typedBid, profile, analysis)
      : null;

    // Analyze competitors
    const competitorAnalysis = includeCompetitors
      ? await analyzeCompetitors(typedBid)
      : null;

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
    const finalFitScore = fitScore?.overall ?? analysis.win_probability;
    await supabase
      .from('bids')
      .update({
        fit_score: finalFitScore,
        status: 'analyzed',
      })
      .eq('id', bidId);

    logger.info('Bid analysis completed', {
      bidId,
      fitScore: finalFitScore,
      competitionLevel: analysis.competition_level,
    });

    return NextResponse.json({
      success: true,
      analysis: savedAnalysis,
      fitScore: fitScore
        ? {
            overall: fitScore.overall,
            grade: fitScore.grade,
            recommendation: fitScore.recommendation,
            recommendationText: getRecommendationText(fitScore.recommendation),
            breakdown: fitScore.breakdown,
          }
        : null,
      competitors: competitorAnalysis
        ? {
            level: competitorAnalysis.competition_level,
            estimatedCount: competitorAnalysis.estimated_competitors,
            profiles: competitorAnalysis.competitor_profiles,
            insights: competitorAnalysis.market_insights,
            strategies: competitorAnalysis.strategy_recommendations,
          }
        : null,
      summary: {
        fitScore: finalFitScore,
        fitGrade: fitScore?.grade || null,
        competitionLevel: analysis.competition_level,
        qualificationsMet: analysis.qualifications_met.filter((q) => q.met).length,
        qualificationsTotal: analysis.qualifications_met.length,
        requiredDocuments: analysis.required_documents.length,
        recommendationsCount: analysis.recommendations.length,
        estimatedCompetitors: competitorAnalysis?.estimated_competitors || null,
      },
      metadata: {
        executionTime: Date.now() - startTime,
        analyzedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Tender Analyze Error', { error });
    statusCode = 500;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    metrics.httpRequest(
      'POST',
      '/api/tender/analyze',
      statusCode,
      (Date.now() - startTime) / 1000
    );
  }
}

/**
 * GET /api/tender/analyze - Get analysis for a bid
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  let statusCode = 200;

  try {
    const searchParams = request.nextUrl.searchParams;
    const bidId = searchParams.get('bidId');
    const orgId = searchParams.get('orgId');
    const limit = parseLimit(searchParams.get('limit'));

    if (!bidId && !orgId) {
      statusCode = 400;
      return NextResponse.json(
        { error: 'Either bidId or orgId is required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    let query = supabase
      .from('bid_analyses')
      .select('*, bids(*)')
      .order('analyzed_at', { ascending: false })
      .limit(limit);

    if (bidId) query = query.eq('bid_id', bidId);
    if (orgId) query = query.eq('org_id', orgId);

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      analyses: data || [],
      count: data?.length || 0,
    });
  } catch (error) {
    logger.error('Tender Analysis List Error', { error });
    statusCode = 500;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    metrics.httpRequest(
      'GET',
      '/api/tender/analyze',
      statusCode,
      (Date.now() - startTime) / 1000
    );
  }
}

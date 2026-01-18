/**
 * K-Startup API Route
 * GET /api/gov/kstartup - 창업진흥원 지원사업 조회
 */

import { NextRequest, NextResponse } from 'next/server';
import { getKStartupClient } from '@/lib/bizsupport/apis/kstartup-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const keyword = searchParams.get('keyword');

    const client = getKStartupClient();
    let programs;

    switch (type) {
      case 'pre-startup':
        programs = await client.getPreStartupPackages();
        break;
      case 'early-startup':
        programs = await client.getEarlyStartupPackages();
        break;
      case 'tips':
        programs = await client.getTIPSPrograms();
        break;
      case 'open':
        programs = await client.getOpenPrograms();
        break;
      default:
        if (keyword) {
          programs = await client.searchByKeyword(keyword);
        } else {
          programs = await client.getOpenPrograms();
        }
    }

    return NextResponse.json({
      success: true,
      data: programs,
      count: programs.length,
      source: 'k-startup',
    });
  } catch (error) {
    console.error('[API] K-Startup error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch K-Startup programs',
      },
      { status: 500 }
    );
  }
}

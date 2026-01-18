/**
 * Bizinfo API Route
 * GET /api/gov/bizinfo - 기업마당 지원사업 조회
 */

import { NextRequest, NextResponse } from 'next/server';
import { getBizinfoClient } from '@/lib/bizsupport/apis/bizinfo-client';
import { logger } from '@/lib/logging';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const keyword = searchParams.get('keyword');

    const client = getBizinfoClient();
    let programs;

    switch (type) {
      case 'smart-factory':
        programs = await client.getSmartFactoryPrograms();
        break;
      case 'ai':
        programs = await client.getAIPrograms();
        break;
      case 'latest':
        programs = await client.getLatestPrograms();
        break;
      default:
        if (keyword) {
          programs = await client.searchByKeyword(keyword);
        } else {
          programs = await client.getLatestPrograms();
        }
    }

    return NextResponse.json({
      success: true,
      data: programs,
      count: programs.length,
      source: 'bizinfo',
    });
  } catch (error) {
    logger.error('Bizinfo API error', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch Bizinfo programs',
      },
      { status: 500 }
    );
  }
}

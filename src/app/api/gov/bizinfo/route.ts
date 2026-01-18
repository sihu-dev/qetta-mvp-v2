/**
 * Bizinfo API Route
 * GET /api/gov/bizinfo - 기업마당 지원사업 조회
 */

import { NextRequest } from 'next/server';
import { getBizinfoClient } from '@/lib/bizsupport/apis/bizinfo-client';
import { successResponse, internalError } from '@/lib/api';
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

    return successResponse({
      data: programs,
      count: programs.length,
      source: 'bizinfo',
    });
  } catch (error) {
    logger.error('Bizinfo API error', error);
    return internalError('Failed to fetch Bizinfo programs');
  }
}

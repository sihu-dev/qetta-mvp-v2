/**
 * Safe JSON Parsing Utility
 * Provides consistent error handling for API request body parsing
 */

import { NextRequest, NextResponse } from 'next/server';

export interface ParseJsonResult<T> {
  success: true;
  data: T;
}

export interface ParseJsonError {
  success: false;
  response: NextResponse;
}

export type ParseJsonReturn<T> = ParseJsonResult<T> | ParseJsonError;

/**
 * Safely parse JSON from a NextRequest
 * Returns a standardized error response if parsing fails
 *
 * @example
 * const parsed = await parseJson<MyRequestBody>(request);
 * if (!parsed.success) {
 *   return parsed.response;
 * }
 * const { data } = parsed;
 */
export async function parseJson<T>(
  request: NextRequest
): Promise<ParseJsonReturn<T>> {
  try {
    const data = await request.json() as T;
    return { success: true, data };
  } catch (error) {
    const message = error instanceof SyntaxError
      ? 'Invalid JSON in request body'
      : 'Failed to parse request body';

    return {
      success: false,
      response: NextResponse.json(
        { error: message },
        { status: 400 }
      ),
    };
  }
}

/**
 * Scenario validation API.
 *
 * POST /api/scenarios/validate — validate scenario JSON
 */

import { NextResponse, type NextRequest } from 'next/server';
import { validateScenario } from '@/lib/validator';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { data } = body as { data?: unknown };

    if (!data) {
      return NextResponse.json(
        { error: 'data is required' },
        { status: 400 }
      );
    }

    const result = validateScenario(data);

    return NextResponse.json({
      valid: result.valid,
      errors: result.errors,
      warnings: result.warnings,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

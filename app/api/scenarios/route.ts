/**
 * Scenarios API — list and create scenarios.
 *
 * GET  /api/scenarios — list all scenarios with meta
 * POST /api/scenarios — create a new scenario file
 */

import { NextResponse, type NextRequest } from 'next/server';
import { listScenariosWithMeta } from '@/lib/scenario-loader';
import { createScenario } from '@/lib/scenario-writer';

export async function GET(): Promise<NextResponse> {
  try {
    const scenarios = listScenariosWithMeta();
    return NextResponse.json({ scenarios });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { fileId, data } = body as { fileId?: string; data?: unknown };

    if (!fileId || typeof fileId !== 'string') {
      return NextResponse.json(
        { error: 'fileId is required (string)' },
        { status: 400 }
      );
    }

    if (!data || typeof data !== 'object') {
      return NextResponse.json(
        { error: 'data is required (object)' },
        { status: 400 }
      );
    }

    const result = createScenario(fileId, data);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', errors: result.errors, warnings: result.warnings },
        { status: 422 }
      );
    }

    return NextResponse.json(
      { success: true, fileId, warnings: result.warnings },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message.includes('already exists') ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

/**
 * Scenario CRUD — read, update, delete a single scenario.
 *
 * GET    /api/scenarios/:fileId — read raw JSON
 * PUT    /api/scenarios/:fileId — validate & save
 * DELETE /api/scenarios/:fileId — delete file
 */

import { NextResponse, type NextRequest } from 'next/server';
import { getScenarioRaw, saveScenario, deleteScenario } from '@/lib/scenario-writer';

interface RouteParams {
  params: Promise<{ fileId: string }>;
}

export async function GET(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { fileId } = await params;
    const raw = getScenarioRaw(fileId);

    // Extract meta for header display
    let meta = null;
    try {
      const parsed = JSON.parse(raw);
      meta = parsed?.meta ?? null;
    } catch {
      // raw JSON might be invalid — still return it for editing
    }

    return NextResponse.json({ fileId, raw, meta });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message.includes('not found') ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { fileId } = await params;
    const body = await request.json();
    const { data } = body as { data?: unknown };

    if (!data || typeof data !== 'object') {
      return NextResponse.json(
        { error: 'data is required (object)' },
        { status: 400 }
      );
    }

    const result = saveScenario(fileId, data);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', errors: result.errors, warnings: result.warnings },
        { status: 422 }
      );
    }

    return NextResponse.json({ success: true, warnings: result.warnings });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message.includes('not found') ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { fileId } = await params;
    deleteScenario(fileId);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message.includes('not found') ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

/**
 * JSON validation API.
 *
 * POST /api/scenarios/validate
 * Body: { data: unknown, schema?: object }
 *
 * If schema is provided, validates data against it (JSON Schema / AJV).
 * If schema is omitted, only checks that data is valid JSON.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { validateJson } from '@/lib/validator';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { data, schema } = body as { data?: unknown; schema?: Record<string, unknown> };

    if (data === undefined) {
      return NextResponse.json(
        { error: 'data is required' },
        { status: 400 },
      );
    }

    const result = validateJson(data, schema ?? null);

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

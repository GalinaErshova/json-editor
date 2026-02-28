/**
 * Universal JSON validator.
 *
 * Two modes:
 * 1. Syntax-only — checks that the string is valid JSON
 * 2. Schema validation — if a JSON Schema is provided, validates data against it via AJV
 *
 * @module lib/validator
 */

import Ajv from 'ajv';

export interface ValidationError {
  readonly path: string;
  readonly message: string;
}

export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly ValidationError[];
  readonly warnings: readonly ValidationError[];
}

/**
 * Validate JSON data, optionally against a JSON Schema.
 *
 * @param data   - Parsed JSON value
 * @param schema - Optional JSON Schema object. If omitted, only confirms data is valid JSON.
 */
export function validateJson(
  data: unknown,
  schema?: Record<string, unknown> | null,
): ValidationResult {
  // No schema — syntax check only (data is already parsed, so it's valid)
  if (!schema) {
    return { valid: true, errors: [], warnings: [] };
  }

  // Validate against provided JSON Schema
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  try {
    const ajv = new Ajv({ allErrors: true });
    const validate = ajv.compile(schema);
    const valid = validate(data);

    if (!valid && validate.errors) {
      for (const err of validate.errors) {
        errors.push({
          path: err.instancePath || 'root',
          message: err.message || 'Unknown validation error',
        });
      }
    }
  } catch (err) {
    errors.push({
      path: 'schema',
      message: `Invalid JSON Schema: ${err instanceof Error ? err.message : 'unknown error'}`,
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Generic JSON validator - works with any JSON structure.
 *
 * Use this for non-scenario JSON files.
 * Only validates JSON syntax, no schema enforcement.
 */

export interface GenericValidationResult {
  readonly valid: boolean;
  readonly errors: readonly string[];
  readonly stats: {
    readonly size: number;
    readonly maxDepth: number;
    readonly keys: number;
  };
}

function getMaxDepth(obj: unknown, currentDepth = 0): number {
  if (typeof obj !== 'object' || obj === null) {
    return currentDepth;
  }

  const depths = Object.values(obj).map(value =>
    getMaxDepth(value, currentDepth + 1)
  );

  return depths.length > 0 ? Math.max(...depths) : currentDepth;
}

function countKeys(obj: unknown): number {
  if (typeof obj !== 'object' || obj === null) {
    return 0;
  }

  let count = Object.keys(obj).length;

  for (const value of Object.values(obj)) {
    count += countKeys(value);
  }

  return count;
}

/**
 * Validates any JSON structure.
 * Returns syntax validation + statistics.
 */
export function validateGenericJSON(data: unknown): GenericValidationResult {
  const errors: string[] = [];

  try {
    // Test serialization
    const serialized = JSON.stringify(data);
    const size = new Blob([serialized]).size;

    // Compute stats
    const maxDepth = getMaxDepth(data);
    const keys = countKeys(data);

    return {
      valid: true,
      errors: [],
      stats: {
        size,
        maxDepth,
        keys,
      },
    };
  } catch (err) {
    errors.push(err instanceof Error ? err.message : 'Unknown error');

    return {
      valid: false,
      errors,
      stats: {
        size: 0,
        maxDepth: 0,
        keys: 0,
      },
    };
  }
}

/**
 * Checks if JSON matches History's Edge scenario schema (basic check).
 */
export function looksLikeScenario(data: unknown): boolean {
  if (typeof data !== 'object' || data === null) {
    return false;
  }

  const obj = data as Record<string, unknown>;

  // Check for key scenario fields
  return (
    'meta' in obj &&
    'turns' in obj &&
    'params' in obj &&
    'endings' in obj
  );
}

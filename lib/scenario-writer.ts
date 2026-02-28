/**
 * Scenario writer — saves, creates, and deletes scenario JSON files.
 *
 * All write operations validate the scenario before saving.
 * Path traversal protection ensures files stay in scenarios/ directory.
 *
 * @module lib/scenario-writer
 */

import * as fs from 'fs';
import * as path from 'path';
import { validateScenario } from '@/lib/validator';
import type { ValidationError } from '@/types/scenario';

export interface ValidationWarning {
  readonly path: string;
  readonly message: string;
}

export interface SaveResult {
  readonly success: boolean;
  readonly errors: readonly ValidationError[];
  readonly warnings: readonly ValidationWarning[];
}

const SCENARIOS_DIR = path.resolve(process.cwd(), 'scenarios');
const FILE_ID_PATTERN = /^[a-z0-9][a-z0-9_-]*$/;

/**
 * Validates a fileId to prevent path traversal and invalid names.
 */
function validateFileId(fileId: string): void {
  if (!fileId || typeof fileId !== 'string') {
    throw new Error('fileId is required');
  }

  if (!FILE_ID_PATTERN.test(fileId)) {
    throw new Error(
      'Invalid fileId: only lowercase letters, digits, hyphens, and underscores allowed (must start with letter or digit)'
    );
  }

  if (fileId.startsWith('tone_legend')) {
    throw new Error('Cannot modify tone legend files through this API');
  }
}

/**
 * Resolves and validates the file path for a scenario.
 */
function resolveScenarioPath(fileId: string): string {
  validateFileId(fileId);

  const filePath = path.resolve(SCENARIOS_DIR, `${fileId}.json`);

  // Prevent path traversal
  if (!filePath.startsWith(SCENARIOS_DIR + path.sep)) {
    throw new Error(`Invalid scenario path: ${fileId}`);
  }

  return filePath;
}

/**
 * Gets the raw JSON content of a scenario file.
 *
 * @param fileId - Scenario file name without .json extension
 * @returns Raw JSON string
 * @throws Error if file not found
 */
export function getScenarioRaw(fileId: string): string {
  const filePath = resolveScenarioPath(fileId);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Scenario not found: ${fileId}`);
  }

  return fs.readFileSync(filePath, 'utf-8');
}

/**
 * Saves (overwrites) an existing scenario file.
 *
 * Validates the data before writing. Returns validation result.
 *
 * @param fileId - Scenario file name without .json extension
 * @param data - Scenario data object
 * @returns Save result with validation errors/warnings
 */
export function saveScenario(fileId: string, data: unknown): SaveResult {
  const filePath = resolveScenarioPath(fileId);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Scenario not found: ${fileId}. Use createScenario() for new files.`);
  }

  return writeScenarioFile(filePath, data);
}

/**
 * Creates a new scenario file.
 *
 * Validates the data before writing. Fails if file already exists.
 *
 * @param fileId - Scenario file name without .json extension
 * @param data - Scenario data object
 * @returns Save result with validation errors/warnings
 */
export function createScenario(fileId: string, data: unknown): SaveResult {
  const filePath = resolveScenarioPath(fileId);

  if (fs.existsSync(filePath)) {
    throw new Error(`Scenario already exists: ${fileId}`);
  }

  // Ensure scenarios directory exists
  if (!fs.existsSync(SCENARIOS_DIR)) {
    fs.mkdirSync(SCENARIOS_DIR, { recursive: true });
  }

  return writeScenarioFile(filePath, data);
}

/**
 * Deletes a scenario file.
 *
 * @param fileId - Scenario file name without .json extension
 * @throws Error if file not found
 */
export function deleteScenario(fileId: string): void {
  const filePath = resolveScenarioPath(fileId);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Scenario not found: ${fileId}`);
  }

  fs.unlinkSync(filePath);
}

/**
 * Validates scenario data and writes to file if valid.
 */
function writeScenarioFile(filePath: string, data: unknown): SaveResult {
  const result = validateScenario(data);

  if (!result.valid) {
    return {
      success: false,
      errors: result.errors,
      warnings: result.warnings,
    };
  }

  const json = JSON.stringify(data, null, 2);
  fs.writeFileSync(filePath, json, 'utf-8');

  return {
    success: true,
    errors: [],
    warnings: result.warnings,
  };
}

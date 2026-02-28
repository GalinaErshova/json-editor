/**
 * Scenario loader — loads and validates scenario JSON files.
 *
 * @module lib/scenario-loader
 */

import * as fs from 'fs';
import * as path from 'path';
import { validateScenario } from '@/lib/validator';
import type { Scenario, ScenarioMeta } from '@/types/scenario';

/**
 * Loads scenario from scenarios/{scenarioId}.json file.
 *
 * Validates the scenario and throws if invalid.
 *
 * @param scenarioId - Scenario file name (without .json extension)
 * @returns Validated scenario object
 * @throws Error if file not found or validation fails
 *
 * @example
 * const scenario = loadScenario('caesar');
 * // → Scenario { meta: { id: 'caesar-ides-of-march', ... }, ... }
 */
export function loadScenario(scenarioId: string): Scenario {
  // 1. Construct file path
  const scenariosDir = path.resolve(process.cwd(), 'scenarios');
  const filePath = path.resolve(scenariosDir, `${scenarioId}.json`);

  // 2. Prevent path traversal — ensure resolved path stays inside scenarios/
  if (!filePath.startsWith(scenariosDir + path.sep) && filePath !== scenariosDir) {
    throw new Error(`Invalid scenario ID: ${scenarioId}`);
  }

  // 3. Check file exists
  if (!fs.existsSync(filePath)) {
    throw new Error(`Scenario not found: ${scenarioId}`);
  }

  // 4. Read and parse JSON
  let data: unknown;
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    data = JSON.parse(content);
  } catch (error) {
    throw new Error(
      `Failed to parse scenario JSON: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  // 5. Validate scenario
  const result = validateScenario(data);

  if (!result.valid) {
    const errorMessages = result.errors.map((e) => `${e.path}: ${e.message}`).join('\n');
    throw new Error(`Scenario validation failed:\n${errorMessages}`);
  }

  if (!result.scenario) {
    throw new Error('Scenario validation succeeded but no scenario returned');
  }

  return result.scenario;
}

/**
 * Lists all available scenario IDs.
 *
 * @returns Array of scenario IDs (file names without .json extension)
 *
 * @example
 * const scenarios = listScenarios();
 * // → ['caesar', 'cuban-missile-crisis']
 */
export function listScenarios(): string[] {
  const scenariosDir = path.resolve(process.cwd(), 'scenarios');

  if (!fs.existsSync(scenariosDir)) {
    return [];
  }

  const files = fs.readdirSync(scenariosDir);

  return files
    .filter((file) => file.endsWith('.json'))
    .map((file) => file.replace(/\.json$/, ''));
}

export type ScenarioMetaWithFileId = ScenarioMeta & {
  readonly fileId: string;
  readonly endingsCount: number;
};

/**
 * Lists all available scenarios with their metadata.
 *
 * Scans scenarios/ directory, loads each JSON, and extracts the meta block.
 * Silently skips files that fail to load or validate.
 *
 * @returns Array of scenario metadata objects
 */
export function listScenariosWithMeta(): ScenarioMetaWithFileId[] {
  const ids = listScenarios();
  const results: ScenarioMetaWithFileId[] = [];

  for (const id of ids) {
    try {
      const scenario = loadScenario(id);
      results.push({
        ...scenario.meta,
        fileId: id,
        endingsCount: scenario.endings.length,
      });
    } catch {
      // Skip invalid scenarios
    }
  }

  return results;
}

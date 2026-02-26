/**
 * Core scenario types for JSON Schema Editor.
 *
 * Minimal type definitions extracted from History's Edge project.
 * This standalone editor works with any JSON Schema validation.
 */

// Simplified scenario types (core structure)
export interface Scenario {
  readonly meta: ScenarioMeta;
  readonly briefing: object;
  readonly params: ReadonlyArray<object>;
  readonly turns: ReadonlyArray<Turn>;
  readonly triggers: ReadonlyArray<object>;
  readonly endings: ReadonlyArray<object>;
  readonly sources?: ReadonlyArray<object>;
  readonly realHistory: ReadonlyArray<object>;
  [key: string]: unknown; // Allow additional fields
}

export interface ScenarioMeta {
  readonly id: string;
  readonly version: string;
  readonly title: string;
  readonly subtitle: string;
  readonly description: string;
  readonly epoch: string;
  readonly region: string;
  readonly character: {
    readonly name: string;
    readonly role: string;
  };
  readonly conflictType: string;
  readonly difficulty: string;
  readonly turnCount: number;
  readonly estimatedMinutes: number;
  readonly tags: readonly string[];
  readonly locale: string;
  readonly author: {
    readonly id: string;
    readonly name: string;
    readonly verified: boolean;
  };
  [key: string]: unknown;
}

export interface Turn {
  readonly id: string;
  readonly order: number;
  readonly event: {
    readonly text: string;
    readonly title?: string;
    [key: string]: unknown;
  };
  readonly isCulmination: boolean;
  readonly ai_override: boolean;
  readonly choices: ReadonlyArray<Choice>;
  [key: string]: unknown;
}

export interface Choice {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly deltas: Record<string, number>;
  readonly newspaper: object;
  readonly nextTurnId?: string | null;
  readonly forceTrigger?: string;
  readonly endingIds?: readonly string[];
  [key: string]: unknown;
}

export interface ValidationError {
  readonly path: string;
  readonly message: string;
}

export interface ValidationWarning {
  readonly path: string;
  readonly message: string;
}

export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly ValidationError[];
  readonly warnings: readonly ValidationWarning[];
  readonly scenario: Scenario | null;
}

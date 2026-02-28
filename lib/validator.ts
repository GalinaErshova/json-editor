/**
 * Scenario JSON schema validator.
 *
 * Uses AJV to validate scenario files against JSON Schema.
 * Catches structural errors, missing required fields, invalid types.
 * This is a standalone version that does NOT include game engine validation.
 *
 * @module lib/validator
 */

import Ajv from 'ajv';
import type { Scenario, Turn, ValidationError } from '@/types/scenario';

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

// JSON Schema for Scenario type
const scenarioSchema = {
  type: 'object',
  required: ['meta', 'briefing', 'params', 'turns', 'triggers', 'endings', 'realHistory'],
  properties: {
    meta: {
      type: 'object',
      required: ['id', 'version', 'title', 'subtitle', 'description', 'epoch', 'region', 'character', 'conflictType', 'difficulty', 'turnCount', 'estimatedMinutes', 'tags', 'locale', 'author'],
      properties: {
        id: { type: 'string' },
        version: { type: 'string' },
        title: { type: 'string' },
        subtitle: { type: 'string' },
        description: { type: 'string' },
        epoch: { enum: ['antiquity', 'medieval', 'renaissance', 'early_modern', 'modern', 'cold_war', 'contemporary'] },
        region: { type: 'string' },
        character: {
          type: 'object',
          required: ['name', 'role'],
          properties: {
            name: { type: 'string' },
            role: { type: 'string' },
            portrait: { type: ['string', 'null'] },
            portraitAnimated: { type: ['string', 'null'] },
          },
        },
        conflictType: {
          enum: [
            'power-vs-republic',
            'escalation-vs-concession',
            'economy-vs-lives',
            'pride-vs-pragmatism',
            'faith-vs-state',
            'reform-vs-stability',
            'war-vs-diplomacy',
            'loyalty-vs-survival',
          ],
        },
        difficulty: { enum: ['easy', 'medium', 'hard'] },
        turnCount: { type: 'number' },
        estimatedMinutes: { type: 'number' },
        tags: { type: 'array', items: { type: 'string' } },
        locale: { type: 'string' },
        author: {
          type: 'object',
          required: ['id', 'name', 'verified'],
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            verified: { type: 'boolean' },
          },
        },
        marketplace: {
          type: 'object',
          required: ['price', 'isPremium', 'featured', 'downloads'],
          properties: {
            price: { type: 'number' },
            isPremium: { type: 'boolean' },
            featured: { type: 'boolean' },
            publishedAt: { type: ['string', 'null'] },
            downloads: { type: 'number' },
            rating: { type: ['number', 'null'] },
          },
        },
      },
    },
    briefing: {
      type: 'object',
      required: ['text', 'maxLength'],
      properties: {
        text: { type: 'string' },
        image: { type: ['string', 'null'] },
        maxLength: { type: 'number' },
      },
    },
    params: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'name', 'icon', 'color', 'startValue', 'min', 'max', 'description', 'thresholds'],
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          icon: { type: 'string' },
          color: { type: 'string' },
          startValue: { type: 'number' },
          min: { type: 'number' },
          max: { type: 'number' },
          description: { type: 'string' },
          thresholds: {
            type: 'array',
            items: {
              type: 'object',
              required: ['value', 'type', 'label'],
              properties: {
                value: { type: 'number' },
                type: { enum: ['danger', 'warning', 'trigger', 'special'] },
                label: { type: 'string' },
                triggerId: { type: 'string' },
              },
            },
          },
        },
      },
    },
    turns: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'order', 'event', 'isCulmination', 'ai_override', 'choices'],
        properties: {
          id: { type: 'string' },
          order: { type: 'number' },
          event: {
            type: 'object',
            required: ['text'],
            properties: {
              period: { type: 'string' },
              text: { type: 'string' },
              image: { type: ['string', 'null'] },
              sourceRef: { type: ['string', 'null'] },
            },
          },
          isCulmination: { type: 'boolean' },
          timerSeconds: { type: ['number', 'null'] },
          ai_override: { type: 'boolean' },
          choices: {
            type: 'array',
            items: {
              type: 'object',
              required: ['id', 'title', 'description', 'deltas', 'impactPreview', 'newspaper'],
              properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                description: { type: 'string' },
                deltas: { type: 'object' },
                impactPreview: { type: 'object' },
                newspaper: {
                  type: 'object',
                  required: ['style', 'headline', 'title', 'body', 'ai_override'],
                  additionalProperties: true,
                  properties: {
                    style: { enum: ['acta_diurna', 'intelligence', 'letter', 'decree'] },
                    headline: { type: 'string' },
                    title: { type: 'string' },
                    body: { type: 'string' },
                    image: { type: ['string', 'null'] },
                    ai_override: { type: 'boolean' },
                    historicalComment: { type: 'string' },
                  },
                },
                nextTurnId: { type: ['string', 'null'] },
                forceTrigger: { type: 'string' },
                endingIds: { type: 'array', items: { type: 'string' } },
              },
            },
          },
        },
      },
    },
    triggers: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'condition', 'effect', 'description'],
        properties: {
          id: { type: 'string' },
          condition: {
            type: 'object',
            required: ['param', 'operator', 'value'],
            properties: {
              param: { type: 'string' },
              operator: { enum: ['>=', '<=', '==', '>', '<'] },
              value: { type: 'number' },
            },
          },
          effect: { enum: ['force_ending', 'modify_choices', 'add_event'] },
          endingId: { type: ['string', 'null'] },
          description: { type: 'string' },
        },
      },
    },
    endings: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'title', 'subtitle', 'conditions', 'epilogue'],
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          subtitle: { type: 'string' },
          conditions: { type: 'object' },
          epilogue: { type: 'string' },
          image: { type: ['string', 'null'] },
        },
      },
    },
    realHistory: {
      type: 'array',
      items: {
        type: 'object',
        required: ['turnId', 'title', 'description', 'matchChoiceId', 'historicalNote'],
        properties: {
          turnId: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          matchChoiceId: { type: 'string' },
          historicalNote: { type: 'string' },
          sourceRef: { type: ['string', 'null'] },
        },
      },
    },
    sources: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'type', 'citation'],
        properties: {
          id: { type: 'string' },
          type: { enum: ['book', 'article', 'wiki', 'archive'] },
          citation: { type: 'string' },
          url: { type: ['string', 'null'] },
        },
      },
    },
    realHistoryEndingId: { type: 'string' },
    toneLegendFile: { type: 'string' },
    endingRules: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'type', 'endingId', 'description'],
        properties: {
          id: { type: 'string' },
          type: {
            enum: [
              'exact_history_match',
              'near_history_match',
              'choice_trigger',
              'tone_area',
              'conditional',
              'default',
            ],
          },
          endingId: { type: 'string' },
          description: { type: 'string' },
          lastNTurns: { type: 'number', minimum: 1 },
          choiceId: { type: 'string' },
          immediate: { type: 'boolean' },
          toneRuleId: { type: 'string' },
          conditions: { type: 'object' },
        },
      },
    },
    aiConfig: {
      type: 'object',
      required: ['model', 'epochContext', 'newspaperStyle', 'negativePrompts', 'maxTokensPerGeneration', 'temperature'],
      properties: {
        model: { type: 'string' },
        epochContext: { type: 'string' },
        newspaperStyle: { type: 'string' },
        negativePrompts: { type: 'array', items: { type: 'string' } },
        maxTokensPerGeneration: { type: 'number' },
        temperature: { type: 'number' },
      },
    },
  },
};

/**
 * Validates scenario JSON against schema.
 *
 * Checks:
 * - Required fields present
 * - Types correct (string, number, array, etc.)
 * - Enums valid
 * - IDs unique and referenced correctly
 * - Turn routing valid (no dead ends)
 *
 * @param data - Raw JSON data (unknown type)
 * @returns Validation result with errors
 *
 * @example
 * const result = validateScenario(jsonData);
 * if (!result.valid) {
 *   console.error('Validation errors:', result.errors);
 * }
 */
export function validateScenario(data: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  // 1. Structural validation with AJV
  const ajv = new Ajv({ allErrors: true });
  const validate = ajv.compile(scenarioSchema);
  const valid = validate(data);

  if (!valid && validate.errors) {
    for (const error of validate.errors) {
      errors.push({
        path: error.instancePath || 'root',
        message: error.message || 'Unknown error',
      });
    }
  }

  // If structural validation failed, return early
  if (errors.length > 0) {
    return { valid: false, errors, warnings: [], scenario: null };
  }

  // Cast to Scenario after successful AJV validation
  const scenario = data as Scenario;

  // 2. Check ID references
  const refErrors = validateReferences(scenario);
  errors.push(...refErrors);

  // 3. Check turn routing
  const routingErrors = validateTurnRouting(scenario);
  errors.push(...routingErrors);

  // 4. Collect warnings (non-blocking)
  const warnings = errors.length === 0 ? collectWarnings(scenario) : [];

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    scenario: errors.length === 0 ? scenario : null,
  };
}

/**
 * Checks if all ID references are valid.
 *
 * Validates:
 * - sourceRef → sources[]
 * - nextTurnId → turns[]
 * - matchChoiceId → choices[]
 * - endingId → endings[]
 * - threshold.triggerId → triggers[]
 */
export function validateReferences(scenario: Scenario): ValidationError[] {
  const errors: ValidationError[] = [];

  // Collect all valid IDs
  const sourceIds = new Set((scenario.sources ?? []).map((s: any) => s.id));
  const turnIds = new Set(scenario.turns.map((t) => t.id));
  const endingIds = new Set(scenario.endings.map((e: any) => e.id));
  const triggerIds = new Set(scenario.triggers.map((t: any) => t.id));

  // Collect all choice IDs
  const choiceIds = new Set<string>();
  for (const turn of scenario.turns) {
    for (const choice of turn.choices) {
      choiceIds.add(choice.id);
    }
  }

  // Check event.sourceRef
  for (const turn of scenario.turns) {
    const sourceRef = (turn.event as any).sourceRef;
    if (sourceRef && !sourceIds.has(sourceRef)) {
      errors.push({
        path: `turns[${turn.order}].event.sourceRef`,
        message: `Invalid sourceRef "${sourceRef}" — not found in sources[]`,
      });
    }
  }

  // Check choice.nextTurnId
  for (const turn of scenario.turns) {
    for (const choice of turn.choices) {
      if (choice.nextTurnId && !turnIds.has(choice.nextTurnId)) {
        errors.push({
          path: `turns[${turn.order}].choices[${choice.id}].nextTurnId`,
          message: `Invalid nextTurnId "${choice.nextTurnId}" — not found in turns[]`,
        });
      }
    }
  }

  // Check trigger.endingId
  for (const trigger of scenario.triggers as any[]) {
    if (trigger.endingId && !endingIds.has(trigger.endingId)) {
      errors.push({
        path: `triggers[${trigger.id}].endingId`,
        message: `Invalid endingId "${trigger.endingId}" — not found in endings[]`,
      });
    }
  }

  // Check realHistory.turnId and matchChoiceId
  for (const entry of scenario.realHistory as any[]) {
    if (!turnIds.has(entry.turnId)) {
      errors.push({
        path: `realHistory[${entry.turnId}].turnId`,
        message: `Invalid turnId "${entry.turnId}" — not found in turns[]`,
      });
    }

    if (!choiceIds.has(entry.matchChoiceId)) {
      errors.push({
        path: `realHistory[${entry.turnId}].matchChoiceId`,
        message: `Invalid matchChoiceId "${entry.matchChoiceId}" — not found in any turn's choices[]`,
      });
    }

    if (entry.sourceRef && !sourceIds.has(entry.sourceRef)) {
      errors.push({
        path: `realHistory[${entry.turnId}].sourceRef`,
        message: `Invalid sourceRef "${entry.sourceRef}" — not found in sources[]`,
      });
    }
  }

  // Check threshold.triggerId
  for (const param of scenario.params as any[]) {
    for (const threshold of param.thresholds || []) {
      if (threshold.triggerId && !triggerIds.has(threshold.triggerId)) {
        errors.push({
          path: `params[${param.id}].thresholds[${threshold.value}].triggerId`,
          message: `Invalid triggerId "${threshold.triggerId}" — not found in triggers[]`,
        });
      }
    }
  }

  // Check choice.forceTrigger
  for (const turn of scenario.turns) {
    for (const choice of turn.choices) {
      if (choice.forceTrigger && !triggerIds.has(choice.forceTrigger)) {
        errors.push({
          path: `turns[${turn.order}].choices[${choice.id}].forceTrigger`,
          message: `Invalid forceTrigger "${choice.forceTrigger}" — not found in triggers[]`,
        });
      }
    }
  }

  // Check choice.endingIds
  for (const turn of scenario.turns) {
    for (const choice of turn.choices) {
      if (choice.endingIds) {
        for (const endingId of choice.endingIds) {
          if (!endingIds.has(endingId)) {
            errors.push({
              path: `turns[${turn.order}].choices[${choice.id}].endingIds`,
              message: `Invalid endingId "${endingId}" in endingIds — not found in endings[]`,
            });
          }
        }
      }
    }
  }

  // Check realHistoryEndingId
  const realHistoryEndingId = (scenario as any).realHistoryEndingId;
  if (realHistoryEndingId && !endingIds.has(realHistoryEndingId)) {
    errors.push({
      path: 'realHistoryEndingId',
      message: `Invalid realHistoryEndingId "${realHistoryEndingId}" — not found in endings[]`,
    });
  }

  // Check endingRules (if present)
  const endingRulesErrors = validateEndingRules(scenario, endingIds, choiceIds);
  errors.push(...endingRulesErrors);

  return errors;
}

/**
 * Validates endingRules references and type-specific field requirements.
 */
export function validateEndingRules(
  scenario: Scenario,
  endingIds: Set<string>,
  choiceIds: Set<string>
): ValidationError[] {
  const errors: ValidationError[] = [];
  const endingRules = (scenario as unknown as Record<string, unknown>).endingRules as
    | readonly Record<string, unknown>[]
    | undefined;

  if (!endingRules) {
    return errors;
  }

  const ruleIds = new Set<string>();

  for (let i = 0; i < endingRules.length; i++) {
    const rule = endingRules[i]!;
    const ruleId = rule.id as string;
    const ruleType = rule.type as string;
    const rulePath = `endingRules[${i}]`;

    // Check unique ID
    if (ruleIds.has(ruleId)) {
      errors.push({ path: rulePath, message: `Duplicate endingRule id "${ruleId}"` });
    }
    ruleIds.add(ruleId);

    // Check endingId reference
    if (!endingIds.has(rule.endingId as string)) {
      errors.push({
        path: `${rulePath}.endingId`,
        message: `Invalid endingId "${rule.endingId}" — not found in endings[]`,
      });
    }

    // Type-specific validation
    switch (ruleType) {
      case 'near_history_match':
        if (typeof rule.lastNTurns !== 'number' || rule.lastNTurns < 1) {
          errors.push({
            path: `${rulePath}.lastNTurns`,
            message: 'near_history_match rule requires lastNTurns >= 1',
          });
        }
        break;

      case 'choice_trigger':
        if (typeof rule.choiceId !== 'string') {
          errors.push({
            path: `${rulePath}.choiceId`,
            message: 'choice_trigger rule requires choiceId',
          });
        } else if (!choiceIds.has(rule.choiceId)) {
          errors.push({
            path: `${rulePath}.choiceId`,
            message: `Invalid choiceId "${rule.choiceId}" — not found in any turn's choices[]`,
          });
        }
        if (typeof rule.immediate !== 'boolean') {
          errors.push({
            path: `${rulePath}.immediate`,
            message: 'choice_trigger rule requires immediate (boolean)',
          });
        }
        break;

      case 'tone_area':
        if (typeof rule.toneRuleId !== 'string') {
          errors.push({
            path: `${rulePath}.toneRuleId`,
            message: 'tone_area rule requires toneRuleId',
          });
        }
        break;

      case 'conditional':
        if (typeof rule.conditions !== 'object' || rule.conditions === null) {
          errors.push({
            path: `${rulePath}.conditions`,
            message: 'conditional rule requires conditions object',
          });
        }
        break;

      case 'exact_history_match':
      case 'default':
        break;
    }
  }

  return errors;
}

/**
 * Checks for orphaned turns (unreachable from start).
 *
 * Uses graph traversal (BFS) to find all reachable turns from turn with order=1.
 */
export function validateTurnRouting(scenario: Scenario): ValidationError[] {
  const errors: ValidationError[] = [];

  // Find starting turn (order = 1)
  const startTurn = scenario.turns.find((t) => t.order === 1);
  if (!startTurn) {
    errors.push({
      path: 'turns',
      message: 'No turn with order=1 found (required starting point)',
    });
    return errors;
  }

  // Build reachable set using BFS
  const reachable = new Set<string>();
  const queue: Turn[] = [startTurn];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) continue;

    reachable.add(current.id);

    // Add all turns reachable via nextTurnId
    for (const choice of current.choices) {
      if (choice.nextTurnId) {
        const nextTurn = scenario.turns.find((t) => t.id === choice.nextTurnId);
        if (nextTurn && !reachable.has(nextTurn.id)) {
          queue.push(nextTurn);
        }
      }
    }
  }

  // Check for unreachable turns
  for (const turn of scenario.turns) {
    if (!reachable.has(turn.id)) {
      errors.push({
        path: `turns[${turn.order}]`,
        message: `Turn "${turn.id}" (order=${turn.order}) is unreachable from starting turn (order=1)`,
      });
    }
  }

  return errors;
}

const RECOMMENDED_CHOICES_PER_TURN = 3;

/**
 * Collects non-blocking warnings for a valid scenario.
 *
 * Warnings do not affect validation result (valid/invalid),
 * but highlight potential design issues.
 *
 * @param scenario - Validated scenario
 * @returns Array of warnings
 */
export function collectWarnings(scenario: Scenario): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];

  // Check choice count per turn
  for (const turn of scenario.turns) {
    if (turn.choices.length !== RECOMMENDED_CHOICES_PER_TURN) {
      warnings.push({
        path: `turns[${turn.id}].choices`,
        message: `Turn "${turn.id}" (order ${turn.order}) has ${turn.choices.length} choice(s), recommended ${RECOMMENDED_CHOICES_PER_TURN}. UI is optimized for ${RECOMMENDED_CHOICES_PER_TURN} choices per turn.`,
      });
    }

    // Check culmination turn choices for forceTrigger or endingIds
    if (turn.isCulmination) {
      for (const choice of turn.choices) {
        if (!choice.forceTrigger && !choice.endingIds) {
          warnings.push({
            path: `turns[${turn.id}].choices[${choice.id}]`,
            message: `Culmination turn choice "${choice.id}" has neither forceTrigger nor endingIds. Ending may be ambiguous.`,
          });
        }
      }
    }
  }

  // Check endingRules has a default rule
  const endingRules = (scenario as unknown as Record<string, unknown>).endingRules as
    | readonly Record<string, unknown>[]
    | undefined;
  if (endingRules && endingRules.length > 0) {
    const hasDefault = endingRules.some((r) => r.type === 'default');
    if (!hasDefault) {
      warnings.push({
        path: 'endingRules',
        message: 'endingRules has no "default" rule — if no rules match, the legacy conditions system will be used as fallback.',
      });
    }
  }

  return warnings;
}

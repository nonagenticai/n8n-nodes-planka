import * as fs from 'fs';
import * as path from 'path';
import { INodeProperties } from 'n8n-workflow';
import { cardFields } from '../../../nodes/Planka/descriptions/card.description';

/**
 * CONTRACT TEST: updateCard() handler  <->  card.description.ts descriptor.
 *
 * n8n resolves a DECLARED collection to its DECLARED sub-keys only. A key the
 * handler reads off the merged `fields` object but that is NOT declared as an
 * option of `updateFields` / `additionalFields` is stripped by n8n before the
 * handler runs: the read yields `undefined`, the feature does nothing, and
 * NOTHING is logged — no error, no warning.
 *
 * That is exactly how `customFields` stayed broken: read by updateCard() since
 * 2026-05-04, set by production workflow JSON, never declared. Measured
 * 2026-08-25 — n8n run 572316 moved a card READY->BLOCKED carrying a composed
 * block_reason in customFields, on a board where that field exists, and wrote
 * ZERO custom_field_value rows.
 *
 * Every other test in tests/unit/operations/ mocks getNodeParameter with
 * mockReturnValueOnce({...}), which hardcodes the assumption that n8n hands the
 * handler back whatever the caller supplied — the very assumption that was
 * false. This test does not mock n8n; it compares handler SOURCE against
 * descriptor DATA.
 */

const OPERATIONS_FILE = path.resolve(
  __dirname,
  '../../../nodes/Planka/operations/card.operations.ts',
);

// ---------------------------------------------------------------------------
// Pure helpers (exercised below against synthetic inputs so the contract check
// itself is proven capable of failing — see "self-check" describe block).
// ---------------------------------------------------------------------------

/**
 * Isolate a single top-level `function <name>(` body from TypeScript source.
 * Scoped deliberately: other card handlers merge their own collections, so
 * scanning the whole file would mix contracts together.
 */
export function isolateFunctionSource(source: string, fnName: string): string {
  const startPatterns = [
    `async function ${fnName}(`,
    `function ${fnName}(`,
  ];
  let start = -1;
  for (const p of startPatterns) {
    start = source.indexOf(p);
    if (start !== -1) break;
  }
  if (start === -1) {
    throw new Error(
      `isolateFunctionSource: could not locate function "${fnName}". ` +
        `If it was renamed or moved, this contract test must be updated — do not delete it.`,
    );
  }
  const rest = source.slice(start);
  // A top-level function ends at the first line beginning at column 0 with `}`.
  const end = rest.search(/^\}/m);
  if (end === -1) {
    throw new Error(`isolateFunctionSource: no closing brace found for "${fnName}"`);
  }
  return rest.slice(0, end + 1);
}

/** Every distinct key read as `fields.<key>` in the given source slice. */
export function extractFieldReads(fnSource: string): string[] {
  const keys = new Set<string>();
  for (const m of fnSource.matchAll(/\bfields\.([A-Za-z_$][\w$]*)/g)) {
    keys.add(m[1]);
  }
  return [...keys].sort();
}

/** Declared option `name`s of a named collection property, or null if absent. */
export function collectionOptionNames(
  properties: INodeProperties[],
  collectionName: string,
): string[] | null {
  const prop = properties.find(
    (p) => p.name === collectionName && p.type === 'collection',
  );
  if (!prop) return null;
  const options = (prop.options ?? []) as Array<{ name?: string }>;
  return options.map((o) => o.name).filter((n): n is string => typeof n === 'string');
}

/** Keys the handler reads that no collection declares. */
export function findUndeclaredFieldReads(
  readKeys: string[],
  declared: string[],
): string[] {
  const declaredSet = new Set(declared);
  return readKeys.filter((k) => !declaredSet.has(k));
}

function undeclaredMessage(offenders: string[]): string {
  return (
    `updateCard() reads fields.${offenders.join(', fields.')} but ` +
    `${offenders.length === 1 ? 'that key is' : 'those keys are'} not declared as an option of the ` +
    `'updateFields' or 'additionalFields' collection in ` +
    `nodes/Planka/descriptions/card.description.ts.\n` +
    `n8n resolves a declared collection to its DECLARED sub-keys only: an undeclared sub-key is ` +
    `STRIPPED before the handler runs, so the handler's read is silently \`undefined\`. ` +
    `The feature does nothing and nothing is logged — no error, no warning. ` +
    `Declare ${offenders.length === 1 ? 'it' : 'them'} in the collection, or stop reading ` +
    `${offenders.length === 1 ? 'it' : 'them'} in updateCard().`
  );
}

// ---------------------------------------------------------------------------

describe('card.description <-> card.operations contract (update)', () => {
  const source = fs.readFileSync(OPERATIONS_FILE, 'utf8');
  const updateCardSource = isolateFunctionSource(source, 'updateCard');
  const readKeys = extractFieldReads(updateCardSource);

  const updateFieldsOptions = collectionOptionNames(cardFields, 'updateFields');
  const additionalFieldsOptions = collectionOptionNames(cardFields, 'additionalFields');

  describe('extraction non-vacuity', () => {
    it('should isolate updateCard() and not the whole file', () => {
      expect(updateCardSource).toContain('async function updateCard(');
      expect(updateCardSource).toContain('const fields = {');
      // Other handlers must not be swept in.
      expect(updateCardSource).not.toContain('async function createCard(');
      expect(updateCardSource).not.toContain('function parseCustomFields(');
    });

    it('should find a meaningful number of fields.<key> reads', () => {
      // Guards against a regex that silently matches nothing, which would make
      // the contract assertion below pass trivially — the same class of silent
      // failure as the bug this test exists to prevent.
      expect(readKeys.length).toBeGreaterThanOrEqual(8);
    });

    it('should specifically find listId and customFields among the reads', () => {
      expect(readKeys).toContain('listId');
      expect(readKeys).toContain('customFields');
    });
  });

  describe('descriptor shape', () => {
    it('should declare an updateFields collection with options', () => {
      expect(updateFieldsOptions).not.toBeNull();
      expect((updateFieldsOptions as string[]).length).toBeGreaterThan(0);
    });

    it('should declare an additionalFields collection with options', () => {
      expect(additionalFieldsOptions).not.toBeNull();
      expect((additionalFieldsOptions as string[]).length).toBeGreaterThan(0);
    });
  });

  describe('the contract', () => {
    it('should declare every key updateCard() reads off the merged collections', () => {
      const declared = [
        ...(updateFieldsOptions ?? []),
        ...(additionalFieldsOptions ?? []),
      ];
      const offenders = findUndeclaredFieldReads(readKeys, declared);
      if (offenders.length > 0) {
        throw new Error(undeclaredMessage(offenders));
      }
      expect(offenders).toEqual([]);
    });

    // Direct regression pin for the 2026-08-25 defect: deployed workflows send
    // customFields for `operation: update`, which resolves against updateFields
    // specifically — being declared only under additionalFields would NOT fix it.
    it('should declare customFields in updateFields specifically', () => {
      expect(updateFieldsOptions).toContain('customFields');
    });
  });

  // -------------------------------------------------------------------------
  // Self-check: prove the contract check can actually FAIL. Without this, a
  // permanently-green check is indistinguishable from a working one.
  // -------------------------------------------------------------------------
  describe('self-check (the check can fail)', () => {
    const syntheticSource = [
      'async function updateCard(this: any, i: number) {',
      '  const fields = { ...a, ...b };',
      '  if (fields.name) body.name = fields.name;',
      '  if (fields.customFields !== undefined) apply(fields.customFields);',
      '  return body;',
      '}',
      'function other() { const fields = {}; return fields.neverScanned; }',
    ].join('\n');

    it('should extract only the target function, not its neighbours', () => {
      const isolated = isolateFunctionSource(syntheticSource, 'updateCard');
      expect(extractFieldReads(isolated)).toEqual(['customFields', 'name']);
      expect(extractFieldReads(isolated)).not.toContain('neverScanned');
    });

    it('should report customFields as undeclared when the descriptor omits it', () => {
      const brokenDescriptor: INodeProperties[] = [
        {
          displayName: 'Update Fields',
          name: 'updateFields',
          type: 'collection',
          placeholder: 'Add Field',
          default: {},
          options: [
            { displayName: 'Name', name: 'name', type: 'string', default: '' },
          ],
        },
      ];
      const declared = collectionOptionNames(brokenDescriptor, 'updateFields') ?? [];
      const offenders = findUndeclaredFieldReads(['customFields', 'name'], declared);
      expect(offenders).toEqual(['customFields']);
      expect(undeclaredMessage(offenders)).toContain('fields.customFields');
      expect(undeclaredMessage(offenders)).toContain('silently `undefined`');
    });

    it('should report the real keys as undeclared against an empty descriptor', () => {
      // Same real extraction, descriptor emptied: every key must be reported.
      const offenders = findUndeclaredFieldReads(readKeys, []);
      expect(offenders).toEqual(readKeys);
      expect(offenders.length).toBeGreaterThanOrEqual(8);
    });

    it('should return null for a collection the descriptor does not define', () => {
      expect(collectionOptionNames(cardFields, 'noSuchCollection')).toBeNull();
    });
  });
});

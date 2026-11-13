import { INodeProperties } from 'n8n-workflow';

/**
 * Planka's description.properties is wrapped in mergeSameNameCollections()
 * (n8n_module_scripts#96) so a workflow that sets `resource` by EXPRESSION
 * keeps every child of `additionalFields` / `updateFields` instead of only
 * the children of whichever same-named definition n8n processes last.
 *
 * Planka is one of the packages where the merge cannot collapse a group into
 * ONE definition: `additionalFields` is emitted as a SPLIT group (two
 * definitions, each carrying the full child list) because no single n8n
 * `show` cross-product covers exactly the (resource, operation) pairs its
 * members displayed. This suite pins the semantic contract for that case
 * rather than a definition count:
 *
 *   A child is live for (resource, operation) iff its parent shows for that
 *   pair AND the child shows for that pair.
 *
 *   1. literal resource: every (resource, operation) pair sees EXACTLY the
 *      live children it saw before the merge, from at most one definition;
 *   2. expression resource: every definition of a merged name carries the
 *      same children, and that set is every child of every member, so the
 *      last-processed definition drops nothing;
 *   3. no merged child is dead (live for no pair).
 *
 * The pre-merge list is captured from the real call site, not rebuilt here.
 */

let captured: INodeProperties[] | undefined;

jest.mock('../../../helpers/mergeSameNameCollections', () => {
  const actual = jest.requireActual('../../../helpers/mergeSameNameCollections');
  return {
    ...actual,
    mergeSameNameCollections: (props: INodeProperties[]) => {
      captured = props;
      return actual.mergeSameNameCollections(props);
    },
  };
});

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Planka } = require('../../../nodes/Planka/Planka.node');

type Params = { resource: string; operation: string };
type Dict = Record<string, unknown>;

const MERGEABLE = new Set(['collection', 'fixedCollection']);

function paramValue(key: string, params: Params, nested: boolean): unknown {
  if (key.startsWith('/')) return (params as Dict)[key.slice(1)];
  if (nested) throw new Error(`relative display key "${key}" on a child is not modelled`);
  return (params as Dict)[key];
}

function assertModelled(key: string, values: unknown[]): void {
  const k = key.replace(/^\//, '');
  if (k !== 'resource' && k !== 'operation') {
    throw new Error(`display key "${key}" is not modelled by this test`);
  }
  for (const v of values) {
    if (typeof v === 'object' && v !== null) throw new Error(`condition ${JSON.stringify(v)} not modelled`);
  }
}

/** n8n displayParameter semantics for show/hide over resource+operation. */
function shows(p: { displayOptions?: Dict }, params: Params, nested: boolean): boolean {
  const d = p.displayOptions as { show?: Dict; hide?: Dict } | undefined;
  if (!d) return true;
  for (const [key, raw] of Object.entries(d.show ?? {})) {
    const values = Array.isArray(raw) ? raw : [raw];
    assertModelled(key, values);
    if (!values.includes(paramValue(key, params, nested))) return false;
  }
  for (const [key, raw] of Object.entries(d.hide ?? {})) {
    const values = Array.isArray(raw) ? raw : [raw];
    assertModelled(key, values);
    if (values.includes(paramValue(key, params, nested))) return false;
  }
  return true;
}

/** Child identity: everything except its gate (the merge rewrites gates). */
function childId(c: Dict): string {
  const { displayOptions: _gate, ...rest } = c;
  return JSON.stringify(rest);
}

function children(p: INodeProperties): Dict[] {
  if (p.type === 'collection') return (p.options ?? []) as unknown as Dict[];
  // fixedCollection: each option's values, keyed by option name
  return ((p.options ?? []) as unknown as Array<{ name: string; values?: Dict[] }>).flatMap((o) =>
    (o.values ?? []).map((v) => ({ ...v, __option: o.name })),
  );
}

function liveChildren(defs: INodeProperties[], params: Params): Set<string> {
  const out = new Set<string>();
  for (const p of defs) {
    if (!shows(p as never, params, false)) continue;
    for (const c of children(p)) if (shows(c as never, params, true)) out.add(childId(c));
  }
  return out;
}

function pairs(props: INodeProperties[]): Params[] {
  const resource = props.find((p) => p.name === 'resource');
  const out: Params[] = [];
  for (const r of (resource?.options ?? []) as Array<{ value: string }>) {
    for (const op of props.filter(
      (p) => p.name === 'operation' && shows(p as never, { resource: r.value, operation: '' }, false),
    )) {
      for (const o of (op.options ?? []) as Array<{ value: string }>) {
        out.push({ resource: r.value, operation: o.value });
      }
    }
  }
  return out;
}

describe('Planka description: merged same-name collections', () => {
  const merged: INodeProperties[] = new Planka().description.properties;
  const original = captured as INodeProperties[];
  const allPairs = pairs(original);
  const groupNames = [
    ...new Set(
      original
        .filter((p) => MERGEABLE.has(p.type))
        .map((p) => p.name)
        .filter((n) => original.filter((p) => p.name === n).length > 1),
    ),
  ];
  const defsOf = (list: INodeProperties[], name: string) => list.filter((p) => p.name === name);

  it('captures the real pre-merge list and enumerates the operation space', () => {
    expect(Array.isArray(original)).toBe(true);
    expect(allPairs.length).toBeGreaterThan(50);
    expect(groupNames).toEqual(expect.arrayContaining(['additionalFields', 'updateFields']));
  });

  it('exercises a split group: additionalFields is emitted as more than one definition', () => {
    // If the merge ever collapses this to one definition the split-group
    // assertions below still hold, but this fixture would stop covering the
    // split case — find another one before relaxing this.
    expect(defsOf(merged, 'additionalFields').length).toBeGreaterThan(1);
    expect(defsOf(merged, 'additionalFields').length).toBeLessThan(
      defsOf(original, 'additionalFields').length,
    );
  });

  it('literal resource: each pair sees exactly its pre-merge live children, from at most one definition', () => {
    for (const name of groupNames) {
      for (const params of allPairs) {
        const shownMerged = defsOf(merged, name).filter((p) => shows(p as never, params, false));
        const shownOriginal = defsOf(original, name).filter((p) => shows(p as never, params, false));
        expect({ name, params, shown: shownMerged.length }).toEqual({
          name,
          params,
          shown: shownOriginal.length === 0 ? 0 : 1,
        });
        expect({ name, params, live: [...liveChildren(defsOf(merged, name), params)].sort() }).toEqual({
          name,
          params,
          live: [...liveChildren(defsOf(original, name), params)].sort(),
        });
      }
    }
  });

  it('expression resource: every definition carries every child of every member', () => {
    for (const name of groupNames) {
      const all = new Set(defsOf(original, name).flatMap((p) => children(p).map(childId)));
      for (const def of defsOf(merged, name)) {
        expect({ name, children: [...new Set(children(def).map(childId))].sort() }).toEqual({
          name,
          children: [...all].sort(),
        });
      }
    }
  });

  it('no merged child is dead: every child of the group is live for some (resource, operation)', () => {
    // Per group, not per definition: a split group's definitions each carry
    // the full child list, so a child is expected to be dead in the
    // definition whose scope excludes its member and live in the other.
    for (const name of groupNames) {
      const everyChild = new Set(defsOf(original, name).flatMap((p) => children(p).map(childId)));
      const liveAnywhere = new Set(allPairs.flatMap((params) => [...liveChildren(defsOf(merged, name), params)]));
      const dead = [...everyChild].filter((c) => !liveAnywhere.has(c)).map((c) => JSON.parse(c).name);
      expect({ name, dead }).toEqual({ name, dead: [] });
    }
  });
});

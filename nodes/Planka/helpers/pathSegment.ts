import { IExecuteFunctions, NodeOperationError } from 'n8n-workflow';

/**
 * Encode one URL path SEGMENT for a Planka route.
 *
 * Ids were interpolated raw, so cardId="../boards/1" addressed a different
 * resource (RFC 3986 remove_dot_segments) and a "/" split the segment.
 * Mirrors the shared resolvePathParam helper: the value is
 * encodeURIComponent-ed, and empty / "." / ".." are refused before any
 * request is sent.
 */
export function pathSegment(ctx: IExecuteFunctions, name: string, raw: unknown): string {
  const value = raw === undefined || raw === null ? '' : String(raw);
  if (value.trim() === '') {
    throw new NodeOperationError(ctx.getNode(), `Path parameter "${name}" is required and must not be empty`);
  }
  if (value === '.' || value === '..') {
    throw new NodeOperationError(ctx.getNode(), `Path parameter "${name}" must not be a dot-segment ("${value}")`);
  }
  return encodeURIComponent(value);
}

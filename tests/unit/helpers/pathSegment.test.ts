import { IExecuteFunctions } from 'n8n-workflow';
import { cardOperations } from '../../../nodes/Planka/operations/card.operations';
import { listOperations } from '../../../nodes/Planka/operations/list.operations';
import * as requestHelper from '../../../nodes/Planka/helpers/request';

// Only the transport is mocked; pathSegment runs for real.
jest.mock('../../../nodes/Planka/helpers/request');

/**
 * Planka ids are single URL segments. They were interpolated raw, so
 * cardId="../boards/1" turned GET /api/cards/:id into GET /api/boards/1.
 */
describe('path params are encoded and dot-segments refused', () => {
  const baseUrl = 'http://planka.test';
  const token = 'tok';
  const ctx = (value: unknown) =>
    ({
      getNodeParameter: jest.fn().mockReturnValue(value),
      getNode: jest.fn().mockReturnValue({ name: 'Planka' }),
    }) as unknown as IExecuteFunctions;

  beforeEach(() => {
    jest.clearAllMocks();
    (requestHelper.makeRequest as jest.Mock).mockResolvedValue({ item: {} });
  });

  it('card.get encodes a traversal attempt into one segment', async () => {
    await cardOperations.execute.call(ctx('../boards/1'), 'get', 0, baseUrl, token);
    expect(requestHelper.makeRequest).toHaveBeenCalledWith(
      'GET',
      `${baseUrl}/api/cards/..%2Fboards%2F1`,
      null,
      token,
    );
  });

  it('list.get keeps an ordinary numeric id byte-identical', async () => {
    await listOperations.execute.call(ctx('1864791069586097541'), 'get', 0, baseUrl, token);
    expect(requestHelper.makeRequest).toHaveBeenCalledWith(
      'GET',
      `${baseUrl}/api/lists/1864791069586097541`,
      null,
      token,
    );
  });

  it.each(['..', '.', '', '  ', undefined])('card.get refuses %p without a request', async (value) => {
    await expect(
      cardOperations.execute.call(ctx(value), 'get', 0, baseUrl, token),
    ).rejects.toThrow(/Path parameter "cardId"/);
    expect(requestHelper.makeRequest).not.toHaveBeenCalled();
  });
});

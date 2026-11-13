import { IExecuteFunctions, NodeOperationError } from 'n8n-workflow';
import { cardOperations } from '../../../nodes/Planka/operations/card.operations';
import * as requestHelper from '../../../nodes/Planka/helpers/request';
import { resetDefaultCardPositionForTests } from '../../../nodes/Planka/helpers/position';

// Fixed wall clock so the default move position is deterministic.
const MOCK_NOW = 1_790_000_000_000;

jest.mock('../../../nodes/Planka/helpers/request');

describe('Card Operations', () => {
  let mockExecuteFunctions: jest.Mocked<IExecuteFunctions>;
  const baseUrl = 'http://planka.example.com:3333';
  const accessToken = 'test-token-123';
  const itemIndex = 0;

  beforeEach(() => {
    mockExecuteFunctions = {
      getNodeParameter: jest.fn(),
      getNode: jest.fn().mockReturnValue({ name: 'Planka', type: 'kanban.planka' }),
      logger: { warn: jest.fn(), info: jest.fn(), error: jest.fn(), debug: jest.fn() },
    } as any;

    jest.clearAllMocks();
    resetDefaultCardPositionForTests();
    jest.spyOn(Date, 'now').mockReturnValue(MOCK_NOW);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('create', () => {
    it('should create card with required fields only', async () => {
      mockExecuteFunctions.getNodeParameter = jest
        .fn()
        .mockReturnValueOnce('list-123')
        .mockReturnValueOnce(0)
        .mockReturnValueOnce('Test Card')
        .mockReturnValueOnce('project')
        .mockReturnValueOnce({});

      const mockResponse = {
        item: { id: 'card-123', name: 'Test Card', type: 'project', listId: 'list-123', position: 0 },
      };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await cardOperations.execute.call(
        mockExecuteFunctions,
        'create',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(result).toEqual(mockResponse);
      expect(requestHelper.makeRequest).toHaveBeenCalledWith(
        'POST',
        `${baseUrl}/api/lists/list-123/cards`,
        { position: 0, name: 'Test Card', type: 'project' },
        accessToken,
      );
    });

    it('should create card with all optional fields', async () => {
      mockExecuteFunctions.getNodeParameter = jest
        .fn()
        .mockReturnValueOnce('list-123')
        .mockReturnValueOnce(0)
        .mockReturnValueOnce('Test Card')
        .mockReturnValueOnce('story')
        .mockReturnValueOnce({
          description: 'Card description',
          dueDate: '2025-12-31',
          isDueCompleted: true,
        });

      const mockResponse = {
        item: {
          id: 'card-123',
          name: 'Test Card',
          description: 'Card description',
          dueDate: '2025-12-31',
          isDueCompleted: true,
        },
      };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await cardOperations.execute.call(
        mockExecuteFunctions,
        'create',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(result).toEqual(mockResponse);
      expect(requestHelper.makeRequest).toHaveBeenCalledWith(
        'POST',
        `${baseUrl}/api/lists/list-123/cards`,
        {
          position: 0,
          name: 'Test Card',
          type: 'story',
          description: 'Card description',
          dueDate: '2025-12-31',
          isDueCompleted: true,
        },
        accessToken,
      );
    });

    it('should create card with stopwatch started', async () => {
      // Mock Date.toISOString for consistent test
      const mockDate = '2025-01-15T10:30:00.000Z';
      jest.spyOn(Date.prototype, 'toISOString').mockReturnValue(mockDate);

      mockExecuteFunctions.getNodeParameter = jest
        .fn()
        .mockReturnValueOnce('list-123')
        .mockReturnValueOnce(0)
        .mockReturnValueOnce('Test Card')
        .mockReturnValueOnce('project')
        .mockReturnValueOnce({
          stopwatchAction: 'start',
        });

      const mockResponse = {
        item: {
          id: 'card-123',
          name: 'Test Card',
          stopwatch: { startedAt: mockDate, total: 0 },
        },
      };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await cardOperations.execute.call(
        mockExecuteFunctions,
        'create',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(result).toEqual(mockResponse);
      expect(requestHelper.makeRequest).toHaveBeenCalledWith(
        'POST',
        `${baseUrl}/api/lists/list-123/cards`,
        {
          position: 0,
          name: 'Test Card',
          type: 'project',
          stopwatch: { startedAt: mockDate, total: 0 },
        },
        accessToken,
      );

      jest.restoreAllMocks();
    });
  });

  describe('get', () => {
    it('should get card by ID', async () => {
      mockExecuteFunctions.getNodeParameter = jest.fn().mockReturnValueOnce('card-123');

      const mockResponse = { item: { id: 'card-123', name: 'Test Card' } };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await cardOperations.execute.call(
        mockExecuteFunctions,
        'get',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(result).toEqual(mockResponse);
      expect(requestHelper.makeRequest).toHaveBeenCalledWith(
        'GET',
        `${baseUrl}/api/cards/card-123`,
        null,
        accessToken,
      );
    });
  });

  describe('update', () => {
    it('should update card with single field', async () => {
      mockExecuteFunctions.getNodeParameter = jest
        .fn()
        .mockReturnValueOnce('card-123')
        .mockReturnValueOnce({ name: 'Updated Card' });

      const mockResponse = { item: { id: 'card-123', name: 'Updated Card' } };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await cardOperations.execute.call(
        mockExecuteFunctions,
        'update',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(result).toEqual(mockResponse);
      expect(requestHelper.makeRequest).toHaveBeenCalledWith(
        'PATCH',
        `${baseUrl}/api/cards/card-123`,
        { name: 'Updated Card' },
        accessToken,
      );
    });

    it('should update card with multiple fields', async () => {
      mockExecuteFunctions.getNodeParameter = jest
        .fn()
        .mockReturnValueOnce('card-123')
        .mockReturnValueOnce({
          name: 'Updated Card',
          description: 'New description',
          position: 5,
          listId: 'list-456',
        });

      const mockResponse = {
        item: {
          id: 'card-123',
          name: 'Updated Card',
          description: 'New description',
          position: 5,
          listId: 'list-456',
        },
      };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await cardOperations.execute.call(
        mockExecuteFunctions,
        'update',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(result).toEqual(mockResponse);
      expect(requestHelper.makeRequest).toHaveBeenCalledWith(
        'PATCH',
        `${baseUrl}/api/cards/card-123`,
        {
          name: 'Updated Card',
          description: 'New description',
          position: 5,
          listId: 'list-456',
        },
        accessToken,
      );
    });

    it('should auto-inject a clash-free default position when listId is set without position', async () => {
      // Planka rejects PATCH /api/cards/:id with {listId} alone — position is required
      // when moving between lists. Wrapper defaults to a monotonic bottom position.
      mockExecuteFunctions.getNodeParameter = jest
        .fn()
        .mockReturnValueOnce('card-123')
        .mockReturnValueOnce({ listId: 'list-456' });

      const mockResponse = { item: { id: 'card-123', listId: 'list-456', position: 1 } };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      await cardOperations.execute.call(
        mockExecuteFunctions,
        'update',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(requestHelper.makeRequest).toHaveBeenCalledWith(
        'PATCH',
        `${baseUrl}/api/cards/card-123`,
        { listId: 'list-456', position: MOCK_NOW },
        accessToken,
      );
    });

    it('should respect explicit position when listId is also set', async () => {
      mockExecuteFunctions.getNodeParameter = jest
        .fn()
        .mockReturnValueOnce('card-123')
        .mockReturnValueOnce({ listId: 'list-456', position: 7 });

      const mockResponse = { item: { id: 'card-123', listId: 'list-456' } };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      await cardOperations.execute.call(
        mockExecuteFunctions,
        'update',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(requestHelper.makeRequest).toHaveBeenCalledWith(
        'PATCH',
        `${baseUrl}/api/cards/card-123`,
        { listId: 'list-456', position: 7 },
        accessToken,
      );
    });

    // THE PROBE MUST BE PROVEN TO FIRE. card.operations.ts warns when additionalFields
    // arrives non-empty on an update; that warn is the ONLY instrument that can tell us
    // whether n8n strips the create-only collection or passes it raw. If the warn were
    // silently broken, its absence from production logs would be misread as "n8n strips
    // it" — the absence would look like the answer. So assert it fires, and assert it
    // stays quiet when there is nothing to report.
    it('warns when additionalFields reaches the update handler (the production probe)', async () => {
      mockExecuteFunctions.getNodeParameter = jest
        .fn()
        .mockReturnValueOnce('card-123')
        .mockReturnValueOnce({})
        .mockReturnValueOnce({ listId: 'list-456' });

      (requestHelper.makeRequest as jest.Mock).mockResolvedValue({
        item: { id: 'card-123', listId: 'list-456' },
      });

      await cardOperations.execute.call(
        mockExecuteFunctions,
        'update',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(mockExecuteFunctions.logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('additionalFields reached the update handler'),
      );
      expect(mockExecuteFunctions.logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('listId'),
      );
    });

    it('does NOT warn when additionalFields is absent on an update', async () => {
      mockExecuteFunctions.getNodeParameter = jest
        .fn()
        .mockReturnValueOnce('card-123')
        .mockReturnValueOnce({ listId: 'list-456' })
        .mockReturnValueOnce({});

      (requestHelper.makeRequest as jest.Mock).mockResolvedValue({
        item: { id: 'card-123', listId: 'list-456' },
      });

      await cardOperations.execute.call(
        mockExecuteFunctions,
        'update',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(mockExecuteFunctions.logger.warn).not.toHaveBeenCalledWith(
        expect.stringContaining('additionalFields reached the update handler'),
      );
    });

    it('should accept additionalFields as fallback for hand-authored JSON workflows', async () => {
      // n8n's UI gates additionalFields to create-only via displayOptions, but
      // workflow JSON authored outside the UI commonly puts update payloads in
      // additionalFields. Wrapper falls back so they work.
      mockExecuteFunctions.getNodeParameter = jest
        .fn()
        .mockReturnValueOnce('card-123')
        .mockReturnValueOnce({}) // updateFields empty
        .mockReturnValueOnce({ name: 'Renamed via additionalFields', listId: 'list-456' });

      const mockResponse = { item: { id: 'card-123', listId: 'list-456' } };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      await cardOperations.execute.call(
        mockExecuteFunctions,
        'update',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(requestHelper.makeRequest).toHaveBeenCalledWith(
        'PATCH',
        `${baseUrl}/api/cards/card-123`,
        { name: 'Renamed via additionalFields', listId: 'list-456', position: MOCK_NOW },
        accessToken,
      );
    });

    it('resolves expression strings inside additionalFields (n8n leaves them raw for create-only declared collection on update op)', async () => {
      // Regression test for the bug where workflow JSON like
      //   parameters.additionalFields.listId = "={{ $json.doing_list_id }}"
      // produced a PATCH body with the literal expression string instead of
      // the resolved listId. n8n's expression resolver only descends into
      // collection sub-keys when the collection is declared in the descriptor
      // for the current operation; additionalFields is declared for create
      // only, so on update getNodeParameter returns the raw object with
      // unresolved =`{{...}}` strings. updateCard now manually evaluates
      // any leading-`=` strings via this.evaluateExpression().
      mockExecuteFunctions.getNodeParameter = jest
        .fn()
        .mockReturnValueOnce('card-123')
        .mockReturnValueOnce({}) // updateFields empty
        .mockReturnValueOnce({
          listId: '={{ $json.doing_list_id }}',
          name: 'plain string stays untouched',
        });
      mockExecuteFunctions.evaluateExpression = jest.fn((expr: string) => {
        if (expr === '={{ $json.doing_list_id }}') return 'list-resolved-uuid';
        return expr;
      });

      const mockResponse = { item: { id: 'card-123', listId: 'list-resolved-uuid' } };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      await cardOperations.execute.call(
        mockExecuteFunctions,
        'update',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(mockExecuteFunctions.evaluateExpression).toHaveBeenCalledWith(
        '={{ $json.doing_list_id }}',
        itemIndex,
      );
      expect(requestHelper.makeRequest).toHaveBeenCalledWith(
        'PATCH',
        `${baseUrl}/api/cards/card-123`,
        {
          listId: 'list-resolved-uuid',
          name: 'plain string stays untouched',
          position: MOCK_NOW,
        },
        accessToken,
      );
    });

    it('updateFields wins when both updateFields and additionalFields set the same key', async () => {
      mockExecuteFunctions.getNodeParameter = jest
        .fn()
        .mockReturnValueOnce('card-123')
        .mockReturnValueOnce({ name: 'from updateFields' })
        .mockReturnValueOnce({ name: 'from additionalFields' });

      const mockResponse = { item: { id: 'card-123' } };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      await cardOperations.execute.call(
        mockExecuteFunctions,
        'update',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(requestHelper.makeRequest).toHaveBeenCalledWith(
        'PATCH',
        `${baseUrl}/api/cards/card-123`,
        { name: 'from updateFields' },
        accessToken,
      );
    });

    describe('customFields persistence', () => {
      const boardResponse = {
        item: { id: 'board-1' },
        included: {
          customFieldGroups: [
            { id: 'group-A', baseCustomFieldGroupId: 'base-A' },
          ],
          customFields: [
            { id: 'field-status', name: 'Status', customFieldGroupId: 'group-A', baseCustomFieldGroupId: null },
            { id: 'field-priority', name: 'Priority', customFieldGroupId: null, baseCustomFieldGroupId: 'base-A' },
          ],
        },
      };

      const cardPatchResponse = { item: { id: 'card-123', boardId: 'board-1' } };
      const valuePatchResponse = { item: { content: 'whatever' } };

      it('parses customFields from a JSON string and PATCHes each entry', async () => {
        mockExecuteFunctions.getNodeParameter = jest
          .fn()
          .mockReturnValueOnce('card-123')
          .mockReturnValueOnce({}) // updateFields
          .mockReturnValueOnce({
            customFields: JSON.stringify({ Status: 'In Progress', Priority: 'High' }),
          });

        (requestHelper.makeRequest as jest.Mock)
          .mockResolvedValueOnce(cardPatchResponse) // PATCH card
          .mockResolvedValueOnce(boardResponse) // GET board
          .mockResolvedValueOnce(valuePatchResponse) // PATCH value 1
          .mockResolvedValueOnce(valuePatchResponse); // PATCH value 2

        const result = await cardOperations.execute.call(
          mockExecuteFunctions,
          'update',
          itemIndex,
          baseUrl,
          accessToken,
        );

        // Returns the card PATCH response, not the customField PATCHes
        expect(result).toEqual(cardPatchResponse);

        const calls = (requestHelper.makeRequest as jest.Mock).mock.calls;
        expect(calls[0]).toEqual([
          'PATCH',
          `${baseUrl}/api/cards/card-123`,
          {},
          accessToken,
        ]);
        expect(calls[1]).toEqual([
          'GET',
          `${baseUrl}/api/boards/board-1?subscribe=false`,
          null,
          accessToken,
        ]);
        expect(calls[2]).toEqual([
          'PATCH',
          `${baseUrl}/api/cards/card-123/custom-field-values/customFieldGroupId:group-A:customFieldId:field-status`,
          { content: 'In Progress' },
          accessToken,
        ]);
        expect(calls[3]).toEqual([
          'PATCH',
          `${baseUrl}/api/cards/card-123/custom-field-values/customFieldGroupId:group-A:customFieldId:field-priority`,
          { content: 'High' },
          accessToken,
        ]);
      });

      it('accepts an already-parsed customFields object', async () => {
        mockExecuteFunctions.getNodeParameter = jest
          .fn()
          .mockReturnValueOnce('card-123')
          .mockReturnValueOnce({
            customFields: { Status: 'Done' },
          })
          .mockReturnValueOnce({});

        (requestHelper.makeRequest as jest.Mock)
          .mockResolvedValueOnce(cardPatchResponse)
          .mockResolvedValueOnce(boardResponse)
          .mockResolvedValueOnce(valuePatchResponse);

        const result = await cardOperations.execute.call(
          mockExecuteFunctions,
          'update',
          itemIndex,
          baseUrl,
          accessToken,
        );

        expect(result).toEqual(cardPatchResponse);
        const calls = (requestHelper.makeRequest as jest.Mock).mock.calls;
        expect(calls).toHaveLength(3);
        expect(calls[2]).toEqual([
          'PATCH',
          `${baseUrl}/api/cards/card-123/custom-field-values/customFieldGroupId:group-A:customFieldId:field-status`,
          { content: 'Done' },
          accessToken,
        ]);
      });

      it('reports a board-schema miss without throwing, and still writes the fields that do resolve', async () => {
        mockExecuteFunctions.getNodeParameter = jest
          .fn()
          .mockReturnValueOnce('card-123')
          .mockReturnValueOnce({})
          .mockReturnValueOnce({
            customFields: { Status: 'Done', Nonexistent: 'whatever' },
          });

        (requestHelper.makeRequest as jest.Mock)
          .mockResolvedValueOnce(cardPatchResponse)
          .mockResolvedValueOnce(boardResponse)
          .mockResolvedValueOnce(valuePatchResponse);

        const result = await cardOperations.execute.call(
          mockExecuteFunctions,
          'update',
          itemIndex,
          baseUrl,
          accessToken,
        );

        // A board that legitimately lacks the field must keep working: no throw,
        // the resolvable field is still written, and the loss is REPORTED.
        expect(result).toEqual({
          ...cardPatchResponse,
          customFieldsNotPersisted: [{ name: 'Nonexistent', reason: 'not-on-board' }],
        });
        // 1 card PATCH + 1 board GET + 1 value PATCH (the resolvable one) — Nonexistent is skipped
        expect((requestHelper.makeRequest as jest.Mock).mock.calls).toHaveLength(3);
        expect((mockExecuteFunctions.logger as any).warn).toHaveBeenCalledWith(
          expect.stringContaining('customField "Nonexistent" not found on board board-1'),
        );
        expect((mockExecuteFunctions.logger as any).error).toHaveBeenCalledWith(
          expect.stringContaining('customFields NOT persisted on card card-123'),
        );
      });

      // ------------------------------------------------------------------
      // Fail-open regression guards. The card PATCH is already COMMITTED by
      // the time customFields are written, so a silent skip parks a card in
      // BLOCKED with no block_reason and still reports success. Every case
      // below returned a clean success response before 2026-09-11.
      // ------------------------------------------------------------------
      const movedResponse = {
        item: { id: 'card-123', boardId: 'board-1', listId: 'list-blocked' },
      };

      const setupMove = (customFields: unknown) => {
        mockExecuteFunctions.getNodeParameter = jest
          .fn()
          .mockReturnValueOnce('card-123')
          .mockReturnValueOnce({})
          .mockReturnValueOnce({ listId: 'list-blocked', position: 0, customFields });
      };

      // Run the update and capture the rejection WITHOUT asserting on it yet, so
      // the caller can check the request count FIRST. Order matters: the
      // ordering property ("no request may have been issued") must be the
      // assertion that fails when the validation is moved back below the PATCH,
      // not a message mismatch that happens to fire earlier.
      const runUpdateCapturingError = async (): Promise<unknown> =>
        cardOperations.execute
          .call(mockExecuteFunctions, 'update', itemIndex, baseUrl, accessToken)
          .then(
            (ok: unknown) => {
              throw new Error(
                `expected card.update to reject, but it resolved with ${JSON.stringify(ok)}`,
              );
            },
            (err: unknown) => err,
          );

      // ⭐ ORDERING GUARD. A malformed payload is decidable from the node's
      // parameters alone, so it must be rejected BEFORE the card PATCH. If it
      // were rejected after, the card would already be in BLOCKED with the
      // listId echo verified, and the downstream `Assert Moved BLOCKED` node
      // (no onError / no continueOnFail ⇒ n8n default stopWorkflow) would
      // abort the run with the factually FALSE headline "card move failed".
      // `toHaveLength(0)` is what makes that regression impossible to land.
      it('rejects an unparseable customFields payload WITHOUT issuing the card PATCH', async () => {
        setupMove('{"block_reason": "gate failed"');
        // Deliberately NO stubbed response: no request may be reached at all,
        // and a stubbed-but-unconsumed mockResolvedValueOnce would leak into
        // the next test.
        const err = await runUpdateCapturingError();

        // ⭐ THE ordering property. Nothing was committed: not the card PATCH,
        // not the board GET, not a value PATCH. Because no PATCH was issued the
        // card never moved, so the downstream Assert's "card move failed"
        // headline is TRUE and no half-committed card is stranded.
        expect((requestHelper.makeRequest as jest.Mock).mock.calls).toHaveLength(0);

        expect(err).toBeInstanceOf(Error);
        expect((err as Error).message).toMatch(/could not be read as a name/);
      });

      it('rejects a non-object customFields payload pre-commit, and says nothing was committed', async () => {
        setupMove('"gate failed"');
        // Deliberately NO stubbed response: no request may be reached at all,
        // and a stubbed-but-unconsumed mockResolvedValueOnce would leak into
        // the next test.
        const err = await runUpdateCapturingError();

        // ⭐ THE ordering property. Nothing was committed: not the card PATCH,
        // not the board GET, not a value PATCH. Because no PATCH was issued the
        // card never moved, so the downstream Assert's "card move failed"
        // headline is TRUE and no half-committed card is stranded.
        expect((requestHelper.makeRequest as jest.Mock).mock.calls).toHaveLength(0);

        expect(err).toBeInstanceOf(Error);
        expect((err as Error).message).toMatch(/NOTHING has been committed[\s\S]*NOT moved to list list-blocked/);
      });

      it('rejects a zero-field customFields payload WITHOUT issuing the card PATCH', async () => {
        setupMove('{}');
        // Deliberately NO stubbed response: no request may be reached at all,
        // and a stubbed-but-unconsumed mockResolvedValueOnce would leak into
        // the next test.
        const err = await runUpdateCapturingError();

        // ⭐ THE ordering property. Nothing was committed: not the card PATCH,
        // not the board GET, not a value PATCH. Because no PATCH was issued the
        // card never moved, so the downstream Assert's "card move failed"
        // headline is TRUE and no half-committed card is stranded.
        expect((requestHelper.makeRequest as jest.Mock).mock.calls).toHaveLength(0);

        expect(err).toBeInstanceOf(Error);
        expect((err as Error).message).toMatch(/parsed to zero fields/);
      });

      it('throws when the card PATCH echo carries no boardId to address the fields', async () => {
        setupMove(JSON.stringify({ block_reason: 'gate failed' }));
        (requestHelper.makeRequest as jest.Mock).mockResolvedValueOnce({
          item: { id: 'card-123', listId: 'list-blocked' },
        });

        await expect(
          cardOperations.execute.call(
            mockExecuteFunctions,
            'update',
            itemIndex,
            baseUrl,
            accessToken,
          ),
        ).rejects.toThrow(/carried no item\.boardId/);
        // Intrinsically post-commit: item.boardId is read off the PATCH
        // RESPONSE, so this one CANNOT be decided before the move. Exactly 1
        // request — the card PATCH itself — and the message therefore does
        // say the move was committed.
        expect((requestHelper.makeRequest as jest.Mock).mock.calls).toHaveLength(1);
        expect((requestHelper.makeRequest as jest.Mock).mock.calls[0][0]).toBe('PATCH');
      });

      it('distinguishes a field whose group cannot be addressed from one absent from the board', async () => {
        setupMove(JSON.stringify({ block_reason: 'gate failed' }));
        (requestHelper.makeRequest as jest.Mock)
          .mockResolvedValueOnce(movedResponse)
          .mockResolvedValueOnce({
            item: { id: 'board-1' },
            included: {
              customFieldGroups: [],
              customFields: [
                {
                  id: 'field-orphan',
                  name: 'block_reason',
                  customFieldGroupId: null,
                  baseCustomFieldGroupId: 'base-missing',
                },
              ],
            },
          });

        const result = await cardOperations.execute.call(
          mockExecuteFunctions,
          'update',
          itemIndex,
          baseUrl,
          accessToken,
        );

        expect(result).toEqual({
          ...movedResponse,
          customFieldsNotPersisted: [
            { name: 'block_reason', reason: 'no-addressable-group' },
          ],
        });
        // card PATCH + board GET only — nothing was addressable.
        expect((requestHelper.makeRequest as jest.Mock).mock.calls).toHaveLength(2);
      });

      it('does not annotate the response when every requested field persists', async () => {
        setupMove(JSON.stringify({ Status: 'Done' }));
        (requestHelper.makeRequest as jest.Mock)
          .mockResolvedValueOnce(movedResponse)
          .mockResolvedValueOnce(boardResponse)
          .mockResolvedValueOnce(valuePatchResponse);

        const result = await cardOperations.execute.call(
          mockExecuteFunctions,
          'update',
          itemIndex,
          baseUrl,
          accessToken,
        );

        expect(result).not.toHaveProperty('customFieldsNotPersisted');
        expect((mockExecuteFunctions.logger as any).error).not.toHaveBeenCalled();
      });

      it('treats an empty-string customFields as no fields requested', async () => {
        // doing-orchestrate.json and delivery-sweep.json both send '' to mean
        // "no custom fields this time" — that must stay a silent success.
        setupMove('');
        (requestHelper.makeRequest as jest.Mock).mockResolvedValueOnce(movedResponse);

        const result = await cardOperations.execute.call(
          mockExecuteFunctions,
          'update',
          itemIndex,
          baseUrl,
          accessToken,
        );

        expect(result).toEqual(movedResponse);
        expect((requestHelper.makeRequest as jest.Mock).mock.calls).toHaveLength(1);
      });
    });

    it('should handle position 0 and empty description', async () => {
      mockExecuteFunctions.getNodeParameter = jest
        .fn()
        .mockReturnValueOnce('card-123')
        .mockReturnValueOnce({
          position: 0,
          description: '',
        });

      const mockResponse = { item: { id: 'card-123', position: 0, description: '' } };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await cardOperations.execute.call(
        mockExecuteFunctions,
        'update',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(result).toEqual(mockResponse);
      expect(requestHelper.makeRequest).toHaveBeenCalledWith(
        'PATCH',
        `${baseUrl}/api/cards/card-123`,
        { position: 0, description: '' },
        accessToken,
      );
    });
  });

  describe('listId echo guard (regression-prevention)', () => {
    // Planka returns 200 + the original card item when a PATCH listId is
    // silently no-op'd (wrong board, schema-rejected value, NetworkPolicy
    // stripping the field). Pre-2026-05-08 PR #4 the module reported success
    // while the actual move never happened — 425+ runs of Plan 7 READY phase
    // ran "end-to-end successfully" while the card never moved. PR #4 fixed
    // the expression-not-resolved class; this guard closes the
    // response-validation class.

    it('throws when PATCH response listId differs from request', async () => {
      mockExecuteFunctions.getNodeParameter = jest
        .fn()
        .mockReturnValueOnce('card-123')
        .mockReturnValueOnce({ listId: 'list-target' })
        .mockReturnValueOnce({});

      const mockResponse = {
        item: { id: 'card-123', listId: 'list-original-NOT-target' },
      };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      await expect(
        cardOperations.execute.call(
          mockExecuteFunctions,
          'update',
          itemIndex,
          baseUrl,
          accessToken,
        ),
      ).rejects.toThrow(/listId mismatch.*list-target.*list-original-NOT-target/);
    });

    it('passes when PATCH response listId matches request (happy path)', async () => {
      mockExecuteFunctions.getNodeParameter = jest
        .fn()
        .mockReturnValueOnce('card-123')
        .mockReturnValueOnce({ listId: 'list-target' })
        .mockReturnValueOnce({});

      const mockResponse = { item: { id: 'card-123', listId: 'list-target' } };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await cardOperations.execute.call(
        mockExecuteFunctions,
        'update',
        itemIndex,
        baseUrl,
        accessToken,
      );
      expect(result).toEqual(mockResponse);
    });

    it('does not check listId echo when listId was not requested (name-only update)', async () => {
      // Guard only fires when caller asked to set listId; pure-rename updates
      // never include listId in the request body and shouldn't trip the guard.
      mockExecuteFunctions.getNodeParameter = jest
        .fn()
        .mockReturnValueOnce('card-123')
        .mockReturnValueOnce({ name: 'Renamed' })
        .mockReturnValueOnce({});

      const mockResponse = {
        item: { id: 'card-123', name: 'Renamed', listId: 'list-current' },
      };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await cardOperations.execute.call(
        mockExecuteFunctions,
        'update',
        itemIndex,
        baseUrl,
        accessToken,
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('delete', () => {
    it('should delete card by ID', async () => {
      mockExecuteFunctions.getNodeParameter = jest.fn().mockReturnValueOnce('card-123');

      const mockResponse = { item: { id: 'card-123' } };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await cardOperations.execute.call(
        mockExecuteFunctions,
        'delete',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(result).toEqual(mockResponse);
      expect(requestHelper.makeRequest).toHaveBeenCalledWith(
        'DELETE',
        `${baseUrl}/api/cards/card-123`,
        null,
        accessToken,
      );
    });
  });

  describe('duplicate', () => {
    it('should duplicate card with no options', async () => {
      mockExecuteFunctions.getNodeParameter = jest
        .fn()
        .mockReturnValueOnce('card-123')
        .mockReturnValueOnce({});

      const mockResponse = { item: { id: 'card-456', name: 'Test Card (copy)' } };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await cardOperations.execute.call(
        mockExecuteFunctions,
        'duplicate',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(result).toEqual(mockResponse);
      expect(requestHelper.makeRequest).toHaveBeenCalledWith(
        'POST',
        `${baseUrl}/api/cards/card-123/duplicate`,
        {},
        accessToken,
      );
    });

    it('should duplicate card with name and position options', async () => {
      mockExecuteFunctions.getNodeParameter = jest
        .fn()
        .mockReturnValueOnce('card-123')
        .mockReturnValueOnce({ name: 'Copy of Card', position: 1 });

      const mockResponse = { item: { id: 'card-456', name: 'Copy of Card', position: 1 } };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await cardOperations.execute.call(
        mockExecuteFunctions,
        'duplicate',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(result).toEqual(mockResponse);
      expect(requestHelper.makeRequest).toHaveBeenCalledWith(
        'POST',
        `${baseUrl}/api/cards/card-123/duplicate`,
        { name: 'Copy of Card', position: 1 },
        accessToken,
      );
    });

    it('should duplicate card with boardId and listId options', async () => {
      mockExecuteFunctions.getNodeParameter = jest
        .fn()
        .mockReturnValueOnce('card-123')
        .mockReturnValueOnce({ boardId: 'board-456', listId: 'list-789' });

      const mockResponse = { item: { id: 'card-456', boardId: 'board-456', listId: 'list-789' } };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await cardOperations.execute.call(
        mockExecuteFunctions,
        'duplicate',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(result).toEqual(mockResponse);
      expect(requestHelper.makeRequest).toHaveBeenCalledWith(
        'POST',
        `${baseUrl}/api/cards/card-123/duplicate`,
        { boardId: 'board-456', listId: 'list-789' },
        accessToken,
      );
    });
  });

  describe('readNotifications', () => {
    it('should mark card notifications as read', async () => {
      mockExecuteFunctions.getNodeParameter = jest.fn().mockReturnValueOnce('card-123');

      const mockResponse = { item: { id: 'card-123', notificationsRead: true } };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await cardOperations.execute.call(
        mockExecuteFunctions,
        'readNotifications',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(result).toEqual(mockResponse);
      expect(requestHelper.makeRequest).toHaveBeenCalledWith(
        'POST',
        `${baseUrl}/api/cards/card-123/read-notifications`,
        null,
        accessToken,
      );
    });
  });

  describe('listInList', () => {
    it('should list cards in a list without filters', async () => {
      mockExecuteFunctions.getNodeParameter = jest
        .fn()
        .mockReturnValueOnce('list-123')
        .mockReturnValueOnce({});

      const mockResponse = { items: [{ id: 'card-1' }, { id: 'card-2' }] };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await cardOperations.execute.call(
        mockExecuteFunctions,
        'listInList',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(result).toEqual(mockResponse);
      expect(requestHelper.makeRequest).toHaveBeenCalledWith(
        'GET',
        `${baseUrl}/api/lists/list-123/cards`,
        null,
        accessToken,
      );
    });

    it('should list cards with beforeListChangedAt filter', async () => {
      mockExecuteFunctions.getNodeParameter = jest
        .fn()
        .mockReturnValueOnce('list-123')
        .mockReturnValueOnce({ beforeListChangedAt: '2023-01-01T00:00:00.000Z' });

      const mockResponse = { items: [{ id: 'card-1' }] };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await cardOperations.execute.call(
        mockExecuteFunctions,
        'listInList',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(result).toEqual(mockResponse);
      expect(requestHelper.makeRequest).toHaveBeenCalledWith(
        'GET',
        `${baseUrl}/api/lists/list-123/cards?before[listChangedAt]=2023-01-01T00%3A00%3A00.000Z`,
        null,
        accessToken,
      );
    });

    it('should list cards with beforeId filter', async () => {
      mockExecuteFunctions.getNodeParameter = jest
        .fn()
        .mockReturnValueOnce('list-123')
        .mockReturnValueOnce({ beforeId: 'card-99' });

      const mockResponse = { items: [{ id: 'card-1' }] };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await cardOperations.execute.call(
        mockExecuteFunctions,
        'listInList',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(result).toEqual(mockResponse);
      expect(requestHelper.makeRequest).toHaveBeenCalledWith(
        'GET',
        `${baseUrl}/api/lists/list-123/cards?before[id]=card-99`,
        null,
        accessToken,
      );
    });

    it('should list cards with search filter', async () => {
      mockExecuteFunctions.getNodeParameter = jest
        .fn()
        .mockReturnValueOnce('list-123')
        .mockReturnValueOnce({ search: 'test query' });

      const mockResponse = { items: [{ id: 'card-1' }] };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await cardOperations.execute.call(
        mockExecuteFunctions,
        'listInList',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(result).toEqual(mockResponse);
      expect(requestHelper.makeRequest).toHaveBeenCalledWith(
        'GET',
        `${baseUrl}/api/lists/list-123/cards?search=test%20query`,
        null,
        accessToken,
      );
    });

    it('should list cards with user and label filters', async () => {
      mockExecuteFunctions.getNodeParameter = jest
        .fn()
        .mockReturnValueOnce('list-123')
        .mockReturnValueOnce({
          userIds: 'user-1,user-2',
          labelIds: 'label-1,label-2'
        });

      const mockResponse = { items: [{ id: 'card-1' }] };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await cardOperations.execute.call(
        mockExecuteFunctions,
        'listInList',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(result).toEqual(mockResponse);
      expect(requestHelper.makeRequest).toHaveBeenCalledWith(
        'GET',
        `${baseUrl}/api/lists/list-123/cards?userIds=user-1%2Cuser-2&labelIds=label-1%2Clabel-2`,
        null,
        accessToken,
      );
    });

    it('should list cards with all filters combined', async () => {
      mockExecuteFunctions.getNodeParameter = jest
        .fn()
        .mockReturnValueOnce('list-123')
        .mockReturnValueOnce({
          beforeListChangedAt: '2023-01-01T00:00:00.000Z',
          beforeId: 'card-50',
          search: 'test',
          userIds: 'user-1',
          labelIds: 'label-1'
        });

      const mockResponse = { items: [] };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await cardOperations.execute.call(
        mockExecuteFunctions,
        'listInList',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(result).toEqual(mockResponse);
      expect(requestHelper.makeRequest).toHaveBeenCalledWith(
        'GET',
        `${baseUrl}/api/lists/list-123/cards?before[listChangedAt]=2023-01-01T00%3A00%3A00.000Z&before[id]=card-50&search=test&userIds=user-1&labelIds=label-1`,
        null,
        accessToken,
      );
    });
  });

  describe('unknown operation', () => {
    it('should throw error for unknown operation', async () => {
      await expect(
        cardOperations.execute.call(
          mockExecuteFunctions,
          'invalidOperation',
          itemIndex,
          baseUrl,
          accessToken,
        ),
      ).rejects.toThrow(NodeOperationError);
    });
  });
});

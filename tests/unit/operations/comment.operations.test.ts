import { IExecuteFunctions, NodeOperationError } from 'n8n-workflow';
import { commentOperations } from '../../../nodes/Planka/operations/comment.operations';
import * as requestHelper from '../../../nodes/Planka/helpers/request';

jest.mock('../../../nodes/Planka/helpers/request');

describe('Comment Operations', () => {
  let mockExecuteFunctions: jest.Mocked<IExecuteFunctions>;
  const baseUrl = 'http://planka.example.com:3333';
  const accessToken = 'test-token-123';
  const itemIndex = 0;

  beforeEach(() => {
    mockExecuteFunctions = {
      getNodeParameter: jest.fn(),
      getNode: jest.fn().mockReturnValue({ name: 'Planka', type: 'kanban.planka' }),
    } as any;
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create comment', async () => {
      mockExecuteFunctions.getNodeParameter = jest
        .fn()
        .mockReturnValueOnce('card-123')
        .mockReturnValueOnce('This is a comment');

      const mockResponse = { item: { id: 'comment-123', text: 'This is a comment', cardId: 'card-123' } };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await commentOperations.execute.call(
        mockExecuteFunctions,
        'create',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(result).toEqual(mockResponse);
      expect(requestHelper.makeRequest).toHaveBeenCalledWith(
        'POST',
        `${baseUrl}/api/cards/card-123/comments`,
        { text: 'This is a comment' },
        accessToken,
      );
    });
  });

  describe('update', () => {
    it('should update comment text', async () => {
      mockExecuteFunctions.getNodeParameter = jest
        .fn()
        .mockReturnValueOnce('comment-123')
        .mockReturnValueOnce('Updated comment text');

      const mockResponse = { item: { id: 'comment-123', text: 'Updated comment text' } };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await commentOperations.execute.call(
        mockExecuteFunctions,
        'update',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(result).toEqual(mockResponse);
      expect(requestHelper.makeRequest).toHaveBeenCalledWith(
        'PATCH',
        `${baseUrl}/api/comments/comment-123`,
        { text: 'Updated comment text' },
        accessToken,
      );
    });
  });

  describe('delete', () => {
    it('should delete comment by ID', async () => {
      mockExecuteFunctions.getNodeParameter = jest.fn().mockReturnValueOnce('comment-123');

      const mockResponse = { item: { id: 'comment-123' } };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await commentOperations.execute.call(
        mockExecuteFunctions,
        'delete',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(result).toEqual(mockResponse);
      expect(requestHelper.makeRequest).toHaveBeenCalledWith(
        'DELETE',
        `${baseUrl}/api/comments/comment-123`,
        null,
        accessToken,
      );
    });
  });

  describe('list', () => {
    it('should list comments for a card', async () => {
      mockExecuteFunctions.getNodeParameter = jest
        .fn()
        .mockReturnValueOnce('card-123')
        .mockReturnValueOnce({});

      const mockResponse = { items: [{ id: 'comment-1' }, { id: 'comment-2' }] };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await commentOperations.execute.call(
        mockExecuteFunctions,
        'list',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(result).toEqual(mockResponse);
      expect(requestHelper.makeRequest).toHaveBeenCalledWith(
        'GET',
        `${baseUrl}/api/cards/card-123/comments`,
        null,
        accessToken,
      );
    });

    it('should list comments with beforeId filter', async () => {
      mockExecuteFunctions.getNodeParameter = jest
        .fn()
        .mockReturnValueOnce('card-123')
        .mockReturnValueOnce({ beforeId: 'comment-999' });

      const mockResponse = { items: [{ id: 'comment-1' }] };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await commentOperations.execute.call(
        mockExecuteFunctions,
        'list',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(result).toEqual(mockResponse);
      expect(requestHelper.makeRequest).toHaveBeenCalledWith(
        'GET',
        `${baseUrl}/api/cards/card-123/comments?beforeId=comment-999`,
        null,
        accessToken,
      );
    });
  });

  describe('unknown operation', () => {
    it('should throw error for unknown operation', async () => {
      await expect(
        commentOperations.execute.call(
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

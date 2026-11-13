import { IExecuteFunctions, NodeOperationError } from 'n8n-workflow';
import { labelOperations } from '../../../nodes/Planka/operations/label.operations';
import * as requestHelper from '../../../nodes/Planka/helpers/request';

jest.mock('../../../nodes/Planka/helpers/request');

describe('Label Operations', () => {
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
    it('should create label', async () => {
      mockExecuteFunctions.getNodeParameter = jest
        .fn()
        .mockReturnValueOnce('board-123')
        .mockReturnValueOnce(0)
        .mockReturnValueOnce('Bug')
        .mockReturnValueOnce('#ff0000');

      const mockResponse = { item: { id: 'label-123', name: 'Bug', color: '#ff0000' } };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await labelOperations.execute.call(
        mockExecuteFunctions,
        'create',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(result).toEqual(mockResponse);
      expect(requestHelper.makeRequest).toHaveBeenCalledWith(
        'POST',
        `${baseUrl}/api/boards/board-123/labels`,
        { position: 0, name: 'Bug', color: '#ff0000' },
        accessToken,
      );
    });
  });

  describe('update', () => {
    it('should update label', async () => {
      mockExecuteFunctions.getNodeParameter = jest
        .fn()
        .mockReturnValueOnce('label-123')
        .mockReturnValueOnce({ name: 'Critical Bug', color: '#cc0000' });

      const mockResponse = { item: { id: 'label-123', name: 'Critical Bug', color: '#cc0000' } };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await labelOperations.execute.call(
        mockExecuteFunctions,
        'update',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(result).toEqual(mockResponse);
      expect(requestHelper.makeRequest).toHaveBeenCalledWith(
        'PATCH',
        `${baseUrl}/api/labels/label-123`,
        { name: 'Critical Bug', color: '#cc0000' },
        accessToken,
      );
    });
  });

  describe('delete', () => {
    it('should delete label by ID', async () => {
      mockExecuteFunctions.getNodeParameter = jest.fn().mockReturnValueOnce('label-123');

      const mockResponse = { item: { id: 'label-123' } };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await labelOperations.execute.call(
        mockExecuteFunctions,
        'delete',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(result).toEqual(mockResponse);
      expect(requestHelper.makeRequest).toHaveBeenCalledWith(
        'DELETE',
        `${baseUrl}/api/labels/label-123`,
        null,
        accessToken,
      );
    });
  });

  describe('addToCard', () => {
    it('should add label to card', async () => {
      mockExecuteFunctions.getNodeParameter = jest
        .fn()
        .mockReturnValueOnce('card-123')
        .mockReturnValueOnce('label-123');

      const mockResponse = { item: { id: 'card-label-123', cardId: 'card-123', labelId: 'label-123' } };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await labelOperations.execute.call(
        mockExecuteFunctions,
        'addToCard',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(result).toEqual(mockResponse);
      expect(requestHelper.makeRequest).toHaveBeenCalledWith(
        'POST',
        `${baseUrl}/api/cards/card-123/card-labels`,
        { labelId: 'label-123' },
        accessToken,
      );
    });
  });

  describe('removeFromCard', () => {
    it('should remove label from card', async () => {
      mockExecuteFunctions.getNodeParameter = jest
        .fn()
        .mockReturnValueOnce('card-123')
        .mockReturnValueOnce('label-456');

      const mockResponse = { item: { id: 'card-label-123' } };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await labelOperations.execute.call(
        mockExecuteFunctions,
        'removeFromCard',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(result).toEqual(mockResponse);
      expect(requestHelper.makeRequest).toHaveBeenCalledWith(
        'DELETE',
        `${baseUrl}/api/cards/card-123/card-labels/labelId:label-456`,
        null,
        accessToken,
      );
    });
  });

  describe('unknown operation', () => {
    it('should throw error for unknown operation', async () => {
      await expect(
        labelOperations.execute.call(
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

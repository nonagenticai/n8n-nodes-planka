import { IExecuteFunctions, NodeOperationError } from 'n8n-workflow';
import { listOperations } from '../../../nodes/Planka/operations/list.operations';
import * as requestHelper from '../../../nodes/Planka/helpers/request';

jest.mock('../../../nodes/Planka/helpers/request');

describe('List Operations', () => {
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
    it('should create list with required fields', async () => {
      mockExecuteFunctions.getNodeParameter = jest
        .fn()
        .mockReturnValueOnce('board-123')
        .mockReturnValueOnce('active')
        .mockReturnValueOnce(0)
        .mockReturnValueOnce('To Do');

      const mockResponse = { item: { id: 'list-123', name: 'To Do', type: 'active', position: 0 } };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await listOperations.execute.call(
        mockExecuteFunctions,
        'create',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(result).toEqual(mockResponse);
      expect(requestHelper.makeRequest).toHaveBeenCalledWith(
        'POST',
        `${baseUrl}/api/boards/board-123/lists`,
        { type: 'active', position: 0, name: 'To Do' },
        accessToken,
      );
    });
  });

  describe('get', () => {
    it('should get list by ID', async () => {
      mockExecuteFunctions.getNodeParameter = jest.fn().mockReturnValueOnce('list-123');

      const mockResponse = { item: { id: 'list-123', name: 'To Do' } };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await listOperations.execute.call(
        mockExecuteFunctions,
        'get',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(result).toEqual(mockResponse);
      expect(requestHelper.makeRequest).toHaveBeenCalledWith(
        'GET',
        `${baseUrl}/api/lists/list-123`,
        null,
        accessToken,
      );
    });
  });

  describe('update', () => {
    it('should update list fields', async () => {
      mockExecuteFunctions.getNodeParameter = jest
        .fn()
        .mockReturnValueOnce('list-123')
        .mockReturnValueOnce({ name: 'In Progress' });

      const mockResponse = { item: { id: 'list-123', name: 'In Progress' } };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await listOperations.execute.call(
        mockExecuteFunctions,
        'update',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(result).toEqual(mockResponse);
      expect(requestHelper.makeRequest).toHaveBeenCalledWith(
        'PATCH',
        `${baseUrl}/api/lists/list-123`,
        { name: 'In Progress' },
        accessToken,
      );
    });
  });

  describe('delete', () => {
    it('should delete list by ID', async () => {
      mockExecuteFunctions.getNodeParameter = jest.fn().mockReturnValueOnce('list-123');

      const mockResponse = { item: { id: 'list-123' } };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await listOperations.execute.call(
        mockExecuteFunctions,
        'delete',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(result).toEqual(mockResponse);
      expect(requestHelper.makeRequest).toHaveBeenCalledWith(
        'DELETE',
        `${baseUrl}/api/lists/list-123`,
        null,
        accessToken,
      );
    });
  });

  describe('moveCards', () => {
    it('should move all cards from source list to target list', async () => {
      mockExecuteFunctions.getNodeParameter = jest
        .fn()
        .mockReturnValueOnce('list-123')
        .mockReturnValueOnce('target-list-456');

      const mockResponse = { items: [{ id: 'card-1' }, { id: 'card-2' }, { id: 'card-3' }] };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await listOperations.execute.call(
        mockExecuteFunctions,
        'moveCards',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(result).toEqual(mockResponse);
      expect(requestHelper.makeRequest).toHaveBeenCalledWith(
        'POST',
        `${baseUrl}/api/lists/list-123/move-cards`,
        { listId: 'target-list-456' },
        accessToken,
      );
    });
  });

  describe('sort', () => {
    it('should sort cards in list', async () => {
      mockExecuteFunctions.getNodeParameter = jest
        .fn()
        .mockReturnValueOnce('list-123')
        .mockReturnValueOnce('name')
        .mockReturnValueOnce('asc');

      const mockResponse = { items: [] };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await listOperations.execute.call(
        mockExecuteFunctions,
        'sort',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(result).toEqual(mockResponse);
      expect(requestHelper.makeRequest).toHaveBeenCalledWith(
        'POST',
        `${baseUrl}/api/lists/list-123/sort`,
        { fieldName: 'name', order: 'asc' },
        accessToken,
      );
    });
  });

  describe('unknown operation', () => {
    it('should throw error for unknown operation', async () => {
      await expect(
        listOperations.execute.call(
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

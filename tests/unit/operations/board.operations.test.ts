import { IExecuteFunctions, NodeOperationError } from 'n8n-workflow';
import { boardOperations } from '../../../nodes/Planka/operations/board.operations';
import * as requestHelper from '../../../nodes/Planka/helpers/request';

jest.mock('../../../nodes/Planka/helpers/request');

describe('Board Operations', () => {
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
    it('should create board with required fields', async () => {
      mockExecuteFunctions.getNodeParameter = jest
        .fn()
        .mockReturnValueOnce('proj-123')
        .mockReturnValueOnce(0)
        .mockReturnValueOnce('Test Board');

      const mockResponse = { item: { id: 'board-123', name: 'Test Board', position: 0 } };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await boardOperations.execute.call(
        mockExecuteFunctions,
        'create',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(result).toEqual(mockResponse);
      expect(requestHelper.makeRequest).toHaveBeenCalledWith(
        'POST',
        `${baseUrl}/api/projects/proj-123/boards`,
        { position: 0, name: 'Test Board' },
        accessToken,
      );
    });
  });

  describe('get', () => {
    it('should get board by ID', async () => {
      mockExecuteFunctions.getNodeParameter = jest.fn().mockReturnValueOnce('board-123');

      const mockResponse = { item: { id: 'board-123', name: 'Test Board' } };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await boardOperations.execute.call(
        mockExecuteFunctions,
        'get',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(result).toEqual(mockResponse);
      expect(requestHelper.makeRequest).toHaveBeenCalledWith(
        'GET',
        `${baseUrl}/api/boards/board-123`,
        null,
        accessToken,
      );
    });
  });

  describe('update', () => {
    it('should update board fields', async () => {
      mockExecuteFunctions.getNodeParameter = jest
        .fn()
        .mockReturnValueOnce('board-123')
        .mockReturnValueOnce({ name: 'Updated Board', position: 1 });

      const mockResponse = { item: { id: 'board-123', name: 'Updated Board' } };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await boardOperations.execute.call(
        mockExecuteFunctions,
        'update',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(result).toEqual(mockResponse);
      expect(requestHelper.makeRequest).toHaveBeenCalledWith(
        'PATCH',
        `${baseUrl}/api/boards/board-123`,
        { name: 'Updated Board', position: 1 },
        accessToken,
      );
    });
  });

  describe('delete', () => {
    it('should delete board by ID', async () => {
      mockExecuteFunctions.getNodeParameter = jest.fn().mockReturnValueOnce('board-123');

      const mockResponse = { item: { id: 'board-123' } };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await boardOperations.execute.call(
        mockExecuteFunctions,
        'delete',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(result).toEqual(mockResponse);
      expect(requestHelper.makeRequest).toHaveBeenCalledWith(
        'DELETE',
        `${baseUrl}/api/boards/board-123`,
        null,
        accessToken,
      );
    });
  });

  describe('unknown operation', () => {
    it('should throw error for unknown operation', async () => {
      await expect(
        boardOperations.execute.call(
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

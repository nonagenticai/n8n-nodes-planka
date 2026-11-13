import { IExecuteFunctions, NodeOperationError } from 'n8n-workflow';
import { membershipOperations } from '../../../nodes/Planka/operations/membership.operations';
import * as requestHelper from '../../../nodes/Planka/helpers/request';

jest.mock('../../../nodes/Planka/helpers/request');

describe('Membership Operations', () => {
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

  describe('addUserToCard', () => {
    it('should add user to card', async () => {
      mockExecuteFunctions.getNodeParameter = jest
        .fn()
        .mockReturnValueOnce('card-123')
        .mockReturnValueOnce('user-456');

      const mockResponse = { item: { id: 'membership-123', cardId: 'card-123', userId: 'user-456' } };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await membershipOperations.execute.call(
        mockExecuteFunctions,
        'addUserToCard',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(result).toEqual(mockResponse);
      expect(requestHelper.makeRequest).toHaveBeenCalledWith(
        'POST',
        `${baseUrl}/api/cards/card-123/card-memberships`,
        { userId: 'user-456' },
        accessToken,
      );
    });
  });

  describe('removeUserFromCard', () => {
    it('should remove user from card', async () => {
      mockExecuteFunctions.getNodeParameter = jest
        .fn()
        .mockReturnValueOnce('card-123')
        .mockReturnValueOnce('user-456');

      const mockResponse = { item: { id: 'membership-123' } };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await membershipOperations.execute.call(
        mockExecuteFunctions,
        'removeUserFromCard',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(result).toEqual(mockResponse);
      expect(requestHelper.makeRequest).toHaveBeenCalledWith(
        'DELETE',
        `${baseUrl}/api/cards/card-123/card-memberships/userId:user-456`,
        null,
        accessToken,
      );
    });
  });

  describe('addUserToBoard', () => {
    it('should add user to board with editor role', async () => {
      mockExecuteFunctions.getNodeParameter = jest
        .fn()
        .mockReturnValueOnce('board-123')
        .mockReturnValueOnce('user-456')
        .mockReturnValueOnce('editor')
        .mockReturnValueOnce(true);

      const mockResponse = { item: { id: 'membership-123', boardId: 'board-123', userId: 'user-456', role: 'editor' } };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await membershipOperations.execute.call(
        mockExecuteFunctions,
        'addUserToBoard',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(result).toEqual(mockResponse);
      expect(requestHelper.makeRequest).toHaveBeenCalledWith(
        'POST',
        `${baseUrl}/api/boards/board-123/board-memberships`,
        { userId: 'user-456', role: 'editor', canComment: true },
        accessToken,
      );
    });

    it('should add user to board with viewer role', async () => {
      mockExecuteFunctions.getNodeParameter = jest
        .fn()
        .mockReturnValueOnce('board-123')
        .mockReturnValueOnce('user-456')
        .mockReturnValueOnce('viewer')
        .mockReturnValueOnce(true);

      const mockResponse = { item: { id: 'membership-123', boardId: 'board-123', userId: 'user-456', role: 'viewer' } };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await membershipOperations.execute.call(
        mockExecuteFunctions,
        'addUserToBoard',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(result).toEqual(mockResponse);
      expect(requestHelper.makeRequest).toHaveBeenCalledWith(
        'POST',
        `${baseUrl}/api/boards/board-123/board-memberships`,
        { userId: 'user-456', role: 'viewer', canComment: true },
        accessToken,
      );
    });
  });

  describe('updateBoardMembership', () => {
    it('should update board membership role', async () => {
      mockExecuteFunctions.getNodeParameter = jest
        .fn()
        .mockReturnValueOnce('membership-123')
        .mockReturnValueOnce('editor')
        .mockReturnValueOnce({});

      const mockResponse = { item: { id: 'membership-123', role: 'editor' } };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await membershipOperations.execute.call(
        mockExecuteFunctions,
        'updateBoardMembership',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(result).toEqual(mockResponse);
      expect(requestHelper.makeRequest).toHaveBeenCalledWith(
        'PATCH',
        `${baseUrl}/api/board-memberships/membership-123`,
        { role: 'editor' },
        accessToken,
      );
    });

    it('should update board membership role with canComment', async () => {
      mockExecuteFunctions.getNodeParameter = jest
        .fn()
        .mockReturnValueOnce('membership-123')
        .mockReturnValueOnce('viewer')
        .mockReturnValueOnce({ canComment: false });

      const mockResponse = { item: { id: 'membership-123', role: 'viewer', canComment: false } };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await membershipOperations.execute.call(
        mockExecuteFunctions,
        'updateBoardMembership',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(result).toEqual(mockResponse);
      expect(requestHelper.makeRequest).toHaveBeenCalledWith(
        'PATCH',
        `${baseUrl}/api/board-memberships/membership-123`,
        { role: 'viewer', canComment: false },
        accessToken,
      );
    });
  });

  describe('removeUserFromBoard', () => {
    it('should remove user from board', async () => {
      mockExecuteFunctions.getNodeParameter = jest
        .fn()
        .mockReturnValueOnce('membership-123');

      const mockResponse = { item: { id: 'membership-123' } };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await membershipOperations.execute.call(
        mockExecuteFunctions,
        'removeUserFromBoard',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(result).toEqual(mockResponse);
      expect(requestHelper.makeRequest).toHaveBeenCalledWith(
        'DELETE',
        `${baseUrl}/api/board-memberships/membership-123`,
        null,
        accessToken,
      );
    });
  });

  describe('unknown operation', () => {
    it('should throw error for unknown operation', async () => {
      await expect(
        membershipOperations.execute.call(
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

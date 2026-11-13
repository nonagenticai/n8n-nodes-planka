import { IExecuteFunctions, NodeOperationError } from 'n8n-workflow';
import { userOperations } from '../../../nodes/Planka/operations/user.operations';
import * as requestHelper from '../../../nodes/Planka/helpers/request';

jest.mock('../../../nodes/Planka/helpers/request');

describe('User Operations', () => {
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
    it('should create user with required fields', async () => {
      mockExecuteFunctions.getNodeParameter = jest
        .fn()
        .mockReturnValueOnce('user@example.com')
        .mockReturnValueOnce('password123')
        .mockReturnValueOnce('boardUser')
        .mockReturnValueOnce('John Doe')
        .mockReturnValueOnce('johndoe')
        .mockReturnValueOnce({});

      const mockResponse = { item: { id: 'user-123', email: 'user@example.com', name: 'John Doe' } };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await userOperations.execute.call(
        mockExecuteFunctions,
        'create',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(result).toEqual(mockResponse);
      expect(requestHelper.makeRequest).toHaveBeenCalledWith(
        'POST',
        `${baseUrl}/api/users`,
        { email: 'user@example.com', password: 'password123', role: 'boardUser', name: 'John Doe', username: 'johndoe' },
        accessToken,
      );
    });

    it('should create user with all additional fields', async () => {
      mockExecuteFunctions.getNodeParameter = jest
        .fn()
        .mockReturnValueOnce('user@example.com')
        .mockReturnValueOnce('password123')
        .mockReturnValueOnce('admin')
        .mockReturnValueOnce('John Doe')
        .mockReturnValueOnce('johndoe')
        .mockReturnValueOnce({
          organization: 'ACME Corp',
          phone: '+1234567890',
          language: 'en'
        });

      const mockResponse = { item: { id: 'user-123', email: 'user@example.com', name: 'John Doe' } };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await userOperations.execute.call(
        mockExecuteFunctions,
        'create',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(result).toEqual(mockResponse);
      expect(requestHelper.makeRequest).toHaveBeenCalledWith(
        'POST',
        `${baseUrl}/api/users`,
        {
          email: 'user@example.com',
          password: 'password123',
          role: 'admin',
          name: 'John Doe',
          username: 'johndoe',
          organization: 'ACME Corp',
          phone: '+1234567890',
          language: 'en'
        },
        accessToken,
      );
    });

    it('should create user with admin role', async () => {
      mockExecuteFunctions.getNodeParameter = jest
        .fn()
        .mockReturnValueOnce('user@example.com')
        .mockReturnValueOnce('password123')
        .mockReturnValueOnce('admin')
        .mockReturnValueOnce('John Doe')
        .mockReturnValueOnce('johndoe')
        .mockReturnValueOnce({});

      const mockResponse = {
        item: { id: 'user-123', email: 'user@example.com', username: 'johndoe', role: 'admin' },
      };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await userOperations.execute.call(
        mockExecuteFunctions,
        'create',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(result).toEqual(mockResponse);
      expect(requestHelper.makeRequest).toHaveBeenCalledWith(
        'POST',
        `${baseUrl}/api/users`,
        {
          email: 'user@example.com',
          password: 'password123',
          role: 'admin',
          name: 'John Doe',
          username: 'johndoe',
        },
        accessToken,
      );
    });
  });

  describe('get', () => {
    it('should get user by ID', async () => {
      mockExecuteFunctions.getNodeParameter = jest.fn().mockReturnValueOnce('user-123');

      const mockResponse = { item: { id: 'user-123', name: 'John Doe' } };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await userOperations.execute.call(
        mockExecuteFunctions,
        'get',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(result).toEqual(mockResponse);
      expect(requestHelper.makeRequest).toHaveBeenCalledWith(
        'GET',
        `${baseUrl}/api/users/user-123`,
        null,
        accessToken,
      );
    });
  });

  describe('list', () => {
    it('should list all users', async () => {
      const mockResponse = { items: [{ id: 'user-1' }, { id: 'user-2' }] };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await userOperations.execute.call(
        mockExecuteFunctions,
        'list',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(result).toEqual(mockResponse);
      expect(requestHelper.makeRequest).toHaveBeenCalledWith(
        'GET',
        `${baseUrl}/api/users`,
        null,
        accessToken,
      );
    });
  });

  describe('update', () => {
    it('should update user fields', async () => {
      mockExecuteFunctions.getNodeParameter = jest
        .fn()
        .mockReturnValueOnce('user-123')
        .mockReturnValueOnce({ name: 'Jane Doe' });

      const mockResponse = { item: { id: 'user-123', name: 'Jane Doe' } };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await userOperations.execute.call(
        mockExecuteFunctions,
        'update',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(result).toEqual(mockResponse);
      expect(requestHelper.makeRequest).toHaveBeenCalledWith(
        'PATCH',
        `${baseUrl}/api/users/user-123`,
        { name: 'Jane Doe' },
        accessToken,
      );
    });

    it('should update user with all possible fields', async () => {
      mockExecuteFunctions.getNodeParameter = jest
        .fn()
        .mockReturnValueOnce('user-123')
        .mockReturnValueOnce({
          role: 'admin',
          name: 'Updated Name',
          organization: 'New Org',
          phone: '+9876543210',
          language: 'es'
        });

      const mockResponse = { item: { id: 'user-123', name: 'Updated Name' } };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await userOperations.execute.call(
        mockExecuteFunctions,
        'update',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(result).toEqual(mockResponse);
      expect(requestHelper.makeRequest).toHaveBeenCalledWith(
        'PATCH',
        `${baseUrl}/api/users/user-123`,
        {
          role: 'admin',
          name: 'Updated Name',
          organization: 'New Org',
          phone: '+9876543210',
          language: 'es'
        },
        accessToken,
      );
    });
  });

  describe('delete', () => {
    it('should delete user by ID', async () => {
      mockExecuteFunctions.getNodeParameter = jest.fn().mockReturnValueOnce('user-123');

      const mockResponse = { item: { id: 'user-123' } };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await userOperations.execute.call(
        mockExecuteFunctions,
        'delete',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(result).toEqual(mockResponse);
      expect(requestHelper.makeRequest).toHaveBeenCalledWith(
        'DELETE',
        `${baseUrl}/api/users/user-123`,
        null,
        accessToken,
      );
    });
  });

  describe('updateAvatar', () => {
    it('should update user avatar with binary data', async () => {
      const mockBinaryData = {
        data: Buffer.from('fake-image-data').toString('base64'),
        mimeType: 'image/png',
        fileName: 'avatar.png',
      };

      mockExecuteFunctions.getNodeParameter = jest
        .fn()
        .mockReturnValueOnce('user-123')
        .mockReturnValueOnce('data');

      mockExecuteFunctions.getInputData = jest.fn().mockReturnValue([
        {
          binary: {
            data: mockBinaryData,
          },
        },
      ]);

      mockExecuteFunctions.helpers = {
        getBinaryDataBuffer: jest.fn().mockResolvedValue(Buffer.from('fake-image-data')),
        request: jest.fn().mockResolvedValue({ item: { id: 'user-123', avatarUrl: 'http://example.com/avatar.png' } }),
      } as any;

      const result = await userOperations.execute.call(
        mockExecuteFunctions,
        'updateAvatar',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(result).toBeDefined();
      expect(mockExecuteFunctions.helpers.request).toHaveBeenCalled();
    });

    it('should throw error when no binary data exists', async () => {
      mockExecuteFunctions.getNodeParameter = jest
        .fn()
        .mockReturnValueOnce('user-123')
        .mockReturnValueOnce('data');

      mockExecuteFunctions.getInputData = jest.fn().mockReturnValue([
        {
          binary: undefined,
        },
      ]);

      await expect(
        userOperations.execute.call(
          mockExecuteFunctions,
          'updateAvatar',
          itemIndex,
          baseUrl,
          accessToken,
        ),
      ).rejects.toThrow(NodeOperationError);
    });
  });

  describe('updateEmail', () => {
    it('should update user email', async () => {
      mockExecuteFunctions.getNodeParameter = jest
        .fn()
        .mockReturnValueOnce('user-123')
        .mockReturnValueOnce('newemail@example.com')
        .mockReturnValueOnce({});

      const mockResponse = { item: { id: 'user-123', email: 'newemail@example.com' } };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await userOperations.execute.call(
        mockExecuteFunctions,
        'updateEmail',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(result).toEqual(mockResponse);
      expect(requestHelper.makeRequest).toHaveBeenCalledWith(
        'PATCH',
        `${baseUrl}/api/users/user-123/email`,
        { email: 'newemail@example.com' },
        accessToken,
      );
    });

    it('should update user email with current password', async () => {
      mockExecuteFunctions.getNodeParameter = jest
        .fn()
        .mockReturnValueOnce('user-123')
        .mockReturnValueOnce('newemail@example.com')
        .mockReturnValueOnce({ currentPassword: 'oldpass123' });

      const mockResponse = { item: { id: 'user-123', email: 'newemail@example.com' } };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await userOperations.execute.call(
        mockExecuteFunctions,
        'updateEmail',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(result).toEqual(mockResponse);
      expect(requestHelper.makeRequest).toHaveBeenCalledWith(
        'PATCH',
        `${baseUrl}/api/users/user-123/email`,
        { email: 'newemail@example.com', currentPassword: 'oldpass123' },
        accessToken,
      );
    });
  });

  describe('updatePassword', () => {
    it('should update user password', async () => {
      mockExecuteFunctions.getNodeParameter = jest
        .fn()
        .mockReturnValueOnce('user-123')
        .mockReturnValueOnce('newpass123')
        .mockReturnValueOnce({});

      const mockResponse = { item: { id: 'user-123' } };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await userOperations.execute.call(
        mockExecuteFunctions,
        'updatePassword',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(result).toEqual(mockResponse);
      expect(requestHelper.makeRequest).toHaveBeenCalledWith(
        'PATCH',
        `${baseUrl}/api/users/user-123/password`,
        { password: 'newpass123' },
        accessToken,
      );
    });

    it('should update user password with current password', async () => {
      mockExecuteFunctions.getNodeParameter = jest
        .fn()
        .mockReturnValueOnce('user-123')
        .mockReturnValueOnce('newpass123')
        .mockReturnValueOnce({ currentPassword: 'oldpass123' });

      const mockResponse = { item: { id: 'user-123' } };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await userOperations.execute.call(
        mockExecuteFunctions,
        'updatePassword',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(result).toEqual(mockResponse);
      expect(requestHelper.makeRequest).toHaveBeenCalledWith(
        'PATCH',
        `${baseUrl}/api/users/user-123/password`,
        { password: 'newpass123', currentPassword: 'oldpass123' },
        accessToken,
      );
    });
  });

  describe('updateUsername', () => {
    it('should update username', async () => {
      mockExecuteFunctions.getNodeParameter = jest
        .fn()
        .mockReturnValueOnce('user-123')
        .mockReturnValueOnce('newusername')
        .mockReturnValueOnce({});

      const mockResponse = { item: { id: 'user-123', username: 'newusername' } };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await userOperations.execute.call(
        mockExecuteFunctions,
        'updateUsername',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(result).toEqual(mockResponse);
      expect(requestHelper.makeRequest).toHaveBeenCalledWith(
        'PATCH',
        `${baseUrl}/api/users/user-123/username`,
        { username: 'newusername' },
        accessToken,
      );
    });

    it('should update username with current password', async () => {
      mockExecuteFunctions.getNodeParameter = jest
        .fn()
        .mockReturnValueOnce('user-123')
        .mockReturnValueOnce('newusername')
        .mockReturnValueOnce({ currentPassword: 'mypass123' });

      const mockResponse = { item: { id: 'user-123', username: 'newusername' } };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await userOperations.execute.call(
        mockExecuteFunctions,
        'updateUsername',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(result).toEqual(mockResponse);
      expect(requestHelper.makeRequest).toHaveBeenCalledWith(
        'PATCH',
        `${baseUrl}/api/users/user-123/username`,
        { username: 'newusername', currentPassword: 'mypass123' },
        accessToken,
      );
    });
  });

  describe('unknown operation', () => {
    it('should throw error for unknown operation', async () => {
      await expect(
        userOperations.execute.call(
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

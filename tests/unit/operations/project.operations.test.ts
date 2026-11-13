import { IExecuteFunctions, NodeOperationError } from 'n8n-workflow';
import { projectOperations } from '../../../nodes/Planka/operations/project.operations';
import * as requestHelper from '../../../nodes/Planka/helpers/request';

jest.mock('../../../nodes/Planka/helpers/request');

describe('Project Operations', () => {
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
    it('should create project with required fields only', async () => {
      mockExecuteFunctions.getNodeParameter = jest
        .fn()
        .mockReturnValueOnce('Test Project')
        .mockReturnValueOnce('private')
        .mockReturnValueOnce({});

      const mockResponse = { item: { id: 'proj-123', name: 'Test Project', type: 'private' } };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await projectOperations.execute.call(
        mockExecuteFunctions,
        'create',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(result).toEqual(mockResponse);
      expect(requestHelper.makeRequest).toHaveBeenCalledWith(
        'POST',
        `${baseUrl}/api/projects`,
        { name: 'Test Project', type: 'private' },
        accessToken,
      );
    });

    it('should create project with additional fields', async () => {
      mockExecuteFunctions.getNodeParameter = jest
        .fn()
        .mockReturnValueOnce('Test Project')
        .mockReturnValueOnce('public')
        .mockReturnValueOnce({ backgroundImageId: 'img-456' });

      const mockResponse = {
        item: { id: 'proj-123', name: 'Test Project', type: 'public', backgroundImageId: 'img-456' },
      };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await projectOperations.execute.call(
        mockExecuteFunctions,
        'create',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(result).toEqual(mockResponse);
      expect(requestHelper.makeRequest).toHaveBeenCalledWith(
        'POST',
        `${baseUrl}/api/projects`,
        { name: 'Test Project', type: 'public', backgroundImageId: 'img-456' },
        accessToken,
      );
    });
  });

  describe('get', () => {
    it('should get project by ID', async () => {
      mockExecuteFunctions.getNodeParameter = jest.fn().mockReturnValueOnce('proj-123');

      const mockResponse = { item: { id: 'proj-123', name: 'Test Project' } };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await projectOperations.execute.call(
        mockExecuteFunctions,
        'get',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(result).toEqual(mockResponse);
      expect(requestHelper.makeRequest).toHaveBeenCalledWith(
        'GET',
        `${baseUrl}/api/projects/proj-123`,
        null,
        accessToken,
      );
    });
  });

  describe('list', () => {
    it('should list all projects', async () => {
      const mockResponse = {
        items: [
          { id: 'proj-1', name: 'Project 1' },
          { id: 'proj-2', name: 'Project 2' },
        ],
      };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await projectOperations.execute.call(
        mockExecuteFunctions,
        'list',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(result).toEqual(mockResponse);
      expect(requestHelper.makeRequest).toHaveBeenCalledWith(
        'GET',
        `${baseUrl}/api/projects`,
        null,
        accessToken,
      );
    });
  });

  describe('update', () => {
    it('should update project with name', async () => {
      mockExecuteFunctions.getNodeParameter = jest
        .fn()
        .mockReturnValueOnce('proj-123')
        .mockReturnValueOnce({ name: 'Updated Name' });

      const mockResponse = { item: { id: 'proj-123', name: 'Updated Name' } };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await projectOperations.execute.call(
        mockExecuteFunctions,
        'update',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(result).toEqual(mockResponse);
      expect(requestHelper.makeRequest).toHaveBeenCalledWith(
        'PATCH',
        `${baseUrl}/api/projects/proj-123`,
        { name: 'Updated Name' },
        accessToken,
      );
    });

    it('should update project with multiple fields', async () => {
      mockExecuteFunctions.getNodeParameter = jest
        .fn()
        .mockReturnValueOnce('proj-123')
        .mockReturnValueOnce({
          name: 'Updated Name',
          backgroundImageId: 'img-789',
        });

      const mockResponse = {
        item: { id: 'proj-123', name: 'Updated Name', backgroundImageId: 'img-789' },
      };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await projectOperations.execute.call(
        mockExecuteFunctions,
        'update',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(result).toEqual(mockResponse);
      expect(requestHelper.makeRequest).toHaveBeenCalledWith(
        'PATCH',
        `${baseUrl}/api/projects/proj-123`,
        { name: 'Updated Name', backgroundImageId: 'img-789' },
        accessToken,
      );
    });

    it('should handle empty update fields', async () => {
      mockExecuteFunctions.getNodeParameter = jest
        .fn()
        .mockReturnValueOnce('proj-123')
        .mockReturnValueOnce({});

      const mockResponse = { item: { id: 'proj-123', name: 'Original Name' } };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await projectOperations.execute.call(
        mockExecuteFunctions,
        'update',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(result).toEqual(mockResponse);
      expect(requestHelper.makeRequest).toHaveBeenCalledWith(
        'PATCH',
        `${baseUrl}/api/projects/proj-123`,
        {},
        accessToken,
      );
    });
  });

  describe('delete', () => {
    it('should delete project by ID', async () => {
      mockExecuteFunctions.getNodeParameter = jest.fn().mockReturnValueOnce('proj-123');

      const mockResponse = { item: { id: 'proj-123' } };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await projectOperations.execute.call(
        mockExecuteFunctions,
        'delete',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(result).toEqual(mockResponse);
      expect(requestHelper.makeRequest).toHaveBeenCalledWith(
        'DELETE',
        `${baseUrl}/api/projects/proj-123`,
        null,
        accessToken,
      );
    });
  });

  describe('uploadBackgroundImage', () => {
    it('should upload background image with binary data', async () => {
      const mockBinaryData = {
        data: Buffer.from('fake-image-data').toString('base64'),
        mimeType: 'image/jpeg',
        fileName: 'background.jpg',
      };

      mockExecuteFunctions.getNodeParameter = jest
        .fn()
        .mockReturnValueOnce('proj-123')
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
        request: jest.fn().mockResolvedValue({ item: { id: 'bg-img-123', url: 'http://example.com/bg.jpg' } }),
      } as any;

      const result = await projectOperations.execute.call(
        mockExecuteFunctions,
        'uploadBackgroundImage',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(result).toBeDefined();
      expect(mockExecuteFunctions.helpers.request).toHaveBeenCalled();
    });

    it('should throw error when no binary data exists for background image', async () => {
      mockExecuteFunctions.getNodeParameter = jest
        .fn()
        .mockReturnValueOnce('proj-123')
        .mockReturnValueOnce('data');

      mockExecuteFunctions.getInputData = jest.fn().mockReturnValue([
        {
          binary: undefined,
        },
      ]);

      await expect(
        projectOperations.execute.call(
          mockExecuteFunctions,
          'uploadBackgroundImage',
          itemIndex,
          baseUrl,
          accessToken,
        ),
      ).rejects.toThrow(NodeOperationError);
    });

    it('should use default filename when not provided', async () => {
      const mockBinaryData = {
        data: Buffer.from('fake-image-data').toString('base64'),
        mimeType: 'image/jpeg',
        fileName: undefined, // No filename provided
      };

      mockExecuteFunctions.getNodeParameter = jest
        .fn()
        .mockReturnValueOnce('proj-123')
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
        request: jest.fn().mockResolvedValue({ item: { id: 'bg-img-123' } }),
      } as any;

      const result = await projectOperations.execute.call(
        mockExecuteFunctions,
        'uploadBackgroundImage',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(result).toBeDefined();
      expect(mockExecuteFunctions.helpers.request).toHaveBeenCalled();
    });
  });

  describe('deleteBackgroundImage', () => {
    it('should delete background image by ID', async () => {
      mockExecuteFunctions.getNodeParameter = jest.fn().mockReturnValueOnce('bg-img-456');

      const mockResponse = { item: { id: 'bg-img-456' } };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await projectOperations.execute.call(
        mockExecuteFunctions,
        'deleteBackgroundImage',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(result).toEqual(mockResponse);
      expect(requestHelper.makeRequest).toHaveBeenCalledWith(
        'DELETE',
        `${baseUrl}/api/background-images/bg-img-456`,
        null,
        accessToken,
      );
    });
  });

  describe('unknown operation', () => {
    it('should throw error for unknown operation', async () => {
      await expect(
        projectOperations.execute.call(
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

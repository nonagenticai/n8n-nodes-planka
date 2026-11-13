import { IExecuteFunctions, NodeOperationError } from 'n8n-workflow';
import { attachmentOperations } from '../../../nodes/Planka/operations/attachment.operations';
import * as requestHelper from '../../../nodes/Planka/helpers/request';

jest.mock('../../../nodes/Planka/helpers/request');

describe('Attachment Operations', () => {
  let mockExecuteFunctions: jest.Mocked<IExecuteFunctions>;
  const baseUrl = 'http://planka.example.com:3333';
  const accessToken = 'test-token-123';
  const itemIndex = 0;

  beforeEach(() => {
    mockExecuteFunctions = {
      getNodeParameter: jest.fn(),
      getNode: jest.fn().mockReturnValue({ name: 'Planka', type: 'kanban.planka' }),
      getInputData: jest.fn(),
      helpers: {
        request: jest.fn(),
        getBinaryDataBuffer: jest.fn(),
      },
    } as any;

    jest.clearAllMocks();
  });

  describe('create', () => {
    describe('file attachment (default)', () => {
      it('should upload attachment with binary data', async () => {
        const mockBinaryData = {
          data: 'base64data',
          mimeType: 'image/png',
          fileName: 'test.png',
        };

        const mockBuffer = Buffer.from('test file content');

        mockExecuteFunctions.getNodeParameter = jest
          .fn()
          .mockReturnValueOnce('card-123')     // cardId
          .mockReturnValueOnce('file')          // attachmentType
          .mockReturnValueOnce('data');          // binaryPropertyName

        mockExecuteFunctions.getInputData = jest.fn().mockReturnValue([
          {
            json: {},
            binary: {
              data: mockBinaryData,
            },
          },
        ]);

        mockExecuteFunctions.helpers.getBinaryDataBuffer = jest.fn().mockResolvedValue(mockBuffer);

        const mockResponse = {
          item: { id: 'attach-123', name: 'test.png', cardId: 'card-123' },
        };
        mockExecuteFunctions.helpers.request = jest.fn().mockResolvedValue(mockResponse);

        const result = await attachmentOperations.execute.call(
          mockExecuteFunctions,
          'create',
          itemIndex,
          baseUrl,
          accessToken,
        );

        expect(result).toEqual(mockResponse);
        expect(mockExecuteFunctions.helpers.getBinaryDataBuffer).toHaveBeenCalledWith(
          itemIndex,
          'data',
        );
        expect(mockExecuteFunctions.helpers.request).toHaveBeenCalled();

        const requestMock = mockExecuteFunctions.helpers.request as jest.Mock;
        const requestCall = requestMock.mock.calls[0][0] as any;
        expect(requestCall.method).toBe('POST');
        expect(requestCall.url).toBe(`${baseUrl}/api/cards/card-123/attachments`);
        expect(requestCall.headers.Authorization).toBe(`Bearer ${accessToken}`);
        expect(requestCall.body).toBeDefined();
      });

      it('should throw error when binary data does not exist', async () => {
        mockExecuteFunctions.getNodeParameter = jest
          .fn()
          .mockReturnValueOnce('card-123')     // cardId
          .mockReturnValueOnce('file')          // attachmentType
          .mockReturnValueOnce('data');          // binaryPropertyName

        mockExecuteFunctions.getInputData = jest.fn().mockReturnValue([
          {
            json: {},
            binary: {},
          },
        ]);

        await expect(
          attachmentOperations.execute.call(
            mockExecuteFunctions,
            'create',
            itemIndex,
            baseUrl,
            accessToken,
          ),
        ).rejects.toThrow(NodeOperationError);
      });

      it('should throw error when binary property is missing', async () => {
        mockExecuteFunctions.getNodeParameter = jest
          .fn()
          .mockReturnValueOnce('card-123')     // cardId
          .mockReturnValueOnce('file')          // attachmentType
          .mockReturnValueOnce('data');          // binaryPropertyName

        mockExecuteFunctions.getInputData = jest.fn().mockReturnValue([
          {
            json: {},
          },
        ]);

        await expect(
          attachmentOperations.execute.call(
            mockExecuteFunctions,
            'create',
            itemIndex,
            baseUrl,
            accessToken,
          ),
        ).rejects.toThrow(NodeOperationError);
      });

      it('should use custom binary property name', async () => {
        const mockBinaryData = {
          data: 'base64data',
          mimeType: 'application/pdf',
          fileName: 'document.pdf',
        };

        const mockBuffer = Buffer.from('pdf content');

        mockExecuteFunctions.getNodeParameter = jest
          .fn()
          .mockReturnValueOnce('card-123')         // cardId
          .mockReturnValueOnce('file')              // attachmentType
          .mockReturnValueOnce('customProperty');   // binaryPropertyName

        mockExecuteFunctions.getInputData = jest.fn().mockReturnValue([
          {
            json: {},
            binary: {
              customProperty: mockBinaryData,
            },
          },
        ]);

        mockExecuteFunctions.helpers.getBinaryDataBuffer = jest.fn().mockResolvedValue(mockBuffer);

        const mockResponse = {
          item: { id: 'attach-456', name: 'document.pdf', cardId: 'card-123' },
        };
        mockExecuteFunctions.helpers.request = jest.fn().mockResolvedValue(mockResponse);

        const result = await attachmentOperations.execute.call(
          mockExecuteFunctions,
          'create',
          itemIndex,
          baseUrl,
          accessToken,
        );

        expect(result).toEqual(mockResponse);
        expect(mockExecuteFunctions.helpers.getBinaryDataBuffer).toHaveBeenCalledWith(
          itemIndex,
          'customProperty',
        );
      });
    });

    describe('link attachment', () => {
      it('should create a link attachment with URL and name', async () => {
        mockExecuteFunctions.getNodeParameter = jest
          .fn()
          .mockReturnValueOnce('card-123')             // cardId
          .mockReturnValueOnce('link')                 // attachmentType
          .mockReturnValueOnce('https://example.com')  // linkUrl
          .mockReturnValueOnce('Example Site');         // linkName

        const mockResponse = {
          item: { id: 'attach-789', name: 'Example Site', url: 'https://example.com', cardId: 'card-123' },
        };
        (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

        const result = await attachmentOperations.execute.call(
          mockExecuteFunctions,
          'create',
          itemIndex,
          baseUrl,
          accessToken,
        );

        expect(result).toEqual(mockResponse);
        expect(requestHelper.makeRequest).toHaveBeenCalledWith(
          'POST',
          `${baseUrl}/api/cards/card-123/attachments`,
          { type: 'link', url: 'https://example.com', name: 'Example Site' },
          accessToken,
        );
      });

      it('should create a link attachment without name', async () => {
        mockExecuteFunctions.getNodeParameter = jest
          .fn()
          .mockReturnValueOnce('card-456')             // cardId
          .mockReturnValueOnce('link')                 // attachmentType
          .mockReturnValueOnce('https://example.org')  // linkUrl
          .mockReturnValueOnce('');                     // linkName (empty)

        const mockResponse = {
          item: { id: 'attach-790', url: 'https://example.org', cardId: 'card-456' },
        };
        (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

        const result = await attachmentOperations.execute.call(
          mockExecuteFunctions,
          'create',
          itemIndex,
          baseUrl,
          accessToken,
        );

        expect(result).toEqual(mockResponse);
        expect(requestHelper.makeRequest).toHaveBeenCalledWith(
          'POST',
          `${baseUrl}/api/cards/card-456/attachments`,
          { type: 'link', url: 'https://example.org' },
          accessToken,
        );
      });
    });
  });

  describe('update', () => {
    it('should update attachment name', async () => {
      mockExecuteFunctions.getNodeParameter = jest
        .fn()
        .mockReturnValueOnce('attach-123')
        .mockReturnValueOnce('new-name.pdf');

      const mockResponse = { item: { id: 'attach-123', name: 'new-name.pdf' } };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await attachmentOperations.execute.call(
        mockExecuteFunctions,
        'update',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(result).toEqual(mockResponse);
      expect(requestHelper.makeRequest).toHaveBeenCalledWith(
        'PATCH',
        `${baseUrl}/api/attachments/attach-123`,
        { name: 'new-name.pdf' },
        accessToken,
      );
    });
  });

  describe('delete', () => {
    it('should delete attachment by ID', async () => {
      mockExecuteFunctions.getNodeParameter = jest.fn().mockReturnValueOnce('attach-123');

      const mockResponse = { item: { id: 'attach-123' } };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await attachmentOperations.execute.call(
        mockExecuteFunctions,
        'delete',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(result).toEqual(mockResponse);
      expect(requestHelper.makeRequest).toHaveBeenCalledWith(
        'DELETE',
        `${baseUrl}/api/attachments/attach-123`,
        null,
        accessToken,
      );
    });
  });

  describe('unknown operation', () => {
    it('should throw error for unknown operation', async () => {
      await expect(
        attachmentOperations.execute.call(
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

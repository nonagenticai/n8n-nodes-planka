import { IExecuteFunctions, NodeOperationError } from 'n8n-workflow';
import { webhookOperations } from '../../../nodes/Planka/operations/webhook.operations';
import * as requestHelper from '../../../nodes/Planka/helpers/request';

jest.mock('../../../nodes/Planka/helpers/request');

describe('Webhook Operations', () => {
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
    it('should create webhook', async () => {
      mockExecuteFunctions.getNodeParameter = jest
        .fn()
        .mockReturnValueOnce('https://example.com/webhook') // url
        .mockReturnValueOnce('Webhook') // name
        .mockReturnValueOnce({}); // additionalFields

      const mockResponse = { item: { id: 'webhook-123', url: 'https://example.com/webhook' } };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await webhookOperations.execute.call(
        mockExecuteFunctions,
        'create',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(result).toEqual(mockResponse);
      expect(requestHelper.makeRequest).toHaveBeenCalledWith(
        'POST',
        `${baseUrl}/api/webhooks`,
        { name: 'Webhook', url: 'https://example.com/webhook' },
        accessToken,
      );
    });
  });

  describe('list', () => {
    it('should list all webhooks', async () => {
      const mockResponse = { items: [{ id: 'webhook-1' }, { id: 'webhook-2' }] };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await webhookOperations.execute.call(
        mockExecuteFunctions,
        'list',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(result).toEqual(mockResponse);
      expect(requestHelper.makeRequest).toHaveBeenCalledWith(
        'GET',
        `${baseUrl}/api/webhooks`,
        null,
        accessToken,
      );
    });
  });

  describe('update', () => {
    it('should update webhook URL', async () => {
      mockExecuteFunctions.getNodeParameter = jest
        .fn()
        .mockReturnValueOnce('webhook-123') // webhookId
        .mockReturnValueOnce('https://example.com/new-webhook') // url
        .mockReturnValueOnce({}); // updateFields

      const mockResponse = { item: { id: 'webhook-123', url: 'https://example.com/new-webhook' } };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await webhookOperations.execute.call(
        mockExecuteFunctions,
        'update',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(result).toEqual(mockResponse);
      expect(requestHelper.makeRequest).toHaveBeenCalledWith(
        'PATCH',
        `${baseUrl}/api/webhooks/webhook-123`,
        { url: 'https://example.com/new-webhook' },
        accessToken,
      );
    });
  });

  describe('delete', () => {
    it('should delete webhook by ID', async () => {
      mockExecuteFunctions.getNodeParameter = jest.fn().mockReturnValueOnce('webhook-123');

      const mockResponse = { item: { id: 'webhook-123' } };
      (requestHelper.makeRequest as jest.Mock).mockResolvedValue(mockResponse);

      const result = await webhookOperations.execute.call(
        mockExecuteFunctions,
        'delete',
        itemIndex,
        baseUrl,
        accessToken,
      );

      expect(result).toEqual(mockResponse);
      expect(requestHelper.makeRequest).toHaveBeenCalledWith(
        'DELETE',
        `${baseUrl}/api/webhooks/webhook-123`,
        null,
        accessToken,
      );
    });
  });

  describe('unknown operation', () => {
    it('should throw error for unknown operation', async () => {
      await expect(
        webhookOperations.execute.call(
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

import { IExecuteFunctions, NodeApiError, NodeOperationError } from 'n8n-workflow';
import { makeRequest, loginAndGetToken } from '../../../nodes/Planka/helpers/request';

describe('Planka Request Helpers', () => {
  describe('makeRequest', () => {
    let mockExecuteFunctions: jest.Mocked<IExecuteFunctions>;

    beforeEach(() => {
      mockExecuteFunctions = {
        helpers: {
          request: jest.fn(),
        },
        getNode: jest.fn().mockReturnValue({ name: 'Planka', type: 'kanban.planka' }),
        getCredentials: jest.fn().mockResolvedValue({
          baseUrl: 'http://planka.example.com:3333',
          emailOrUsername: 'user@example.com',
          password: 'test-password',
          licenseToken: 'test-license-token',
          sslOptions: { ignoreSSL: false },
        }),
      } as any;
    });

    it('should make successful GET request', async () => {
      const mockResponse = { id: '123', name: 'Test Project' };
      mockExecuteFunctions.helpers.request = jest.fn().mockResolvedValue(mockResponse);

      const result = await makeRequest.call(
        mockExecuteFunctions,
        'GET',
        'http://planka.example.com:3333/api/projects',
        null,
        'test-token',
      );

      expect(result).toEqual(mockResponse);
      expect(mockExecuteFunctions.helpers.request).toHaveBeenCalledWith({
        method: 'GET',
        url: 'http://planka.example.com:3333/api/projects',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token',
        },
        json: true,
        rejectUnauthorized: true,
      });
    });

    it('should make successful POST request with body', async () => {
      const mockBody = { name: 'New Project' };
      const mockResponse = { id: '456', ...mockBody };
      mockExecuteFunctions.helpers.request = jest.fn().mockResolvedValue(mockResponse);

      const result = await makeRequest.call(
        mockExecuteFunctions,
        'POST',
        'http://planka.example.com:3333/api/projects',
        mockBody,
        'test-token',
      );

      expect(result).toEqual(mockResponse);
      expect(mockExecuteFunctions.helpers.request).toHaveBeenCalledWith({
        method: 'POST',
        url: 'http://planka.example.com:3333/api/projects',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token',
        },
        body: mockBody,
        json: true,
        rejectUnauthorized: true,
      });
    });

    it('should handle 401 authentication error', async () => {
      // When makeRequest gets 401, it tries to refresh the token via loginAndGetToken
      // which also fails with 401, throwing NodeOperationError
      const error = { statusCode: 401, message: 'Unauthorized' };
      mockExecuteFunctions.helpers.request = jest.fn().mockRejectedValue(error);

      await expect(
        makeRequest.call(
          mockExecuteFunctions,
          'GET',
          'http://planka.example.com:3333/api/projects',
          null,
          'invalid-token',
        ),
      ).rejects.toThrow(NodeOperationError);
    });

    it('should handle 403 permission denied error', async () => {
      const error = { statusCode: 403, message: 'Forbidden' };
      mockExecuteFunctions.helpers.request = jest.fn().mockRejectedValue(error);

      await expect(
        makeRequest.call(
          mockExecuteFunctions,
          'DELETE',
          'http://planka.example.com:3333/api/projects/123',
          null,
          'test-token',
        ),
      ).rejects.toThrow(NodeApiError);
    });

    it('should handle 404 not found error', async () => {
      const error = { statusCode: 404, message: 'Not Found' };
      mockExecuteFunctions.helpers.request = jest.fn().mockRejectedValue(error);

      await expect(
        makeRequest.call(
          mockExecuteFunctions,
          'GET',
          'http://planka.example.com:3333/api/projects/nonexistent',
          null,
          'test-token',
        ),
      ).rejects.toThrow(NodeApiError);
    });

    it('should handle 400 bad request error', async () => {
      const error = { statusCode: 400, message: 'Bad Request' };
      mockExecuteFunctions.helpers.request = jest.fn().mockRejectedValue(error);

      await expect(
        makeRequest.call(
          mockExecuteFunctions,
          'POST',
          'http://planka.example.com:3333/api/projects',
          { invalid: 'data' },
          'test-token',
        ),
      ).rejects.toThrow(NodeApiError);
    });

    it('should handle 422 validation error', async () => {
      const error = { statusCode: 422, message: 'Validation Failed' };
      mockExecuteFunctions.helpers.request = jest.fn().mockRejectedValue(error);

      await expect(
        makeRequest.call(
          mockExecuteFunctions,
          'POST',
          'http://planka.example.com:3333/api/projects',
          {},
          'test-token',
        ),
      ).rejects.toThrow(NodeApiError);
    });

    it('should handle 500 server error', async () => {
      const error = { statusCode: 500, message: 'Internal Server Error' };
      mockExecuteFunctions.helpers.request = jest.fn().mockRejectedValue(error);

      await expect(
        makeRequest.call(
          mockExecuteFunctions,
          'GET',
          'http://planka.example.com:3333/api/projects',
          null,
          'test-token',
        ),
      ).rejects.toThrow(NodeApiError);
    });

    it('should handle unknown errors', async () => {
      const error = new Error('Network timeout');
      mockExecuteFunctions.helpers.request = jest.fn().mockRejectedValue(error);

      await expect(
        makeRequest.call(
          mockExecuteFunctions,
          'GET',
          'http://planka.example.com:3333/api/projects',
          null,
          'test-token',
        ),
      ).rejects.toThrow(NodeOperationError);
    });
  });

  describe('loginAndGetToken', () => {
    let mockExecuteFunctions: jest.Mocked<IExecuteFunctions>;

    beforeEach(() => {
      mockExecuteFunctions = {
        helpers: {
          request: jest.fn(),
        },
        getNode: jest.fn().mockReturnValue({ name: 'Planka', type: 'kanban.planka' }),
        getCredentials: jest.fn().mockResolvedValue({
          baseUrl: 'http://planka.example.com:3333',
          emailOrUsername: 'user@example.com',
          password: 'test-password',
          licenseToken: 'test-license-token',
          sslOptions: { ignoreSSL: false },
        }),
      } as any;
    });

    it('should successfully login and return access token', async () => {
      const mockToken = 'mock-access-token';
      const mockResponse = { item: mockToken };
      mockExecuteFunctions.helpers.request = jest.fn().mockResolvedValue(mockResponse);

      const token = await loginAndGetToken.call(
        mockExecuteFunctions,
        'http://planka.example.com:3333',
        'user@example.com',
        'test-password',
      );

      expect(token).toBe(mockToken);
      expect(mockExecuteFunctions.helpers.request).toHaveBeenCalledWith({
        method: 'POST',
        url: 'http://planka.example.com:3333/api/access-tokens',
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          emailOrUsername: 'user@example.com',
          password: 'test-password',
        },
        json: true,
        rejectUnauthorized: true,
      });
    });

    it('should handle terms acceptance flow', async () => {
      const pendingToken = 'pending-token-123';
      const finalToken = 'mock-final-token';
      // Stock Planka rejects any signature that is not exactly 64 chars (400).
      const termsSignature = 'a'.repeat(64);

      const termsError = {
        statusCode: 403,
        response: {
          body: {
            code: 'E_FORBIDDEN',
            step: 'accept-terms',
            pendingToken,
            termsType: 'extended',
          },
        },
      };

      mockExecuteFunctions.helpers.request = jest
        .fn()
        .mockRejectedValueOnce(termsError)
        .mockResolvedValueOnce({ item: { type: 'general', signature: termsSignature } })
        .mockResolvedValueOnce({ item: finalToken });

      const token = await loginAndGetToken.call(
        mockExecuteFunctions,
        'http://planka.example.com:3333',
        'newuser@gmail.com',
        'password123',
      );

      expect(token).toBe(finalToken);
      expect(mockExecuteFunctions.helpers.request).toHaveBeenCalledTimes(3);

      // The signature comes from GET /api/terms, never a placeholder
      expect(mockExecuteFunctions.helpers.request).toHaveBeenNthCalledWith(2, {
        method: 'GET',
        url: 'http://planka.example.com:3333/api/terms',
        json: true,
        rejectUnauthorized: true,
      });

      // Verify terms acceptance call
      expect(mockExecuteFunctions.helpers.request).toHaveBeenNthCalledWith(3, {
        method: 'POST',
        url: 'http://planka.example.com:3333/api/access-tokens/accept-terms',
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          pendingToken,
          signature: termsSignature,
        },
        json: true,
        rejectUnauthorized: true,
      });
    });

    it('should handle terms acceptance failure', async () => {
      const pendingToken = 'pending-token-123';

      const termsError = {
        statusCode: 403,
        response: {
          body: {
            code: 'E_FORBIDDEN',
            step: 'accept-terms',
            pendingToken,
          },
        },
      };

      const termsAcceptError = new Error('Terms acceptance failed');

      mockExecuteFunctions.helpers.request = jest
        .fn()
        .mockRejectedValueOnce(termsError)
        .mockResolvedValueOnce({ item: { signature: 'a'.repeat(64) } })
        .mockRejectedValueOnce(termsAcceptError);

      await expect(
        loginAndGetToken.call(
          mockExecuteFunctions,
          'http://planka.example.com:3333',
          'user@gmail.com',
          'password',
        ),
      ).rejects.toThrow(NodeOperationError);
    });

    it('should fail clearly when /api/terms returns no signature', async () => {
      const termsError = {
        statusCode: 403,
        response: { body: { code: 'E_FORBIDDEN', step: 'accept-terms', pendingToken: 'p' } },
      };
      mockExecuteFunctions.helpers.request = jest
        .fn()
        .mockRejectedValueOnce(termsError)
        .mockResolvedValueOnce({ item: {} });

      await expect(
        loginAndGetToken.call(mockExecuteFunctions, 'http://planka.example.com:3333', 'u@x.com', 'pw'),
      ).rejects.toThrow('Planka /api/terms returned no signature');
      expect(mockExecuteFunctions.helpers.request).toHaveBeenCalledTimes(2);
    });

    it('should handle invalid credentials', async () => {
      const error = {
        statusCode: 401,
        message: 'Invalid credentials',
      };

      mockExecuteFunctions.helpers.request = jest.fn().mockRejectedValue(error);

      await expect(
        loginAndGetToken.call(
          mockExecuteFunctions,
          'http://planka.example.com:3333',
          'wrong@gmail.com',
          'wrongpassword',
        ),
      ).rejects.toThrow(NodeOperationError);
    });

    it('should handle other 403 errors (not terms acceptance)', async () => {
      const error = {
        statusCode: 403,
        response: {
          body: {
            code: 'FORBIDDEN',
            message: 'Access denied',
          },
        },
      };

      mockExecuteFunctions.helpers.request = jest.fn().mockRejectedValue(error);

      await expect(
        loginAndGetToken.call(
          mockExecuteFunctions,
          'http://planka.example.com:3333',
          'user@gmail.com',
          'password',
        ),
      ).rejects.toThrow(NodeOperationError);
    });
  });
});

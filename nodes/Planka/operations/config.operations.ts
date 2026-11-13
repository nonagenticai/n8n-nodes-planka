import {
  IExecuteFunctions,
  NodeOperationError,
} from 'n8n-workflow';

import { makeRequest } from '../helpers/request';

/**
 * Config operations handler
 * Retrieves application configuration
 */
export const configOperations = {
  async execute(
    this: IExecuteFunctions,
    operation: string,
    itemIndex: number,
    baseUrl: string,
    accessToken: string,
  ): Promise<any> {
    switch (operation) {
      case 'get':
        return await getConfig.call(this, itemIndex, baseUrl, accessToken);

      case 'getBootstrap':
        return await getBootstrap.call(this, itemIndex, baseUrl, accessToken);

      case 'update':
        return await updateConfig.call(this, itemIndex, baseUrl, accessToken);

      case 'testSmtp':
        return await testSmtpConfig.call(this, itemIndex, baseUrl, accessToken);

      default:
        throw new NodeOperationError(
          this.getNode(),
          `Unknown operation: ${operation}`,
        );
    }
  },
};

/**
 * Retrieves the application configuration
 * @param i - Item index
 * @param baseUrl - Base URL of the Planka instance
 * @param accessToken - Access token for authentication
 * @returns Application configuration object
 */
async function getConfig(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  return await makeRequest.call(
    this,
    'GET',
    `${baseUrl}/api/config`,
    null,
    accessToken,
  );
}

/**
 * Retrieves the application bootstrap data
 * GET /api/bootstrap
 */
async function getBootstrap(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  return await makeRequest.call(
    this,
    'GET',
    `${baseUrl}/api/bootstrap`,
    null,
    accessToken,
  );
}

/**
 * Updates the application configuration (Admin only)
 * PATCH /api/config
 */
async function updateConfig(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const updateFields = this.getNodeParameter('updateFields', i, {}) as any;

  const body: any = {};
  if (updateFields.smtpHost) body.smtpHost = updateFields.smtpHost;
  if (updateFields.smtpPort !== undefined) body.smtpPort = updateFields.smtpPort;
  if (updateFields.smtpSecure !== undefined) body.smtpSecure = updateFields.smtpSecure;
  if (updateFields.smtpUser) body.smtpUser = updateFields.smtpUser;
  if (updateFields.smtpPassword) body.smtpPassword = updateFields.smtpPassword;
  if (updateFields.smtpFrom) body.smtpFrom = updateFields.smtpFrom;
  if (updateFields.smtpName) body.smtpName = updateFields.smtpName;
  if (updateFields.smtpTlsRejectUnauthorized !== undefined) body.smtpTlsRejectUnauthorized = updateFields.smtpTlsRejectUnauthorized;

  return await makeRequest.call(
    this,
    'PATCH',
    `${baseUrl}/api/config`,
    body,
    accessToken,
  );
}

/**
 * Tests the SMTP configuration by sending a test email (Admin only)
 * POST /api/config/test-smtp
 */
async function testSmtpConfig(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  return await makeRequest.call(
    this,
    'POST',
    `${baseUrl}/api/config/test-smtp`,
    null,
    accessToken,
  );
}

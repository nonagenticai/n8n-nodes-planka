import {
  IExecuteFunctions,
  NodeOperationError,
} from 'n8n-workflow';

import { makeRequest } from '../helpers/request';
import { pathSegment } from '../helpers/pathSegment';

/**
 * Handles all notification service-related operations for the Planka API
 * Notification services allow sending notifications to external services (webhooks, Slack, email, etc.)
 */
export const notificationServiceOperations = {
  async execute(
    this: IExecuteFunctions,
    operation: string,
    itemIndex: number,
    baseUrl: string,
    accessToken: string,
  ): Promise<any> {
    switch (operation) {
      case 'createBoard':
        return await createBoardNotificationService.call(this, itemIndex, baseUrl, accessToken);

      case 'createUser':
        return await createUserNotificationService.call(this, itemIndex, baseUrl, accessToken);

      case 'update':
        return await updateNotificationService.call(this, itemIndex, baseUrl, accessToken);

      case 'delete':
        return await deleteNotificationService.call(this, itemIndex, baseUrl, accessToken);

      case 'test':
        return await testNotificationService.call(this, itemIndex, baseUrl, accessToken);

      default:
        throw new NodeOperationError(
          this.getNode(),
          `Unknown operation: ${operation}`,
        );
    }
  },
};

/**
 * Creates a notification service for a board
 * POST /api/boards/{boardId}/notification-services
 */
async function createBoardNotificationService(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const boardId = this.getNodeParameter('boardId', i) as string;
  const url = this.getNodeParameter('url', i) as string;
  const format = this.getNodeParameter('format', i) as string;

  const body: any = {
    url,
    format,
  };

  return await makeRequest.call(
    this,
    'POST',
    `${baseUrl}/api/boards/${pathSegment(this, 'boardId', boardId)}/notification-services`,
    body,
    accessToken,
  );
}

/**
 * Creates a notification service for a user
 * POST /api/users/{userId}/notification-services
 */
async function createUserNotificationService(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const userId = this.getNodeParameter('userId', i) as string;
  const url = this.getNodeParameter('url', i) as string;
  const format = this.getNodeParameter('format', i) as string;

  const body: any = {
    url,
    format,
  };

  return await makeRequest.call(
    this,
    'POST',
    `${baseUrl}/api/users/${pathSegment(this, 'userId', userId)}/notification-services`,
    body,
    accessToken,
  );
}

/**
 * Updates a notification service
 * PATCH /api/notification-services/{id}
 */
async function updateNotificationService(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const serviceId = this.getNodeParameter('serviceId', i) as string;
  const updateFields = this.getNodeParameter('updateFields', i, {}) as any;

  const body: any = {};

  if (updateFields.url !== undefined) {
    body.url = updateFields.url;
  }
  if (updateFields.format !== undefined) {
    body.format = updateFields.format;
  }

  return await makeRequest.call(
    this,
    'PATCH',
    `${baseUrl}/api/notification-services/${pathSegment(this, 'serviceId', serviceId)}`,
    body,
    accessToken,
  );
}

/**
 * Deletes a notification service
 * DELETE /api/notification-services/{id}
 */
async function deleteNotificationService(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const serviceId = this.getNodeParameter('serviceId', i) as string;

  return await makeRequest.call(
    this,
    'DELETE',
    `${baseUrl}/api/notification-services/${pathSegment(this, 'serviceId', serviceId)}`,
    null,
    accessToken,
  );
}

/**
 * Tests a notification service
 * POST /api/notification-services/{id}/test
 */
async function testNotificationService(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const serviceId = this.getNodeParameter('serviceId', i) as string;

  return await makeRequest.call(
    this,
    'POST',
    `${baseUrl}/api/notification-services/${pathSegment(this, 'serviceId', serviceId)}/test`,
    null,
    accessToken,
  );
}

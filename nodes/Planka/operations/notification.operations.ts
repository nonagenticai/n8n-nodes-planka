import {
  IExecuteFunctions,
  NodeOperationError,
} from 'n8n-workflow';

import { makeRequest } from '../helpers/request';
import { pathSegment } from '../helpers/pathSegment';

/**
 * Handles all notification-related operations for the Planka API
 */
export const notificationOperations = {
  async execute(
    this: IExecuteFunctions,
    operation: string,
    itemIndex: number,
    baseUrl: string,
    accessToken: string,
  ): Promise<any> {
    switch (operation) {
      case 'list':
        return await listNotifications.call(this, itemIndex, baseUrl, accessToken);

      case 'get':
        return await getNotification.call(this, itemIndex, baseUrl, accessToken);

      case 'update':
        return await updateNotification.call(this, itemIndex, baseUrl, accessToken);

      case 'markAllRead':
        return await markAllNotificationsRead.call(this, itemIndex, baseUrl, accessToken);

      default:
        throw new NodeOperationError(
          this.getNode(),
          `Unknown operation: ${operation}`,
        );
    }
  },
};

/**
 * Lists all unread notifications for the current user
 * GET /api/notifications
 */
async function listNotifications(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  return await makeRequest.call(
    this,
    'GET',
    `${baseUrl}/api/notifications`,
    null,
    accessToken,
  );
}

/**
 * Retrieves a specific notification by ID
 * GET /api/notifications/{id}
 */
async function getNotification(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const notificationId = this.getNodeParameter('notificationId', i) as string;

  return await makeRequest.call(
    this,
    'GET',
    `${baseUrl}/api/notifications/${pathSegment(this, 'notificationId', notificationId)}`,
    null,
    accessToken,
  );
}

/**
 * Updates a notification (typically to mark as read)
 * PATCH /api/notifications/{id}
 */
async function updateNotification(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const notificationId = this.getNodeParameter('notificationId', i) as string;
  const isRead = this.getNodeParameter('isRead', i) as boolean;

  const body: any = {
    isRead,
  };

  return await makeRequest.call(
    this,
    'PATCH',
    `${baseUrl}/api/notifications/${pathSegment(this, 'notificationId', notificationId)}`,
    body,
    accessToken,
  );
}

/**
 * Marks all notifications for the current user as read
 * POST /api/notifications/read-all
 */
async function markAllNotificationsRead(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  return await makeRequest.call(
    this,
    'POST',
    `${baseUrl}/api/notifications/read-all`,
    null,
    accessToken,
  );
}

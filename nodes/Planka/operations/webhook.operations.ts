import {
  IExecuteFunctions,
  NodeOperationError,
} from 'n8n-workflow';

import { makeRequest } from '../helpers/request';
import { pathSegment } from '../helpers/pathSegment';

export const webhookOperations = {
  async execute(
    this: IExecuteFunctions,
    operation: string,
    itemIndex: number,
    baseUrl: string,
    accessToken: string,
  ): Promise<any> {
    switch (operation) {
      case 'create':
        return await createWebhook.call(this, itemIndex, baseUrl, accessToken);

      case 'list':
        return await listWebhooks.call(this, itemIndex, baseUrl, accessToken);

      case 'update':
        return await updateWebhook.call(this, itemIndex, baseUrl, accessToken);

      case 'delete':
        return await deleteWebhook.call(this, itemIndex, baseUrl, accessToken);

      default:
        throw new NodeOperationError(
          this.getNode(),
          `Unknown operation: ${operation}`,
        );
    }
  },
};

async function createWebhook(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const url = this.getNodeParameter('url', i) as string;
  const name = this.getNodeParameter('name', i, 'Webhook') as string;

  const body: any = {
    name,
    url,
  };

  const additionalFields = this.getNodeParameter('additionalFields', i, {}) as any;
  if (additionalFields.accessToken) body.accessToken = additionalFields.accessToken;
  if (additionalFields.events) {
    try {
      body.events = typeof additionalFields.events === 'string' ? JSON.parse(additionalFields.events) : additionalFields.events;
    } catch {
      body.events = additionalFields.events;
    }
  }
  if (additionalFields.excludedEvents) {
    try {
      body.excludedEvents = typeof additionalFields.excludedEvents === 'string' ? JSON.parse(additionalFields.excludedEvents) : additionalFields.excludedEvents;
    } catch {
      body.excludedEvents = additionalFields.excludedEvents;
    }
  }

  return await makeRequest.call(
    this,
    'POST',
    `${baseUrl}/api/webhooks`,
    body,
    accessToken,
  );
}

async function listWebhooks(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  return await makeRequest.call(
    this,
    'GET',
    `${baseUrl}/api/webhooks`,
    null,
    accessToken,
  );
}

async function updateWebhook(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const webhookId = this.getNodeParameter('webhookId', i) as string;
  const url = this.getNodeParameter('url', i) as string;
  const updateFields = this.getNodeParameter('updateFields', i, {}) as any;

  const body: any = {
    url,
  };

  if (updateFields.name) body.name = updateFields.name;
  if (updateFields.accessToken) body.accessToken = updateFields.accessToken;
  if (updateFields.events) {
    try {
      body.events = typeof updateFields.events === 'string' ? JSON.parse(updateFields.events) : updateFields.events;
    } catch {
      body.events = updateFields.events;
    }
  }
  if (updateFields.excludedEvents) {
    try {
      body.excludedEvents = typeof updateFields.excludedEvents === 'string' ? JSON.parse(updateFields.excludedEvents) : updateFields.excludedEvents;
    } catch {
      body.excludedEvents = updateFields.excludedEvents;
    }
  }

  return await makeRequest.call(
    this,
    'PATCH',
    `${baseUrl}/api/webhooks/${pathSegment(this, 'webhookId', webhookId)}`,
    body,
    accessToken,
  );
}

async function deleteWebhook(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const webhookId = this.getNodeParameter('webhookId', i) as string;

  return await makeRequest.call(
    this,
    'DELETE',
    `${baseUrl}/api/webhooks/${pathSegment(this, 'webhookId', webhookId)}`,
    null,
    accessToken,
  );
}

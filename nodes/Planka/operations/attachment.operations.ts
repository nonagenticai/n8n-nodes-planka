import {
  IExecuteFunctions,
  NodeOperationError,
} from 'n8n-workflow';

import { makeRequest } from '../helpers/request';
import { pathSegment } from '../helpers/pathSegment';
import FormData from 'form-data';

export const attachmentOperations = {
  async execute(
    this: IExecuteFunctions,
    operation: string,
    itemIndex: number,
    baseUrl: string,
    accessToken: string,
  ): Promise<any> {
    switch (operation) {
      case 'create':
        return await createAttachment.call(this, itemIndex, baseUrl, accessToken);

      case 'update':
        return await updateAttachment.call(this, itemIndex, baseUrl, accessToken);

      case 'delete':
        return await deleteAttachment.call(this, itemIndex, baseUrl, accessToken);

      default:
        throw new NodeOperationError(
          this.getNode(),
          `Unknown operation: ${operation}`,
        );
    }
  },
};

async function createAttachment(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const cardId = this.getNodeParameter('cardId', i) as string;
  const attachmentType = this.getNodeParameter('attachmentType', i, 'file') as string;

  if (attachmentType === 'link') {
    const linkUrl = this.getNodeParameter('linkUrl', i) as string;
    const linkName = this.getNodeParameter('linkName', i, '') as string;

    const body: any = {
      type: 'link',
      url: linkUrl,
    };
    if (linkName) {
      body.name = linkName;
    }

    return await makeRequest.call(
      this,
      'POST',
      `${baseUrl}/api/cards/${pathSegment(this, 'cardId', cardId)}/attachments`,
      body,
      accessToken,
    );
  }

  // File upload (default)
  const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i, 'data') as string;
  const items = this.getInputData();
  const item = items[i];

  if (!item.binary || !item.binary[binaryPropertyName]) {
    throw new NodeOperationError(this.getNode(), `No binary data exists on item with property: ${binaryPropertyName}`);
  }

  const binaryData = item.binary[binaryPropertyName];
  const dataBuffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);

  // For file uploads, we need to use form-data
  const formData = new FormData();
  formData.append('file', dataBuffer, {
    filename: binaryData.fileName || 'file',
    contentType: binaryData.mimeType,
  });

  const options: any = {
    method: 'POST' as const,
    url: `${baseUrl}/api/cards/${pathSegment(this, 'cardId', cardId)}/attachments`,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      ...formData.getHeaders(),
    },
    body: formData,
  };

  return await this.helpers.request(options);
}

async function updateAttachment(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const attachmentId = this.getNodeParameter('attachmentId', i) as string;
  const name = this.getNodeParameter('name', i) as string;

  const body: any = {
    name,
  };

  return await makeRequest.call(
    this,
    'PATCH',
    `${baseUrl}/api/attachments/${pathSegment(this, 'attachmentId', attachmentId)}`,
    body,
    accessToken,
  );
}

async function deleteAttachment(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const attachmentId = this.getNodeParameter('attachmentId', i) as string;

  return await makeRequest.call(
    this,
    'DELETE',
    `${baseUrl}/api/attachments/${pathSegment(this, 'attachmentId', attachmentId)}`,
    null,
    accessToken,
  );
}

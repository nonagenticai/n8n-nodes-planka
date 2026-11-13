import {
  IExecuteFunctions,
  NodeOperationError,
} from 'n8n-workflow';

import { makeRequest } from '../helpers/request';
import { pathSegment } from '../helpers/pathSegment';

export const commentOperations = {
  async execute(
    this: IExecuteFunctions,
    operation: string,
    itemIndex: number,
    baseUrl: string,
    accessToken: string,
  ): Promise<any> {
    switch (operation) {
      case 'create':
        return await createComment.call(this, itemIndex, baseUrl, accessToken);

      case 'update':
        return await updateComment.call(this, itemIndex, baseUrl, accessToken);

      case 'delete':
        return await deleteComment.call(this, itemIndex, baseUrl, accessToken);

      case 'list':
        return await listComments.call(this, itemIndex, baseUrl, accessToken);

      default:
        throw new NodeOperationError(
          this.getNode(),
          `Unknown operation: ${operation}`,
        );
    }
  },
};

async function createComment(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const cardId = this.getNodeParameter('cardId', i) as string;
  const text = this.getNodeParameter('text', i) as string;

  const body: any = {
    text,
  };

  return await makeRequest.call(
    this,
    'POST',
    `${baseUrl}/api/cards/${pathSegment(this, 'cardId', cardId)}/comments`,
    body,
    accessToken,
  );
}

async function updateComment(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const commentId = this.getNodeParameter('commentId', i) as string;
  const text = this.getNodeParameter('text', i) as string;

  const body: any = {
    text,
  };

  return await makeRequest.call(
    this,
    'PATCH',
    `${baseUrl}/api/comments/${pathSegment(this, 'commentId', commentId)}`,
    body,
    accessToken,
  );
}

async function deleteComment(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const commentId = this.getNodeParameter('commentId', i) as string;

  return await makeRequest.call(
    this,
    'DELETE',
    `${baseUrl}/api/comments/${pathSegment(this, 'commentId', commentId)}`,
    null,
    accessToken,
  );
}

async function listComments(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const cardId = this.getNodeParameter('cardId', i) as string;
  const additionalFields = this.getNodeParameter('additionalFields', i, {}) as any;

  let url = `${baseUrl}/api/cards/${pathSegment(this, 'cardId', cardId)}/comments`;

  if (additionalFields.beforeId) {
    url += `?beforeId=${encodeURIComponent(String(additionalFields.beforeId))}`;
  }

  return await makeRequest.call(
    this,
    'GET',
    url,
    null,
    accessToken,
  );
}

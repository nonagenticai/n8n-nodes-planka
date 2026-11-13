import {
  IExecuteFunctions,
  NodeOperationError,
} from 'n8n-workflow';

import { makeRequest } from '../helpers/request';
import { pathSegment } from '../helpers/pathSegment';

/**
 * Custom Field Group operations handler
 * Handles all operations related to custom field groups in Planka
 */
export const customFieldGroupOperations = {
  async execute(
    this: IExecuteFunctions,
    operation: string,
    itemIndex: number,
    baseUrl: string,
    accessToken: string,
  ): Promise<any> {
    switch (operation) {
      case 'createBoardGroup':
        return await createBoardGroup.call(this, itemIndex, baseUrl, accessToken);

      case 'createCardGroup':
        return await createCardGroup.call(this, itemIndex, baseUrl, accessToken);

      case 'get':
        return await getGroup.call(this, itemIndex, baseUrl, accessToken);

      case 'update':
        return await updateGroup.call(this, itemIndex, baseUrl, accessToken);

      case 'delete':
        return await deleteGroup.call(this, itemIndex, baseUrl, accessToken);

      default:
        throw new NodeOperationError(
          this.getNode(),
          `Unknown operation: ${operation}`,
        );
    }
  },
};

/**
 * Create a custom field group within a board
 * POST /api/boards/{boardId}/custom-field-groups
 */
async function createBoardGroup(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const boardId = this.getNodeParameter('boardId', i) as string;
  const position = this.getNodeParameter('position', i) as number;
  const creationType = this.getNodeParameter('creationType', i) as string;

  const body: any = {
    position,
  };

  if (creationType === 'fromBase') {
    const baseCustomFieldGroupId = this.getNodeParameter('baseCustomFieldGroupId', i) as string;
    body.baseCustomFieldGroupId = baseCustomFieldGroupId;
  } else {
    const name = this.getNodeParameter('name', i) as string;
    body.name = name;
  }

  return await makeRequest.call(
    this,
    'POST',
    `${baseUrl}/api/boards/${pathSegment(this, 'boardId', boardId)}/custom-field-groups`,
    body,
    accessToken,
  );
}

/**
 * Create a custom field group for a card
 * POST /api/cards/{cardId}/custom-field-groups
 * Supports both direct creation (name) and from base group (baseCustomFieldGroupId)
 */
async function createCardGroup(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const cardId = this.getNodeParameter('cardId', i) as string;
  const position = this.getNodeParameter('position', i) as number;
  const creationType = this.getNodeParameter('creationType', i) as string;

  const body: any = { position };

  if (creationType === 'fromBase') {
    body.baseCustomFieldGroupId = this.getNodeParameter('baseCustomFieldGroupId', i) as string;
  } else {
    body.name = this.getNodeParameter('name', i) as string;
  }

  return await makeRequest.call(
    this,
    'POST',
    `${baseUrl}/api/cards/${pathSegment(this, 'cardId', cardId)}/custom-field-groups`,
    body,
    accessToken,
  );
}

/**
 * Get a custom field group by ID
 * GET /api/custom-field-groups/{id}
 */
async function getGroup(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const groupId = this.getNodeParameter('groupId', i) as string;

  return await makeRequest.call(
    this,
    'GET',
    `${baseUrl}/api/custom-field-groups/${pathSegment(this, 'groupId', groupId)}`,
    null,
    accessToken,
  );
}

/**
 * Update a custom field group
 * PATCH /api/custom-field-groups/{id}
 */
async function updateGroup(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const groupId = this.getNodeParameter('groupId', i) as string;
  const updateFields = this.getNodeParameter('updateFields', i, {}) as any;

  const body: any = {};

  if (updateFields.name) {
    body.name = updateFields.name;
  }
  if (updateFields.position !== undefined) {
    body.position = updateFields.position;
  }

  return await makeRequest.call(
    this,
    'PATCH',
    `${baseUrl}/api/custom-field-groups/${pathSegment(this, 'groupId', groupId)}`,
    body,
    accessToken,
  );
}

/**
 * Delete a custom field group
 * DELETE /api/custom-field-groups/{id}
 */
async function deleteGroup(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const groupId = this.getNodeParameter('groupId', i) as string;

  return await makeRequest.call(
    this,
    'DELETE',
    `${baseUrl}/api/custom-field-groups/${pathSegment(this, 'groupId', groupId)}`,
    null,
    accessToken,
  );
}

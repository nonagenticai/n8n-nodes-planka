import {
  IExecuteFunctions,
  NodeOperationError,
} from 'n8n-workflow';

import { makeRequest } from '../helpers/request';
import { pathSegment } from '../helpers/pathSegment';

/**
 * Custom Field operations handler
 * Handles all operations related to custom fields in Planka
 */
export const customFieldOperations = {
  async execute(
    this: IExecuteFunctions,
    operation: string,
    itemIndex: number,
    baseUrl: string,
    accessToken: string,
  ): Promise<any> {
    switch (operation) {
      case 'createInBaseGroup':
        return await createInBaseGroup.call(this, itemIndex, baseUrl, accessToken);

      case 'createInGroup':
        return await createInGroup.call(this, itemIndex, baseUrl, accessToken);

      case 'update':
        return await updateField.call(this, itemIndex, baseUrl, accessToken);

      case 'delete':
        return await deleteField.call(this, itemIndex, baseUrl, accessToken);

      case 'listInBaseGroup':
        return await listInBaseGroup.call(this, itemIndex, baseUrl, accessToken);

      default:
        throw new NodeOperationError(
          this.getNode(),
          `Unknown operation: ${operation}`,
        );
    }
  },
};

/**
 * Create a custom field in a base custom field group
 * POST /api/base-custom-field-groups/{baseCustomFieldGroupId}/custom-fields
 */
async function createInBaseGroup(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const baseGroupId = this.getNodeParameter('baseGroupId', i) as string;
  const position = this.getNodeParameter('position', i) as number;
  const name = this.getNodeParameter('name', i) as string;
  const additionalFields = this.getNodeParameter('additionalFields', i, {}) as any;

  const body: any = {
    position,
    name,
  };

  if (additionalFields.showOnFrontOfCard !== undefined) {
    body.showOnFrontOfCard = additionalFields.showOnFrontOfCard;
  }

  return await makeRequest.call(
    this,
    'POST',
    `${baseUrl}/api/base-custom-field-groups/${pathSegment(this, 'baseGroupId', baseGroupId)}/custom-fields`,
    body,
    accessToken,
  );
}

/**
 * Create a custom field in a custom field group
 * POST /api/custom-field-groups/{customFieldGroupId}/custom-fields
 */
async function createInGroup(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const groupId = this.getNodeParameter('groupId', i) as string;
  const position = this.getNodeParameter('position', i) as number;
  const name = this.getNodeParameter('name', i) as string;
  const additionalFields = this.getNodeParameter('additionalFields', i, {}) as any;

  const body: any = {
    position,
    name,
  };

  if (additionalFields.showOnFrontOfCard !== undefined) {
    body.showOnFrontOfCard = additionalFields.showOnFrontOfCard;
  }

  return await makeRequest.call(
    this,
    'POST',
    `${baseUrl}/api/custom-field-groups/${pathSegment(this, 'groupId', groupId)}/custom-fields`,
    body,
    accessToken,
  );
}

/**
 * Update a custom field
 * PATCH /api/custom-fields/{id}
 */
async function updateField(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const fieldId = this.getNodeParameter('fieldId', i) as string;
  const updateFields = this.getNodeParameter('updateFields', i, {}) as any;

  const body: any = {};

  if (updateFields.position !== undefined) {
    body.position = updateFields.position;
  }
  if (updateFields.name) {
    body.name = updateFields.name;
  }
  if (updateFields.showOnFrontOfCard !== undefined) {
    body.showOnFrontOfCard = updateFields.showOnFrontOfCard;
  }

  return await makeRequest.call(
    this,
    'PATCH',
    `${baseUrl}/api/custom-fields/${pathSegment(this, 'fieldId', fieldId)}`,
    body,
    accessToken,
  );
}

/**
 * List custom fields in a base custom field group
 * GET /api/base-custom-field-groups/{baseCustomFieldGroupId}/custom-fields
 */
async function listInBaseGroup(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const baseCustomFieldGroupId = this.getNodeParameter('baseCustomFieldGroupId', i) as string;

  return await makeRequest.call(
    this,
    'GET',
    `${baseUrl}/api/base-custom-field-groups/${pathSegment(this, 'baseCustomFieldGroupId', baseCustomFieldGroupId)}/custom-fields`,
    null,
    accessToken,
  );
}

/**
 * Delete a custom field
 * DELETE /api/custom-fields/{id}
 */
async function deleteField(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const fieldId = this.getNodeParameter('fieldId', i) as string;

  return await makeRequest.call(
    this,
    'DELETE',
    `${baseUrl}/api/custom-fields/${pathSegment(this, 'fieldId', fieldId)}`,
    null,
    accessToken,
  );
}

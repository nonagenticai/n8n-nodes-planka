import {
  IExecuteFunctions,
  NodeOperationError,
} from 'n8n-workflow';

import { makeRequest } from '../helpers/request';
import { pathSegment } from '../helpers/pathSegment';

/**
 * Handles all base custom field group-related operations for the Planka API
 * Base custom field groups are templates for custom fields at the project level
 */
export const baseCustomFieldGroupOperations = {
  async execute(
    this: IExecuteFunctions,
    operation: string,
    itemIndex: number,
    baseUrl: string,
    accessToken: string,
  ): Promise<any> {
    switch (operation) {
      case 'create':
        return await createBaseCustomFieldGroup.call(this, itemIndex, baseUrl, accessToken);

      case 'update':
        return await updateBaseCustomFieldGroup.call(this, itemIndex, baseUrl, accessToken);

      case 'delete':
        return await deleteBaseCustomFieldGroup.call(this, itemIndex, baseUrl, accessToken);

      default:
        throw new NodeOperationError(
          this.getNode(),
          `Unknown operation: ${operation}`,
        );
    }
  },
};

/**
 * Creates a base custom field group for a project
 * POST /api/projects/{projectId}/base-custom-field-groups
 */
async function createBaseCustomFieldGroup(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const projectId = this.getNodeParameter('projectId', i) as string;
  const name = this.getNodeParameter('name', i) as string;

  const body: any = {
    name,
  };

  return await makeRequest.call(
    this,
    'POST',
    `${baseUrl}/api/projects/${pathSegment(this, 'projectId', projectId)}/base-custom-field-groups`,
    body,
    accessToken,
  );
}

/**
 * Updates a base custom field group
 * PATCH /api/base-custom-field-groups/{id}
 */
async function updateBaseCustomFieldGroup(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const groupId = this.getNodeParameter('groupId', i) as string;
  const updateFields = this.getNodeParameter('updateFields', i, {}) as any;

  const body: any = {};

  if (updateFields.name !== undefined) {
    body.name = updateFields.name;
  }

  return await makeRequest.call(
    this,
    'PATCH',
    `${baseUrl}/api/base-custom-field-groups/${pathSegment(this, 'groupId', groupId)}`,
    body,
    accessToken,
  );
}

/**
 * Deletes a base custom field group
 * DELETE /api/base-custom-field-groups/{id}
 */
async function deleteBaseCustomFieldGroup(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const groupId = this.getNodeParameter('groupId', i) as string;

  return await makeRequest.call(
    this,
    'DELETE',
    `${baseUrl}/api/base-custom-field-groups/${pathSegment(this, 'groupId', groupId)}`,
    null,
    accessToken,
  );
}

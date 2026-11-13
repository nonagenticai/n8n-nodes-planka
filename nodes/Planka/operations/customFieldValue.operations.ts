import {
  IExecuteFunctions,
  NodeOperationError,
} from 'n8n-workflow';

import { makeRequest } from '../helpers/request';
import { pathSegment } from '../helpers/pathSegment';

/**
 * Custom Field Value operations handler
 * Handles all operations related to custom field values in Planka
 */
export const customFieldValueOperations = {
  async execute(
    this: IExecuteFunctions,
    operation: string,
    itemIndex: number,
    baseUrl: string,
    accessToken: string,
  ): Promise<any> {
    switch (operation) {
      case 'set':
        return await setValue.call(this, itemIndex, baseUrl, accessToken);

      case 'delete':
        return await deleteValue.call(this, itemIndex, baseUrl, accessToken);

      default:
        throw new NodeOperationError(
          this.getNode(),
          `Unknown operation: ${operation}`,
        );
    }
  },
};

/**
 * Set a custom field value for a card
 * PATCH /api/cards/{cardId}/custom-field-values/customFieldGroupId:{groupId}:customFieldId:{fieldId}
 */
async function setValue(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const cardId = this.getNodeParameter('cardId', i) as string;
  const customFieldGroupId = this.getNodeParameter('customFieldGroupId', i) as string;
  const customFieldId = this.getNodeParameter('customFieldId', i) as string;
  const value = this.getNodeParameter('value', i) as string;

  const body = {
    content: value,
  };

  const url = `${baseUrl}/api/cards/${pathSegment(this, 'cardId', cardId)}/custom-field-values/customFieldGroupId:${pathSegment(this, 'customFieldGroupId', customFieldGroupId)}:customFieldId:${pathSegment(this, 'customFieldId', customFieldId)}`;

  return await makeRequest.call(
    this,
    'PATCH',
    url,
    body,
    accessToken,
  );
}

/**
 * Delete a custom field value from a card
 * DELETE /api/cards/{cardId}/custom-field-value/customFieldGroupId:{groupId}:customFieldId:{fieldId}
 */
async function deleteValue(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const cardId = this.getNodeParameter('cardId', i) as string;
  const customFieldGroupId = this.getNodeParameter('customFieldGroupId', i) as string;
  const customFieldId = this.getNodeParameter('customFieldId', i) as string;

  const url = `${baseUrl}/api/cards/${pathSegment(this, 'cardId', cardId)}/custom-field-value/customFieldGroupId:${pathSegment(this, 'customFieldGroupId', customFieldGroupId)}:customFieldId:${pathSegment(this, 'customFieldId', customFieldId)}`;

  return await makeRequest.call(
    this,
    'DELETE',
    url,
    null,
    accessToken,
  );
}

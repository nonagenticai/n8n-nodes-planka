import {
  IExecuteFunctions,
  NodeOperationError,
} from 'n8n-workflow';

import { makeRequest } from '../helpers/request';

/**
 * Terms operations handler
 * Retrieves terms and conditions
 */
export const termsOperations = {
  async execute(
    this: IExecuteFunctions,
    operation: string,
    itemIndex: number,
    baseUrl: string,
    accessToken: string,
  ): Promise<any> {
    switch (operation) {
      case 'get':
        return await getTerms.call(this, itemIndex, baseUrl, accessToken);

      default:
        throw new NodeOperationError(
          this.getNode(),
          `Unknown operation: ${operation}`,
        );
    }
  },
};

/**
 * Retrieves terms and conditions in the specified language
 * @param i - Item index
 * @param baseUrl - Base URL of the Planka instance
 * @param accessToken - Access token for authentication
 * @returns Terms content object
 */
async function getTerms(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const additionalFields = this.getNodeParameter('additionalFields', i, {}) as any;

  let url = `${baseUrl}/api/terms`;

  if (additionalFields.language) {
    url += `?language=${encodeURIComponent(String(additionalFields.language))}`;
  }

  return await makeRequest.call(
    this,
    'GET',
    url,
    null,
    accessToken,
  );
}


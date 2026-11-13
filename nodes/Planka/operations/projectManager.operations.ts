import {
  IExecuteFunctions,
  NodeOperationError,
} from 'n8n-workflow';

import { makeRequest } from '../helpers/request';
import { pathSegment } from '../helpers/pathSegment';

export const projectManagerOperations = {
  /**
   * Execute project manager operations
   * @param operation Operation to execute (add, remove)
   * @param itemIndex Index of the current item
   * @param baseUrl Planka base URL
   * @param accessToken JWT access token
   * @returns Operation result
   */
  async execute(
    this: IExecuteFunctions,
    operation: string,
    itemIndex: number,
    baseUrl: string,
    accessToken: string,
  ): Promise<any> {
    switch (operation) {
      case 'add':
        return await addProjectManager.call(this, itemIndex, baseUrl, accessToken);

      case 'remove':
        return await removeProjectManager.call(this, itemIndex, baseUrl, accessToken);

      default:
        throw new NodeOperationError(
          this.getNode(),
          `Unknown operation: ${operation}`,
        );
    }
  },
};

/**
 * Add a project manager to a project
 * @param i Index of the current item
 * @param baseUrl Planka base URL
 * @param accessToken JWT access token
 * @returns Project manager data
 */
async function addProjectManager(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const projectId = this.getNodeParameter('projectId', i) as string;
  const userId = this.getNodeParameter('userId', i) as string;

  const body: any = {
    userId,
  };

  return await makeRequest.call(
    this,
    'POST',
    `${baseUrl}/api/projects/${pathSegment(this, 'projectId', projectId)}/project-managers`,
    body,
    accessToken,
  );
}

/**
 * Remove a project manager from a project
 * @param i Index of the current item
 * @param baseUrl Planka base URL
 * @param accessToken JWT access token
 * @returns Deletion result
 */
async function removeProjectManager(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const projectManagerId = this.getNodeParameter('projectManagerId', i) as string;

  return await makeRequest.call(
    this,
    'DELETE',
    `${baseUrl}/api/project-managers/${pathSegment(this, 'projectManagerId', projectManagerId)}`,
    null,
    accessToken,
  );
}

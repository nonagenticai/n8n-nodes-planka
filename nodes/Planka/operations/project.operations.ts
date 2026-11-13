import {
  IExecuteFunctions,
  NodeOperationError,
} from 'n8n-workflow';

import { makeRequest } from '../helpers/request';
import { pathSegment } from '../helpers/pathSegment';
import FormData from 'form-data';

export const projectOperations = {
  /**
   * Execute project operations
   * @param operation Operation to execute (create, get, list, update, delete, uploadBackgroundImage, deleteBackgroundImage)
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
      case 'create':
        return await createProject.call(this, itemIndex, baseUrl, accessToken);

      case 'get':
        return await getProject.call(this, itemIndex, baseUrl, accessToken);

      case 'list':
        return await listProjects.call(this, itemIndex, baseUrl, accessToken);

      case 'update':
        return await updateProject.call(this, itemIndex, baseUrl, accessToken);

      case 'delete':
        return await deleteProject.call(this, itemIndex, baseUrl, accessToken);

      case 'uploadBackgroundImage':
        return await uploadBackgroundImage.call(this, itemIndex, baseUrl, accessToken);

      case 'deleteBackgroundImage':
        return await deleteBackgroundImage.call(this, itemIndex, baseUrl, accessToken);

      default:
        throw new NodeOperationError(
          this.getNode(),
          `Unknown operation: ${operation}`,
        );
    }
  },
};

async function createProject(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const name = this.getNodeParameter('name', i) as string;
  const type = this.getNodeParameter('type', i) as string;
  const additionalFields = this.getNodeParameter('additionalFields', i, {}) as any;

  const body: any = { name, type };

  if (additionalFields.backgroundImageId) {
    body.backgroundImageId = additionalFields.backgroundImageId;
  }
  if (additionalFields.description) {
    body.description = additionalFields.description;
  }

  return await makeRequest.call(
    this,
    'POST',
    `${baseUrl}/api/projects`,
    body,
    accessToken,
  );
}

async function getProject(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const projectId = this.getNodeParameter('projectId', i) as string;

  return await makeRequest.call(
    this,
    'GET',
    `${baseUrl}/api/projects/${pathSegment(this, 'projectId', projectId)}`,
    null,
    accessToken,
  );
}

async function listProjects(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  return await makeRequest.call(
    this,
    'GET',
    `${baseUrl}/api/projects`,
    null,
    accessToken,
  );
}

async function updateProject(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const projectId = this.getNodeParameter('projectId', i) as string;
  const updateFields = this.getNodeParameter('updateFields', i, {}) as any;

  const body: any = {};

  if (updateFields.name) body.name = updateFields.name;
  if (updateFields.backgroundImageId !== undefined) body.backgroundImageId = updateFields.backgroundImageId;
  if (updateFields.ownerProjectManagerId) body.ownerProjectManagerId = updateFields.ownerProjectManagerId;
  if (updateFields.description !== undefined) body.description = updateFields.description;
  if (updateFields.backgroundType) body.backgroundType = updateFields.backgroundType;
  if (updateFields.backgroundGradient) body.backgroundGradient = updateFields.backgroundGradient;
  if (updateFields.isHidden !== undefined) body.isHidden = updateFields.isHidden;
  if (updateFields.isFavorite !== undefined) body.isFavorite = updateFields.isFavorite;

  return await makeRequest.call(
    this,
    'PATCH',
    `${baseUrl}/api/projects/${pathSegment(this, 'projectId', projectId)}`,
    body,
    accessToken,
  );
}

async function deleteProject(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const projectId = this.getNodeParameter('projectId', i) as string;

  return await makeRequest.call(
    this,
    'DELETE',
    `${baseUrl}/api/projects/${pathSegment(this, 'projectId', projectId)}`,
    null,
    accessToken,
  );
}

/**
 * Upload a background image for a project
 * @param i Index of the current item
 * @param baseUrl Planka base URL
 * @param accessToken JWT access token
 * @returns Background image data
 */
async function uploadBackgroundImage(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const projectId = this.getNodeParameter('projectId', i) as string;
  const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i, 'data') as string;
  const items = this.getInputData();
  const item = items[i];

  if (!item.binary || !item.binary[binaryPropertyName]) {
    throw new NodeOperationError(this.getNode(), `No binary data exists on item with property: ${binaryPropertyName}`);
  }

  const binaryData = item.binary[binaryPropertyName];
  const dataBuffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);

  const formData = new FormData();
  formData.append('file', dataBuffer, {
    filename: binaryData.fileName || 'background.jpg',
    contentType: binaryData.mimeType,
  });

  const options: any = {
    method: 'POST' as const,
    url: `${baseUrl}/api/projects/${pathSegment(this, 'projectId', projectId)}/background-images`,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      ...formData.getHeaders(),
    },
    body: formData,
  };

  return await this.helpers.request(options);
}

/**
 * Delete a background image
 * @param i Index of the current item
 * @param baseUrl Planka base URL
 * @param accessToken JWT access token
 * @returns Deletion result
 */
async function deleteBackgroundImage(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const backgroundImageId = this.getNodeParameter('backgroundImageId', i) as string;

  return await makeRequest.call(
    this,
    'DELETE',
    `${baseUrl}/api/background-images/${pathSegment(this, 'backgroundImageId', backgroundImageId)}`,
    null,
    accessToken,
  );
}

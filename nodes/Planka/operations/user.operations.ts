import {
  IExecuteFunctions,
  NodeOperationError,
} from 'n8n-workflow';

import { makeRequest } from '../helpers/request';
import { pathSegment } from '../helpers/pathSegment';
import FormData from 'form-data';

export const userOperations = {
  async execute(
    this: IExecuteFunctions,
    operation: string,
    itemIndex: number,
    baseUrl: string,
    accessToken: string,
  ): Promise<any> {
    switch (operation) {
      case 'create':
        return await createUser.call(this, itemIndex, baseUrl, accessToken);

      case 'get':
        return await getUser.call(this, itemIndex, baseUrl, accessToken);

      case 'list':
        return await listUsers.call(this, itemIndex, baseUrl, accessToken);

      case 'update':
        return await updateUser.call(this, itemIndex, baseUrl, accessToken);

      case 'delete':
        return await deleteUser.call(this, itemIndex, baseUrl, accessToken);

      case 'updateAvatar':
        return await updateUserAvatar.call(this, itemIndex, baseUrl, accessToken);

      case 'updateEmail':
        return await updateUserEmail.call(this, itemIndex, baseUrl, accessToken);

      case 'updatePassword':
        return await updateUserPassword.call(this, itemIndex, baseUrl, accessToken);

      case 'updateUsername':
        return await updateUserUsername.call(this, itemIndex, baseUrl, accessToken);

      case 'createApiKey':
        return await createUserApiKey.call(this, itemIndex, baseUrl, accessToken);

      default:
        throw new NodeOperationError(
          this.getNode(),
          `Unknown operation: ${operation}`,
        );
    }
  },
};

async function createUser(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const email = this.getNodeParameter('email', i) as string;
  const password = this.getNodeParameter('password', i) as string;
  const role = this.getNodeParameter('role', i) as string;
  const name = this.getNodeParameter('name', i) as string;
  const username = this.getNodeParameter('username', i) as string;
  const additionalFields = this.getNodeParameter('additionalFields', i, {}) as any;

  const body: any = {
    email,
    password,
    role,
    name,
  };

  if (username) body.username = username;
  if (additionalFields.organization) body.organization = additionalFields.organization;
  if (additionalFields.phone) body.phone = additionalFields.phone;
  if (additionalFields.language) body.language = additionalFields.language;

  return await makeRequest.call(
    this,
    'POST',
    `${baseUrl}/api/users`,
    body,
    accessToken,
  );
}

async function getUser(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const userId = this.getNodeParameter('userId', i) as string;

  return await makeRequest.call(
    this,
    'GET',
    `${baseUrl}/api/users/${pathSegment(this, 'userId', userId)}`,
    null,
    accessToken,
  );
}

async function listUsers(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  return await makeRequest.call(
    this,
    'GET',
    `${baseUrl}/api/users`,
    null,
    accessToken,
  );
}

async function updateUser(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const userId = this.getNodeParameter('userId', i) as string;
  const updateFields = this.getNodeParameter('updateFields', i, {}) as any;

  const body: any = {};

  if (updateFields.role) body.role = updateFields.role;
  if (updateFields.name) body.name = updateFields.name;
  if (updateFields.organization !== undefined) body.organization = updateFields.organization;
  if (updateFields.phone !== undefined) body.phone = updateFields.phone;
  if (updateFields.language) body.language = updateFields.language;
  if (updateFields.subscribeToOwnCards !== undefined) body.subscribeToOwnCards = updateFields.subscribeToOwnCards;
  if (updateFields.subscribeToCardWhenCommenting !== undefined) body.subscribeToCardWhenCommenting = updateFields.subscribeToCardWhenCommenting;
  if (updateFields.turnOffRecentCardHighlighting !== undefined) body.turnOffRecentCardHighlighting = updateFields.turnOffRecentCardHighlighting;
  if (updateFields.enableFavoritesByDefault !== undefined) body.enableFavoritesByDefault = updateFields.enableFavoritesByDefault;
  if (updateFields.defaultEditorMode) body.defaultEditorMode = updateFields.defaultEditorMode;
  if (updateFields.defaultHomeView) body.defaultHomeView = updateFields.defaultHomeView;
  if (updateFields.defaultProjectsOrder) body.defaultProjectsOrder = updateFields.defaultProjectsOrder;
  if (updateFields.isDeactivated !== undefined) body.isDeactivated = updateFields.isDeactivated;

  return await makeRequest.call(
    this,
    'PATCH',
    `${baseUrl}/api/users/${pathSegment(this, 'userId', userId)}`,
    body,
    accessToken,
  );
}

async function deleteUser(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const userId = this.getNodeParameter('userId', i) as string;

  return await makeRequest.call(
    this,
    'DELETE',
    `${baseUrl}/api/users/${pathSegment(this, 'userId', userId)}`,
    null,
    accessToken,
  );
}

async function updateUserAvatar(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const userId = this.getNodeParameter('userId', i) as string;
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
    filename: binaryData.fileName || 'avatar',
    contentType: binaryData.mimeType,
  });

  const options: any = {
    method: 'POST' as const,
    url: `${baseUrl}/api/users/${pathSegment(this, 'userId', userId)}/avatar`,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      ...formData.getHeaders(),
    },
    body: formData,
  };

  return await this.helpers.request(options);
}

async function updateUserEmail(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const userId = this.getNodeParameter('userId', i) as string;
  const email = this.getNodeParameter('email', i) as string;
  const additionalFields = this.getNodeParameter('additionalFields', i, {}) as any;

  const body: any = {
    email,
  };

  if (additionalFields.currentPassword) {
    body.currentPassword = additionalFields.currentPassword;
  }

  return await makeRequest.call(
    this,
    'PATCH',
    `${baseUrl}/api/users/${pathSegment(this, 'userId', userId)}/email`,
    body,
    accessToken,
  );
}

async function updateUserPassword(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const userId = this.getNodeParameter('userId', i) as string;
  const password = this.getNodeParameter('password', i) as string;
  const additionalFields = this.getNodeParameter('additionalFields', i, {}) as any;

  const body: any = {
    password,
  };

  if (additionalFields.currentPassword) {
    body.currentPassword = additionalFields.currentPassword;
  }

  return await makeRequest.call(
    this,
    'PATCH',
    `${baseUrl}/api/users/${pathSegment(this, 'userId', userId)}/password`,
    body,
    accessToken,
  );
}

async function updateUserUsername(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const userId = this.getNodeParameter('userId', i) as string;
  const username = this.getNodeParameter('username', i) as string;
  const additionalFields = this.getNodeParameter('additionalFields', i, {}) as any;

  const body: any = {
    username,
  };

  if (additionalFields.currentPassword) {
    body.currentPassword = additionalFields.currentPassword;
  }

  return await makeRequest.call(
    this,
    'PATCH',
    `${baseUrl}/api/users/${pathSegment(this, 'userId', userId)}/username`,
    body,
    accessToken,
  );
}

/**
 * Creates an API key for a user
 * POST /api/users/{id}/api-key
 * Note: The full API key is returned only once and cannot be retrieved again
 */
async function createUserApiKey(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const userId = this.getNodeParameter('userId', i) as string;

  return await makeRequest.call(
    this,
    'POST',
    `${baseUrl}/api/users/${pathSegment(this, 'userId', userId)}/api-key`,
    null,
    accessToken,
  );
}

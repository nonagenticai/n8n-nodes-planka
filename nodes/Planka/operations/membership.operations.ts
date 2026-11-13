import {
  IExecuteFunctions,
  NodeOperationError,
} from 'n8n-workflow';

import { makeRequest } from '../helpers/request';
import { pathSegment } from '../helpers/pathSegment';

export const membershipOperations = {
  async execute(
    this: IExecuteFunctions,
    operation: string,
    itemIndex: number,
    baseUrl: string,
    accessToken: string,
  ): Promise<any> {
    switch (operation) {
      case 'addUserToCard':
        return await addUserToCard.call(this, itemIndex, baseUrl, accessToken);

      case 'removeUserFromCard':
        return await removeUserFromCard.call(this, itemIndex, baseUrl, accessToken);

      case 'addUserToBoard':
        return await addUserToBoard.call(this, itemIndex, baseUrl, accessToken);

      case 'updateBoardMembership':
        return await updateBoardMembership.call(this, itemIndex, baseUrl, accessToken);

      case 'removeUserFromBoard':
        return await removeUserFromBoard.call(this, itemIndex, baseUrl, accessToken);

      default:
        throw new NodeOperationError(
          this.getNode(),
          `Unknown operation: ${operation}`,
        );
    }
  },
};

async function addUserToCard(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const cardId = this.getNodeParameter('cardId', i) as string;
  const userId = this.getNodeParameter('userId', i) as string;

  const body: any = {
    userId,
  };

  return await makeRequest.call(
    this,
    'POST',
    `${baseUrl}/api/cards/${pathSegment(this, 'cardId', cardId)}/card-memberships`,
    body,
    accessToken,
  );
}

async function removeUserFromCard(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const cardId = this.getNodeParameter('cardId', i) as string;
  const userId = this.getNodeParameter('userId', i) as string;

  return await makeRequest.call(
    this,
    'DELETE',
    `${baseUrl}/api/cards/${pathSegment(this, 'cardId', cardId)}/card-memberships/userId:${pathSegment(this, 'userId', userId)}`,
    null,
    accessToken,
  );
}

async function addUserToBoard(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const boardId = this.getNodeParameter('boardId', i) as string;
  const userId = this.getNodeParameter('userId', i) as string;
  const role = this.getNodeParameter('role', i, 'editor') as string;
  const canComment = this.getNodeParameter('canComment', i, true) as boolean;

  const body: any = {
    userId,
    role,
  };

  if (canComment !== undefined) {
    body.canComment = canComment;
  }

  return await makeRequest.call(
    this,
    'POST',
    `${baseUrl}/api/boards/${pathSegment(this, 'boardId', boardId)}/board-memberships`,
    body,
    accessToken,
  );
}

async function updateBoardMembership(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const boardMembershipId = this.getNodeParameter('boardMembershipId', i) as string;
  const role = this.getNodeParameter('role', i) as string;
  const updateFields = this.getNodeParameter('updateFields', i, {}) as any;

  const body: any = {
    role,
  };

  if (updateFields.canComment !== undefined) body.canComment = updateFields.canComment;

  return await makeRequest.call(
    this,
    'PATCH',
    `${baseUrl}/api/board-memberships/${pathSegment(this, 'boardMembershipId', boardMembershipId)}`,
    body,
    accessToken,
  );
}

async function removeUserFromBoard(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const boardMembershipId = this.getNodeParameter('boardMembershipId', i) as string;

  return await makeRequest.call(
    this,
    'DELETE',
    `${baseUrl}/api/board-memberships/${pathSegment(this, 'boardMembershipId', boardMembershipId)}`,
    null,
    accessToken,
  );
}

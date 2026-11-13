import {
  IExecuteFunctions,
  NodeOperationError,
} from 'n8n-workflow';

import { makeRequest } from '../helpers/request';
import { pathSegment } from '../helpers/pathSegment';

export const labelOperations = {
  async execute(
    this: IExecuteFunctions,
    operation: string,
    itemIndex: number,
    baseUrl: string,
    accessToken: string,
  ): Promise<any> {
    switch (operation) {
      case 'create':
        return await createLabel.call(this, itemIndex, baseUrl, accessToken);

      case 'update':
        return await updateLabel.call(this, itemIndex, baseUrl, accessToken);

      case 'delete':
        return await deleteLabel.call(this, itemIndex, baseUrl, accessToken);

      case 'addToCard':
        return await addLabelToCard.call(this, itemIndex, baseUrl, accessToken);

      case 'removeFromCard':
        return await removeLabelFromCard.call(this, itemIndex, baseUrl, accessToken);

      default:
        throw new NodeOperationError(
          this.getNode(),
          `Unknown operation: ${operation}`,
        );
    }
  },
};

async function createLabel(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const boardId = this.getNodeParameter('boardId', i) as string;
  const position = this.getNodeParameter('position', i) as number;
  const name = this.getNodeParameter('name', i) as string;
  const color = this.getNodeParameter('color', i) as string;

  const body: any = {
    position,
    name,
    color,
  };

  return await makeRequest.call(
    this,
    'POST',
    `${baseUrl}/api/boards/${pathSegment(this, 'boardId', boardId)}/labels`,
    body,
    accessToken,
  );
}

async function updateLabel(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const labelId = this.getNodeParameter('labelId', i) as string;
  const updateFields = this.getNodeParameter('updateFields', i, {}) as any;

  const body: any = {};

  if (updateFields.position !== undefined) body.position = updateFields.position;
  if (updateFields.name) body.name = updateFields.name;
  if (updateFields.color) body.color = updateFields.color;

  return await makeRequest.call(
    this,
    'PATCH',
    `${baseUrl}/api/labels/${pathSegment(this, 'labelId', labelId)}`,
    body,
    accessToken,
  );
}

async function deleteLabel(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const labelId = this.getNodeParameter('labelId', i) as string;

  return await makeRequest.call(
    this,
    'DELETE',
    `${baseUrl}/api/labels/${pathSegment(this, 'labelId', labelId)}`,
    null,
    accessToken,
  );
}

async function addLabelToCard(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const cardId = this.getNodeParameter('cardId', i) as string;
  const labelId = this.getNodeParameter('labelId', i) as string;

  const body: any = {
    labelId,
  };

  return await makeRequest.call(
    this,
    'POST',
    `${baseUrl}/api/cards/${pathSegment(this, 'cardId', cardId)}/card-labels`,
    body,
    accessToken,
  );
}

async function removeLabelFromCard(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const cardId = this.getNodeParameter('cardId', i) as string;
  const labelId = this.getNodeParameter('labelId', i) as string;

  return await makeRequest.call(
    this,
    'DELETE',
    `${baseUrl}/api/cards/${pathSegment(this, 'cardId', cardId)}/card-labels/labelId:${pathSegment(this, 'labelId', labelId)}`,
    null,
    accessToken,
  );
}

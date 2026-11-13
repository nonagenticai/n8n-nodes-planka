import {
  IExecuteFunctions,
  NodeOperationError,
} from 'n8n-workflow';

import { makeRequest } from '../helpers/request';
import { pathSegment } from '../helpers/pathSegment';

/**
 * Task List operations handler
 * Manages CRUD operations for task lists within cards
 */
export const taskListOperations = {
  async execute(
    this: IExecuteFunctions,
    operation: string,
    itemIndex: number,
    baseUrl: string,
    accessToken: string,
  ): Promise<any> {
    switch (operation) {
      case 'create':
        return await createTaskList.call(this, itemIndex, baseUrl, accessToken);

      case 'get':
        return await getTaskList.call(this, itemIndex, baseUrl, accessToken);

      case 'update':
        return await updateTaskList.call(this, itemIndex, baseUrl, accessToken);

      case 'delete':
        return await deleteTaskList.call(this, itemIndex, baseUrl, accessToken);

      default:
        throw new NodeOperationError(
          this.getNode(),
          `Unknown operation: ${operation}`,
        );
    }
  },
};

/**
 * Creates a task list within a card
 * @param i - Item index
 * @param baseUrl - Base URL of the Planka instance
 * @param accessToken - Access token for authentication
 * @returns Created task list object
 */
async function createTaskList(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const cardId = this.getNodeParameter('cardId', i) as string;
  const name = this.getNodeParameter('name', i) as string;
  const position = this.getNodeParameter('position', i) as number;
  const additionalFields = this.getNodeParameter('additionalFields', i, {}) as any;

  const body: any = {
    name,
    position,
  };

  if (additionalFields.showOnFrontOfCard !== undefined) {
    body.showOnFrontOfCard = additionalFields.showOnFrontOfCard;
  }
  if (additionalFields.hideCompletedTasks !== undefined) {
    body.hideCompletedTasks = additionalFields.hideCompletedTasks;
  }

  return await makeRequest.call(
    this,
    'POST',
    `${baseUrl}/api/cards/${pathSegment(this, 'cardId', cardId)}/task-lists`,
    body,
    accessToken,
  );
}

/**
 * Retrieves task list information including tasks
 * @param i - Item index
 * @param baseUrl - Base URL of the Planka instance
 * @param accessToken - Access token for authentication
 * @returns Task list details with included tasks
 */
async function getTaskList(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const taskListId = this.getNodeParameter('taskListId', i) as string;

  return await makeRequest.call(
    this,
    'GET',
    `${baseUrl}/api/task-lists/${pathSegment(this, 'taskListId', taskListId)}`,
    null,
    accessToken,
  );
}

/**
 * Updates a task list
 * @param i - Item index
 * @param baseUrl - Base URL of the Planka instance
 * @param accessToken - Access token for authentication
 * @returns Updated task list object
 */
async function updateTaskList(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const taskListId = this.getNodeParameter('taskListId', i) as string;
  const updateFields = this.getNodeParameter('updateFields', i, {}) as any;

  const body: any = {};

  if (updateFields.name) body.name = updateFields.name;
  if (updateFields.position !== undefined) body.position = updateFields.position;
  if (updateFields.showOnFrontOfCard !== undefined) {
    body.showOnFrontOfCard = updateFields.showOnFrontOfCard;
  }
  if (updateFields.hideCompletedTasks !== undefined) {
    body.hideCompletedTasks = updateFields.hideCompletedTasks;
  }

  return await makeRequest.call(
    this,
    'PATCH',
    `${baseUrl}/api/task-lists/${pathSegment(this, 'taskListId', taskListId)}`,
    body,
    accessToken,
  );
}

/**
 * Deletes a task list and all its tasks
 * @param i - Item index
 * @param baseUrl - Base URL of the Planka instance
 * @param accessToken - Access token for authentication
 * @returns Deleted task list object
 */
async function deleteTaskList(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const taskListId = this.getNodeParameter('taskListId', i) as string;

  return await makeRequest.call(
    this,
    'DELETE',
    `${baseUrl}/api/task-lists/${pathSegment(this, 'taskListId', taskListId)}`,
    null,
    accessToken,
  );
}

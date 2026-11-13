import {
  IExecuteFunctions,
  NodeOperationError,
} from 'n8n-workflow';

import { makeRequest } from '../helpers/request';
import { pathSegment } from '../helpers/pathSegment';

export const taskOperations = {
  async execute(
    this: IExecuteFunctions,
    operation: string,
    itemIndex: number,
    baseUrl: string,
    accessToken: string,
  ): Promise<any> {
    switch (operation) {
      case 'create':
        return await createTask.call(this, itemIndex, baseUrl, accessToken);

      case 'update':
        return await updateTask.call(this, itemIndex, baseUrl, accessToken);

      case 'delete':
        return await deleteTask.call(this, itemIndex, baseUrl, accessToken);

      case 'list':
        return await listTasks.call(this, itemIndex, baseUrl, accessToken);

      default:
        throw new NodeOperationError(
          this.getNode(),
          `Unknown operation: ${operation}`,
        );
    }
  },
};

async function createTask(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const taskListId = this.getNodeParameter('taskListId', i) as string;
  const name = this.getNodeParameter('name', i) as string;
  const position = this.getNodeParameter('position', i) as number;

  const body: any = {
    name,
    position,
  };

  const additionalFields = this.getNodeParameter('additionalFields', i, {}) as any;
  if (additionalFields.linkedCardId) body.linkedCardId = additionalFields.linkedCardId;
  if (additionalFields.isCompleted !== undefined) body.isCompleted = additionalFields.isCompleted;

  return await makeRequest.call(
    this,
    'POST',
    `${baseUrl}/api/task-lists/${pathSegment(this, 'taskListId', taskListId)}/tasks`,
    body,
    accessToken,
  );
}

async function updateTask(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const taskId = this.getNodeParameter('taskId', i) as string;
  const updateFields = this.getNodeParameter('updateFields', i, {}) as any;

  const body: any = {};

  if (updateFields.name) body.name = updateFields.name;
  if (updateFields.position !== undefined) body.position = updateFields.position;
  if (updateFields.isCompleted !== undefined) body.isCompleted = updateFields.isCompleted;
  if (updateFields.taskListId) body.taskListId = updateFields.taskListId;
  if (updateFields.assigneeUserId) body.assigneeUserId = updateFields.assigneeUserId;

  return await makeRequest.call(
    this,
    'PATCH',
    `${baseUrl}/api/tasks/${pathSegment(this, 'taskId', taskId)}`,
    body,
    accessToken,
  );
}

async function deleteTask(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const taskId = this.getNodeParameter('taskId', i) as string;

  return await makeRequest.call(
    this,
    'DELETE',
    `${baseUrl}/api/tasks/${pathSegment(this, 'taskId', taskId)}`,
    null,
    accessToken,
  );
}

async function listTasks(
  this: IExecuteFunctions,
  i: number,
  baseUrl: string,
  accessToken: string,
): Promise<any> {
  const taskListId = this.getNodeParameter('taskListId', i) as string;

  return await makeRequest.call(
    this,
    'GET',
    `${baseUrl}/api/task-lists/${pathSegment(this, 'taskListId', taskListId)}/tasks`,
    null,
    accessToken,
  );
}

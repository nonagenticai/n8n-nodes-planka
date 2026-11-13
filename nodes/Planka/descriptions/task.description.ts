import { INodeProperties } from 'n8n-workflow';

export const taskOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    displayOptions: { show: { resource: ['task'] } },
    options: [
      { name: 'Create', value: 'create', description: 'Create a new task', action: 'Create a task' },
      { name: 'Update', value: 'update', description: 'Update a task', action: 'Update a task' },
      { name: 'Delete', value: 'delete', description: 'Delete a task', action: 'Delete a task' },
      { name: 'List', value: 'list', description: 'List tasks in a task list', action: 'List tasks' },
    ],
    default: 'create',
  },
];

export const taskFields: INodeProperties[] = [
  // CREATE
  { displayName: 'Task List ID', name: 'taskListId', type: 'string', displayOptions: { show: { resource: ['task'], operation: ['create'] } }, default: '', required: false },
  { displayName: 'Name', name: 'name', type: 'string', displayOptions: { show: { resource: ['task'], operation: ['create'] } }, default: '', required: false },
  { displayName: 'Position', name: 'position', type: 'number', displayOptions: { show: { resource: ['task'], operation: ['create'] } }, default: 0, required: false },
  // CREATE - Additional Fields
  {
    displayName: 'Additional Fields',
    name: 'additionalFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: { show: { resource: ['task'], operation: ['create'] } },
    options: [
      { displayName: 'Linked Card ID', name: 'linkedCardId', type: 'string', default: '', description: 'ID of a card to link to this task' },
      { displayName: 'Is Completed', name: 'isCompleted', type: 'boolean', default: false, description: 'Whether the task is already completed' },
    ],
  },
  // LIST
  { displayName: 'Task List ID', name: 'taskListId', type: 'string', displayOptions: { show: { resource: ['task'], operation: ['list'] } }, default: '', required: false, description: 'ID of the task list to retrieve tasks from' },
  // UPDATE/DELETE
  { displayName: 'Task ID', name: 'taskId', type: 'string', displayOptions: { show: { resource: ['task'], operation: ['update', 'delete'] } }, default: '', required: false },
  // UPDATE
  {
    displayName: 'Update Fields',
    name: 'updateFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: { show: { resource: ['task'], operation: ['update'] } },
    options: [
      { displayName: 'Name', name: 'name', type: 'string', default: '' },
      { displayName: 'Position', name: 'position', type: 'number', default: 0 },
      { displayName: 'Is Completed', name: 'isCompleted', type: 'boolean', default: false },
      { displayName: 'Task List ID', name: 'taskListId', type: 'string', default: '', description: 'Move the task to a different task list' },
      { displayName: 'Assignee User ID', name: 'assigneeUserId', type: 'string', default: '', description: 'ID of the user to assign the task to' },
    ],
  },
];

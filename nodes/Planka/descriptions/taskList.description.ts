import { INodeProperties } from 'n8n-workflow';

export const taskListOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    displayOptions: { show: { resource: ['taskList'] } },
    options: [
      { name: 'Create', value: 'create', description: 'Create a new task list', action: 'Create a task list' },
      { name: 'Get', value: 'get', description: 'Get a task list', action: 'Get a task list' },
      { name: 'Update', value: 'update', description: 'Update a task list', action: 'Update a task list' },
      { name: 'Delete', value: 'delete', description: 'Delete a task list', action: 'Delete a task list' },
    ],
    default: 'create',
  },
];

export const taskListFields: INodeProperties[] = [
  // CREATE
  {
    displayName: 'Card ID',
    name: 'cardId',
    type: 'string',
    displayOptions: { show: { resource: ['taskList'], operation: ['create'] } },
    default: '',
    required: false,
    description: 'ID of the card to create task list in',
  },
  {
    displayName: 'Name',
    name: 'name',
    type: 'string',
    displayOptions: { show: { resource: ['taskList'], operation: ['create'] } },
    default: '',
    required: false,
    description: 'Name of the task list (max 128 characters)',
  },
  {
    displayName: 'Position',
    name: 'position',
    type: 'number',
    displayOptions: { show: { resource: ['taskList'], operation: ['create'] } },
    default: 0,
    required: false,
    description: 'Position of the task list within the card',
  },
  {
    displayName: 'Additional Fields',
    name: 'additionalFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: { show: { resource: ['taskList'], operation: ['create'] } },
    options: [
      {
        displayName: 'Show on Front of Card',
        name: 'showOnFrontOfCard',
        type: 'boolean',
        default: true,
        description: 'Whether to show the task list on the front of the card',
      },
      {
        displayName: 'Hide Completed Tasks',
        name: 'hideCompletedTasks',
        type: 'boolean',
        default: false,
        description: 'Whether to hide completed tasks',
      },
    ],
  },
  // GET / UPDATE / DELETE
  {
    displayName: 'Task List ID',
    name: 'taskListId',
    type: 'string',
    displayOptions: { show: { resource: ['taskList'], operation: ['get', 'update', 'delete'] } },
    default: '',
    required: false,
    description: 'ID of the task list',
  },
  // UPDATE
  {
    displayName: 'Update Fields',
    name: 'updateFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: { show: { resource: ['taskList'], operation: ['update'] } },
    options: [
      {
        displayName: 'Name',
        name: 'name',
        type: 'string',
        default: '',
        description: 'Name of the task list (max 128 characters)',
      },
      {
        displayName: 'Position',
        name: 'position',
        type: 'number',
        default: 0,
        description: 'Position of the task list within the card',
      },
      {
        displayName: 'Show on Front of Card',
        name: 'showOnFrontOfCard',
        type: 'boolean',
        default: true,
        description: 'Whether to show the task list on the front of the card',
      },
      {
        displayName: 'Hide Completed Tasks',
        name: 'hideCompletedTasks',
        type: 'boolean',
        default: false,
        description: 'Whether to hide completed tasks',
      },
    ],
  },
];

import { INodeProperties } from 'n8n-workflow';

export const notificationServiceOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    displayOptions: { show: { resource: ['notificationService'] } },
    options: [
      {
        name: 'Create Board Service',
        value: 'createBoard',
        description: 'Create a notification service for a board',
        action: 'Create board notification service'
      },
      {
        name: 'Create User Service',
        value: 'createUser',
        description: 'Create a notification service for a user',
        action: 'Create user notification service'
      },
      {
        name: 'Update',
        value: 'update',
        description: 'Update a notification service',
        action: 'Update notification service'
      },
      {
        name: 'Delete',
        value: 'delete',
        description: 'Delete a notification service',
        action: 'Delete notification service'
      },
      {
        name: 'Test',
        value: 'test',
        description: 'Test a notification service',
        action: 'Test notification service'
      },
    ],
    default: 'createBoard',
  },
];

export const notificationServiceFields: INodeProperties[] = [
  // CREATE BOARD
  {
    displayName: 'Board ID',
    name: 'boardId',
    type: 'string',
    displayOptions: {
      show: {
        resource: ['notificationService'],
        operation: ['createBoard']
      }
    },
    default: '',
    required: false,
    description: 'ID of the board to create notification service for',
  },
  // CREATE USER
  {
    displayName: 'User ID',
    name: 'userId',
    type: 'string',
    displayOptions: {
      show: {
        resource: ['notificationService'],
        operation: ['createUser']
      }
    },
    default: '',
    required: false,
    description: 'ID of the user to create notification service for (must be current user)',
  },
  // SHARED - URL
  {
    displayName: 'URL',
    name: 'url',
    type: 'string',
    displayOptions: {
      show: {
        resource: ['notificationService'],
        operation: ['createBoard', 'createUser']
      }
    },
    default: '',
    required: false,
    description: 'URL endpoint for notifications (webhook URL, Slack webhook, etc.)',
  },
  // SHARED - FORMAT
  {
    displayName: 'Format',
    name: 'format',
    type: 'options',
    displayOptions: {
      show: {
        resource: ['notificationService'],
        operation: ['createBoard', 'createUser']
      }
    },
    options: [
      {
        name: 'Text',
        value: 'text',
        description: 'Plain text format',
      },
      {
        name: 'Markdown',
        value: 'markdown',
        description: 'Markdown format',
      },
      {
        name: 'HTML',
        value: 'html',
        description: 'HTML format',
      },
    ],
    default: 'text',
    required: false,
    description: 'Format for notification messages',
  },

  // UPDATE/DELETE/TEST - Service ID
  {
    displayName: 'Service ID',
    name: 'serviceId',
    type: 'string',
    displayOptions: {
      show: {
        resource: ['notificationService'],
        operation: ['update', 'delete', 'test']
      }
    },
    default: '',
    required: false,
    description: 'ID of the notification service',
  },

  // UPDATE - Update Fields
  {
    displayName: 'Update Fields',
    name: 'updateFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: {
      show: {
        resource: ['notificationService'],
        operation: ['update']
      }
    },
    options: [
      {
        displayName: 'URL',
        name: 'url',
        type: 'string',
        default: '',
        description: 'URL endpoint for notifications',
      },
      {
        displayName: 'Format',
        name: 'format',
        type: 'options',
        options: [
          {
            name: 'Text',
            value: 'text',
            description: 'Plain text format',
          },
          {
            name: 'Markdown',
            value: 'markdown',
            description: 'Markdown format',
          },
          {
            name: 'HTML',
            value: 'html',
            description: 'HTML format',
          },
        ],
        default: 'text',
        description: 'Format for notification messages',
      },
    ],
  },
];

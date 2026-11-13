import { INodeProperties } from 'n8n-workflow';

export const webhookOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    displayOptions: { show: { resource: ['webhook'] } },
    options: [
      { name: 'Create', value: 'create', description: 'Create a new webhook', action: 'Create a webhook' },
      { name: 'List', value: 'list', description: 'List webhooks', action: 'List webhooks' },
      { name: 'Update', value: 'update', description: 'Update a webhook', action: 'Update a webhook' },
      { name: 'Delete', value: 'delete', description: 'Delete a webhook', action: 'Delete a webhook' },
    ],
    default: 'create',
  },
];

export const webhookFields: INodeProperties[] = [
  // CREATE
  { displayName: 'Name', name: 'name', type: 'string', displayOptions: { show: { resource: ['webhook'], operation: ['create'] } }, default: '', required: false, description: 'Webhook name' },
  { displayName: 'URL', name: 'url', type: 'string', displayOptions: { show: { resource: ['webhook'], operation: ['create', 'update'] } }, default: '', required: false, description: 'Webhook URL to call' },
  // CREATE - Additional Fields
  {
    displayName: 'Additional Fields',
    name: 'additionalFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: { show: { resource: ['webhook'], operation: ['create'] } },
    options: [
      { displayName: 'Access Token', name: 'accessToken', type: 'string', default: '', description: 'Access token for webhook authentication' },
      { displayName: 'Events', name: 'events', type: 'string', default: '', description: 'JSON array of event types to subscribe to (e.g., ["cardCreate", "cardUpdate"])' },
      { displayName: 'Excluded Events', name: 'excludedEvents', type: 'string', default: '', description: 'JSON array of event types to exclude (e.g., ["cardDelete"])' },
    ],
  },
  // UPDATE/DELETE
  { displayName: 'Webhook ID', name: 'webhookId', type: 'string', displayOptions: { show: { resource: ['webhook'], operation: ['update', 'delete'] } }, default: '', required: false },
  // UPDATE - Additional Fields
  {
    displayName: 'Update Fields',
    name: 'updateFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: { show: { resource: ['webhook'], operation: ['update'] } },
    options: [
      { displayName: 'Name', name: 'name', type: 'string', default: '', description: 'New name for the webhook' },
      { displayName: 'Access Token', name: 'accessToken', type: 'string', default: '', description: 'Access token for webhook authentication' },
      { displayName: 'Events', name: 'events', type: 'string', default: '', description: 'JSON array of event types to subscribe to (e.g., ["cardCreate", "cardUpdate"])' },
      { displayName: 'Excluded Events', name: 'excludedEvents', type: 'string', default: '', description: 'JSON array of event types to exclude (e.g., ["cardDelete"])' },
    ],
  },
];

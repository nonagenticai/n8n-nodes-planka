import { INodeProperties } from 'n8n-workflow';

export const commentOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    displayOptions: { show: { resource: ['comment'] } },
    options: [
      { name: 'Create', value: 'create', description: 'Create a new comment', action: 'Create a comment' },
      { name: 'Update', value: 'update', description: 'Update a comment', action: 'Update a comment' },
      { name: 'Delete', value: 'delete', description: 'Delete a comment', action: 'Delete a comment' },
      { name: 'List', value: 'list', description: 'List comments on a card', action: 'List comments' },
    ],
    default: 'create',
  },
];

export const commentFields: INodeProperties[] = [
  // CREATE/LIST
  { displayName: 'Card ID', name: 'cardId', type: 'string', displayOptions: { show: { resource: ['comment'], operation: ['create', 'list'] } }, default: '', required: false },
  { displayName: 'Text', name: 'text', type: 'string', typeOptions: { rows: 4 }, displayOptions: { show: { resource: ['comment'], operation: ['create', 'update'] } }, default: '', required: false },
  // UPDATE/DELETE
  { displayName: 'Comment ID', name: 'commentId', type: 'string', displayOptions: { show: { resource: ['comment'], operation: ['update', 'delete'] } }, default: '', required: false },
  // LIST
  {
    displayName: 'Additional Fields',
    name: 'additionalFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: { show: { resource: ['comment'], operation: ['list'] } },
    options: [
      { displayName: 'Before ID', name: 'beforeId', type: 'string', default: '', description: 'ID to get comments before (for pagination)' },
    ],
  },
];

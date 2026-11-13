import { INodeProperties } from 'n8n-workflow';

export const labelOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    displayOptions: { show: { resource: ['label'] } },
    options: [
      { name: 'Create', value: 'create', description: 'Create a new label', action: 'Create a label' },
      { name: 'Update', value: 'update', description: 'Update a label', action: 'Update a label' },
      { name: 'Delete', value: 'delete', description: 'Delete a label', action: 'Delete a label' },
      { name: 'Add To Card', value: 'addToCard', description: 'Add label to card', action: 'Add label to card' },
      { name: 'Remove From Card', value: 'removeFromCard', description: 'Remove label from card', action: 'Remove label from card' },
    ],
    default: 'create',
  },
];

export const labelFields: INodeProperties[] = [
  // CREATE
  { displayName: 'Board ID', name: 'boardId', type: 'string', displayOptions: { show: { resource: ['label'], operation: ['create'] } }, default: '', required: false },
  { displayName: 'Position', name: 'position', type: 'number', displayOptions: { show: { resource: ['label'], operation: ['create'] } }, default: 0, required: false },
  { displayName: 'Name', name: 'name', type: 'string', displayOptions: { show: { resource: ['label'], operation: ['create'] } }, default: '', required: false },
  { displayName: 'Color', name: 'color', type: 'string', displayOptions: { show: { resource: ['label'], operation: ['create'] } }, default: 'blue', required: false },
  // UPDATE/DELETE
  { displayName: 'Label ID', name: 'labelId', type: 'string', displayOptions: { show: { resource: ['label'], operation: ['update', 'delete', 'addToCard', 'removeFromCard'] } }, default: '', required: false },
  // UPDATE
  {
    displayName: 'Update Fields',
    name: 'updateFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: { show: { resource: ['label'], operation: ['update'] } },
    options: [
      { displayName: 'Position', name: 'position', type: 'number', default: 0 },
      { displayName: 'Name', name: 'name', type: 'string', default: '' },
      { displayName: 'Color', name: 'color', type: 'string', default: 'blue' },
    ],
  },
  // ADD TO CARD / REMOVE FROM CARD
  { displayName: 'Card ID', name: 'cardId', type: 'string', displayOptions: { show: { resource: ['label'], operation: ['addToCard', 'removeFromCard'] } }, default: '', required: false },
];

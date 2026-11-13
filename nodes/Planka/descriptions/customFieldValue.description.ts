import { INodeProperties } from 'n8n-workflow';

export const customFieldValueOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    displayOptions: {
      show: {
        resource: ['customFieldValue'],
      },
    },
    options: [
      {
        name: 'Set Value',
        value: 'set',
        description: 'Set or update a custom field value for a card',
        action: 'Set custom field value',
      },
      {
        name: 'Delete Value',
        value: 'delete',
        description: 'Delete a custom field value from a card',
        action: 'Delete custom field value',
      },
    ],
    default: 'set',
  },
];

export const customFieldValueFields: INodeProperties[] = [
  // SET/DELETE
  {
    displayName: 'Card ID',
    name: 'cardId',
    type: 'string',
    displayOptions: {
      show: {
        resource: ['customFieldValue'],
        operation: ['set', 'delete'],
      },
    },
    default: '',
    required: false,
    description: 'ID of the card to set or delete the custom field value for',
  },
  {
    displayName: 'Custom Field Group ID',
    name: 'customFieldGroupId',
    type: 'string',
    displayOptions: {
      show: {
        resource: ['customFieldValue'],
        operation: ['set', 'delete'],
      },
    },
    default: '',
    required: false,
    description: 'ID of the custom field group the value belongs to',
  },
  {
    displayName: 'Custom Field ID',
    name: 'customFieldId',
    type: 'string',
    displayOptions: {
      show: {
        resource: ['customFieldValue'],
        operation: ['set', 'delete'],
      },
    },
    default: '',
    required: false,
    description: 'ID of the custom field the value belongs to',
  },

  // SET
  {
    displayName: 'Value',
    name: 'value',
    type: 'string',
    displayOptions: {
      show: {
        resource: ['customFieldValue'],
        operation: ['set'],
      },
    },
    default: '',
    required: false,
    description: 'Value to set for the custom field (max 512 characters)',
  },
];

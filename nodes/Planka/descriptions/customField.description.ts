import { INodeProperties } from 'n8n-workflow';

export const customFieldOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    displayOptions: {
      show: {
        resource: ['customField'],
      },
    },
    options: [
      {
        name: 'Create In Base Group',
        value: 'createInBaseGroup',
        description: 'Create a custom field in a base custom field group',
        action: 'Create a custom field in base group',
      },
      {
        name: 'Create In Group',
        value: 'createInGroup',
        description: 'Create a custom field in a custom field group',
        action: 'Create a custom field in group',
      },
      {
        name: 'Update',
        value: 'update',
        description: 'Update a custom field',
        action: 'Update a custom field',
      },
      {
        name: 'Delete',
        value: 'delete',
        description: 'Delete a custom field',
        action: 'Delete a custom field',
      },
      {
        name: 'List In Base Group',
        value: 'listInBaseGroup',
        description: 'List custom fields in a base custom field group',
        action: 'List custom fields in base group',
      },
    ],
    default: 'createInBaseGroup',
  },
];

export const customFieldFields: INodeProperties[] = [
  // CREATE IN BASE GROUP
  {
    displayName: 'Base Group ID',
    name: 'baseGroupId',
    type: 'string',
    displayOptions: {
      show: {
        resource: ['customField'],
        operation: ['createInBaseGroup'],
      },
    },
    default: '',
    required: false,
    description: 'ID of the base custom field group to create the field in',
  },
  {
    displayName: 'Position',
    name: 'position',
    type: 'number',
    displayOptions: {
      show: {
        resource: ['customField'],
        operation: ['createInBaseGroup', 'createInGroup'],
      },
    },
    default: 65536,
    required: false,
    description: 'Position of the custom field within the group',
  },
  {
    displayName: 'Name',
    name: 'name',
    type: 'string',
    displayOptions: {
      show: {
        resource: ['customField'],
        operation: ['createInBaseGroup', 'createInGroup'],
      },
    },
    default: '',
    required: false,
    description: 'Name of the custom field',
  },
  {
    displayName: 'Additional Fields',
    name: 'additionalFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: {
      show: {
        resource: ['customField'],
        operation: ['createInBaseGroup', 'createInGroup'],
      },
    },
    options: [
      {
        displayName: 'Show On Front Of Card',
        name: 'showOnFrontOfCard',
        type: 'boolean',
        default: true,
        description: 'Whether to show the field on the front of cards',
      },
    ],
  },

  // CREATE IN GROUP
  {
    displayName: 'Group ID',
    name: 'groupId',
    type: 'string',
    displayOptions: {
      show: {
        resource: ['customField'],
        operation: ['createInGroup'],
      },
    },
    default: '',
    required: false,
    description: 'ID of the custom field group to create the field in',
  },

  // LIST IN BASE GROUP
  {
    displayName: 'Base Custom Field Group ID',
    name: 'baseCustomFieldGroupId',
    type: 'string',
    displayOptions: {
      show: {
        resource: ['customField'],
        operation: ['listInBaseGroup'],
      },
    },
    default: '',
    required: false,
    description: 'ID of the base custom field group to list fields from',
  },

  // UPDATE/DELETE
  {
    displayName: 'Field ID',
    name: 'fieldId',
    type: 'string',
    displayOptions: {
      show: {
        resource: ['customField'],
        operation: ['update', 'delete'],
      },
    },
    default: '',
    required: false,
    description: 'ID of the custom field',
  },

  // UPDATE
  {
    displayName: 'Update Fields',
    name: 'updateFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: {
      show: {
        resource: ['customField'],
        operation: ['update'],
      },
    },
    options: [
      {
        displayName: 'Position',
        name: 'position',
        type: 'number',
        default: 65536,
        description: 'New position for the custom field',
      },
      {
        displayName: 'Name',
        name: 'name',
        type: 'string',
        default: '',
        description: 'New name for the custom field',
      },
      {
        displayName: 'Show On Front Of Card',
        name: 'showOnFrontOfCard',
        type: 'boolean',
        default: true,
        description: 'Whether to show the field on the front of cards',
      },
    ],
  },
];

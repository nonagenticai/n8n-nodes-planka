import { INodeProperties } from 'n8n-workflow';

export const customFieldGroupOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    displayOptions: {
      show: {
        resource: ['customFieldGroup'],
      },
    },
    options: [
      {
        name: 'Create Board Group',
        value: 'createBoardGroup',
        description: 'Create a custom field group within a board',
        action: 'Create a board custom field group',
      },
      {
        name: 'Create Card Group',
        value: 'createCardGroup',
        description: 'Create a custom field group for a card',
        action: 'Create a card custom field group',
      },
      {
        name: 'Get',
        value: 'get',
        description: 'Get a custom field group',
        action: 'Get a custom field group',
      },
      {
        name: 'Update',
        value: 'update',
        description: 'Update a custom field group',
        action: 'Update a custom field group',
      },
      {
        name: 'Delete',
        value: 'delete',
        description: 'Delete a custom field group',
        action: 'Delete a custom field group',
      },
    ],
    default: 'createBoardGroup',
  },
];

export const customFieldGroupFields: INodeProperties[] = [
  // CREATE BOARD GROUP
  {
    displayName: 'Board ID',
    name: 'boardId',
    type: 'string',
    displayOptions: {
      show: {
        resource: ['customFieldGroup'],
        operation: ['createBoardGroup'],
      },
    },
    default: '',
    required: false,
    description: 'ID of the board to create the custom field group in',
  },
  {
    displayName: 'Position',
    name: 'position',
    type: 'number',
    displayOptions: {
      show: {
        resource: ['customFieldGroup'],
        operation: ['createBoardGroup'],
      },
    },
    default: 65536,
    required: false,
    description: 'Position of the custom field group within the board',
  },
  {
    displayName: 'Creation Type',
    name: 'creationType',
    type: 'options',
    displayOptions: {
      show: {
        resource: ['customFieldGroup'],
        operation: ['createBoardGroup'],
      },
    },
    options: [
      {
        name: 'From Base Group',
        value: 'fromBase',
        description: 'Create from an existing base custom field group',
      },
      {
        name: 'New Group',
        value: 'new',
        description: 'Create a new custom field group with a name',
      },
    ],
    default: 'new',
    required: false,
    description: 'How to create the custom field group',
  },
  {
    displayName: 'Base Custom Field Group ID',
    name: 'baseCustomFieldGroupId',
    type: 'string',
    displayOptions: {
      show: {
        resource: ['customFieldGroup'],
        operation: ['createBoardGroup'],
        creationType: ['fromBase'],
      },
    },
    default: '',
    required: false,
    description: 'ID of the base custom field group to create from',
  },
  {
    displayName: 'Name',
    name: 'name',
    type: 'string',
    displayOptions: {
      show: {
        resource: ['customFieldGroup'],
        operation: ['createBoardGroup'],
        creationType: ['new'],
      },
    },
    default: '',
    required: false,
    description: 'Name of the custom field group',
  },

  // CREATE CARD GROUP
  {
    displayName: 'Card ID',
    name: 'cardId',
    type: 'string',
    displayOptions: {
      show: {
        resource: ['customFieldGroup'],
        operation: ['createCardGroup'],
      },
    },
    default: '',
    required: false,
    description: 'ID of the card to create the custom field group for',
  },
  {
    displayName: 'Position',
    name: 'position',
    type: 'number',
    displayOptions: {
      show: {
        resource: ['customFieldGroup'],
        operation: ['createCardGroup'],
      },
    },
    default: 65536,
    required: false,
    description: 'Position of the custom field group within the card',
  },
  {
    displayName: 'Creation Type',
    name: 'creationType',
    type: 'options',
    displayOptions: {
      show: {
        resource: ['customFieldGroup'],
        operation: ['createCardGroup'],
      },
    },
    options: [
      {
        name: 'New Group',
        value: 'new',
        description: 'Create a new custom field group with a name',
      },
      {
        name: 'From Base Group',
        value: 'fromBase',
        description: 'Create from an existing base custom field group',
      },
    ],
    default: 'new',
    required: false,
    description: 'How to create the custom field group',
  },
  {
    displayName: 'Base Custom Field Group ID',
    name: 'baseCustomFieldGroupId',
    type: 'string',
    displayOptions: {
      show: {
        resource: ['customFieldGroup'],
        operation: ['createCardGroup'],
        creationType: ['fromBase'],
      },
    },
    default: '',
    required: false,
    description: 'ID of the base custom field group to attach to the card',
  },
  {
    displayName: 'Name',
    name: 'name',
    type: 'string',
    displayOptions: {
      show: {
        resource: ['customFieldGroup'],
        operation: ['createCardGroup'],
        creationType: ['new'],
      },
    },
    default: '',
    required: false,
    description: 'Name of the custom field group',
  },

  // GET/UPDATE/DELETE
  {
    displayName: 'Group ID',
    name: 'groupId',
    type: 'string',
    displayOptions: {
      show: {
        resource: ['customFieldGroup'],
        operation: ['get', 'update', 'delete'],
      },
    },
    default: '',
    required: false,
    description: 'ID of the custom field group',
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
        resource: ['customFieldGroup'],
        operation: ['update'],
      },
    },
    options: [
      {
        displayName: 'Name',
        name: 'name',
        type: 'string',
        default: '',
        description: 'New name for the custom field group',
      },
      {
        displayName: 'Position',
        name: 'position',
        type: 'number',
        default: 0,
        description: 'New position for the custom field group',
      },
    ],
  },
];

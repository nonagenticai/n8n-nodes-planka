import { INodeProperties } from 'n8n-workflow';

export const listOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    displayOptions: {
      show: {
        resource: ['list'],
      },
    },
    options: [
      {
        name: 'Create',
        value: 'create',
        description: 'Create a new list',
        action: 'Create a list',
      },
      {
        name: 'Get',
        value: 'get',
        description: 'Get a list',
        action: 'Get a list',
      },
      {
        name: 'Get by Name',
        value: 'getByName',
        description: 'Get the one list on a board with this name (trimmed, case-insensitive by default); typed error when absent or ambiguous',
        action: 'Get a list by name',
      },
      {
        name: 'Update',
        value: 'update',
        description: 'Update a list',
        action: 'Update a list',
      },
      {
        name: 'Delete',
        value: 'delete',
        description: 'Delete a list',
        action: 'Delete a list',
      },
      {
        name: 'Move Cards',
        value: 'moveCards',
        description: 'Move cards to this list',
        action: 'Move cards to list',
      },
      {
        name: 'Sort',
        value: 'sort',
        description: 'Sort cards in list',
        action: 'Sort list',
      },
      {
        name: 'Clear',
        value: 'clear',
        description: 'Clear all cards from list (trash lists only)',
        action: 'Clear list',
      },
    ],
    default: 'create',
  },
];

export const listFields: INodeProperties[] = [
  // GET BY NAME
  {
    displayName: 'Board ID',
    name: 'boardId',
    type: 'string',
    displayOptions: {
      show: {
        resource: ['list'],
        operation: ['getByName'],
      },
    },
    default: '',
    required: false,
    description: 'ID of the board whose lists are searched',
  },
  {
    displayName: 'List Name',
    name: 'listName',
    type: 'string',
    displayOptions: {
      show: {
        resource: ['list'],
        operation: ['getByName'],
      },
    },
    default: '',
    required: false,
    placeholder: 'QA',
    description: 'Name of the list. Compared after trimming; case-insensitive unless Case Sensitive is on.',
  },
  {
    displayName: 'Case Sensitive',
    name: 'caseSensitive',
    type: 'boolean',
    displayOptions: {
      show: {
        resource: ['list'],
        operation: ['getByName'],
      },
    },
    default: false,
    description: 'Whether the name must match case exactly',
  },
  // CREATE
  {
    displayName: 'Board ID',
    name: 'boardId',
    type: 'string',
    displayOptions: {
      show: {
        resource: ['list'],
        operation: ['create'],
      },
    },
    default: '',
    required: false,
    description: 'ID of the board to create the list in',
  },
  {
    displayName: 'Type',
    name: 'type',
    type: 'options',
    displayOptions: {
      show: {
        resource: ['list'],
        operation: ['create'],
      },
    },
    options: [
      {
        name: 'Active',
        value: 'active',
        description: 'Active list for regular use',
      },
      {
        name: 'Closed',
        value: 'closed',
        description: 'Closed/archived list',
      },
    ],
    default: 'active',
    required: false,
    description: 'The type of list to create',
  },
  {
    displayName: 'Position',
    name: 'position',
    type: 'number',
    displayOptions: {
      show: {
        resource: ['list'],
        operation: ['create'],
      },
    },
    default: 0,
    required: false,
    description: 'Position of the list in the board',
  },
  {
    displayName: 'Name',
    name: 'name',
    type: 'string',
    displayOptions: {
      show: {
        resource: ['list'],
        operation: ['create'],
      },
    },
    default: '',
    required: false,
    description: 'Name of the list',
  },

  // GET/UPDATE/DELETE/SORT/CLEAR
  {
    displayName: 'List ID',
    name: 'listId',
    type: 'string',
    displayOptions: {
      show: {
        resource: ['list'],
        operation: ['get', 'update', 'delete', 'moveCards', 'sort', 'clear'],
      },
    },
    default: '',
    required: false,
    description: 'ID of the list',
  },

  // SORT
  {
    displayName: 'Sort Field',
    name: 'fieldName',
    type: 'options',
    required: false,
    options: [
      { name: 'Name', value: 'name' },
      { name: 'Due Date', value: 'dueDate' },
      { name: 'Created At', value: 'createdAt' },
    ],
    default: 'name',
    description: 'Field to sort cards by',
    displayOptions: { show: { resource: ['list'], operation: ['sort'] } },
  },
  {
    displayName: 'Order',
    name: 'order',
    type: 'options',
    options: [
      { name: 'Ascending', value: 'asc' },
      { name: 'Descending', value: 'desc' },
    ],
    default: 'asc',
    description: 'Sort order',
    displayOptions: { show: { resource: ['list'], operation: ['sort'] } },
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
        resource: ['list'],
        operation: ['update'],
      },
    },
    options: [
      {
        displayName: 'Position',
        name: 'position',
        type: 'number',
        default: 0,
        description: 'New position for the list',
      },
      {
        displayName: 'Name',
        name: 'name',
        type: 'string',
        default: '',
        description: 'New name for the list',
      },
      {
        displayName: 'Board ID',
        name: 'boardId',
        type: 'string',
        default: '',
        description: 'Move the list to a different board',
      },
      {
        displayName: 'Type',
        name: 'type',
        type: 'string',
        default: '',
        description: 'Type of the list (e.g., active, closed)',
      },
      {
        displayName: 'Color',
        name: 'color',
        type: 'string',
        default: '',
        description: 'Color of the list',
      },
    ],
  },

  // MOVE CARDS
  {
    displayName: 'Target List ID',
    name: 'targetListId',
    type: 'string',
    displayOptions: {
      show: {
        resource: ['list'],
        operation: ['moveCards'],
      },
    },
    default: '',
    required: false,
    description: 'ID of the target list (must be an archive-type list). All cards from the source list will be moved to this list.',
    placeholder: '1357158568008091265',
  },
];

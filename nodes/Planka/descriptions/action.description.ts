import { INodeProperties } from 'n8n-workflow';

export const actionOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    displayOptions: {
      show: {
        resource: ['action'],
      },
    },
    options: [
      {
        name: 'Get Board Actions',
        value: 'getBoardActions',
        description: 'Get activity history for a board',
        action: 'Get board actions',
      },
      {
        name: 'Get Card Actions',
        value: 'getCardActions',
        description: 'Get activity history for a card',
        action: 'Get card actions',
      },
    ],
    default: 'getBoardActions',
  },
];

export const actionFields: INodeProperties[] = [
  // RETURN ALL (both operations)
  {
    displayName: 'Return All',
    name: 'returnAll',
    type: 'boolean',
    displayOptions: {
      show: {
        resource: ['action'],
        operation: ['getBoardActions', 'getCardActions'],
      },
    },
    default: false,
    description:
      'Whether to follow beforeId pagination (Planka returns 50 actions per page) and return every action as ONE item {items, included, pages}. Off: a single page, unchanged. Throws pagination_ceiling rather than truncate after 200 pages.',
  },

  // GET BOARD ACTIONS fields
  {
    displayName: 'Board ID',
    name: 'boardId',
    type: 'string',
    displayOptions: {
      show: {
        resource: ['action'],
        operation: ['getBoardActions'],
      },
    },
    default: '',
    required: false,
    description: 'ID of the board to get actions for',
  },
  {
    displayName: 'Additional Fields',
    name: 'additionalFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: {
      show: {
        resource: ['action'],
        operation: ['getBoardActions'],
      },
    },
    options: [
      {
        displayName: 'Before ID',
        name: 'beforeId',
        type: 'string',
        default: '',
        description: 'ID to get actions before (for pagination)',
      },
    ],
  },

  // GET CARD ACTIONS fields
  {
    displayName: 'Card ID',
    name: 'cardId',
    type: 'string',
    displayOptions: {
      show: {
        resource: ['action'],
        operation: ['getCardActions'],
      },
    },
    default: '',
    required: false,
    description: 'ID of the card to get actions for',
  },
  {
    displayName: 'Additional Fields',
    name: 'additionalFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: {
      show: {
        resource: ['action'],
        operation: ['getCardActions'],
      },
    },
    options: [
      {
        displayName: 'Before ID',
        name: 'beforeId',
        type: 'string',
        default: '',
        description: 'ID to get actions before (for pagination)',
      },
    ],
  },
];

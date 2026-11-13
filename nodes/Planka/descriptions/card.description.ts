import { INodeProperties } from 'n8n-workflow';

export const cardOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    displayOptions: {
      show: {
        resource: ['card'],
      },
    },
    options: [
      {
        name: 'Create',
        value: 'create',
        description: 'Create a new card',
        action: 'Create a card',
      },
      {
        name: 'Get',
        value: 'get',
        description: 'Get a card',
        action: 'Get a card',
      },
      {
        name: 'Get Ancestor Chain',
        value: 'getAncestorChain',
        description: 'Walk Relations.parent_card upward and resolve the first ancestor Metadata.project_id; every refusal is a named stop',
        action: 'Get a card ancestor chain',
      },
      {
        name: 'Update',
        value: 'update',
        description: 'Update a card',
        action: 'Update a card',
      },
      {
        name: 'Delete',
        value: 'delete',
        description: 'Delete a card',
        action: 'Delete a card',
      },
      {
        name: 'Duplicate',
        value: 'duplicate',
        description: 'Duplicate a card',
        action: 'Duplicate a card',
      },
      {
        name: 'Read Notifications',
        value: 'readNotifications',
        description: 'Mark card notifications as read',
        action: 'Mark notifications as read',
      },
      {
        name: 'List In List',
        value: 'listInList',
        description: 'List cards in a specific list with filtering',
        action: 'List cards in list',
      },
    ],
    default: 'create',
  },
];

export const cardFields: INodeProperties[] = [
  // CREATE
  {
    displayName: 'List ID',
    name: 'listId',
    type: 'string',
    displayOptions: {
      show: {
        resource: ['card'],
        operation: ['create'],
      },
    },
    default: '',
    required: false,
    description: 'ID of the list to create the card in',
  },
  {
    displayName: 'Position',
    name: 'position',
    type: 'number',
    displayOptions: {
      show: {
        resource: ['card'],
        operation: ['create'],
      },
    },
    default: 0,
    required: false,
    description: 'Position of the card in the list',
  },
  {
    displayName: 'Name',
    name: 'name',
    type: 'string',
    displayOptions: {
      show: {
        resource: ['card'],
        operation: ['create'],
      },
    },
    default: '',
    required: false,
    description: 'Name of the card',
  },
  {
    displayName: 'Type',
    name: 'type',
    type: 'options',
    displayOptions: {
      show: {
        resource: ['card'],
        operation: ['create'],
      },
    },
    options: [
      {
        name: 'Project',
        value: 'project',
        description: 'Project card',
      },
      {
        name: 'Story',
        value: 'story',
        description: 'Story/user story card',
      },
    ],
    default: 'project',
    required: false,
    description: 'Type of the card',
  },
  {
    displayName: 'Additional Fields',
    name: 'additionalFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: {
      show: {
        resource: ['card'],
        operation: ['create'],
      },
    },
    options: [
      {
        displayName: 'Description',
        name: 'description',
        type: 'string',
        default: '',
        description: 'Description of the card',
      },
      {
        displayName: 'Due Date',
        name: 'dueDate',
        type: 'dateTime',
        default: '',
        description: 'Due date for the card',
      },
      {
        displayName: 'Stopwatch Action',
        name: 'stopwatchAction',
        type: 'options',
        options: [
          { name: 'No Change', value: 'none' },
          { name: 'Start', value: 'start', description: 'Start the stopwatch now' },
          { name: 'Clear', value: 'clear', description: 'Reset stopwatch to null' },
        ],
        default: 'none',
        description: 'Control the card stopwatch',
      },
      {
        displayName: 'Is Due Completed',
        name: 'isDueCompleted',
        type: 'boolean',
        default: false,
        description: 'Whether the due date is marked as completed',
      },
    ],
  },

  // DUPLICATE fields
  {
    displayName: 'Duplicate Options',
    name: 'duplicateOptions',
    type: 'collection',
    placeholder: 'Add Option',
    default: {},
    displayOptions: { show: { resource: ['card'], operation: ['duplicate'] } },
    options: [
      {
        displayName: 'Name',
        name: 'name',
        type: 'string',
        default: '',
        description: 'Name for the duplicated card (defaults to original name)',
      },
      {
        displayName: 'Position',
        name: 'position',
        type: 'number',
        default: 0,
        description: 'Position for the duplicated card within the list',
      },
      {
        displayName: 'Board ID',
        name: 'boardId',
        type: 'string',
        default: '',
        description: 'ID of the board to duplicate the card to',
      },
      {
        displayName: 'List ID',
        name: 'listId',
        type: 'string',
        default: '',
        description: 'ID of the list to duplicate the card to',
      },
    ],
  },

  // GET/UPDATE/DELETE/DUPLICATE/READ NOTIFICATIONS
  {
    displayName: 'Card ID',
    name: 'cardId',
    type: 'string',
    displayOptions: {
      show: {
        resource: ['card'],
        operation: ['get', 'getAncestorChain', 'update', 'delete', 'duplicate', 'readNotifications'],
      },
    },
    default: '',
    required: false,
    description: 'ID of the card',
  },

  // GET ANCESTOR CHAIN
  {
    displayName: 'Depth Cap',
    name: 'cap',
    type: 'number',
    typeOptions: { minValue: 1, maxValue: 100 },
    displayOptions: {
      show: {
        resource: ['card'],
        operation: ['getAncestorChain'],
      },
    },
    default: 40,
    description: 'Maximum number of ancestor cards fetched. Hitting it is the named stop depth_cap_reached, never an empty answer.',
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
        resource: ['card'],
        operation: ['update'],
      },
    },
    options: [
      {
        displayName: 'Position',
        name: 'position',
        type: 'number',
        default: 0,
        description: 'New position for the card',
      },
      {
        displayName: 'Name',
        name: 'name',
        type: 'string',
        default: '',
        description: 'New name for the card',
      },
      {
        displayName: 'Description',
        name: 'description',
        type: 'string',
        default: '',
        description: 'New description for the card',
      },
      {
        displayName: 'Due Date',
        name: 'dueDate',
        type: 'dateTime',
        default: '',
        description: 'New due date for the card',
      },
      {
        displayName: 'Stopwatch Action',
        name: 'stopwatchAction',
        type: 'options',
        options: [
          { name: 'No Change', value: 'none' },
          { name: 'Start', value: 'start', description: 'Start the stopwatch now' },
          { name: 'Stop', value: 'stop', description: 'Stop and accumulate time' },
          { name: 'Clear', value: 'clear', description: 'Reset stopwatch to null' },
        ],
        default: 'none',
        description: 'Control the card stopwatch',
      },
      {
        displayName: 'List ID',
        name: 'listId',
        type: 'string',
        default: '',
        description: 'Move card to different list',
      },
      {
        // WHY THIS EXISTS, and why its absence was invisible for months.
        //
        // updateCard() has read `fields.customFields` and called applyCustomFields()
        // since 2026-05-04, and workflow JSON has been setting it -- but this option
        // was never declared, in EITHER collection. n8n resolves a DECLARED collection
        // to its DECLARED sub-keys only, so `customFields` was stripped before the
        // handler ever saw it. applyCustomFields() was therefore never CALLED -- which
        // is why nothing appeared in the logs: not the "not found on board" skip, not
        // the "missing item.boardId" warn. Silence read as success.
        //
        // Measured 2026-08-25: n8n run 572316 moved a card READY->BLOCKED with
        // customFields carrying a composed block_reason, on a board where the
        // block_reason field exists. custom_field_value rows written: ZERO.
        //
        // Typed as `string` (not `json`) deliberately: every existing call site passes
        // a JSON-stringified expression, and parseCustomFields() already accepts both a
        // string-encoded map and a parsed object. Typing it `json` would change how n8n
        // renders and coerces the value for those call sites.
        displayName: 'Custom Fields',
        name: 'customFields',
        type: 'string',
        default: '',
        description:
          'Custom field values as a name-to-value map, JSON-encoded (e.g. {"block_reason":"evidence_gap"}). Names are resolved to the board\'s custom fields; a name the board does not define is skipped with a warning.',
      },
      {
        displayName: 'Board ID',
        name: 'boardId',
        type: 'string',
        default: '',
        description: 'Move card to a different board',
      },
      {
        displayName: 'Cover Attachment ID',
        name: 'coverAttachmentId',
        type: 'string',
        default: '',
        description: 'ID of the attachment to use as cover image',
      },
      {
        displayName: 'Type',
        name: 'type',
        type: 'string',
        default: '',
        description: 'Type of the card',
      },
      {
        displayName: 'Is Due Completed',
        name: 'isDueCompleted',
        type: 'boolean',
        default: false,
        description: 'Whether the due date is marked as completed',
      },
      {
        displayName: 'Is Subscribed',
        name: 'isSubscribed',
        type: 'boolean',
        default: false,
        description: 'Whether to subscribe to the card',
      },
    ],
  },

  // LIST IN LIST
  {
    displayName: 'List ID',
    name: 'listId',
    type: 'string',
    displayOptions: {
      show: {
        resource: ['card'],
        operation: ['listInList'],
      },
    },
    default: '',
    required: false,
    description: 'ID of the list to get cards from',
  },
  {
    displayName: 'Filters',
    name: 'filters',
    type: 'collection',
    placeholder: 'Add Filter',
    default: {},
    displayOptions: {
      show: {
        resource: ['card'],
        operation: ['listInList'],
      },
    },
    options: [
      {
        displayName: 'Before List Changed At',
        name: 'beforeListChangedAt',
        type: 'string',
        default: '',
        description: 'Pagination cursor field listChangedAt (use together with Before ID)',
        placeholder: '2024-01-01T00:00:00.000Z',
      },
      {
        displayName: 'Before ID',
        name: 'beforeId',
        type: 'string',
        default: '',
        description: 'Pagination cursor field id (use together with Before List Changed At)',
      },
      {
        displayName: 'Search',
        name: 'search',
        type: 'string',
        default: '',
        description: 'Search term to filter cards',
      },
      {
        displayName: 'User IDs',
        name: 'userIds',
        type: 'string',
        default: '',
        description: 'Comma-separated user IDs to filter by members or task assignees',
        placeholder: 'user1,user2,user3',
      },
      {
        displayName: 'Label IDs',
        name: 'labelIds',
        type: 'string',
        default: '',
        description: 'Comma-separated label IDs to filter by labels',
        placeholder: 'label1,label2,label3',
      },
    ],
  },
];

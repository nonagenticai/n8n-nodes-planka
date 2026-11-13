import { INodeProperties } from 'n8n-workflow';

export const boardOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    displayOptions: {
      show: {
        resource: ['board'],
      },
    },
    options: [
      {
        name: 'Create',
        value: 'create',
        description: 'Create a new board',
        action: 'Create a board',
      },
      {
        name: 'Get',
        value: 'get',
        description: 'Get a board',
        action: 'Get a board',
      },
      {
        name: 'Update',
        value: 'update',
        description: 'Update a board',
        action: 'Update a board',
      },
      {
        name: 'Delete',
        value: 'delete',
        description: 'Delete a board',
        action: 'Delete a board',
      },
    ],
    default: 'create',
  },
];

export const boardFields: INodeProperties[] = [
  // CREATE fields
  {
    displayName: 'Project ID',
    name: 'projectId',
    type: 'string',
    displayOptions: {
      show: {
        resource: ['board'],
        operation: ['create'],
      },
    },
    default: '',
    required: false,
    description: 'ID of the project to create the board in',
  },
  {
    displayName: 'Position',
    name: 'position',
    type: 'number',
    displayOptions: {
      show: {
        resource: ['board'],
        operation: ['create'],
      },
    },
    default: 0,
    required: false,
    description: 'Position of the board in the project',
  },
  {
    displayName: 'Name',
    name: 'name',
    type: 'string',
    displayOptions: {
      show: {
        resource: ['board'],
        operation: ['create'],
      },
    },
    default: '',
    required: false,
    description: 'Name of the board',
  },

  // GET/UPDATE/DELETE fields
  {
    displayName: 'Board ID',
    name: 'boardId',
    type: 'string',
    displayOptions: {
      show: {
        resource: ['board'],
        operation: ['get', 'update', 'delete'],
      },
    },
    default: '',
    required: false,
    description: 'ID of the board',
  },

  // GET options
  {
    displayName: 'Lean Included',
    name: 'leanIncluded',
    type: 'boolean',
    displayOptions: {
      show: {
        resource: ['board'],
        operation: ['get'],
      },
    },
    default: false,
    description:
      'Whether to return only included.lists and a reduced included.cards ({id, listId, name}). '
      + 'THIS IS A WHITELIST, NOT A "drop the customField keys" switch: it REBUILDS `included` '
      + 'from `lists` + `cards` alone, so EVERY other key is lost - not just customFieldValues, '
      + 'customFields, customFieldGroups and tasks, but also labels, cardLabels, cardMemberships, '
      + 'taskLists, users, boardMemberships, projects, attachments and any key Planka adds in '
      + 'future. If you need to shed only a few heavy keys and keep the rest, use "Omit Included '
      + 'Keys" (the blacklist counterpart) instead. A board:get response is ~95% of some '
      + 'executions and most of it is never read; on 2026-09-02 that weight OOM-killed the n8n '
      + 'pod and destroyed ~1,051 executions. '
      + 'DEFAULT OFF ON PURPOSE: board:get is the only source of the board-level customField '
      + 'GROUP/FIELD DEFINITIONS (card:get returns values, not defs), which the AA promote path '
      + 'reads to resolve Runtime State. Enable it only where the consumers are known to read '
      + 'nothing but lists and card id/listId.',
  },
  {
    displayName: 'Omit Included Keys',
    name: 'omitIncluded',
    type: 'multiOptions',
    displayOptions: {
      show: {
        resource: ['board'],
        operation: ['get'],
      },
    },
    default: [],
    options: [
      { name: 'Board Memberships', value: 'boardMemberships' },
      { name: 'Labels', value: 'labels' },
      { name: 'Lists', value: 'lists' },
      { name: 'Cards', value: 'cards' },
      { name: 'Card Memberships', value: 'cardMemberships' },
      { name: 'Card Labels', value: 'cardLabels' },
      { name: 'Task Lists', value: 'taskLists' },
      { name: 'Tasks', value: 'tasks' },
      { name: 'Custom Field Groups', value: 'customFieldGroups' },
      { name: 'Custom Fields', value: 'customFields' },
      { name: 'Custom Field Values', value: 'customFieldValues' },
      { name: 'Users', value: 'users' },
      { name: 'Projects', value: 'projects' },
      { name: 'Attachments', value: 'attachments' },
    ],
    description:
      'Which `included` keys to DROP from the board:get response. This is a BLACKLIST and the '
      + 'counterpart to "Lean Included"\'s whitelist: every key you do NOT select survives '
      + 'untouched, including keys not offered in this list and keys Planka adds in future. The '
      + 'default [] is a strict no-op - the response is byte-for-byte what the API returned. Use '
      + 'this at call sites that must keep the board-level customField DEFINITIONS (which '
      + 'card:get cannot supply) while still shedding the multi-MB bulk keys. '
      + 'WARNING: dropping a key a downstream node reads fails SILENTLY - the consumer sees an '
      + 'empty find()/undefined lookup, not an error - so trace every consumer of this call site '
      + 'before selecting anything. The 14 options are the keys measured on a live production '
      + 'board:get payload.',
  },

  // UPDATE fields
  {
    displayName: 'Update Fields',
    name: 'updateFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: {
      show: {
        resource: ['board'],
        operation: ['update'],
      },
    },
    options: [
      {
        displayName: 'Position',
        name: 'position',
        type: 'number',
        default: 0,
        description: 'New position for the board',
      },
      {
        displayName: 'Name',
        name: 'name',
        type: 'string',
        default: '',
        description: 'New name for the board',
      },
      {
        displayName: 'Default View',
        name: 'defaultView',
        type: 'string',
        default: '',
        description: 'Default view for the board (e.g., kanban, list, grid)',
      },
      {
        displayName: 'Default Card Type',
        name: 'defaultCardType',
        type: 'string',
        default: '',
        description: 'Default card type for new cards',
      },
      {
        displayName: 'Limit Card Types To Default One',
        name: 'limitCardTypesToDefaultOne',
        type: 'boolean',
        default: false,
        description: 'Whether to limit card types to the default one',
      },
      {
        displayName: 'Always Display Card Creator',
        name: 'alwaysDisplayCardCreator',
        type: 'boolean',
        default: false,
        description: 'Whether to always display the card creator',
      },
      {
        displayName: 'Expand Task Lists By Default',
        name: 'expandTaskListsByDefault',
        type: 'boolean',
        default: false,
        description: 'Whether to expand task lists by default',
      },
      {
        displayName: 'Is Subscribed',
        name: 'isSubscribed',
        type: 'boolean',
        default: false,
        description: 'Whether to subscribe to the board',
      },
    ],
  },
];

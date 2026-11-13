import { INodeProperties } from 'n8n-workflow';

export const termsOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    displayOptions: { show: { resource: ['terms'] } },
    options: [
      { name: 'Get', value: 'get', description: 'Get terms and conditions', action: 'Get terms and conditions' },
    ],
    default: 'get',
  },
];

export const termsFields: INodeProperties[] = [
  {
    displayName: 'Additional Fields',
    name: 'additionalFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: { show: { resource: ['terms'], operation: ['get'] } },
    options: [
      {
        displayName: 'Language',
        name: 'language',
        type: 'options',
        options: [
          { name: 'English (US)', value: 'en-US' },
          { name: 'German (DE)', value: 'de-DE' },
        ],
        default: 'en-US',
        description: 'Language code for terms localization',
      },
    ],
  },
];

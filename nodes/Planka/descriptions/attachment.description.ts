import { INodeProperties } from 'n8n-workflow';

export const attachmentOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    displayOptions: { show: { resource: ['attachment'] } },
    options: [
      { name: 'Create', value: 'create', description: 'Upload an attachment', action: 'Create an attachment' },
      { name: 'Update', value: 'update', description: 'Update an attachment name', action: 'Update an attachment' },
      { name: 'Delete', value: 'delete', description: 'Delete an attachment', action: 'Delete an attachment' },
    ],
    default: 'create',
  },
];

export const attachmentFields: INodeProperties[] = [
  // CREATE
  { displayName: 'Card ID', name: 'cardId', type: 'string', displayOptions: { show: { resource: ['attachment'], operation: ['create'] } }, default: '', required: false },
  {
    displayName: 'Attachment Type',
    name: 'attachmentType',
    type: 'options',
    displayOptions: { show: { resource: ['attachment'], operation: ['create'] } },
    options: [
      { name: 'File', value: 'file', description: 'Upload a file attachment' },
      { name: 'Link', value: 'link', description: 'Create a link attachment' },
    ],
    default: 'file',
    required: false,
    description: 'Type of attachment to create',
  },
  { displayName: 'Binary Property', name: 'binaryPropertyName', type: 'string', displayOptions: { show: { resource: ['attachment'], operation: ['create'], attachmentType: ['file'] } }, default: 'data', required: false, description: 'Name of the binary property containing the file' },
  { displayName: 'URL', name: 'linkUrl', type: 'string', displayOptions: { show: { resource: ['attachment'], operation: ['create'], attachmentType: ['link'] } }, default: '', required: false, description: 'URL for the link attachment' },
  { displayName: 'Name', name: 'linkName', type: 'string', displayOptions: { show: { resource: ['attachment'], operation: ['create'], attachmentType: ['link'] } }, default: '', description: 'Display name for the link attachment' },
  // UPDATE
  { displayName: 'Attachment ID', name: 'attachmentId', type: 'string', displayOptions: { show: { resource: ['attachment'], operation: ['update', 'delete'] } }, default: '', required: false },
  { displayName: 'Name', name: 'name', type: 'string', displayOptions: { show: { resource: ['attachment'], operation: ['update'] } }, default: '', required: false },
];

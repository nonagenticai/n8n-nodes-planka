import { INodeProperties } from 'n8n-workflow';

export const baseCustomFieldGroupOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    displayOptions: { show: { resource: ['baseCustomFieldGroup'] } },
    options: [
      {
        name: 'Create',
        value: 'create',
        description: 'Create a base custom field group',
        action: 'Create base custom field group'
      },
      {
        name: 'Update',
        value: 'update',
        description: 'Update a base custom field group',
        action: 'Update base custom field group'
      },
      {
        name: 'Delete',
        value: 'delete',
        description: 'Delete a base custom field group',
        action: 'Delete base custom field group'
      },
    ],
    default: 'create',
  },
];

export const baseCustomFieldGroupFields: INodeProperties[] = [
  // CREATE - Project ID
  {
    displayName: 'Project ID',
    name: 'projectId',
    type: 'string',
    displayOptions: {
      show: {
        resource: ['baseCustomFieldGroup'],
        operation: ['create']
      }
    },
    default: '',
    required: false,
    description: 'ID of the project to create the base custom field group in',
  },

  // CREATE - Name
  {
    displayName: 'Name',
    name: 'name',
    type: 'string',
    displayOptions: {
      show: {
        resource: ['baseCustomFieldGroup'],
        operation: ['create']
      }
    },
    default: '',
    required: false,
    description: 'Name of the base custom field group',
  },

  // UPDATE/DELETE - Group ID
  {
    displayName: 'Group ID',
    name: 'groupId',
    type: 'string',
    displayOptions: {
      show: {
        resource: ['baseCustomFieldGroup'],
        operation: ['update', 'delete']
      }
    },
    default: '',
    required: false,
    description: 'ID of the base custom field group',
  },

  // UPDATE - Update Fields
  {
    displayName: 'Update Fields',
    name: 'updateFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: {
      show: {
        resource: ['baseCustomFieldGroup'],
        operation: ['update']
      }
    },
    options: [
      {
        displayName: 'Name',
        name: 'name',
        type: 'string',
        default: '',
        description: 'New name for the base custom field group',
      },
    ],
  },
];

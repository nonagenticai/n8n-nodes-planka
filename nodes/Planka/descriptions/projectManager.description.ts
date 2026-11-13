import { INodeProperties } from 'n8n-workflow';

export const projectManagerOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    displayOptions: {
      show: {
        resource: ['projectManager'],
      },
    },
    options: [
      {
        name: 'Add',
        value: 'add',
        description: 'Add a project manager to a project',
        action: 'Add project manager',
      },
      {
        name: 'Remove',
        value: 'remove',
        description: 'Remove a project manager from a project',
        action: 'Remove project manager',
      },
    ],
    default: 'add',
  },
];

export const projectManagerFields: INodeProperties[] = [
  // ADD fields
  {
    displayName: 'Project ID',
    name: 'projectId',
    type: 'string',
    displayOptions: {
      show: {
        resource: ['projectManager'],
        operation: ['add'],
      },
    },
    default: '',
    required: false,
    description: 'ID of the project to add the manager to',
  },
  {
    displayName: 'User ID',
    name: 'userId',
    type: 'string',
    displayOptions: {
      show: {
        resource: ['projectManager'],
        operation: ['add'],
      },
    },
    default: '',
    required: false,
    description: 'ID of the user to assign as project manager',
  },

  // REMOVE fields
  {
    displayName: 'Project Manager ID',
    name: 'projectManagerId',
    type: 'string',
    displayOptions: {
      show: {
        resource: ['projectManager'],
        operation: ['remove'],
      },
    },
    default: '',
    required: false,
    description: 'ID of the project manager to remove',
  },
];

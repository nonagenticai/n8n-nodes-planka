import { INodeProperties } from 'n8n-workflow';

export const projectOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    displayOptions: {
      show: {
        resource: ['project'],
      },
    },
    options: [
      {
        name: 'Create',
        value: 'create',
        description: 'Create a new project',
        action: 'Create a project',
      },
      {
        name: 'Get',
        value: 'get',
        description: 'Get a project',
        action: 'Get a project',
      },
      {
        name: 'List',
        value: 'list',
        description: 'List all accessible projects',
        action: 'List projects',
      },
      {
        name: 'Update',
        value: 'update',
        description: 'Update a project',
        action: 'Update a project',
      },
      {
        name: 'Delete',
        value: 'delete',
        description: 'Delete a project',
        action: 'Delete a project',
      },
      {
        name: 'Upload Background Image',
        value: 'uploadBackgroundImage',
        description: 'Upload a background image for a project',
        action: 'Upload background image',
      },
      {
        name: 'Delete Background Image',
        value: 'deleteBackgroundImage',
        description: 'Delete a background image',
        action: 'Delete background image',
      },
    ],
    default: 'list',
  },
];

export const projectFields: INodeProperties[] = [
  // CREATE fields
  {
    displayName: 'Name',
    name: 'name',
    type: 'string',
    displayOptions: {
      show: {
        resource: ['project'],
        operation: ['create'],
      },
    },
    default: '',
    required: false,
    description: 'Name of the project',
  },
  {
    displayName: 'Type',
    name: 'type',
    type: 'options',
    displayOptions: {
      show: {
        resource: ['project'],
        operation: ['create'],
      },
    },
    options: [
      {
        name: 'Private',
        value: 'private',
        description: 'Private project - only visible to project members',
      },
      {
        name: 'Public',
        value: 'public',
        description: 'Public project - visible to all users',
      },
    ],
    default: 'private',
    required: false,
    description: 'Type of the project',
  },
  {
    displayName: 'Additional Fields',
    name: 'additionalFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: {
      show: {
        resource: ['project'],
        operation: ['create'],
      },
    },
    options: [
      {
        displayName: 'Background Image ID',
        name: 'backgroundImageId',
        type: 'string',
        default: '',
        description: 'ID of the background image',
      },
      {
        displayName: 'Description',
        name: 'description',
        type: 'string',
        default: '',
        description: 'Description of the project',
      },
    ],
  },

  // GET/UPDATE/DELETE/UPLOAD BACKGROUND fields
  {
    displayName: 'Project ID',
    name: 'projectId',
    type: 'string',
    displayOptions: {
      show: {
        resource: ['project'],
        operation: ['get', 'update', 'delete', 'uploadBackgroundImage'],
      },
    },
    default: '',
    required: false,
    description: 'ID of the project',
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
        resource: ['project'],
        operation: ['update'],
      },
    },
    options: [
      {
        displayName: 'Name',
        name: 'name',
        type: 'string',
        default: '',
        description: 'New name for the project',
      },
      {
        displayName: 'Background Image ID',
        name: 'backgroundImageId',
        type: 'string',
        default: '',
        description: 'ID of the background image',
      },
      {
        displayName: 'Owner Project Manager ID',
        name: 'ownerProjectManagerId',
        type: 'string',
        default: '',
        description: 'ID of the project manager to set as owner',
      },
      {
        displayName: 'Description',
        name: 'description',
        type: 'string',
        default: '',
        description: 'Description of the project',
      },
      {
        displayName: 'Background Type',
        name: 'backgroundType',
        type: 'string',
        default: '',
        description: 'Type of background (e.g., gradient, image)',
      },
      {
        displayName: 'Background Gradient',
        name: 'backgroundGradient',
        type: 'string',
        default: '',
        description: 'Background gradient value',
      },
      {
        displayName: 'Is Hidden',
        name: 'isHidden',
        type: 'boolean',
        default: false,
        description: 'Whether the project is hidden',
      },
      {
        displayName: 'Is Favorite',
        name: 'isFavorite',
        type: 'boolean',
        default: false,
        description: 'Whether the project is marked as favorite',
      },
    ],
  },

  // UPLOAD BACKGROUND IMAGE fields
  {
    displayName: 'Binary Property Name',
    name: 'binaryPropertyName',
    type: 'string',
    displayOptions: {
      show: {
        resource: ['project'],
        operation: ['uploadBackgroundImage'],
      },
    },
    default: 'data',
    required: false,
    description: 'Name of the binary property containing the image file',
  },

  // DELETE BACKGROUND IMAGE fields
  {
    displayName: 'Background Image ID',
    name: 'backgroundImageId',
    type: 'string',
    displayOptions: {
      show: {
        resource: ['project'],
        operation: ['deleteBackgroundImage'],
      },
    },
    default: '',
    required: false,
    description: 'ID of the background image to delete',
  },
];

import { INodeProperties } from 'n8n-workflow';

export const userOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    displayOptions: {
      show: {
        resource: ['user'],
      },
    },
    options: [
      { name: 'Create', value: 'create', description: 'Create a new user', action: 'Create a user' },
      { name: 'Get', value: 'get', description: 'Get a user', action: 'Get a user' },
      { name: 'List', value: 'list', description: 'List all users', action: 'List users' },
      { name: 'Update', value: 'update', description: 'Update a user', action: 'Update a user' },
      { name: 'Delete', value: 'delete', description: 'Delete a user', action: 'Delete a user' },
      { name: 'Update Avatar', value: 'updateAvatar', description: 'Update user avatar', action: 'Update user avatar' },
      { name: 'Update Email', value: 'updateEmail', description: 'Update user email', action: 'Update user email' },
      { name: 'Update Password', value: 'updatePassword', description: 'Update user password', action: 'Update user password' },
      { name: 'Update Username', value: 'updateUsername', description: 'Update user username', action: 'Update user username' },
      { name: 'Create API Key', value: 'createApiKey', description: 'Generate API key for a user (returned once only)', action: 'Create API key' },
    ],
    default: 'list',
  },
];

export const userFields: INodeProperties[] = [
  // CREATE
  { displayName: 'Email', name: 'email', type: 'string', displayOptions: { show: { resource: ['user'], operation: ['create'] } }, default: '', required: false },
  { displayName: 'Password', name: 'password', type: 'string', typeOptions: { password: true }, displayOptions: { show: { resource: ['user'], operation: ['create'] } }, default: '', required: false },
  {
    displayName: 'Role',
    name: 'role',
    type: 'options',
    displayOptions: { show: { resource: ['user'], operation: ['create'] } },
    options: [
      { name: 'User', value: 'user', description: 'Regular user' },
      { name: 'Admin', value: 'admin', description: 'Administrator with full access' },
    ],
    default: 'user',
    required: false,
    description: 'User role defining access permissions',
  },
  { displayName: 'Name', name: 'name', type: 'string', displayOptions: { show: { resource: ['user'], operation: ['create'] } }, default: '', required: false },
  { displayName: 'Username', name: 'username', type: 'string', displayOptions: { show: { resource: ['user'], operation: ['create'] } }, default: '', required: false, description: 'Username for login (optional)' },
  {
    displayName: 'Additional Fields',
    name: 'additionalFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: { show: { resource: ['user'], operation: ['create'] } },
    options: [
      { displayName: 'Organization', name: 'organization', type: 'string', default: '' },
      { displayName: 'Phone', name: 'phone', type: 'string', default: '' },
      { displayName: 'Language', name: 'language', type: 'string', default: 'en' },
    ],
  },
  // GET/UPDATE/DELETE/UPDATE AVATAR/UPDATE EMAIL/UPDATE PASSWORD/UPDATE USERNAME/CREATE API KEY
  { displayName: 'User ID', name: 'userId', type: 'string', displayOptions: { show: { resource: ['user'], operation: ['get', 'update', 'delete', 'updateAvatar', 'updateEmail', 'updatePassword', 'updateUsername', 'createApiKey'] } }, default: '', required: false },
  // UPDATE
  {
    displayName: 'Update Fields',
    name: 'updateFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: { show: { resource: ['user'], operation: ['update'] } },
    options: [
      {
        displayName: 'Role',
        name: 'role',
        type: 'options',
        options: [
          { name: 'User', value: 'user', description: 'Regular user' },
          { name: 'Admin', value: 'admin', description: 'Administrator with full access' },
        ],
        default: 'user',
        description: 'User role defining access permissions',
      },
      { displayName: 'Name', name: 'name', type: 'string', default: '' },
      { displayName: 'Organization', name: 'organization', type: 'string', default: '' },
      { displayName: 'Phone', name: 'phone', type: 'string', default: '' },
      { displayName: 'Language', name: 'language', type: 'string', default: 'en' },
      { displayName: 'Subscribe To Own Cards', name: 'subscribeToOwnCards', type: 'boolean', default: false, description: 'Whether to automatically subscribe to cards created by this user' },
      { displayName: 'Subscribe To Card When Commenting', name: 'subscribeToCardWhenCommenting', type: 'boolean', default: false, description: 'Whether to automatically subscribe to a card when commenting on it' },
      { displayName: 'Turn Off Recent Card Highlighting', name: 'turnOffRecentCardHighlighting', type: 'boolean', default: false, description: 'Whether to turn off recent card highlighting' },
      { displayName: 'Enable Favorites By Default', name: 'enableFavoritesByDefault', type: 'boolean', default: false, description: 'Whether to enable favorites by default' },
      { displayName: 'Default Editor Mode', name: 'defaultEditorMode', type: 'string', default: '', description: 'Default editor mode for the user' },
      { displayName: 'Default Home View', name: 'defaultHomeView', type: 'string', default: '', description: 'Default home view for the user' },
      { displayName: 'Default Projects Order', name: 'defaultProjectsOrder', type: 'string', default: '', description: 'Default order for projects' },
      { displayName: 'Is Deactivated', name: 'isDeactivated', type: 'boolean', default: false, description: 'Whether the user account is deactivated' },
    ],
  },
  // UPDATE AVATAR
  { displayName: 'Binary Property', name: 'binaryPropertyName', type: 'string', displayOptions: { show: { resource: ['user'], operation: ['updateAvatar'] } }, default: 'data', required: false, description: 'Name of the binary property containing the avatar image' },
  // UPDATE EMAIL
  { displayName: 'Email', name: 'email', type: 'string', displayOptions: { show: { resource: ['user'], operation: ['updateEmail'] } }, default: '', required: false, description: 'New email address' },
  {
    displayName: 'Additional Fields',
    name: 'additionalFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: { show: { resource: ['user'], operation: ['updateEmail'] } },
    options: [
      { displayName: 'Current Password', name: 'currentPassword', type: 'string', typeOptions: { password: true }, default: '', description: 'Current password (required when updating own email)' },
    ],
  },
  // UPDATE PASSWORD
  { displayName: 'Password', name: 'password', type: 'string', typeOptions: { password: true }, displayOptions: { show: { resource: ['user'], operation: ['updatePassword'] } }, default: '', required: false, description: 'New password' },
  {
    displayName: 'Additional Fields',
    name: 'additionalFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: { show: { resource: ['user'], operation: ['updatePassword'] } },
    options: [
      { displayName: 'Current Password', name: 'currentPassword', type: 'string', typeOptions: { password: true }, default: '', description: 'Current password (required when updating own password)' },
    ],
  },
  // UPDATE USERNAME
  { displayName: 'Username', name: 'username', type: 'string', displayOptions: { show: { resource: ['user'], operation: ['updateUsername'] } }, default: '', required: false, description: 'New username' },
  {
    displayName: 'Additional Fields',
    name: 'additionalFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: { show: { resource: ['user'], operation: ['updateUsername'] } },
    options: [
      { displayName: 'Current Password', name: 'currentPassword', type: 'string', typeOptions: { password: true }, default: '', description: 'Current password (required when updating own username)' },
    ],
  },
];

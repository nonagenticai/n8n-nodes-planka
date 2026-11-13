import { INodeProperties } from 'n8n-workflow';

export const membershipOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    displayOptions: { show: { resource: ['membership'] } },
    options: [
      { name: 'Add User To Card', value: 'addUserToCard', description: 'Add user to card', action: 'Add user to card' },
      { name: 'Remove User From Card', value: 'removeUserFromCard', description: 'Remove user from card', action: 'Remove user from card' },
      { name: 'Add User To Board', value: 'addUserToBoard', description: 'Add user to board', action: 'Add user to board' },
      { name: 'Update Board Membership', value: 'updateBoardMembership', description: 'Update board membership role', action: 'Update board membership' },
      { name: 'Remove User From Board', value: 'removeUserFromBoard', description: 'Remove user from board', action: 'Remove user from board' },
    ],
    default: 'addUserToCard',
  },
];

export const membershipFields: INodeProperties[] = [
  // CARD OPERATIONS - ADD
  { displayName: 'Card ID', name: 'cardId', type: 'string', displayOptions: { show: { resource: ['membership'], operation: ['addUserToCard', 'removeUserFromCard'] } }, default: '', required: false },
  { displayName: 'User ID', name: 'userId', type: 'string', displayOptions: { show: { resource: ['membership'], operation: ['addUserToCard', 'addUserToBoard', 'removeUserFromCard'] } }, default: '', required: false },
  // BOARD OPERATIONS
  { displayName: 'Board ID', name: 'boardId', type: 'string', displayOptions: { show: { resource: ['membership'], operation: ['addUserToBoard'] } }, default: '', required: false },
  { displayName: 'Role', name: 'role', type: 'options', options: [{ name: 'Editor', value: 'editor' }, { name: 'Viewer', value: 'viewer' }], displayOptions: { show: { resource: ['membership'], operation: ['addUserToBoard', 'updateBoardMembership'] } }, default: 'editor', required: false },
  { displayName: 'Can Comment', name: 'canComment', type: 'boolean', displayOptions: { show: { resource: ['membership'], operation: ['addUserToBoard'] } }, default: true, description: 'Whether the user can comment on cards (applies only to viewers)' },
  { displayName: 'Board Membership ID', name: 'boardMembershipId', type: 'string', displayOptions: { show: { resource: ['membership'], operation: ['updateBoardMembership', 'removeUserFromBoard'] } }, default: '', required: false },
  // UPDATE BOARD MEMBERSHIP - Additional Fields
  {
    displayName: 'Update Fields',
    name: 'updateFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: { show: { resource: ['membership'], operation: ['updateBoardMembership'] } },
    options: [
      { displayName: 'Can Comment', name: 'canComment', type: 'boolean', default: true, description: 'Whether the user can comment on cards (applies only to viewers)' },
    ],
  },
];

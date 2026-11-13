import { INodeProperties } from 'n8n-workflow';

export const notificationOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    displayOptions: { show: { resource: ['notification'] } },
    options: [
      {
        name: 'List',
        value: 'list',
        description: 'List all unread notifications for the current user',
        action: 'List notifications'
      },
      {
        name: 'Get',
        value: 'get',
        description: 'Get a specific notification',
        action: 'Get a notification'
      },
      {
        name: 'Update',
        value: 'update',
        description: 'Update a notification (mark as read/unread)',
        action: 'Update a notification'
      },
      {
        name: 'Mark All Read',
        value: 'markAllRead',
        description: 'Mark all notifications as read',
        action: 'Mark all notifications as read'
      },
    ],
    default: 'list',
  },
];

export const notificationFields: INodeProperties[] = [
  // GET/UPDATE
  {
    displayName: 'Notification ID',
    name: 'notificationId',
    type: 'string',
    displayOptions: {
      show: {
        resource: ['notification'],
        operation: ['get', 'update']
      }
    },
    default: '',
    required: false,
    description: 'ID of the notification',
  },
  // UPDATE
  {
    displayName: 'Is Read',
    name: 'isRead',
    type: 'boolean',
    displayOptions: {
      show: {
        resource: ['notification'],
        operation: ['update']
      }
    },
    default: true,
    required: false,
    description: 'Whether the notification has been read',
  },
];

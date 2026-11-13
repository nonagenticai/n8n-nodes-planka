import { INodeProperties } from 'n8n-workflow';

export const configOperations: INodeProperties[] = [
  {
    displayName: 'Operation',
    name: 'operation',
    type: 'options',
    displayOptions: { show: { resource: ['config'] } },
    options: [
      { name: 'Get', value: 'get', description: 'Get application configuration', action: 'Get application configuration' },
      { name: 'Get Bootstrap', value: 'getBootstrap', description: 'Get application bootstrap data', action: 'Get bootstrap' },
      { name: 'Test SMTP', value: 'testSmtp', description: 'Test SMTP configuration by sending test email (Admin only)', action: 'Test SMTP' },
      { name: 'Update', value: 'update', description: 'Update application configuration (Admin only)', action: 'Update configuration' },
    ],
    default: 'get',
  },
];

export const configFields: INodeProperties[] = [
  {
    displayName: 'Update Fields',
    name: 'updateFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: { show: { resource: ['config'], operation: ['update'] } },
    options: [
      {
        displayName: 'SMTP Host',
        name: 'smtpHost',
        type: 'string',
        default: '',
        description: 'SMTP server hostname',
      },
      {
        displayName: 'SMTP Port',
        name: 'smtpPort',
        type: 'number',
        default: 587,
        description: 'SMTP server port',
      },
      {
        displayName: 'SMTP Secure',
        name: 'smtpSecure',
        type: 'boolean',
        default: false,
        description: 'Whether to use TLS for SMTP',
      },
      {
        displayName: 'SMTP User',
        name: 'smtpUser',
        type: 'string',
        default: '',
        description: 'SMTP authentication username',
      },
      {
        displayName: 'SMTP Password',
        name: 'smtpPassword',
        type: 'string',
        typeOptions: { password: true },
        default: '',
        description: 'SMTP authentication password',
      },
      {
        displayName: 'SMTP From',
        name: 'smtpFrom',
        type: 'string',
        default: '',
        description: 'Email address to send from',
      },
      {
        displayName: 'SMTP Name',
        name: 'smtpName',
        type: 'string',
        default: '',
        description: 'Display name for SMTP sender',
      },
      {
        displayName: 'SMTP TLS Reject Unauthorized',
        name: 'smtpTlsRejectUnauthorized',
        type: 'boolean',
        default: true,
        description: 'Whether to reject unauthorized TLS certificates',
      },
    ],
  },
];

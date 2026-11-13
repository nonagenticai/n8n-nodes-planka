import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeOperationError,
  ICredentialDataDecryptedObject,
  ICredentialTestFunctions,
  ICredentialsDecrypted,
  INodeCredentialTestResult,
} from 'n8n-workflow';

import {
  projectOperations,
  boardOperations,
  listOperations,
  cardOperations,
  userOperations,
  taskOperations,
  taskListOperations,
  commentOperations,
  attachmentOperations,
  labelOperations,
  webhookOperations,
  membershipOperations,
  configOperations,
  termsOperations,
  notificationOperations,
  notificationServiceOperations,
  customFieldGroupOperations,
  customFieldOperations,
  customFieldValueOperations,
  baseCustomFieldGroupOperations,
  actionOperations,
  projectManagerOperations,
} from './operations';

import {
  projectOperations as projectOps,
  projectFields,
  boardOperations as boardOps,
  boardFields,
  listOperations as listOps,
  listFields,
  cardOperations as cardOps,
  cardFields,
  userOperations as userOps,
  userFields,
  taskOperations as taskOps,
  taskFields,
  taskListOperations as taskListOps,
  taskListFields,
  commentOperations as commentOps,
  commentFields,
  attachmentOperations as attachmentOps,
  attachmentFields,
  labelOperations as labelOps,
  labelFields,
  webhookOperations as webhookOps,
  webhookFields,
  membershipOperations as membershipOps,
  membershipFields,
  configOperations as configOps,
  configFields,
  termsOperations as termsOps,
  termsFields,
  notificationOperations as notificationOps,
  notificationFields,
  notificationServiceOperations as notificationServiceOps,
  notificationServiceFields,
  customFieldGroupOperations as customFieldGroupOps,
  customFieldGroupFields,
  customFieldOperations as customFieldOps,
  customFieldFields,
  customFieldValueOperations as customFieldValueOps,
  customFieldValueFields,
  baseCustomFieldGroupOperations as baseCustomFieldGroupOps,
  baseCustomFieldGroupFields,
  actionOperations as actionOps,
  actionFields,
  projectManagerOperations as projectManagerOps,
  projectManagerFields,
} from './descriptions';

import { getAccessToken } from './helpers/request';
import { mergeSameNameCollections } from "../../helpers/mergeSameNameCollections";

export class Planka implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Planka',
    name: 'planka',
    icon: 'file:planka.svg',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
    description: 'Interact with Planka Kanban Board API',
    defaults: {
      name: 'Planka',
    },
    inputs: ['main'],
    outputs: ['main'],
    // Hand-written node: AI-agent Tool variant (plankaTool) exists only when
    // the description sets usableAsTool (n8n 2.42.x tool-generation).
    usableAsTool: true,
    credentials: [
      {
        name: 'plankaApi',
        required: false,
        // `testedBy` is what makes the credential test RUN. n8n resolves a test as:
        // the credential's declarative `test`, else this name looked up in
        // `methods.credentialTest`. A function-valued ICredentialType.test is never
        // called — CredentialsTester wraps it as `{ testRequest: type.test }` and
        // routes `.request` off a function, i.e. undefined.
        testedBy: 'plankaApiTest',
      },
    ],
    properties: mergeSameNameCollections([
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        options: [
          {
            name: 'Project',
            value: 'project',
            description: 'Operations on projects',
          },
          {
            name: 'Board',
            value: 'board',
            description: 'Operations on boards',
          },
          {
            name: 'List',
            value: 'list',
            description: 'Operations on lists',
          },
          {
            name: 'Card',
            value: 'card',
            description: 'Operations on cards',
          },
          {
            name: 'User',
            value: 'user',
            description: 'Operations on users',
          },
          {
            name: 'Task',
            value: 'task',
            description: 'Operations on tasks',
          },
          {
            name: 'Task List',
            value: 'taskList',
            description: 'Operations on task lists',
          },
          {
            name: 'Comment',
            value: 'comment',
            description: 'Operations on comments',
          },
          {
            name: 'Attachment',
            value: 'attachment',
            description: 'Operations on attachments',
          },
          {
            name: 'Label',
            value: 'label',
            description: 'Operations on labels',
          },
          {
            name: 'Webhook',
            value: 'webhook',
            description: 'Operations on webhooks',
          },
          {
            name: 'Membership',
            value: 'membership',
            description: 'Operations on memberships (card and board)',
          },
          {
            name: 'Config',
            value: 'config',
            description: 'Operations on application configuration',
          },
          {
            name: 'Terms',
            value: 'terms',
            description: 'Operations on terms and conditions',
          },
          {
            name: 'Notification',
            value: 'notification',
            description: 'Operations on notifications',
          },
          {
            name: 'Notification Service',
            value: 'notificationService',
            description: 'Operations on notification services',
          },
          {
            name: 'Custom Field Group',
            value: 'customFieldGroup',
            description: 'Operations on custom field groups',
          },
          {
            name: 'Custom Field',
            value: 'customField',
            description: 'Operations on custom fields',
          },
          {
            name: 'Custom Field Value',
            value: 'customFieldValue',
            description: 'Operations on custom field values',
          },
          {
            name: 'Base Custom Field Group',
            value: 'baseCustomFieldGroup',
            description: 'Operations on base custom field groups (templates)',
          },
          {
            name: 'Action',
            value: 'action',
            description: 'Operations on actions (activity history)',
          },
          {
            name: 'Project Manager',
            value: 'projectManager',
            description: 'Operations on project managers',
          },
        ],
        default: 'project',
      },
      // Operation fields for each resource
      ...projectOps,
      ...projectFields,
      ...boardOps,
      ...boardFields,
      ...listOps,
      ...listFields,
      ...cardOps,
      ...cardFields,
      ...userOps,
      ...userFields,
      ...taskOps,
      ...taskFields,
      ...taskListOps,
      ...taskListFields,
      ...commentOps,
      ...commentFields,
      ...attachmentOps,
      ...attachmentFields,
      ...labelOps,
      ...labelFields,
      ...webhookOps,
      ...webhookFields,
      ...membershipOps,
      ...membershipFields,
      ...configOps,
      ...configFields,
      ...termsOps,
      ...termsFields,
      ...notificationOps,
      ...notificationFields,
      ...notificationServiceOps,
      ...notificationServiceFields,
      ...customFieldGroupOps,
      ...customFieldGroupFields,
      ...customFieldOps,
      ...customFieldFields,
      ...customFieldValueOps,
      ...customFieldValueFields,
      ...baseCustomFieldGroupOps,
      ...baseCustomFieldGroupFields,
      ...actionOps,
      ...actionFields,
      ...projectManagerOps,
      ...projectManagerFields,
    ]),
  };

  /**
   * Credential test — IMPERATIVE, the only form this one can take.
   *
   * It POSTs a login to `/api/access-tokens`, and first-run Planka answers 403
   * with `{step: 'accept-terms'}` — a case that must read as OK. A declarative
   * `ICredentialTestRequest` can only map a status code to an error message, so
   * that branch is inexpressible there.
   *
   * It lives here because n8n never calls a function-valued `ICredentialType.test`;
   * the credential declaration above points at it with `testedBy`.
   *
   * Note the call-site shape: a node-level test receives the WRAPPER
   * `{id, name, type, data}`, not the payload.
   */
  methods = {
    credentialTest: {
      async plankaApiTest(
        this: ICredentialTestFunctions,
        credential: ICredentialsDecrypted<ICredentialDataDecryptedObject>,
      ): Promise<INodeCredentialTestResult> {
        const data = credential.data ?? {};
        const baseUrl = ((data.baseUrl as string) || '').replace(/\/$/, '');
        const emailOrUsername = data.emailOrUsername as string;
        const password = data.password as string;
        const sslOptions = (data.sslOptions as any) || {};

        try {
          const response = await this.helpers.request({
            method: 'POST',
            url: `${baseUrl}/api/access-tokens`,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ emailOrUsername, password }),
            json: true,
            rejectUnauthorized: sslOptions.ignoreSSL !== true,
          });

          if (response?.item) {
            return { status: 'OK', message: 'Successfully authenticated with Planka' };
          }

          return { status: 'Error', message: 'Login succeeded but no token returned' };
        } catch (error: any) {
          // Handle terms acceptance flow
          if (error.httpCode === 403 || error.statusCode === 403) {
            const body = error.response?.body ?? error.cause?.response?.body;
            if (body?.step === 'accept-terms') {
              return { status: 'OK', message: 'Authentication works (terms acceptance required on first use)' };
            }
          }

          if (error.httpCode === 401 || error.statusCode === 401) {
            return { status: 'Error', message: 'Invalid email/username or password' };
          }

          const message = error.message || String(error);
          return { status: 'Error', message: `Connection failed: ${message}` };
        }
      },
    },
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    // Get credentials
    const credentials = await this.getCredentials('plankaApi');
    const baseUrl = credentials.baseUrl as string;

    // Get access token via Planka login (username/password)
    const accessToken = await getAccessToken.call(this, credentials);

    // Process each input item
    for (let i = 0; i < items.length; i++) {
      // Per-item reads so a worker-chosen (expression) resource/operation resolves
      // for each item — the generic DOING dispatcher drives these dynamically.
      const resource = this.getNodeParameter('resource', i) as string;
      const operation = this.getNodeParameter('operation', i) as string;
      try {
        let responseData;

        // Dispatch to resource-specific operation handlers
        if (resource === 'project') {
          responseData = await projectOperations.execute.call(
            this,
            operation,
            i,
            baseUrl,
            accessToken,
          );
        } else if (resource === 'board') {
          responseData = await boardOperations.execute.call(
            this,
            operation,
            i,
            baseUrl,
            accessToken,
          );
        } else if (resource === 'list') {
          responseData = await listOperations.execute.call(
            this,
            operation,
            i,
            baseUrl,
            accessToken,
          );
        } else if (resource === 'card') {
          responseData = await cardOperations.execute.call(
            this,
            operation,
            i,
            baseUrl,
            accessToken,
          );
        } else if (resource === 'user') {
          responseData = await userOperations.execute.call(
            this,
            operation,
            i,
            baseUrl,
            accessToken,
          );
        } else if (resource === 'task') {
          responseData = await taskOperations.execute.call(
            this,
            operation,
            i,
            baseUrl,
            accessToken,
          );
        } else if (resource === 'taskList') {
          responseData = await taskListOperations.execute.call(
            this,
            operation,
            i,
            baseUrl,
            accessToken,
          );
        } else if (resource === 'comment') {
          responseData = await commentOperations.execute.call(
            this,
            operation,
            i,
            baseUrl,
            accessToken,
          );
        } else if (resource === 'attachment') {
          responseData = await attachmentOperations.execute.call(
            this,
            operation,
            i,
            baseUrl,
            accessToken,
          );
        } else if (resource === 'label') {
          responseData = await labelOperations.execute.call(
            this,
            operation,
            i,
            baseUrl,
            accessToken,
          );
        } else if (resource === 'webhook') {
          responseData = await webhookOperations.execute.call(
            this,
            operation,
            i,
            baseUrl,
            accessToken,
          );
        } else if (resource === 'membership') {
          responseData = await membershipOperations.execute.call(
            this,
            operation,
            i,
            baseUrl,
            accessToken,
          );
        } else if (resource === 'config') {
          responseData = await configOperations.execute.call(
            this,
            operation,
            i,
            baseUrl,
            accessToken,
          );
        } else if (resource === 'terms') {
          responseData = await termsOperations.execute.call(
            this,
            operation,
            i,
            baseUrl,
            accessToken,
          );
        } else if (resource === 'notification') {
          responseData = await notificationOperations.execute.call(
            this,
            operation,
            i,
            baseUrl,
            accessToken,
          );
        } else if (resource === 'notificationService') {
          responseData = await notificationServiceOperations.execute.call(
            this,
            operation,
            i,
            baseUrl,
            accessToken,
          );
        } else if (resource === 'customFieldGroup') {
          responseData = await customFieldGroupOperations.execute.call(
            this,
            operation,
            i,
            baseUrl,
            accessToken,
          );
        } else if (resource === 'customField') {
          responseData = await customFieldOperations.execute.call(
            this,
            operation,
            i,
            baseUrl,
            accessToken,
          );
        } else if (resource === 'customFieldValue') {
          responseData = await customFieldValueOperations.execute.call(
            this,
            operation,
            i,
            baseUrl,
            accessToken,
          );
        } else if (resource === 'baseCustomFieldGroup') {
          responseData = await baseCustomFieldGroupOperations.execute.call(
            this,
            operation,
            i,
            baseUrl,
            accessToken,
          );
        } else if (resource === 'action') {
          responseData = await actionOperations.execute.call(
            this,
            operation,
            i,
            baseUrl,
            accessToken,
          );
        } else if (resource === 'projectManager') {
          responseData = await projectManagerOperations.execute.call(
            this,
            operation,
            i,
            baseUrl,
            accessToken,
          );
        } else {
          throw new NodeOperationError(
            this.getNode(),
            `Unknown resource: ${resource}`,
          );
        }

        returnData.push({
          json: responseData,
          pairedItem: { item: i },
        });
      } catch (error) {
        if (this.continueOnFail()) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          returnData.push({
            json: { error: errorMessage, resource, operation },
            pairedItem: { item: i },
          });
          continue;
        }
        throw error;
      }
    }

    return [returnData];
  }
}

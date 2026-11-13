import type {
	ICredentialType,
	ICredentialDataDecryptedObject,
	INodeProperties,
	IHttpRequestOptions,
} from 'n8n-workflow';

/**
 * PlankaApi Credential
 *
 * Username/password authentication for self-hosted Planka instances.
 * Session tokens are obtained automatically via login and cached.
 *
 * Users provide their own Planka instance; no third-party licence service is involved.
 */
export class PlankaApi implements ICredentialType {
	name = 'plankaApi';
	displayName = 'Planka Kanban API';
	icon = 'file:planka.svg' as const;
	documentationUrl = 'https://docs.planka.cloud';

	properties: INodeProperties[] = [
		// ========================================
		// SECTION 1: Planka Instance Configuration
		// ========================================
		{
			displayName: 'Planka Base URL',
			name: 'baseUrl',
			type: 'string',
			default: '',
			required: true,
			placeholder: 'https://planka.example.com',
			description: 'Base URL of your Planka instance (e.g., https://planka.example.com)',
			typeOptions: {
				validation: [
					{
						type: 'regex',
						properties: {
							regex: '^https?://.+',
							errorMessage: 'Must be a valid URL starting with http:// or https://',
						},
					},
				],
			},
		},

		// ========================================
		// SECTION 2: Planka Authentication
		// ========================================
		{
			displayName: 'Email or Username',
			name: 'emailOrUsername',
			type: 'string',
			default: '',
			required: true,
			placeholder: 'admin@example.com',
			description: 'Your Planka user email or username',
		},
		{
			displayName: 'Password',
			name: 'password',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'Your Planka user password',
		},

		// ========================================
		// SECTION 3: SSL/TLS Certificate Options
		// ========================================
		{
			displayName: 'SSL Certificate Options',
			name: 'sslOptions',
			type: 'collection',
			placeholder: 'Add SSL Option',
			default: {},
			options: [
				{
					displayName: 'Ignore SSL Issues',
					name: 'ignoreSSL',
					type: 'boolean',
					default: false,
					description:
						'Whether to ignore SSL certificate errors. WARNING: Only enable for development/testing with self-signed certificates.',
				},
			],
			description: 'Additional SSL/TLS certificate options',
		},
	];

	// ⛔ Deliberately NO `test` here. n8n never invokes a function-valued
	// ICredentialType.test (CredentialsTester wraps it as `{ testRequest: type.test }`
	// and routes `.request` off a function, i.e. undefined). This test is IMPERATIVE —
	// a login POST whose 403 `accept-terms` reply must read as OK — so it lives on the
	// NODE as `methods.credentialTest.plankaApiTest`, referenced by `testedBy`.

	/**
	 * Authenticate method - validates required fields are present
	 * Actual session token is obtained in the node via getAccessToken()
	 */
	async authenticate(
		credentials: ICredentialDataDecryptedObject,
		requestOptions: IHttpRequestOptions,
	): Promise<IHttpRequestOptions> {
		if (!credentials.baseUrl) {
			throw new Error('Planka Base URL is required');
		}
		if (!credentials.emailOrUsername) {
			throw new Error('Email or username is required');
		}
		if (!credentials.password) {
			throw new Error('Password is required');
		}

		return requestOptions;
	}
}

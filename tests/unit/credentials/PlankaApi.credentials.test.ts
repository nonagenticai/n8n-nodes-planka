/**
 * Tests for PlankaApi Credential
 * Validates username/password authentication for self-hosted Planka instances
 */

import { PlankaApi } from '../../../credentials/PlankaApi.credentials';
import { ICredentialDataDecryptedObject, IHttpRequestOptions } from 'n8n-workflow';

describe('PlankaApi Credentials', () => {
  let credential: PlankaApi;

  beforeEach(() => {
    credential = new PlankaApi();
  });

  describe('Credential Definition', () => {
    it('should have correct name and displayName', () => {
      expect(credential.name).toBe('plankaApi');
      expect(credential.displayName).toBe('Planka Kanban API');
    });

    it('should have documentation URL', () => {
      expect(credential.documentationUrl).toBe('https://docs.planka.cloud');
    });

    it('should have all required properties', () => {
      expect(credential.properties).toBeDefined();
      expect(Array.isArray(credential.properties)).toBe(true);
      expect(credential.properties.length).toBeGreaterThan(0);
    });
  });

  describe('Planka Instance Configuration', () => {
    it('should have baseUrl property', () => {
      const prop = credential.properties.find((p) => p.name === 'baseUrl');
      expect(prop).toBeDefined();
      expect(prop?.required).toBe(true);
      expect(prop?.default).toBe('');
    });

    it('should validate baseUrl format', () => {
      const prop = credential.properties.find((p) => p.name === 'baseUrl');
      const validation = prop?.typeOptions?.validation?.[0] as any;
      expect(validation).toBeDefined();
      expect(validation.type).toBe('regex');
      expect(validation.properties.regex).toBe('^https?://.+');
    });
  });

  describe('Planka Authentication Properties', () => {
    it('should have emailOrUsername property', () => {
      const prop = credential.properties.find((p) => p.name === 'emailOrUsername');
      expect(prop).toBeDefined();
      expect(prop?.required).toBe(true);
      expect(prop?.type).toBe('string');
    });

    it('should have password property', () => {
      const prop = credential.properties.find((p) => p.name === 'password');
      expect(prop).toBeDefined();
      expect(prop?.required).toBe(true);
      expect(prop?.typeOptions?.password).toBe(true);
    });
  });

  describe('SSL Options', () => {
    it('should have sslOptions collection', () => {
      const prop = credential.properties.find((p) => p.name === 'sslOptions');
      expect(prop).toBeDefined();
      expect(prop?.type).toBe('collection');
    });

    it('should have ignoreSSL option in sslOptions', () => {
      const prop = credential.properties.find((p) => p.name === 'sslOptions');
      const options = prop?.options as any[];
      const ignoreSSL = options?.find((o) => o.name === 'ignoreSSL');
      expect(ignoreSSL).toBeDefined();
      expect(ignoreSSL?.type).toBe('boolean');
      expect(ignoreSSL?.default).toBe(false);
    });
  });

  describe('Credential Test', () => {
    it('is declared on the NODE, not on the credential (n8n never calls a function-valued test)', async () => {
      // n8n resolves a credential test as: the credential's declarative `test`,
      // else `testedBy` → node.methods.credentialTest[<name>]. A function on the
      // credential is never invoked, which is why the UI test could not pass.
      expect(credential.test).toBeUndefined();

      const { Planka } = await import('../../../nodes/Planka/Planka.node');
      const node: any = new Planka();
      expect(node.description.credentials[0].testedBy).toBe('plankaApiTest');

      const fn = node.methods?.credentialTest?.plankaApiTest;
      expect(typeof fn).toBe('function');

      // A node-level test receives the WRAPPER ({id, name, type, data}).
      const requested: any[] = [];
      const ctx = { helpers: { request: async (opts: any) => { requested.push(opts); return { item: { id: '1' } }; } } };
      const ok = await fn.call(ctx, {
        id: '1', name: 'planka', type: 'plankaApi',
        data: { baseUrl: 'https://planka.example.com/', emailOrUsername: 'u', password: 'p' },
      });
      expect(ok).toEqual({ status: 'OK', message: 'Successfully authenticated with Planka' });
      expect(requested[0].url).toBe('https://planka.example.com/api/access-tokens');
      expect(requested[0].method).toBe('POST');
    });
  });

  describe('Authentication Method', () => {
    it('should throw error if baseUrl is missing', async () => {
      const credentials: ICredentialDataDecryptedObject = {
        emailOrUsername: 'user@example.com',
        password: 'password123',
      };

      const requestOptions: IHttpRequestOptions = {
        method: 'GET',
        url: 'https://planka.example.com/api/projects',
      };

      await expect(credential.authenticate(credentials, requestOptions))
        .rejects.toThrow('Planka Base URL is required');
    });

    it('should throw error if emailOrUsername is missing', async () => {
      const credentials: ICredentialDataDecryptedObject = {
        baseUrl: 'https://planka.example.com',
        password: 'password123',
      };

      const requestOptions: IHttpRequestOptions = {
        method: 'GET',
        url: 'https://planka.example.com/api/projects',
      };

      await expect(credential.authenticate(credentials, requestOptions))
        .rejects.toThrow('Email or username is required');
    });

    it('should throw error if password is missing', async () => {
      const credentials: ICredentialDataDecryptedObject = {
        baseUrl: 'https://planka.example.com',
        emailOrUsername: 'user@example.com',
      };

      const requestOptions: IHttpRequestOptions = {
        method: 'GET',
        url: 'https://planka.example.com/api/projects',
      };

      await expect(credential.authenticate(credentials, requestOptions))
        .rejects.toThrow('Password is required');
    });

    it('should return requestOptions unchanged when all credentials present', async () => {
      const credentials: ICredentialDataDecryptedObject = {
        baseUrl: 'https://planka.example.com',
        emailOrUsername: 'user@example.com',
        password: 'password123',
      };

      const requestOptions: IHttpRequestOptions = {
        method: 'GET',
        url: 'https://planka.example.com/api/projects',
      };

      const result = await credential.authenticate(credentials, requestOptions);
      expect(result).toEqual(requestOptions);
    });
  });

  describe('Required Fields', () => {
    it('should have all required field names', () => {
      const fieldNames = credential.properties.map((p) => p.name);

      expect(fieldNames).toContain('baseUrl');
      expect(fieldNames).toContain('emailOrUsername');
      expect(fieldNames).toContain('password');
      expect(fieldNames).toContain('sslOptions');
    });

    it('should mark baseUrl, emailOrUsername, and password as required', () => {
      const baseUrl = credential.properties.find((p) => p.name === 'baseUrl');
      const emailOrUsername = credential.properties.find((p) => p.name === 'emailOrUsername');
      const password = credential.properties.find((p) => p.name === 'password');

      expect(baseUrl?.required).toBe(true);
      expect(emailOrUsername?.required).toBe(true);
      expect(password?.required).toBe(true);
    });
  });
});

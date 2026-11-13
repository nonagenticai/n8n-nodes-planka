/**
 * Custom Jest Environment for Kanban Module
 *
 * - Disables TLS certificate verification for integration tests against self-signed certs
 * - Provides localStorage/sessionStorage polyfills required by n8n-workflow
 */

const NodeEnvironment = require('jest-environment-node').TestEnvironment;

class CustomEnvironment extends NodeEnvironment {
  constructor(config, context) {
    super(config, context);

    // Disable TLS cert verification for self-signed certs (planka.example.com)
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

    // Add localStorage polyfill before any tests run
    this.global.localStorage = {
      _data: {},
      setItem(key, value) {
        this._data[key] = String(value);
      },
      getItem(key) {
        return this._data[key] || null;
      },
      removeItem(key) {
        delete this._data[key];
      },
      clear() {
        this._data = {};
      },
      get length() {
        return Object.keys(this._data).length;
      },
      key(index) {
        const keys = Object.keys(this._data);
        return keys[index] || null;
      },
    };

    this.global.sessionStorage = {
      _data: {},
      setItem(key, value) {
        this._data[key] = String(value);
      },
      getItem(key) {
        return this._data[key] || null;
      },
      removeItem(key) {
        delete this._data[key];
      },
      clear() {
        this._data = {};
      },
      get length() {
        return Object.keys(this._data).length;
      },
      key(index) {
        const keys = Object.keys(this._data);
        return keys[index] || null;
      },
    };
  }

  async setup() {
    await super.setup();
  }

  async teardown() {
    await super.teardown();
  }

  getVmContext() {
    return super.getVmContext();
  }
}

module.exports = CustomEnvironment;

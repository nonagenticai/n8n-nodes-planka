/**
 * Custom Jest Environment for Kanban Module
 *
 * - Provides localStorage/sessionStorage polyfills required by n8n-workflow
 *
 * TLS verification is deliberately NOT disabled here. This suite makes no TLS
 * connections at all: every test mocks `helpers.request`, the one raw-socket
 * test dials `http://127.0.0.1` (plain HTTP), and there is no integration
 * directory. A process-wide NODE_TLS_REJECT_UNAUTHORIZED=0 would have weakened
 * every HTTPS call a dependency might make while protecting nothing.
 */

const NodeEnvironment = require('jest-environment-node').TestEnvironment;

class CustomEnvironment extends NodeEnvironment {
  constructor(config, context) {
    super(config, context);

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

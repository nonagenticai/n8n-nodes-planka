import axios, { AxiosRequestConfig } from 'axios';

/**
 * Custom Axios instance with authentication
 *
 * This mutator is used by Orval-generated API client
 * It injects authentication from n8n credentials
 */

// No hardcoded baseURL fallback. The n8n credential's `baseUrl` field is
// merged into each request via the orval-generated client at node-execute
// time. Per this package's no-hardcoded-URLs convention.
export const AXIOS_INSTANCE = axios.create();

export const customInstance = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<T> => {
  const source = axios.CancelToken.source();

  const promise = AXIOS_INSTANCE({
    ...config,
    ...options,
    cancelToken: source.token,
  }).then(({ data }) => data);

  // @ts-expect-error n8n type override
  promise.cancel = () => {
    source.cancel('Query was cancelled');
  };

  return promise;
};

export type ErrorType<Error> = Error;

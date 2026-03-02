import { APIResponse, expect } from '@playwright/test';

/**
 * Extracts JSON body safely from response
 */
export async function getBody<T = any>(response: APIResponse): Promise<T> {
  try {
    return await response.json() as T;
  } catch (e: unknown) {
    throw new Error(`Failed to parse JSON body: ${e instanceof Error ? e.message : String(e)}`);
  }
}

/**
 * Standard assert for successful responses (2xx)
 */
export function assertOk(response: APIResponse) {
  expect(response.ok(), `Expected OK response but got ${response.status()}`).toBeTruthy();
}

/**
 * Standard assert for specific status code
 */
export function assertStatus(response: APIResponse, status: number) {
  expect(response.status()).toBe(status);
}

/**
 * Calculates response time duration
 */
export async function measureResponse(requestFn: () => Promise<APIResponse>): Promise<{ response: APIResponse, duration: number }> {
    const start = Date.now();
    const response = await requestFn();
    const duration = Date.now() - start;
    return { response, duration };
}

/**
 * Builds a full URL from base URL, path, and optional query parameters
 */
export function buildUrl(path: string, baseUrl: string, queryParams?: Record<string, string | number | boolean>): string {
    const base = baseUrl.replace(/\/$/, '');
    const normalizedPath = path.startsWith('/') ? path : '/' + path;
    const url = new URL(base + normalizedPath);
    if (queryParams) {
        for (const [key, value] of Object.entries(queryParams)) {
            url.searchParams.set(key, String(value));
        }
    }
    return url.toString();
}

/**
 * Extracts path variable names from a path template
 * e.g. '/users/{userId}/posts/{postId}' → ['userId', 'postId']
 */
export function extractPathVariables(path: string): string[] {
    const matches = path.match(/\{([^}]+)\}/g) || [];
    return matches.map(m => m.slice(1, -1));
}

/**
 * Resolves environment variable references in a string
 * e.g. '${BASE_URL}/api' → 'https://example.com/api'
 */
export function resolveEnvironmentVars(value: string): string {
    return value.replace(/\$\{([^}]+)\}/g, (_, varName) => {
        return process.env[varName] ?? `\${varName}_NOT_SET`;
    });
}

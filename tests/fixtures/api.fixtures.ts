import { test as base, APIRequestContext, request } from '@playwright/test';

interface ApiFixtures {
  api: APIRequestContext;
}

export const test = base.extend<ApiFixtures>({
  api: async ({}, use) => {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };

    
    const username = (process.env['API_USERNAME'] ?? process.env['API_KEY'] ?? "");
    const password = (process.env['API_PASSWORD'] ?? "");
    if (username && password) {
      const encoded = Buffer.from(username + ':' + password).toString('base64');
      headers['Authorization'] = 'Basic ' + encoded;
    } else if (username && !password) {
      // Fallback for API Key if passed as username without password
      headers['X-API-KEY'] = username;
    }
    

    const context = await request.newContext({
      baseURL: (process.env.BASE_URL ?? 'https://dummyjson.com').replace(/\/$/, ''),
      extraHTTPHeaders: headers,
    });

    await use(context);
    await context.dispose();
  },
});

export { expect } from '@playwright/test';

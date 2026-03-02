import { test as base, APIRequestContext, request } from '@playwright/test';

/**
 * Extends the basic Playwright test with a pre-configured API client
 * Handles Authentication and Global Headers automatically.
 */
interface ApiFixtures {
  api: APIRequestContext;
}

export const test = base.extend<ApiFixtures>({
  api: async ({}, use) => {
    // 1. Prepare Headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    // 2. Inject Auth Credentials
    

    // 3. Create Context
    const context = await request.newContext({
      baseURL: process.env.BASE_URL || 'https://dummyjson.com',
      extraHTTPHeaders: headers,
    });

    // 4. Use context in test
    await use(context);

    // 5. Cleanup
    await context.dispose();
  },
});

export { expect } from '@playwright/test';

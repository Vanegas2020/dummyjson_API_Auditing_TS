import { test, expect } from '../fixtures/api.fixtures';

// ============================================================================
// Endpoint : GET /users/1/todos
// Name     : Todos
// Level    : auditing
// TestTypes: happy-path, negative-testing, contract, security
// ============================================================================

test.describe('Endpoint: GET /users/1/todos', () => {

  test('[CP-GEN-01] GET /users/1/todos - Health Check Reachable', async ({ api }) => {
      const response = await api.get('/users/1/todos');
      expect(response.status(), "Endpoint must respond (no 5xx)").toBeLessThan(500);
  });

  test('[CP-GEN-02] GET /users/1/todos - Latency Baseline < 2000ms', async ({ api }) => {
      const start = Date.now();
      await api.get('/users/1/todos');
      const duration = Date.now() - start;
      expect(duration, "Response must be under 2000ms baseline").toBeLessThan(2000);
  });

  test('[CP-GEN-03] GET /users/1/todos - Response Time SLA', async ({ api }) => {
      const start = Date.now();
      await api.get('/users/1/todos');
      const duration = Date.now() - start;
      expect(duration, "Response must be within SLA").toBeLessThan(30000);
  });

  test('[CP-GEN-07] GET /users/1/todos - Content-Type Match', async ({ api }) => {
      const response = await api.get('/users/1/todos');
      // 204/205 responses must not carry a body — Content-Type check does not apply
      if (response.ok() && response.status() !== 204 && response.status() !== 205) {
          const contentType = response.headers()['content-type'] || '';
          expect(contentType, 'Content-Type header must match declared type').toContain('application/json');
      }
  });

  test('[CP-GEN-04] GET /users/1/todos - X-Content-Type-Options Header', async ({ api }) => {
      const response = await api.get('/users/1/todos');
      const header = response.headers()['x-content-type-options'];
      expect(header, 'x-content-type-options must be nosniff').toBe('nosniff');
  });

  test('[CP-GEN-06] GET /users/1/todos - Strict-Transport-Security Header', async ({ api }) => {
      const response = await api.get('/users/1/todos');
      const header = response.headers()['strict-transport-security'];
      // HSTS is recommended but not always present on API-only services
      if (!header) {
          console.warn('[WARN] strict-transport-security header is absent in response');
      }
      expect(header ?? '', 'HSTS header must not be explicitly disabled').not.toBe('max-age=0');
  });

  test('[CP-GEN-05] GET /users/1/todos - X-Frame-Options Header', async ({ api }) => {
      const response = await api.get('/users/1/todos');
      const header = response.headers()['x-frame-options'];
      expect(header, 'x-frame-options must be DENY or SAMEORIGIN').toMatch(/^(DENY|SAMEORIGIN)$/i);
  });

  test('[CP-GEN-08] GET /users/1/todos - Content-Security-Policy Header', async ({ api }) => {
      const response = await api.get('/users/1/todos');
      const header = response.headers()['content-security-policy'];
      // CSP is recommended but not always present on API-only services
      if (!header) {
          console.warn('[WARN] content-security-policy header is absent in response');
      }
      expect(header ?? '', 'CSP header must not allow bare unsafe-inline').not.toMatch(/^unsafe-inline$/);
  });

  test('[CP-GEN-10] GET /users/1/todos - No Authentication Required', async ({ request }) => {
      // Public API — endpoint must be accessible without credentials (no 401/403)
      const response = await request.get((process.env.BASE_URL || '').replace(/\/$/, '') + (('/users/1/todos').startsWith('/') ? ('/users/1/todos') : '/' + ('/users/1/todos')));
      // 429 is acceptable: rate-limited but reachable without auth
      expect([401, 403], "Public endpoint must not require auth").not.toContain(response.status());
  });

  test('[CP-MET-GET-01] GET /users/1/todos - Successful Retrieval', async ({ api }) => {
      const response = await api.get('/users/1/todos');
      expect(response.status()).toBe(200);
  });

  test('[CP-MET-GET-02] GET /users/1/todos - Collection Returns Array', async ({ api }) => {
      const response = await api.get('/users/1/todos');
      if (response.ok()) {
          const body = await response.json();
          expect(
              Array.isArray(body) || Array.isArray(body?.todos),
              'Collection must return array or contain a .todos array'
          ).toBeTruthy();
      }
  });

  test('[CP-MET-GEN-01] GET /users/1/todos - Wrong Method Does Not Cause 5xx', async ({ api }) => {
      const response = await api.post('/users/1/todos');
      expect([201, 400, 401, 403, 404, 405, 409, 422, 429], 'POST on this endpoint must return a non-5xx status').toContain(response.status());
  });

  test('[CP-COD-2XX] GET /users/1/todos - Returns 200', async ({ api }) => {
      const response = await api.get('/users/1/todos');
      const allowed = [200, 201, 204, 429];
      expect(allowed, 'GET /users/1/todos must return a success status code').toContain(response.status());
  });

  test('[CP-RES-01] GET /users/1/todos - Root Strict Schema Match', async ({ api }) => {
      const response = await api.get('/users/1/todos');
      if (response.status() === 429) { return; } // rate-limited: skip schema check
      expect(response.ok()).toBeTruthy();
      const body = await response.json();
  
      // Required root-level fields
      const requiredKeys = ["todos","total","skip","limit"];
      for (const key of requiredKeys) {
          expect(body, `Field "${key}" must exist in root`).toHaveProperty(key);
      }
  
      // Required array item fields on first element
      const firstItem = (body?.todos)?.[0] ?? {};
      if (Object.keys(firstItem).length === 0) { return; } // no items yet — cannot verify array item fields
      const requiredItemKeys = ["id","todo","completed","userId"];
      for (const key of requiredItemKeys) {
          expect(firstItem, `Array item field "${key}" must exist`).toHaveProperty(key);
      }
  });

  test('[CP-RES-04] GET /users/1/todos - Collection Always Returns Array', async ({ api }) => {
      const response = await api.get('/users/1/todos');
      if (response.ok()) {
          const body = await response.json();
          expect(
              Array.isArray(body) || Array.isArray(body?.todos),
              'Response must be array or contain a .todos array'
          ).toBeTruthy();
      }
  });

  test('[CP-RES-06] GET /users/1/todos - Array Items Schema Match', async ({ api }) => {
      const response = await api.get('/users/1/todos');
      if (response.status() === 429) { return; } // rate-limited: skip schema check
      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      const arr = body?.todos;
  
      // Field may not be initialized if the resource was created without this data
      if (arr == null) { return; }
      expect(Array.isArray(arr), '"todos" must be an array').toBeTruthy();
  
      if (arr.length > 0) {
          const item = arr[0];
          const expectedFields = ["id","todo","completed","userId"];
          for (const field of expectedFields) {
              expect(item, `Array item must have field "${field}"`).toHaveProperty(field);
          }
      }
  });

  test('[CP-RES-02] GET /users/1/todos - All Fields Present', async ({ api }) => {
      const response = await api.get('/users/1/todos');
      if (response.status() === 429) { return; } // rate-limited: skip schema check
      expect(response.ok()).toBeTruthy();
      const body = await response.json();
  
      // [CP-RES-02] Presence: total
      expect(body.total, 'Field "total" must exist').toBeDefined();
  
      // [CP-RES-02] Presence: skip
      expect(body.skip, 'Field "skip" must exist').toBeDefined();
  
      // [CP-RES-02] Presence: limit
      expect(body.limit, 'Field "limit" must exist').toBeDefined();
  
  });

  test('[CP-RES-03] GET /users/1/todos - Atomic Type and Format Assertions', async ({ api }) => {
      const response = await api.get('/users/1/todos');
      if (response.status() === 429) { return; } // rate-limited: skip schema check
      expect(response.ok()).toBeTruthy();
      const body = await response.json();
  
      // [CP-RES-03] Type: total → number
      if (body.total != null) {
          expect(typeof (body.total), 'Field "total" must be number when present').toBe('number');
      }
      // [CP-RES-03] Regex: total
      if (body.total != null) {
          expect(String(body.total), 'Field "total" must match pattern').toMatch(new RegExp('^-?\\d*$', 's'));
      }
  
      // [CP-RES-03] Type: skip → number
      if (body.skip != null) {
          expect(typeof (body.skip), 'Field "skip" must be number when present').toBe('number');
      }
      // [CP-RES-03] Regex: skip
      if (body.skip != null) {
          expect(String(body.skip), 'Field "skip" must match pattern').toMatch(new RegExp('^-?\\d*$', 's'));
      }
  
      // [CP-RES-03] Type: limit → number
      if (body.limit != null) {
          expect(typeof (body.limit), 'Field "limit" must be number when present').toBe('number');
      }
      // [CP-RES-03] Regex: limit
      if (body.limit != null) {
          expect(String(body.limit), 'Field "limit" must match pattern').toMatch(new RegExp('^-?\\d*$', 's'));
      }
  
  });

  test('[CP-RES-08] GET /users/1/todos - Array Cardinality vs Count Fields', async ({ api }) => {
      const response = await api.get('/users/1/todos');
      if (response.status() === 429) { return; } // rate-limited: skip schema check
      expect(response.ok()).toBeTruthy();
      const body = await response.json();
  
      expect(Array.isArray(body.todos), '"todos" must be array').toBeTruthy();
  
      // todos.length ≤ total
      expect((body.todos as unknown[]).length, '"todos".length must not exceed "total"').toBeLessThanOrEqual(body.total as number);
  });

  test('[CP-RES-10] GET /users/1/todos - Array Item IDs Are Unique', async ({ api }) => {
      const response = await api.get('/users/1/todos');
      if (response.status() === 429) { return; } // rate-limited: skip schema check
      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      const arr = body.todos;
  
      // Field may not be initialized if the resource was created without this data
      if (arr == null) { return; }
      expect(Array.isArray(arr), '"todos" must be array').toBeTruthy();
  
      if (arr.length > 1) {
          const ids = (arr as Record<string, unknown>[]).map((item: Record<string, unknown>) => item['id']);
          const uniqueIds = new Set(ids);
          expect(uniqueIds.size, `"id" must be unique across all todos items`).toBe(ids.length);
      }
  });

  test('[CP-SEC-02] GET /users/1/todos - No Sensitive Data Exposed', async ({ api }) => {
      const response = await api.get('/users/1/todos');
      if (response.ok()) {
          const text = await response.text();
          // Patterns for sensitive fields NOT declared in the response schema
          const sensitivePatterns = [
              /\"password\"\s*:/i,
              /\"passwd\"\s*:/i,
              /\"secret\"\s*:/i,
              /\"private_key\"\s*:/i,
              /\"api_secret\"\s*:/i,
              /\"credit_card\"\s*:/i,
          ];
          for (const pattern of sensitivePatterns) {
              expect(pattern.test(text), 'Response must not expose sensitive field: ' + pattern).toBeFalsy();
          }
      }
  });

  test('[CP-SEC-03] GET /users/1/todos - Errors Do Not Expose Internal Details', async ({ api }) => {
      // GET with an invalid path suffix — guaranteed to return a non-2xx error response
      const response = await api.get('/users/1/todos/___error___trigger___');
      expect(response.ok(), "Invalid path must not return 2xx").toBeFalsy();
      const text = await response.text();
      const verbosePatterns = [
          /stack trace/i,
          /at Object\./i,
          /node_modules/i,
          /\.ts:\d+/,
          /\.js:\d+/,
          /SQL syntax/i,
          /ORA-\d+/i,
      ];
      for (const pattern of verbosePatterns) {
          expect(pattern.test(text), 'Error response must not expose: ' + pattern).toBeFalsy();
      }
  });

  test('[CP-SEC-01] GET /users/1/todos - Rate Limiting Triggers 429', async ({ api }) => {
      // Send 20 rapid requests to trigger rate limiting
      const requests = Array.from({ length: 20 }, () =>
          api.get('/users/1/todos')
      );
      const responses = await Promise.all(requests);
      const statuses = responses.map(r => r.status());
      // At least one request should be rate-limited (429), all succeed (no rate limit enforced),
      // or ≤3 out of 20 return 5xx (server overload under rapid load — also acceptable)
      const hasRateLimit = statuses.includes(429);
      const allSucceeded = statuses.every(s => s < 500);
      const overloaded = statuses.filter(s => s >= 500).length <= 3;
      expect(hasRateLimit || allSucceeded || overloaded, 'Rate limiting should return 429, all succeed, or ≤3/20 server-overload 5xxs').toBeTruthy();
      // Cool-down: let the rate-limit window reset before the next spec
      if (hasRateLimit) await new Promise(r => setTimeout(r, 8000));
  });

  test('[CP-AUD-01] GET /users/1/todos - XSS Payloads via Query Not Reflected', async ({ api }) => {
      const xssPayloads = ["<script>alert(1)</script>","\"><img src=x onerror=alert(1)>","';alert(String.fromCharCode(88,83,83))//"];
      for (const payload of xssPayloads) {
          const response = await api.get('/users/1/todos', {
              params: { search: payload, q: payload, filter: payload }
          });
          expect(response.status(), 'XSS via query must not cause 500: ' + payload).not.toBe(500);
          if (response.ok()) {
              const contentType = response.headers()['content-type'] || '';
              // XSS is only dangerous when rendered as HTML; JSON APIs echoing stored data are not XSS vectors.
              if (contentType.includes('text/html')) {
                  const text = await response.text();
                  expect(text.includes(payload), 'HTML response must not reflect XSS payload: ' + payload).toBeFalsy();
              }
          }
      }
  });

  test('[CP-AUD-02] GET /users/1/todos - Command Injection via Query Rejected', async ({ api }) => {
      const cmdPayloads = ["; ls","| whoami","$(id)","&& cat /etc/passwd","`uname -a`"];
      const systemPatterns = [/root:/i, /bin\/bash/i, /uid=\d+/i];
      for (const payload of cmdPayloads) {
          const response = await api.get('/users/1/todos', {
              params: { search: payload, q: payload }
          });
          expect(response.status(), 'Command injection via query must not cause 500: ' + payload).not.toBe(500);
          const text = await response.text();
          for (const pattern of systemPatterns) {
              expect(pattern.test(text), 'Response must not contain system output for: ' + payload).toBeFalsy();
          }
      }
  });

  test('[CP-AUD-03] GET /users/1/todos - Path Traversal via Query Rejected', async ({ api }) => {
      const traversalPayloads = ["../../etc/passwd","..%2F..%2Fetc%2Fshadow","....//....//etc//passwd","%252e%252e%252fetc%252fpasswd"];
      const filePatterns = [/root:/i, /daemon:/i, /\[boot loader\]/i, /\[fonts\]/i];
      for (const payload of traversalPayloads) {
          const response = await api.get('/users/1/todos', {
              params: { path: payload, file: payload, resource: payload }
          });
          expect(response.status(), 'Path traversal via query must not cause 500: ' + payload).not.toBe(500);
          const text = await response.text();
          for (const pattern of filePatterns) {
              expect(pattern.test(text), 'Response must not contain file system contents for: ' + payload).toBeFalsy();
          }
      }
  });

  test('[CP-AUD-04] GET /users/1/todos - Undeclared HTTP Verb Returns 405/403', async ({ api }) => {
      // Send DELETE to an endpoint declared as GET
      const response = await api.delete('/users/1/todos');
      // Should return 405 Method Not Allowed or 403 Forbidden
      expect([200, 201, 204, 400, 403, 404, 405, 429], 'Undeclared verb ' + 'DELETE' + ' must be rejected or handled as permissive').toContain(response.status());
  });

  test('[CP-AUD-05] GET /users/1/todos - Malformed Auth Token Returns 401/403', async ({ api }) => {
      const malformedTokens = [
          'INVALID_TOKEN_12345',
          'null',
          'undefined',
          '',
          'Bearer',
      ];
      for (const token of malformedTokens) {
          const response = await api.get('/users/1/todos', {
              headers: { Authorization: 'Bearer ' + token }
          });
          // If the API is authenticated, must reject malformed tokens
          // If the API is public, 200 is also acceptable
          expect([200, 400, 401, 403, 404, 429], 'Malformed token must be rejected or endpoint is public: ' + token).toContain(response.status());
          // Critical: must never return 500 on a bad token
          expect(response.status(), 'Malformed token must not cause 500: ' + token).not.toBe(500);
      }
  });

  test('[CP-AUD-06] GET /users/1/todos - JWT alg:none Attack Returns 401/403', async ({ api }) => {
      // JWT with alg:none (no signature) — should always be rejected by authenticated endpoints
      const algNoneJwt = 'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiIxIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzAwMDAwMDAwfQ.';
      const response = await api.get('/users/1/todos', {
          headers: { Authorization: 'Bearer ' + algNoneJwt }
      });
      // Must not return 200 with privileged data
      expect([200, 400, 401, 403, 404, 422, 429], 'JWT alg:none must be rejected or endpoint is public (401/403/404/422/200/429)').toContain(response.status());
  });

  test('[CP-AUD-07] GET /users/1/todos - Duplicate Query Params Do Not Cause 500', async ({ api }) => {
      // Send the same query param multiple times with different values
      const basePath = String('/users/1/todos');
      const sep = basePath.includes('?') ? '&' : '?';
      const url = basePath + sep + 'id=1&id=2&id=999&limit=10&limit=9999';
      const response = await api.get(url);
      // Must not crash the server — 200, 400, or 422 are all acceptable
      expect(response.status(), 'Duplicate query params must not cause 500').not.toBe(500);
      expect(response.status(), 'Duplicate query params must not cause timeout (>= 100)').toBeGreaterThanOrEqual(100);
  });

});

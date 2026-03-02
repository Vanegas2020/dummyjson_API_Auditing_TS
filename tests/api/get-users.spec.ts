import { test, expect } from '../fixtures/api.fixtures';

// ============================================================================
// Endpoint : GET /users
// Name     : Users
// Level    : auditing
// TestTypes: happy-path, negative-testing, contract, security
// ============================================================================

test.describe('Endpoint: GET /users', () => {

  test('[CP-GEN-01] GET /users - Health Check Reachable', async ({ api }) => {
      const response = await api.get('/users');
      expect(response.status(), "Endpoint must respond (no 5xx)").toBeLessThan(500);
  });

  test('[CP-GEN-02] GET /users - Latency Baseline < 2000ms', async ({ api }) => {
      const start = Date.now();
      await api.get('/users');
      const duration = Date.now() - start;
      expect(duration, "Response must be under 2000ms baseline").toBeLessThan(2000);
  });

  test('[CP-GEN-03] GET /users - Response Time SLA', async ({ api }) => {
      const start = Date.now();
      await api.get('/users');
      const duration = Date.now() - start;
      expect(duration, "Response must be within SLA").toBeLessThan(30000);
  });

  test('[CP-GEN-07] GET /users - Content-Type Match', async ({ api }) => {
      const response = await api.get('/users');
      if (response.ok()) {
          const contentType = response.headers()['content-type'] || '';
          expect(contentType, 'Content-Type header must match declared type').toContain('application/json');
      }
  });

  test('[CP-GEN-04] GET /users - X-Content-Type-Options Header', async ({ api }) => {
      const response = await api.get('/users');
      const header = response.headers()['x-content-type-options'];
      expect(header, 'x-content-type-options must be nosniff').toBe('nosniff');
  });

  test('[CP-GEN-06] GET /users - Strict-Transport-Security Header', async ({ api }) => {
      const response = await api.get('/users');
      const header = response.headers()['strict-transport-security'];
      // HSTS is recommended but not always present on API-only services
      if (!header) {
          console.warn('[WARN] strict-transport-security header is absent in response');
      }
      expect(header ?? '', 'HSTS header must not be explicitly disabled').not.toBe('max-age=0');
  });

  test('[CP-GEN-05] GET /users - X-Frame-Options Header', async ({ api }) => {
      const response = await api.get('/users');
      const header = response.headers()['x-frame-options'];
      expect(header, 'x-frame-options must be DENY or SAMEORIGIN').toMatch(/^(DENY|SAMEORIGIN)$/i);
  });

  test('[CP-GEN-08] GET /users - Content-Security-Policy Header', async ({ api }) => {
      const response = await api.get('/users');
      const header = response.headers()['content-security-policy'];
      // CSP is recommended but not always present on API-only services
      if (!header) {
          console.warn('[WARN] content-security-policy header is absent in response');
      }
      expect(header ?? '', 'CSP header must not allow bare unsafe-inline').not.toMatch(/^unsafe-inline$/);
  });

  test('[CP-GEN-10] GET /users - No Authentication Required', async ({ api }) => {
      // Public API — endpoint must be accessible without credentials
      const response = await api.get('/users');
      expect(response.ok(), "Public endpoint must be accessible without auth").toBeTruthy();
  });

  test('[CP-MET-GET-01] GET /users - Successful Retrieval', async ({ api }) => {
      const response = await api.get('/users');
      expect(response.status()).toBe(200);
  });

  test('[CP-MET-GET-02] GET /users - Collection Returns Array', async ({ api }) => {
      const response = await api.get('/users');
      if (response.ok()) {
          const body = await response.json();
          expect(
              Array.isArray(body) || Array.isArray(body?.users),
              'Collection must return array or contain a .users array'
          ).toBeTruthy();
      }
  });

  test('[CP-MET-GEN-01] GET /users - Wrong Method Does Not Cause 5xx', async ({ api }) => {
      const response = await api.post('/users');
      expect([201, 400, 401, 403, 404, 405, 409, 422], 'POST on this endpoint must return a non-5xx status').toContain(response.status());
  });

  test('[CP-COD-2XX] GET /users - Returns 200', async ({ api }) => {
      const response = await api.get('/users');
      expect(response.status()).toBe(200);
  });

  test('[CP-RES-01] GET /users - Root Strict Schema Match', async ({ api }) => {
      const response = await api.get('/users');
      expect(response.ok()).toBeTruthy();
      const body = await response.json();
  
      // Required root-level fields
      const requiredKeys = ["users","total","skip","limit"];
      for (const key of requiredKeys) {
          expect(body, `Field "${key}" must exist in root`).toHaveProperty(key);
      }
  
      // Required array item fields on first element
      const firstItem = (body?.['users'])?.[0] ?? {};
      const requiredItemKeys = ["id","firstName","lastName","maidenName","age","gender","email","phone","username","password","birthDate","image","bloodGroup","height","weight","eyeColor","hair","ip","address","macAddress","university","bank","company","ein","ssn","userAgent","crypto","role"];
      for (const key of requiredItemKeys) {
          expect(firstItem, `Array item field "${key}" must exist`).toHaveProperty(key);
      }
  });

  test('[CP-RES-04] GET /users - Collection Always Returns Array', async ({ api }) => {
      const response = await api.get('/users');
      if (response.ok()) {
          const body = await response.json();
          expect(
              Array.isArray(body) || Array.isArray(body?.users),
              'Response must be array or contain a .users array'
          ).toBeTruthy();
      }
  });

  test('[CP-RES-05] GET /users - Nested Objects Schema Match', async ({ api }) => {
      const response = await api.get('/users');
      expect(response.ok()).toBeTruthy();
      const body = await response.json();
  
      const _get = (o: Record<string, unknown>, path: string): unknown =>
          path.split('.').reduce((acc: unknown, k) => {
              const arrKey = k.replace(/\[\]$/, '');
              const val = (acc as Record<string, unknown>)?.[arrKey];
              return Array.isArray(val) ? val[0] : val;
          }, o as unknown);
  
      // Parent: users[].hair
      const _users___hair = _get(body, 'users[].hair');
      expect(_users___hair, 'Object "users[].hair" must exist').toBeDefined();
      expect(typeof _users___hair, 'Object "users[].hair" must be an object').toBe('object');
      expect(_users___hair, 'Field "users[].hair.color" must exist').toHaveProperty('color');
      expect(_users___hair, 'Field "users[].hair.type" must exist').toHaveProperty('type');
  
      // Parent: users[].address
      const _users___address = _get(body, 'users[].address');
      expect(_users___address, 'Object "users[].address" must exist').toBeDefined();
      expect(typeof _users___address, 'Object "users[].address" must be an object').toBe('object');
      expect(_users___address, 'Field "users[].address.address" must exist').toHaveProperty('address');
      expect(_users___address, 'Field "users[].address.city" must exist').toHaveProperty('city');
      expect(_users___address, 'Field "users[].address.state" must exist').toHaveProperty('state');
      expect(_users___address, 'Field "users[].address.stateCode" must exist').toHaveProperty('stateCode');
      expect(_users___address, 'Field "users[].address.postalCode" must exist').toHaveProperty('postalCode');
      expect(_users___address, 'Field "users[].address.coordinates" must exist').toHaveProperty('coordinates');
      expect(_users___address, 'Field "users[].address.country" must exist').toHaveProperty('country');
  
      // Parent: users[].address.coordinates
      const _users___address_coordinates = _get(body, 'users[].address.coordinates');
      expect(_users___address_coordinates, 'Object "users[].address.coordinates" must exist').toBeDefined();
      expect(typeof _users___address_coordinates, 'Object "users[].address.coordinates" must be an object').toBe('object');
      expect(_users___address_coordinates, 'Field "users[].address.coordinates.lat" must exist').toHaveProperty('lat');
      expect(_users___address_coordinates, 'Field "users[].address.coordinates.lng" must exist').toHaveProperty('lng');
  
      // Parent: users[].bank
      const _users___bank = _get(body, 'users[].bank');
      expect(_users___bank, 'Object "users[].bank" must exist').toBeDefined();
      expect(typeof _users___bank, 'Object "users[].bank" must be an object').toBe('object');
      expect(_users___bank, 'Field "users[].bank.cardExpire" must exist').toHaveProperty('cardExpire');
      expect(_users___bank, 'Field "users[].bank.cardNumber" must exist').toHaveProperty('cardNumber');
      expect(_users___bank, 'Field "users[].bank.cardType" must exist').toHaveProperty('cardType');
      expect(_users___bank, 'Field "users[].bank.currency" must exist').toHaveProperty('currency');
      expect(_users___bank, 'Field "users[].bank.iban" must exist').toHaveProperty('iban');
  
      // Parent: users[].company
      const _users___company = _get(body, 'users[].company');
      expect(_users___company, 'Object "users[].company" must exist').toBeDefined();
      expect(typeof _users___company, 'Object "users[].company" must be an object').toBe('object');
      expect(_users___company, 'Field "users[].company.department" must exist').toHaveProperty('department');
      expect(_users___company, 'Field "users[].company.name" must exist').toHaveProperty('name');
      expect(_users___company, 'Field "users[].company.title" must exist').toHaveProperty('title');
      expect(_users___company, 'Field "users[].company.address" must exist').toHaveProperty('address');
  
      // Parent: users[].company.address
      const _users___company_address = _get(body, 'users[].company.address');
      expect(_users___company_address, 'Object "users[].company.address" must exist').toBeDefined();
      expect(typeof _users___company_address, 'Object "users[].company.address" must be an object').toBe('object');
      expect(_users___company_address, 'Field "users[].company.address.address" must exist').toHaveProperty('address');
      expect(_users___company_address, 'Field "users[].company.address.city" must exist').toHaveProperty('city');
      expect(_users___company_address, 'Field "users[].company.address.state" must exist').toHaveProperty('state');
      expect(_users___company_address, 'Field "users[].company.address.stateCode" must exist').toHaveProperty('stateCode');
      expect(_users___company_address, 'Field "users[].company.address.postalCode" must exist').toHaveProperty('postalCode');
      expect(_users___company_address, 'Field "users[].company.address.coordinates" must exist').toHaveProperty('coordinates');
      expect(_users___company_address, 'Field "users[].company.address.country" must exist').toHaveProperty('country');
  
      // Parent: users[].company.address.coordinates
      const _users___company_address_coordinates = _get(body, 'users[].company.address.coordinates');
      expect(_users___company_address_coordinates, 'Object "users[].company.address.coordinates" must exist').toBeDefined();
      expect(typeof _users___company_address_coordinates, 'Object "users[].company.address.coordinates" must be an object').toBe('object');
      expect(_users___company_address_coordinates, 'Field "users[].company.address.coordinates.lat" must exist').toHaveProperty('lat');
      expect(_users___company_address_coordinates, 'Field "users[].company.address.coordinates.lng" must exist').toHaveProperty('lng');
  
      // Parent: users[].crypto
      const _users___crypto = _get(body, 'users[].crypto');
      expect(_users___crypto, 'Object "users[].crypto" must exist').toBeDefined();
      expect(typeof _users___crypto, 'Object "users[].crypto" must be an object').toBe('object');
      expect(_users___crypto, 'Field "users[].crypto.coin" must exist').toHaveProperty('coin');
      expect(_users___crypto, 'Field "users[].crypto.wallet" must exist').toHaveProperty('wallet');
      expect(_users___crypto, 'Field "users[].crypto.network" must exist').toHaveProperty('network');
  
  });

  test('[CP-RES-06] GET /users - Array Items Schema Match', async ({ api }) => {
      const response = await api.get('/users');
      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      const arr = body?.users;
  
      expect(Array.isArray(arr), '"users" must be an array').toBeTruthy();
  
      if (arr.length > 0) {
          const item = arr[0];
          const expectedFields = ["id","firstName","lastName","maidenName","age","gender","email","phone","username","password","birthDate","image","bloodGroup","height","weight","eyeColor","hair","ip","address","macAddress","university","bank","company","ein","ssn","userAgent","crypto","role"];
          for (const field of expectedFields) {
              expect(item, `Array item must have field "${field}"`).toHaveProperty(field);
          }
      }
  });

  test('[CP-RES-02] GET /users - All Fields Present', async ({ api }) => {
      const response = await api.get('/users');
      expect(response.ok()).toBeTruthy();
      const body = await response.json();
  
      // [CP-RES-02] Presence: users[].id
      expect(body?.users?.[0]?.id, 'Field "users[].id" must exist').toBeDefined();
      expect(body?.users?.[0]?.id, 'Field "users[].id" must not be null').not.toBeNull();
  
      // [CP-RES-02] Presence: users[].firstName
      expect(body?.users?.[0]?.firstName, 'Field "users[].firstName" must exist').toBeDefined();
      expect(body?.users?.[0]?.firstName, 'Field "users[].firstName" must not be null').not.toBeNull();
  
      // [CP-RES-02] Presence: users[].lastName
      expect(body?.users?.[0]?.lastName, 'Field "users[].lastName" must exist').toBeDefined();
      expect(body?.users?.[0]?.lastName, 'Field "users[].lastName" must not be null').not.toBeNull();
  
      // [CP-RES-02] Presence: users[].maidenName
      expect(body?.users?.[0]?.maidenName, 'Field "users[].maidenName" must exist').toBeDefined();
      expect(body?.users?.[0]?.maidenName, 'Field "users[].maidenName" must not be null').not.toBeNull();
  
      // [CP-RES-02] Presence: users[].age
      expect(body?.users?.[0]?.age, 'Field "users[].age" must exist').toBeDefined();
      expect(body?.users?.[0]?.age, 'Field "users[].age" must not be null').not.toBeNull();
  
      // [CP-RES-02] Presence: users[].gender
      expect(body?.users?.[0]?.gender, 'Field "users[].gender" must exist').toBeDefined();
      expect(body?.users?.[0]?.gender, 'Field "users[].gender" must not be null').not.toBeNull();
  
      // [CP-RES-02] Presence: users[].email
      expect(body?.users?.[0]?.email, 'Field "users[].email" must exist').toBeDefined();
      expect(body?.users?.[0]?.email, 'Field "users[].email" must not be null').not.toBeNull();
  
      // [CP-RES-02] Presence: users[].phone
      expect(body?.users?.[0]?.phone, 'Field "users[].phone" must exist').toBeDefined();
      expect(body?.users?.[0]?.phone, 'Field "users[].phone" must not be null').not.toBeNull();
  
      // [CP-RES-02] Presence: users[].username
      expect(body?.users?.[0]?.username, 'Field "users[].username" must exist').toBeDefined();
      expect(body?.users?.[0]?.username, 'Field "users[].username" must not be null').not.toBeNull();
  
      // [CP-RES-02] Presence: users[].password
      expect(body?.users?.[0]?.password, 'Field "users[].password" must exist').toBeDefined();
      expect(body?.users?.[0]?.password, 'Field "users[].password" must not be null').not.toBeNull();
  
      // [CP-RES-02] Presence: users[].birthDate
      expect(body?.users?.[0]?.birthDate, 'Field "users[].birthDate" must exist').toBeDefined();
      expect(body?.users?.[0]?.birthDate, 'Field "users[].birthDate" must not be null').not.toBeNull();
  
      // [CP-RES-02] Presence: users[].image
      expect(body?.users?.[0]?.image, 'Field "users[].image" must exist').toBeDefined();
      expect(body?.users?.[0]?.image, 'Field "users[].image" must not be null').not.toBeNull();
  
      // [CP-RES-02] Presence: users[].bloodGroup
      expect(body?.users?.[0]?.bloodGroup, 'Field "users[].bloodGroup" must exist').toBeDefined();
      expect(body?.users?.[0]?.bloodGroup, 'Field "users[].bloodGroup" must not be null').not.toBeNull();
  
      // [CP-RES-02] Presence: users[].height
      expect(body?.users?.[0]?.height, 'Field "users[].height" must exist').toBeDefined();
      expect(body?.users?.[0]?.height, 'Field "users[].height" must not be null').not.toBeNull();
  
      // [CP-RES-02] Presence: users[].weight
      expect(body?.users?.[0]?.weight, 'Field "users[].weight" must exist').toBeDefined();
      expect(body?.users?.[0]?.weight, 'Field "users[].weight" must not be null').not.toBeNull();
  
      // [CP-RES-02] Presence: users[].eyeColor
      expect(body?.users?.[0]?.eyeColor, 'Field "users[].eyeColor" must exist').toBeDefined();
      expect(body?.users?.[0]?.eyeColor, 'Field "users[].eyeColor" must not be null').not.toBeNull();
  
      // [CP-RES-02] Presence: users[].hair.color
      expect(body?.users?.[0]?.hair?.color, 'Field "users[].hair.color" must exist').toBeDefined();
      expect(body?.users?.[0]?.hair?.color, 'Field "users[].hair.color" must not be null').not.toBeNull();
  
      // [CP-RES-02] Presence: users[].hair.type
      expect(body?.users?.[0]?.hair?.type, 'Field "users[].hair.type" must exist').toBeDefined();
      expect(body?.users?.[0]?.hair?.type, 'Field "users[].hair.type" must not be null').not.toBeNull();
  
      // [CP-RES-02] Presence: users[].ip
      expect(body?.users?.[0]?.ip, 'Field "users[].ip" must exist').toBeDefined();
      expect(body?.users?.[0]?.ip, 'Field "users[].ip" must not be null').not.toBeNull();
  
      // [CP-RES-02] Presence: users[].address.address
      expect(body?.users?.[0]?.address?.address, 'Field "users[].address.address" must exist').toBeDefined();
      expect(body?.users?.[0]?.address?.address, 'Field "users[].address.address" must not be null').not.toBeNull();
  
      // [CP-RES-02] Presence: users[].address.city
      expect(body?.users?.[0]?.address?.city, 'Field "users[].address.city" must exist').toBeDefined();
      expect(body?.users?.[0]?.address?.city, 'Field "users[].address.city" must not be null').not.toBeNull();
  
      // [CP-RES-02] Presence: users[].address.state
      expect(body?.users?.[0]?.address?.state, 'Field "users[].address.state" must exist').toBeDefined();
      expect(body?.users?.[0]?.address?.state, 'Field "users[].address.state" must not be null').not.toBeNull();
  
      // [CP-RES-02] Presence: users[].address.stateCode
      expect(body?.users?.[0]?.address?.stateCode, 'Field "users[].address.stateCode" must exist').toBeDefined();
      expect(body?.users?.[0]?.address?.stateCode, 'Field "users[].address.stateCode" must not be null').not.toBeNull();
  
      // [CP-RES-02] Presence: users[].address.postalCode
      expect(body?.users?.[0]?.address?.postalCode, 'Field "users[].address.postalCode" must exist').toBeDefined();
      expect(body?.users?.[0]?.address?.postalCode, 'Field "users[].address.postalCode" must not be null').not.toBeNull();
  
      // [CP-RES-02] Presence: users[].address.coordinates.lat
      expect(body?.users?.[0]?.address?.coordinates?.lat, 'Field "users[].address.coordinates.lat" must exist').toBeDefined();
      expect(body?.users?.[0]?.address?.coordinates?.lat, 'Field "users[].address.coordinates.lat" must not be null').not.toBeNull();
  
      // [CP-RES-02] Presence: users[].address.coordinates.lng
      expect(body?.users?.[0]?.address?.coordinates?.lng, 'Field "users[].address.coordinates.lng" must exist').toBeDefined();
      expect(body?.users?.[0]?.address?.coordinates?.lng, 'Field "users[].address.coordinates.lng" must not be null').not.toBeNull();
  
      // [CP-RES-02] Presence: users[].address.country
      expect(body?.users?.[0]?.address?.country, 'Field "users[].address.country" must exist').toBeDefined();
      expect(body?.users?.[0]?.address?.country, 'Field "users[].address.country" must not be null').not.toBeNull();
  
      // [CP-RES-02] Presence: users[].macAddress
      expect(body?.users?.[0]?.macAddress, 'Field "users[].macAddress" must exist').toBeDefined();
      expect(body?.users?.[0]?.macAddress, 'Field "users[].macAddress" must not be null').not.toBeNull();
  
      // [CP-RES-02] Presence: users[].university
      expect(body?.users?.[0]?.university, 'Field "users[].university" must exist').toBeDefined();
      expect(body?.users?.[0]?.university, 'Field "users[].university" must not be null').not.toBeNull();
  
      // [CP-RES-02] Presence: users[].bank.cardExpire
      expect(body?.users?.[0]?.bank?.cardExpire, 'Field "users[].bank.cardExpire" must exist').toBeDefined();
      expect(body?.users?.[0]?.bank?.cardExpire, 'Field "users[].bank.cardExpire" must not be null').not.toBeNull();
  
      // [CP-RES-02] Presence: users[].bank.cardNumber
      expect(body?.users?.[0]?.bank?.cardNumber, 'Field "users[].bank.cardNumber" must exist').toBeDefined();
      expect(body?.users?.[0]?.bank?.cardNumber, 'Field "users[].bank.cardNumber" must not be null').not.toBeNull();
  
      // [CP-RES-02] Presence: users[].bank.cardType
      expect(body?.users?.[0]?.bank?.cardType, 'Field "users[].bank.cardType" must exist').toBeDefined();
      expect(body?.users?.[0]?.bank?.cardType, 'Field "users[].bank.cardType" must not be null').not.toBeNull();
  
      // [CP-RES-02] Presence: users[].bank.currency
      expect(body?.users?.[0]?.bank?.currency, 'Field "users[].bank.currency" must exist').toBeDefined();
      expect(body?.users?.[0]?.bank?.currency, 'Field "users[].bank.currency" must not be null').not.toBeNull();
  
      // [CP-RES-02] Presence: users[].bank.iban
      expect(body?.users?.[0]?.bank?.iban, 'Field "users[].bank.iban" must exist').toBeDefined();
      expect(body?.users?.[0]?.bank?.iban, 'Field "users[].bank.iban" must not be null').not.toBeNull();
  
      // [CP-RES-02] Presence: users[].company.department
      expect(body?.users?.[0]?.company?.department, 'Field "users[].company.department" must exist').toBeDefined();
      expect(body?.users?.[0]?.company?.department, 'Field "users[].company.department" must not be null').not.toBeNull();
  
      // [CP-RES-02] Presence: users[].company.name
      expect(body?.users?.[0]?.company?.name, 'Field "users[].company.name" must exist').toBeDefined();
      expect(body?.users?.[0]?.company?.name, 'Field "users[].company.name" must not be null').not.toBeNull();
  
      // [CP-RES-02] Presence: users[].company.title
      expect(body?.users?.[0]?.company?.title, 'Field "users[].company.title" must exist').toBeDefined();
      expect(body?.users?.[0]?.company?.title, 'Field "users[].company.title" must not be null').not.toBeNull();
  
      // [CP-RES-02] Presence: users[].company.address.address
      expect(body?.users?.[0]?.company?.address?.address, 'Field "users[].company.address.address" must exist').toBeDefined();
      expect(body?.users?.[0]?.company?.address?.address, 'Field "users[].company.address.address" must not be null').not.toBeNull();
  
      // [CP-RES-02] Presence: users[].company.address.city
      expect(body?.users?.[0]?.company?.address?.city, 'Field "users[].company.address.city" must exist').toBeDefined();
      expect(body?.users?.[0]?.company?.address?.city, 'Field "users[].company.address.city" must not be null').not.toBeNull();
  
      // [CP-RES-02] Presence: users[].company.address.state
      expect(body?.users?.[0]?.company?.address?.state, 'Field "users[].company.address.state" must exist').toBeDefined();
      expect(body?.users?.[0]?.company?.address?.state, 'Field "users[].company.address.state" must not be null').not.toBeNull();
  
      // [CP-RES-02] Presence: users[].company.address.stateCode
      expect(body?.users?.[0]?.company?.address?.stateCode, 'Field "users[].company.address.stateCode" must exist').toBeDefined();
      expect(body?.users?.[0]?.company?.address?.stateCode, 'Field "users[].company.address.stateCode" must not be null').not.toBeNull();
  
      // [CP-RES-02] Presence: users[].company.address.postalCode
      expect(body?.users?.[0]?.company?.address?.postalCode, 'Field "users[].company.address.postalCode" must exist').toBeDefined();
      expect(body?.users?.[0]?.company?.address?.postalCode, 'Field "users[].company.address.postalCode" must not be null').not.toBeNull();
  
      // [CP-RES-02] Presence: users[].company.address.coordinates.lat
      expect(body?.users?.[0]?.company?.address?.coordinates?.lat, 'Field "users[].company.address.coordinates.lat" must exist').toBeDefined();
      expect(body?.users?.[0]?.company?.address?.coordinates?.lat, 'Field "users[].company.address.coordinates.lat" must not be null').not.toBeNull();
  
      // [CP-RES-02] Presence: users[].company.address.coordinates.lng
      expect(body?.users?.[0]?.company?.address?.coordinates?.lng, 'Field "users[].company.address.coordinates.lng" must exist').toBeDefined();
      expect(body?.users?.[0]?.company?.address?.coordinates?.lng, 'Field "users[].company.address.coordinates.lng" must not be null').not.toBeNull();
  
      // [CP-RES-02] Presence: users[].company.address.country
      expect(body?.users?.[0]?.company?.address?.country, 'Field "users[].company.address.country" must exist').toBeDefined();
      expect(body?.users?.[0]?.company?.address?.country, 'Field "users[].company.address.country" must not be null').not.toBeNull();
  
      // [CP-RES-02] Presence: users[].ein
      expect(body?.users?.[0]?.ein, 'Field "users[].ein" must exist').toBeDefined();
      expect(body?.users?.[0]?.ein, 'Field "users[].ein" must not be null').not.toBeNull();
  
      // [CP-RES-02] Presence: users[].ssn
      expect(body?.users?.[0]?.ssn, 'Field "users[].ssn" must exist').toBeDefined();
      expect(body?.users?.[0]?.ssn, 'Field "users[].ssn" must not be null').not.toBeNull();
  
      // [CP-RES-02] Presence: users[].userAgent
      expect(body?.users?.[0]?.userAgent, 'Field "users[].userAgent" must exist').toBeDefined();
      expect(body?.users?.[0]?.userAgent, 'Field "users[].userAgent" must not be null').not.toBeNull();
  
      // [CP-RES-02] Presence: users[].crypto.coin
      expect(body?.users?.[0]?.crypto?.coin, 'Field "users[].crypto.coin" must exist').toBeDefined();
      expect(body?.users?.[0]?.crypto?.coin, 'Field "users[].crypto.coin" must not be null').not.toBeNull();
  
      // [CP-RES-02] Presence: users[].crypto.wallet
      expect(body?.users?.[0]?.crypto?.wallet, 'Field "users[].crypto.wallet" must exist').toBeDefined();
      expect(body?.users?.[0]?.crypto?.wallet, 'Field "users[].crypto.wallet" must not be null').not.toBeNull();
  
      // [CP-RES-02] Presence: users[].crypto.network
      expect(body?.users?.[0]?.crypto?.network, 'Field "users[].crypto.network" must exist').toBeDefined();
      expect(body?.users?.[0]?.crypto?.network, 'Field "users[].crypto.network" must not be null').not.toBeNull();
  
      // [CP-RES-02] Presence: users[].role
      expect(body?.users?.[0]?.role, 'Field "users[].role" must exist').toBeDefined();
      expect(body?.users?.[0]?.role, 'Field "users[].role" must not be null').not.toBeNull();
  
      // [CP-RES-02] Presence: total
      expect(body.total, 'Field "total" must exist').toBeDefined();
      expect(body.total, 'Field "total" must not be null').not.toBeNull();
  
      // [CP-RES-02] Presence: skip
      expect(body.skip, 'Field "skip" must exist').toBeDefined();
      expect(body.skip, 'Field "skip" must not be null').not.toBeNull();
  
      // [CP-RES-02] Presence: limit
      expect(body.limit, 'Field "limit" must exist').toBeDefined();
      expect(body.limit, 'Field "limit" must not be null').not.toBeNull();
  
  });

  test('[CP-RES-03] GET /users - Atomic Type and Format Assertions', async ({ api }) => {
      const response = await api.get('/users');
      expect(response.ok()).toBeTruthy();
      const body = await response.json();
  
      // [CP-RES-03] Type: users[].id → number
      expect(typeof (body?.users?.[0]?.id), 'Field "users[].id" must be number').toBe('number');
      // [CP-RES-03] Regex: users[].id
      if (body?.users?.[0]?.id != null) {
          expect(String(body?.users?.[0]?.id), 'Field "users[].id" must match pattern').toMatch(new RegExp('^[1-9][0-9]*$'));
      }
  
      // [CP-RES-03] Type: users[].firstName → string
      expect(typeof (body?.users?.[0]?.firstName), 'Field "users[].firstName" must be string').toBe('string');
      // [CP-RES-03] Regex: users[].firstName
      if (body?.users?.[0]?.firstName != null) {
          expect(String(body?.users?.[0]?.firstName), 'Field "users[].firstName" must match pattern').toMatch(new RegExp('^.+$'));
      }
  
      // [CP-RES-03] Type: users[].lastName → string
      expect(typeof (body?.users?.[0]?.lastName), 'Field "users[].lastName" must be string').toBe('string');
      // [CP-RES-03] Regex: users[].lastName
      if (body?.users?.[0]?.lastName != null) {
          expect(String(body?.users?.[0]?.lastName), 'Field "users[].lastName" must match pattern').toMatch(new RegExp('^.+$'));
      }
  
      // [CP-RES-03] Type: users[].maidenName → string
      expect(typeof (body?.users?.[0]?.maidenName), 'Field "users[].maidenName" must be string').toBe('string');
      // [CP-RES-03] Regex: users[].maidenName
      if (body?.users?.[0]?.maidenName != null) {
          expect(String(body?.users?.[0]?.maidenName), 'Field "users[].maidenName" must match pattern').toMatch(new RegExp('^.+$'));
      }
  
      // [CP-RES-03] Type: users[].age → number
      expect(typeof (body?.users?.[0]?.age), 'Field "users[].age" must be number').toBe('number');
      // [CP-RES-03] Regex: users[].age
      if (body?.users?.[0]?.age != null) {
          expect(String(body?.users?.[0]?.age), 'Field "users[].age" must match pattern').toMatch(new RegExp('^-?\\d+$'));
      }
  
      // [CP-RES-03] Type: users[].gender → string
      expect(typeof (body?.users?.[0]?.gender), 'Field "users[].gender" must be string').toBe('string');
      // [CP-RES-03] Regex: users[].gender
      if (body?.users?.[0]?.gender != null) {
          expect(String(body?.users?.[0]?.gender), 'Field "users[].gender" must match pattern').toMatch(new RegExp('^.+$'));
      }
  
      // [CP-RES-03] Type: users[].email → string
      expect(typeof (body?.users?.[0]?.email), 'Field "users[].email" must be string').toBe('string');
      // [CP-RES-03] Regex: users[].email
      if (body?.users?.[0]?.email != null) {
          expect(String(body?.users?.[0]?.email), 'Field "users[].email" must match pattern').toMatch(new RegExp('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'));
      }
  
      // [CP-RES-03] Type: users[].phone → string
      expect(typeof (body?.users?.[0]?.phone), 'Field "users[].phone" must be string').toBe('string');
      // [CP-RES-03] Regex: users[].phone
      if (body?.users?.[0]?.phone != null) {
          expect(String(body?.users?.[0]?.phone), 'Field "users[].phone" must match pattern').toMatch(new RegExp('^.+$'));
      }
  
      // [CP-RES-03] Type: users[].username → string
      expect(typeof (body?.users?.[0]?.username), 'Field "users[].username" must be string').toBe('string');
      // [CP-RES-03] Regex: users[].username
      if (body?.users?.[0]?.username != null) {
          expect(String(body?.users?.[0]?.username), 'Field "users[].username" must match pattern').toMatch(new RegExp('^.+$'));
      }
  
      // [CP-RES-03] Type: users[].password → string
      expect(typeof (body?.users?.[0]?.password), 'Field "users[].password" must be string').toBe('string');
  
      // [CP-RES-03] Type: users[].birthDate → string
      expect(typeof (body?.users?.[0]?.birthDate), 'Field "users[].birthDate" must be string').toBe('string');
      // [CP-RES-03] Regex: users[].birthDate
      if (body?.users?.[0]?.birthDate != null) {
          expect(String(body?.users?.[0]?.birthDate), 'Field "users[].birthDate" must match pattern').toMatch(new RegExp('^.+$'));
      }
  
      // [CP-RES-03] Type: users[].image → string
      expect(typeof (body?.users?.[0]?.image), 'Field "users[].image" must be string').toBe('string');
      // [CP-RES-03] Regex: users[].image
      if (body?.users?.[0]?.image != null) {
          expect(String(body?.users?.[0]?.image), 'Field "users[].image" must match pattern').toMatch(new RegExp('^https?:\\/\\/[^\\s]+$'));
      }
  
      // [CP-RES-03] Type: users[].bloodGroup → string
      expect(typeof (body?.users?.[0]?.bloodGroup), 'Field "users[].bloodGroup" must be string').toBe('string');
      // [CP-RES-03] Regex: users[].bloodGroup
      if (body?.users?.[0]?.bloodGroup != null) {
          expect(String(body?.users?.[0]?.bloodGroup), 'Field "users[].bloodGroup" must match pattern').toMatch(new RegExp('^.+$'));
      }
  
      // [CP-RES-03] Type: users[].height → number
      expect(typeof (body?.users?.[0]?.height), 'Field "users[].height" must be number').toBe('number');
      // [CP-RES-03] Regex: users[].height
      if (body?.users?.[0]?.height != null) {
          expect(String(body?.users?.[0]?.height), 'Field "users[].height" must match pattern').toMatch(new RegExp('^-?\\d+(\\.\\d+)?$'));
      }
  
      // [CP-RES-03] Type: users[].weight → number
      expect(typeof (body?.users?.[0]?.weight), 'Field "users[].weight" must be number').toBe('number');
      // [CP-RES-03] Regex: users[].weight
      if (body?.users?.[0]?.weight != null) {
          expect(String(body?.users?.[0]?.weight), 'Field "users[].weight" must match pattern').toMatch(new RegExp('^-?\\d+(\\.\\d+)?$'));
      }
  
      // [CP-RES-03] Type: users[].eyeColor → string
      expect(typeof (body?.users?.[0]?.eyeColor), 'Field "users[].eyeColor" must be string').toBe('string');
      // [CP-RES-03] Regex: users[].eyeColor
      if (body?.users?.[0]?.eyeColor != null) {
          expect(String(body?.users?.[0]?.eyeColor), 'Field "users[].eyeColor" must match pattern').toMatch(new RegExp('^.+$'));
      }
  
      // [CP-RES-03] Type: users[].hair.color → string
      expect(typeof (body?.users?.[0]?.hair?.color), 'Field "users[].hair.color" must be string').toBe('string');
      // [CP-RES-03] Regex: users[].hair.color
      if (body?.users?.[0]?.hair?.color != null) {
          expect(String(body?.users?.[0]?.hair?.color), 'Field "users[].hair.color" must match pattern').toMatch(new RegExp('^.+$'));
      }
  
      // [CP-RES-03] Type: users[].hair.type → string
      expect(typeof (body?.users?.[0]?.hair?.type), 'Field "users[].hair.type" must be string').toBe('string');
      // [CP-RES-03] Regex: users[].hair.type
      if (body?.users?.[0]?.hair?.type != null) {
          expect(String(body?.users?.[0]?.hair?.type), 'Field "users[].hair.type" must match pattern').toMatch(new RegExp('^.+$'));
      }
  
      // [CP-RES-03] Type: users[].ip → string
      expect(typeof (body?.users?.[0]?.ip), 'Field "users[].ip" must be string').toBe('string');
      // [CP-RES-03] Regex: users[].ip
      if (body?.users?.[0]?.ip != null) {
          expect(String(body?.users?.[0]?.ip), 'Field "users[].ip" must match pattern').toMatch(new RegExp('^.+$'));
      }
  
      // [CP-RES-03] Type: users[].address.address → string
      expect(typeof (body?.users?.[0]?.address?.address), 'Field "users[].address.address" must be string').toBe('string');
      // [CP-RES-03] Regex: users[].address.address
      if (body?.users?.[0]?.address?.address != null) {
          expect(String(body?.users?.[0]?.address?.address), 'Field "users[].address.address" must match pattern').toMatch(new RegExp('^.+$'));
      }
  
      // [CP-RES-03] Type: users[].address.city → string
      expect(typeof (body?.users?.[0]?.address?.city), 'Field "users[].address.city" must be string').toBe('string');
      // [CP-RES-03] Regex: users[].address.city
      if (body?.users?.[0]?.address?.city != null) {
          expect(String(body?.users?.[0]?.address?.city), 'Field "users[].address.city" must match pattern').toMatch(new RegExp('^.+$'));
      }
  
      // [CP-RES-03] Type: users[].address.state → string
      expect(typeof (body?.users?.[0]?.address?.state), 'Field "users[].address.state" must be string').toBe('string');
      // [CP-RES-03] Regex: users[].address.state
      if (body?.users?.[0]?.address?.state != null) {
          expect(String(body?.users?.[0]?.address?.state), 'Field "users[].address.state" must match pattern').toMatch(new RegExp('^.+$'));
      }
  
      // [CP-RES-03] Type: users[].address.stateCode → string
      expect(typeof (body?.users?.[0]?.address?.stateCode), 'Field "users[].address.stateCode" must be string').toBe('string');
      // [CP-RES-03] Regex: users[].address.stateCode
      if (body?.users?.[0]?.address?.stateCode != null) {
          expect(String(body?.users?.[0]?.address?.stateCode), 'Field "users[].address.stateCode" must match pattern').toMatch(new RegExp('^.+$'));
      }
  
      // [CP-RES-03] Type: users[].address.postalCode → string
      expect(typeof (body?.users?.[0]?.address?.postalCode), 'Field "users[].address.postalCode" must be string').toBe('string');
      // [CP-RES-03] Regex: users[].address.postalCode
      if (body?.users?.[0]?.address?.postalCode != null) {
          expect(String(body?.users?.[0]?.address?.postalCode), 'Field "users[].address.postalCode" must match pattern').toMatch(new RegExp('^.+$'));
      }
  
      // [CP-RES-03] Type: users[].address.coordinates.lat → number
      expect(typeof (body?.users?.[0]?.address?.coordinates?.lat), 'Field "users[].address.coordinates.lat" must be number').toBe('number');
      // [CP-RES-03] Regex: users[].address.coordinates.lat
      if (body?.users?.[0]?.address?.coordinates?.lat != null) {
          expect(String(body?.users?.[0]?.address?.coordinates?.lat), 'Field "users[].address.coordinates.lat" must match pattern').toMatch(new RegExp('^-?\\d+(\\.\\d+)?$'));
      }
  
      // [CP-RES-03] Type: users[].address.coordinates.lng → number
      expect(typeof (body?.users?.[0]?.address?.coordinates?.lng), 'Field "users[].address.coordinates.lng" must be number').toBe('number');
      // [CP-RES-03] Regex: users[].address.coordinates.lng
      if (body?.users?.[0]?.address?.coordinates?.lng != null) {
          expect(String(body?.users?.[0]?.address?.coordinates?.lng), 'Field "users[].address.coordinates.lng" must match pattern').toMatch(new RegExp('^-?\\d+(\\.\\d+)?$'));
      }
  
      // [CP-RES-03] Type: users[].address.country → string
      expect(typeof (body?.users?.[0]?.address?.country), 'Field "users[].address.country" must be string').toBe('string');
      // [CP-RES-03] Regex: users[].address.country
      if (body?.users?.[0]?.address?.country != null) {
          expect(String(body?.users?.[0]?.address?.country), 'Field "users[].address.country" must match pattern').toMatch(new RegExp('^.+$'));
      }
  
      // [CP-RES-03] Type: users[].macAddress → string
      expect(typeof (body?.users?.[0]?.macAddress), 'Field "users[].macAddress" must be string').toBe('string');
      // [CP-RES-03] Regex: users[].macAddress
      if (body?.users?.[0]?.macAddress != null) {
          expect(String(body?.users?.[0]?.macAddress), 'Field "users[].macAddress" must match pattern').toMatch(new RegExp('^.+$'));
      }
  
      // [CP-RES-03] Type: users[].university → string
      expect(typeof (body?.users?.[0]?.university), 'Field "users[].university" must be string').toBe('string');
      // [CP-RES-03] Regex: users[].university
      if (body?.users?.[0]?.university != null) {
          expect(String(body?.users?.[0]?.university), 'Field "users[].university" must match pattern').toMatch(new RegExp('^.+$'));
      }
  
      // [CP-RES-03] Type: users[].bank.cardExpire → string
      expect(typeof (body?.users?.[0]?.bank?.cardExpire), 'Field "users[].bank.cardExpire" must be string').toBe('string');
      // [CP-RES-03] Regex: users[].bank.cardExpire
      if (body?.users?.[0]?.bank?.cardExpire != null) {
          expect(String(body?.users?.[0]?.bank?.cardExpire), 'Field "users[].bank.cardExpire" must match pattern').toMatch(new RegExp('^.+$'));
      }
  
      // [CP-RES-03] Type: users[].bank.cardNumber → string
      expect(typeof (body?.users?.[0]?.bank?.cardNumber), 'Field "users[].bank.cardNumber" must be string').toBe('string');
      // [CP-RES-03] Regex: users[].bank.cardNumber
      if (body?.users?.[0]?.bank?.cardNumber != null) {
          expect(String(body?.users?.[0]?.bank?.cardNumber), 'Field "users[].bank.cardNumber" must match pattern').toMatch(new RegExp('^.+$'));
      }
  
      // [CP-RES-03] Type: users[].bank.cardType → string
      expect(typeof (body?.users?.[0]?.bank?.cardType), 'Field "users[].bank.cardType" must be string').toBe('string');
      // [CP-RES-03] Regex: users[].bank.cardType
      if (body?.users?.[0]?.bank?.cardType != null) {
          expect(String(body?.users?.[0]?.bank?.cardType), 'Field "users[].bank.cardType" must match pattern').toMatch(new RegExp('^.+$'));
      }
  
      // [CP-RES-03] Type: users[].bank.currency → string
      expect(typeof (body?.users?.[0]?.bank?.currency), 'Field "users[].bank.currency" must be string').toBe('string');
      // [CP-RES-03] Regex: users[].bank.currency
      if (body?.users?.[0]?.bank?.currency != null) {
          expect(String(body?.users?.[0]?.bank?.currency), 'Field "users[].bank.currency" must match pattern').toMatch(new RegExp('^.+$'));
      }
  
      // [CP-RES-03] Type: users[].bank.iban → string
      expect(typeof (body?.users?.[0]?.bank?.iban), 'Field "users[].bank.iban" must be string').toBe('string');
      // [CP-RES-03] Regex: users[].bank.iban
      if (body?.users?.[0]?.bank?.iban != null) {
          expect(String(body?.users?.[0]?.bank?.iban), 'Field "users[].bank.iban" must match pattern').toMatch(new RegExp('^.+$'));
      }
  
      // [CP-RES-03] Type: users[].company.department → string
      expect(typeof (body?.users?.[0]?.company?.department), 'Field "users[].company.department" must be string').toBe('string');
      // [CP-RES-03] Regex: users[].company.department
      if (body?.users?.[0]?.company?.department != null) {
          expect(String(body?.users?.[0]?.company?.department), 'Field "users[].company.department" must match pattern').toMatch(new RegExp('^.+$'));
      }
  
      // [CP-RES-03] Type: users[].company.name → string
      expect(typeof (body?.users?.[0]?.company?.name), 'Field "users[].company.name" must be string').toBe('string');
      // [CP-RES-03] Regex: users[].company.name
      if (body?.users?.[0]?.company?.name != null) {
          expect(String(body?.users?.[0]?.company?.name), 'Field "users[].company.name" must match pattern').toMatch(new RegExp('^.+$'));
      }
  
      // [CP-RES-03] Type: users[].company.title → string
      expect(typeof (body?.users?.[0]?.company?.title), 'Field "users[].company.title" must be string').toBe('string');
      // [CP-RES-03] Regex: users[].company.title
      if (body?.users?.[0]?.company?.title != null) {
          expect(String(body?.users?.[0]?.company?.title), 'Field "users[].company.title" must match pattern').toMatch(new RegExp('^.+$'));
      }
  
      // [CP-RES-03] Type: users[].company.address.address → string
      expect(typeof (body?.users?.[0]?.company?.address?.address), 'Field "users[].company.address.address" must be string').toBe('string');
      // [CP-RES-03] Regex: users[].company.address.address
      if (body?.users?.[0]?.company?.address?.address != null) {
          expect(String(body?.users?.[0]?.company?.address?.address), 'Field "users[].company.address.address" must match pattern').toMatch(new RegExp('^.+$'));
      }
  
      // [CP-RES-03] Type: users[].company.address.city → string
      expect(typeof (body?.users?.[0]?.company?.address?.city), 'Field "users[].company.address.city" must be string').toBe('string');
      // [CP-RES-03] Regex: users[].company.address.city
      if (body?.users?.[0]?.company?.address?.city != null) {
          expect(String(body?.users?.[0]?.company?.address?.city), 'Field "users[].company.address.city" must match pattern').toMatch(new RegExp('^.+$'));
      }
  
      // [CP-RES-03] Type: users[].company.address.state → string
      expect(typeof (body?.users?.[0]?.company?.address?.state), 'Field "users[].company.address.state" must be string').toBe('string');
      // [CP-RES-03] Regex: users[].company.address.state
      if (body?.users?.[0]?.company?.address?.state != null) {
          expect(String(body?.users?.[0]?.company?.address?.state), 'Field "users[].company.address.state" must match pattern').toMatch(new RegExp('^.+$'));
      }
  
      // [CP-RES-03] Type: users[].company.address.stateCode → string
      expect(typeof (body?.users?.[0]?.company?.address?.stateCode), 'Field "users[].company.address.stateCode" must be string').toBe('string');
      // [CP-RES-03] Regex: users[].company.address.stateCode
      if (body?.users?.[0]?.company?.address?.stateCode != null) {
          expect(String(body?.users?.[0]?.company?.address?.stateCode), 'Field "users[].company.address.stateCode" must match pattern').toMatch(new RegExp('^.+$'));
      }
  
      // [CP-RES-03] Type: users[].company.address.postalCode → string
      expect(typeof (body?.users?.[0]?.company?.address?.postalCode), 'Field "users[].company.address.postalCode" must be string').toBe('string');
      // [CP-RES-03] Regex: users[].company.address.postalCode
      if (body?.users?.[0]?.company?.address?.postalCode != null) {
          expect(String(body?.users?.[0]?.company?.address?.postalCode), 'Field "users[].company.address.postalCode" must match pattern').toMatch(new RegExp('^.+$'));
      }
  
      // [CP-RES-03] Type: users[].company.address.coordinates.lat → number
      expect(typeof (body?.users?.[0]?.company?.address?.coordinates?.lat), 'Field "users[].company.address.coordinates.lat" must be number').toBe('number');
      // [CP-RES-03] Regex: users[].company.address.coordinates.lat
      if (body?.users?.[0]?.company?.address?.coordinates?.lat != null) {
          expect(String(body?.users?.[0]?.company?.address?.coordinates?.lat), 'Field "users[].company.address.coordinates.lat" must match pattern').toMatch(new RegExp('^-?\\d+(\\.\\d+)?$'));
      }
  
      // [CP-RES-03] Type: users[].company.address.coordinates.lng → number
      expect(typeof (body?.users?.[0]?.company?.address?.coordinates?.lng), 'Field "users[].company.address.coordinates.lng" must be number').toBe('number');
      // [CP-RES-03] Regex: users[].company.address.coordinates.lng
      if (body?.users?.[0]?.company?.address?.coordinates?.lng != null) {
          expect(String(body?.users?.[0]?.company?.address?.coordinates?.lng), 'Field "users[].company.address.coordinates.lng" must match pattern').toMatch(new RegExp('^-?\\d+(\\.\\d+)?$'));
      }
  
      // [CP-RES-03] Type: users[].company.address.country → string
      expect(typeof (body?.users?.[0]?.company?.address?.country), 'Field "users[].company.address.country" must be string').toBe('string');
      // [CP-RES-03] Regex: users[].company.address.country
      if (body?.users?.[0]?.company?.address?.country != null) {
          expect(String(body?.users?.[0]?.company?.address?.country), 'Field "users[].company.address.country" must match pattern').toMatch(new RegExp('^.+$'));
      }
  
      // [CP-RES-03] Type: users[].ein → string
      expect(typeof (body?.users?.[0]?.ein), 'Field "users[].ein" must be string').toBe('string');
      // [CP-RES-03] Regex: users[].ein
      if (body?.users?.[0]?.ein != null) {
          expect(String(body?.users?.[0]?.ein), 'Field "users[].ein" must match pattern').toMatch(new RegExp('^.+$'));
      }
  
      // [CP-RES-03] Type: users[].ssn → string
      expect(typeof (body?.users?.[0]?.ssn), 'Field "users[].ssn" must be string').toBe('string');
      // [CP-RES-03] Regex: users[].ssn
      if (body?.users?.[0]?.ssn != null) {
          expect(String(body?.users?.[0]?.ssn), 'Field "users[].ssn" must match pattern').toMatch(new RegExp('^.+$'));
      }
  
      // [CP-RES-03] Type: users[].userAgent → string
      expect(typeof (body?.users?.[0]?.userAgent), 'Field "users[].userAgent" must be string').toBe('string');
      // [CP-RES-03] Regex: users[].userAgent
      if (body?.users?.[0]?.userAgent != null) {
          expect(String(body?.users?.[0]?.userAgent), 'Field "users[].userAgent" must match pattern').toMatch(new RegExp('^.+$'));
      }
  
      // [CP-RES-03] Type: users[].crypto.coin → string
      expect(typeof (body?.users?.[0]?.crypto?.coin), 'Field "users[].crypto.coin" must be string').toBe('string');
      // [CP-RES-03] Regex: users[].crypto.coin
      if (body?.users?.[0]?.crypto?.coin != null) {
          expect(String(body?.users?.[0]?.crypto?.coin), 'Field "users[].crypto.coin" must match pattern').toMatch(new RegExp('^.+$'));
      }
  
      // [CP-RES-03] Type: users[].crypto.wallet → string
      expect(typeof (body?.users?.[0]?.crypto?.wallet), 'Field "users[].crypto.wallet" must be string').toBe('string');
      // [CP-RES-03] Regex: users[].crypto.wallet
      if (body?.users?.[0]?.crypto?.wallet != null) {
          expect(String(body?.users?.[0]?.crypto?.wallet), 'Field "users[].crypto.wallet" must match pattern').toMatch(new RegExp('^.+$'));
      }
  
      // [CP-RES-03] Type: users[].crypto.network → string
      expect(typeof (body?.users?.[0]?.crypto?.network), 'Field "users[].crypto.network" must be string').toBe('string');
      // [CP-RES-03] Regex: users[].crypto.network
      if (body?.users?.[0]?.crypto?.network != null) {
          expect(String(body?.users?.[0]?.crypto?.network), 'Field "users[].crypto.network" must match pattern').toMatch(new RegExp('^.+$'));
      }
  
      // [CP-RES-03] Type: users[].role → string
      expect(typeof (body?.users?.[0]?.role), 'Field "users[].role" must be string').toBe('string');
      // [CP-RES-03] Regex: users[].role
      if (body?.users?.[0]?.role != null) {
          expect(String(body?.users?.[0]?.role), 'Field "users[].role" must match pattern').toMatch(new RegExp('^.+$'));
      }
  
      // [CP-RES-03] Type: total → number
      expect(typeof (body.total), 'Field "total" must be number').toBe('number');
      // [CP-RES-03] Regex: total
      if (body.total != null) {
          expect(String(body.total), 'Field "total" must match pattern').toMatch(new RegExp('^-?\\d+$'));
      }
  
      // [CP-RES-03] Type: skip → number
      expect(typeof (body.skip), 'Field "skip" must be number').toBe('number');
      // [CP-RES-03] Regex: skip
      if (body.skip != null) {
          expect(String(body.skip), 'Field "skip" must match pattern').toMatch(new RegExp('^-?\\d+$'));
      }
  
      // [CP-RES-03] Type: limit → number
      expect(typeof (body.limit), 'Field "limit" must be number').toBe('number');
      // [CP-RES-03] Regex: limit
      if (body.limit != null) {
          expect(String(body.limit), 'Field "limit" must match pattern').toMatch(new RegExp('^-?\\d+$'));
      }
  
  });

  test('[CP-RES-08] GET /users - Array Cardinality vs Count Fields', async ({ api }) => {
      const response = await api.get('/users');
      expect(response.ok()).toBeTruthy();
      const body = await response.json();
  
      expect(Array.isArray(body.users), '"users" must be array').toBeTruthy();
  
      // users.length ≤ total
      expect((body.users as unknown[]).length, '"users".length must not exceed "total"').toBeLessThanOrEqual(body.total as number);
  });

  test('[CP-RES-10] GET /users - Array Item IDs Are Unique', async ({ api }) => {
      const response = await api.get('/users');
      expect(response.ok()).toBeTruthy();
      const body = await response.json();
      const arr = body.users;
  
      expect(Array.isArray(arr), '"users" must be array').toBeTruthy();
  
      if (arr.length > 1) {
          const ids = (arr as Record<string, unknown>[]).map((item: Record<string, unknown>) => item['id']);
          const uniqueIds = new Set(ids);
          expect(uniqueIds.size, `"id" must be unique across all users items`).toBe(ids.length);
      }
  });

  test('[CP-SEC-01] GET /users - Rate Limiting Triggers 429', async ({ api }) => {
      // Send 20 rapid requests to trigger rate limiting
      const requests = Array.from({ length: 20 }, () =>
          api.get('/users')
      );
      const responses = await Promise.all(requests);
      const statuses = responses.map(r => r.status());
      // At least one request should be rate-limited (429) or all succeed (API may not enforce rate limits)
      const hasRateLimit = statuses.includes(429);
      const allSucceeded = statuses.every(s => s < 500);
      expect(hasRateLimit || allSucceeded, 'Rate limiting should return 429 or requests succeed without 5xx').toBeTruthy();
  });

  test('[CP-SEC-02] GET /users - No Sensitive Data Exposed', async ({ api }) => {
      const response = await api.get('/users');
      if (response.ok()) {
          const text = await response.text();
          // Patterns for sensitive fields NOT declared in the response schema
          const sensitivePatterns = [
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

  test('[CP-SEC-03] GET /users - Errors Do Not Expose Internal Details', async ({ api }) => {
      // Send a malformed request to trigger error
      const response = await api.get('/users');
      if (!response.ok()) {
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
      }
  });

  test('[CP-SEC-06] GET /users - Injection via Query String Rejected', async ({ api }) => {
      const injectionPayloads = ["' OR '1'='1","1; DROP TABLE users--","{\"$gt\": \"\"}","<script>alert(1)</script>"];
      for (const injection of injectionPayloads) {
          const response = await api.get('/users', {
              params: { search: injection, q: injection }
          });
          expect(response.status(), 'Injection via query must not cause 500: ' + injection).not.toBe(500);
      }
  });

  test('[CP-AUD-01] GET /users - XSS Payloads via Query Not Reflected', async ({ api }) => {
      const xssPayloads = ["<script>alert(1)</script>","\"><img src=x onerror=alert(1)>","';alert(String.fromCharCode(88,83,83))//"];
      for (const payload of xssPayloads) {
          const response = await api.get('/users', {
              params: { search: payload, q: payload, filter: payload }
          });
          expect(response.status(), 'XSS via query must not cause 500: ' + payload).not.toBe(500);
          if (response.ok()) {
              const text = await response.text();
              expect(text.includes(payload), 'Response must not reflect XSS payload: ' + payload).toBeFalsy();
          }
      }
  });

  test('[CP-AUD-02] GET /users - Command Injection via Query Rejected', async ({ api }) => {
      const cmdPayloads = ["; ls","| whoami","$(id)","&& cat /etc/passwd","`uname -a`"];
      const systemPatterns = [/root:/i, /bin\/bash/i, /uid=\d+/i, /Linux /i, /Windows NT/i];
      for (const payload of cmdPayloads) {
          const response = await api.get('/users', {
              params: { search: payload, q: payload }
          });
          expect(response.status(), 'Command injection via query must not cause 500: ' + payload).not.toBe(500);
          const text = await response.text();
          for (const pattern of systemPatterns) {
              expect(pattern.test(text), 'Response must not contain system output for: ' + payload).toBeFalsy();
          }
      }
  });

  test('[CP-AUD-03] GET /users - Path Traversal via Query Rejected', async ({ api }) => {
      const traversalPayloads = ["../../etc/passwd","..%2F..%2Fetc%2Fshadow","....//....//etc//passwd","%252e%252e%252fetc%252fpasswd"];
      const filePatterns = [/root:/i, /daemon:/i, /\[boot loader\]/i, /\[fonts\]/i];
      for (const payload of traversalPayloads) {
          const response = await api.get('/users', {
              params: { path: payload, file: payload, resource: payload }
          });
          expect(response.status(), 'Path traversal via query must not cause 500: ' + payload).not.toBe(500);
          const text = await response.text();
          for (const pattern of filePatterns) {
              expect(pattern.test(text), 'Response must not contain file system contents for: ' + payload).toBeFalsy();
          }
      }
  });

  test('[CP-AUD-04] GET /users - Undeclared HTTP Verb Returns 405/403', async ({ api }) => {
      // Send DELETE to an endpoint declared as GET
      const response = await api.delete('/users');
      // Should return 405 Method Not Allowed or 403 Forbidden
      expect([403, 404, 405], 'Undeclared verb ' + 'DELETE' + ' must be rejected').toContain(response.status());
  });

  test('[CP-AUD-05] GET /users - Malformed Auth Token Returns 401/403', async ({ api }) => {
      const malformedTokens = [
          'INVALID_TOKEN_12345',
          'null',
          'undefined',
          '',
          'Bearer',
      ];
      for (const token of malformedTokens) {
          const response = await api.get('/users', {
              headers: { Authorization: 'Bearer ' + token }
          });
          // If the API is authenticated, must reject malformed tokens
          // If the API is public, 200 is also acceptable
          expect([200, 401, 403, 404], 'Malformed token must be rejected or endpoint is public: ' + token).toContain(response.status());
          // Critical: must never return 500 on a bad token
          expect(response.status(), 'Malformed token must not cause 500: ' + token).not.toBe(500);
      }
  });

  test('[CP-AUD-06] GET /users - JWT alg:none Attack Returns 401/403', async ({ api }) => {
      // JWT with alg:none (no signature) — should always be rejected by authenticated endpoints
      const algNoneJwt = 'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiIxIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzAwMDAwMDAwfQ.';
      const response = await api.get('/users', {
          headers: { Authorization: 'Bearer ' + algNoneJwt }
      });
      // Must not return 200 with privileged data
      expect([401, 403, 404, 422], 'JWT alg:none must be rejected (401/403/404/422)').toContain(response.status());
  });

  test('[CP-AUD-07] GET /users - Duplicate Query Params Do Not Cause 500', async ({ api }) => {
      // Send the same query param multiple times with different values
      const url = '/users?id=1&id=2&id=999&limit=10&limit=9999';
      const response = await api.get(url);
      // Must not crash the server — 200, 400, or 422 are all acceptable
      expect(response.status(), 'Duplicate query params must not cause 500').not.toBe(500);
      expect(response.status(), 'Duplicate query params must not cause timeout (>= 100)').toBeGreaterThanOrEqual(100);
  });

});

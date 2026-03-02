# dummyjson_API_Auditing_TS

## Overview

This is an **API Auditing & Security Testing project** that uses **Playwright** as the core framework and **TypeScript** for scripting. The project contains comprehensive security tests including vulnerability detection, injection prevention, and authentication testing.

### Capabilities
- **Framework**: Playwright
- **Language**: TypeScript
- **Test Type**: API Security Auditing
- **Reporting**: HTML, JSON, List, Custom Markdown Reports
- **CI/CD**: GitHub Actions configured

## API Under Test

- **Base URL**: https://dummyjson.com
- **Type**: REST API (Public)

### Endpoints Tested

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /users | Get all users |
| GET | /users?limit=10&skip=0 | Get users with pagination |

## Prerequisites

- Node.js 22.x
- npm / yarn / pnpm

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure Environment:
   Rename `.env.example` to `.env` and fill in your secrets.
   ```bash
   cp .env.example .env
   ```

## Running Tests

### Run all tests
```bash
npm test
```

### Run specific test file
```bash
npx playwright test tests/api/<spec-file>.spec.ts
```

### Run with specific reporter
```bash
npx playwright test --reporter=html
```

## Test Results & Reporting

After each test execution, reports are automatically generated in multiple formats:

### Report Locations
- **HTML Report**: `playwright-report/index.html`
- **JSON Report**: `test-results/results.json`
- **Custom Markdown**: `reports/test-report-summary.md`
- **Full HTML Report**: `reports/test-report.html`

### View Reports
```bash
# Open HTML report
npm run test:report

# Or open manually
npx playwright show-report
```

### Report Samples

The project generates detailed security audit reports including:
- Test execution summary (passed/failed/skipped)
- Vulnerability findings
- Security score per endpoint
- HTTP security headers analysis
- Injection test results
- Authentication/Authorization test results

## CI/CD Integration

### GitHub Actions

The project includes a GitHub Actions workflow (`.github/workflows/test.yml`) that:
- Runs security tests on every push
- Runs tests on pull requests
- Uploads test artifacts
- Posts test results summary

### CI Commands
```bash
# Run in CI mode
CI=true npm test

# Run with retry
CI=true npm test -- --retries=2
```

## Project Structure

```
.
├── tests/
│   ├── api/           # Test specifications
│   ├── fixtures/      # Playwright fixtures
│   └── helpers/       # Utilities
├── data/              # Test data payloads
├── reports/           # Generated reports
├── .github/           # GitHub Actions workflows
├── playwright.config.ts
├── package.json
└── tsconfig.json
```

## Security Test Coverage

### Vulnerability Tests
- XSS (Cross-Site Scripting) Detection
- Command Injection Prevention
- Path Traversal Testing
- SQL Injection Prevention

### Authentication & Authorization
- JWT Attack Vectors
- Malformed Token Handling
- Unauthorized Access Prevention

### Input Validation
- Invalid Data Types
- Missing Required Fields
- Null Value Handling
- Pattern Validation

### HTTP Security
- Content-Type Verification
- Security Headers Analysis
- CORS Configuration
- Rate Limiting

### Error Handling
- Information Leakage Detection
- Stack Trace Exposure
- Internal Path Disclosure

## Test Categories

| Code | Category | Description |
|------|----------|-------------|
| CP-GEN | General | Health check, latency, SLA |
| CP-MET | Method | HTTP method validation |
| CP-COD | Status Codes | HTTP response codes |
| CP-RES | Response | Schema & data validation |
| CP-SEC | Security | Basic security tests |
| CP-AUD | Auditing | Advanced security auditing |
| CP-REQ | Requirements | Field validation |
| CP-NEG | Negative | Error handling tests |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| BASE_URL | API Base URL | https://dummyjson.com |
| CI | CI Mode | false |

## Troubleshooting

### Tests failing with 403
- Verify API is accessible from your network
- Check if API requires authentication

### Report not generating
- Ensure `reports/` directory exists
- Check write permissions

### Security tests failing
- Some security tests may fail on APIs that don't implement those security features
- Review test expectations based on your API's security posture

Happy Testing! 🚀

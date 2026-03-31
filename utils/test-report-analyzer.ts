/**
 * Test Report Analyzer for API Tests
 * 
 * Analyzes Playwright test results and generates interactive HTML report
 * with error classification and recommendations.
 */

import * as fs from 'fs';
import * as path from 'path';

/** Remove ANSI/VT100 escape sequences from terminal output */
function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1B\[[0-9;]*[mGKHF]/g, '').replace(/\x1B\([A-Z]/g, '');
}

interface ErrorClassification {
  type: 'code' | 'api' | 'environment' | 'unknown';
  category: string;
  description: string;
  rootCause?: string;
  recommendation?: string;
  severity?: 'critical' | 'high' | 'medium' | 'low';
}

interface AnalyzedTestResult {
  testName: string;
  status: 'passed' | 'failed' | 'skipped';
  errorClassification?: ErrorClassification;
  errorMessage?: string;
}

interface ReportSummary {
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  codeErrors: AnalyzedTestResult[];
  apiErrors: AnalyzedTestResult[];
  environmentErrors: AnalyzedTestResult[];
  unknownErrors: AnalyzedTestResult[];
  passRate: string;
  generatedAt: string;
  projectName?: string;
}

// API-specific error patterns
const API_ERROR_PATTERNS = [
  { pattern: /401|Unauthorized/i, category: 'Authentication', description: 'API authentication failed' },
  { pattern: /403|Forbidden/i, category: 'Authorization', description: 'Access denied' },
  { pattern: /404|Not Found/i, category: 'Resource', description: 'API endpoint not found' },
  { pattern: /400|Bad Request/i, category: 'Validation', description: 'Invalid request payload' },
  { pattern: /429|Too Many Requests/i, category: 'Rate Limit', description: 'Rate limit exceeded' },
  { pattern: /500|Internal Server Error/i, category: 'Server', description: 'API server error' },
  { pattern: /502|Bad Gateway/i, category: 'Gateway', description: 'Upstream server error' },
  { pattern: /503|Service Unavailable/i, category: 'Availability', description: 'Service temporarily unavailable' },
  { pattern: /504|Gateway Timeout/i, category: 'Timeout', description: 'Gateway timeout' },
  { pattern: /ECONNREFUSED|ECONNRESET/i, category: 'Connection', description: 'Connection refused or reset' },
  { pattern: /ETIMEDOUT|timeout/i, category: 'Timeout', description: 'Request timeout' },
  { pattern: /JSON|parse|syntax/i, category: 'Parse', description: 'JSON parsing error' },
];

const CODE_ERROR_PATTERNS = [
  { pattern: /TypeError:/i, category: 'Type Error', description: 'JavaScript type error' },
  { pattern: /ReferenceError:/i, category: 'Reference Error', description: 'Undefined variable reference' },
  { pattern: /AssertionError:/i, category: 'Assertion', description: 'Test assertion failed' },
  { pattern: /expect\(.*\)\.(toBe|toEqual|toContain)/i, category: 'Assertion', description: 'Expect assertion failed' },
];

function classifyError(errorMessage: string): ErrorClassification {
  // Check API errors first
  for (const { pattern, category, description } of API_ERROR_PATTERNS) {
    if (pattern.test(errorMessage)) {
      return {
        type: 'api',
        category,
        description,
        severity: category === 'Authentication' || category === 'Authorization' ? 'critical' : 'high'
      };
    }
  }

  // Check code errors
  for (const { pattern, category, description } of CODE_ERROR_PATTERNS) {
    if (pattern.test(errorMessage)) {
      return {
        type: 'code',
        category,
        description,
        severity: 'high'
      };
    }
  }

  // Check for environment errors
  if (/network|dns|ssl|certificate/i.test(errorMessage)) {
    return {
      type: 'environment',
      category: 'Network',
      description: 'Network or infrastructure error',
      severity: 'medium'
    };
  }

  return {
    type: 'unknown',
    category: 'Unknown',
    description: 'Could not classify error',
    severity: 'medium'
  };
}

function analyzeResults(resultsPath: string): ReportSummary {
  const results = JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));
  
  const analyzedResults: AnalyzedTestResult[] = [];
  let passed = 0, failed = 0, skipped = 0;

  function processSuite(suite: any, parentTitle: string = '') {
    const currentTitle = suite.title || '';
    const fullTitle = parentTitle ? `${parentTitle} > ${currentTitle}` : currentTitle;
    
    if (suite.specs && suite.specs.length > 0) {
      for (const spec of suite.specs) {
        if (spec.tests && spec.tests.length > 0) {
          for (const test of spec.tests) {
            const allResults = test.results || [];
            const latestResult = allResults[allResults.length - 1] || {};
            const status = latestResult.status || test.status || 'unknown';
            
            const analyzed: AnalyzedTestResult = {
              testName: spec.title || 'Unknown Test',
              status: status as 'passed' | 'failed' | 'skipped'
            };

            if (status === 'passed') {
              passed++;
            } else if (status === 'failed') {
              failed++;
              const rawMessage = latestResult?.error?.message || latestResult?.errors?.[0]?.message || '';
              const errorMessage = stripAnsi(rawMessage);
              analyzed.errorMessage = errorMessage;
              analyzed.errorClassification = classifyError(errorMessage);
            } else if (status === 'skipped') {
              skipped++;
            }

            analyzedResults.push(analyzed);
          }
        }
      }
    }
    
    if (suite.suites && suite.suites.length > 0) {
      for (const nestedSuite of suite.suites) {
        processSuite(nestedSuite, fullTitle);
      }
    }
  }

  for (const suite of results.suites || []) {
    processSuite(suite);
  }

  const codeErrors = analyzedResults.filter(r => r.errorClassification?.type === 'code');
  const apiErrors = analyzedResults.filter(r => r.errorClassification?.type === 'api');
  const environmentErrors = analyzedResults.filter(r => r.errorClassification?.type === 'environment');
  const unknownErrors = analyzedResults.filter(r => r.errorClassification?.type === 'unknown');

  const totalTests = passed + failed + skipped;
  const passRate = totalTests > 0 ? ((passed / totalTests) * 100).toFixed(1) : '0.0';

  return {
    totalTests,
    passed,
    failed,
    skipped,
    codeErrors,
    apiErrors,
    environmentErrors,
    unknownErrors,
    passRate,
    generatedAt: new Date().toISOString()
  };
}

function generateHTMLReport(summary: ReportSummary): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Test Report</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            color: #e2e8f0;
            min-height: 100vh;
            padding: 20px;
        }
        .container { max-width: 1400px; margin: 0 auto; }
        header { text-align: center; padding: 30px 0; border-bottom: 1px solid #334155; margin-bottom: 30px; }
        h1 { font-size: 2.5rem; background: linear-gradient(90deg, #60a5fa, #a78bfa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 10px; }
        .metadata { color: #94a3b8; font-size: 0.9rem; }
        .summary-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .card { background: rgba(30, 41, 59, 0.8); border-radius: 12px; padding: 25px; text-align: center; border: 1px solid #334155; }
        .card-value { font-size: 2.5rem; font-weight: bold; margin-bottom: 5px; }
        .card-label { color: #94a3b8; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px; }
        .card.total .card-value { color: #60a5fa; }
        .card.passed .card-value { color: #10b981; }
        .card.failed .card-value { color: #ef4444; }
        .card.skipped .card-value { color: #f59e0b; }
        .card.rate .card-value { color: #a78bfa; }
        .charts-section { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .chart-container { background: rgba(30, 41, 59, 0.8); border-radius: 12px; padding: 25px; border: 1px solid #334155; }
        .chart-title { font-size: 1.2rem; margin-bottom: 20px; color: #e2e8f0; }
        .errors-section { background: rgba(30, 41, 59, 0.8); border-radius: 12px; padding: 25px; border: 1px solid #334155; }
        .section-title { font-size: 1.5rem; margin-bottom: 20px; color: #e2e8f0; }
        .error-item { background: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; padding: 15px; margin-bottom: 15px; border-radius: 0 8px 8px 0; }
        .error-title { font-weight: 600; color: #fca5a5; margin-bottom: 5px; }
        .error-category { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; margin-right: 8px; }
        .error-category.code { background: #ef4444; color: white; }
        .error-category.api { background: #f59e0b; color: white; }
        .error-category.environment { background: #3b82f6; color: white; }
        .error-category.unknown { background: #6b7280; color: white; }
        .error-message { color: #94a3b8; font-size: 0.9rem; margin-top: 8px; font-family: monospace; }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>🧪 API Test Report</h1>
            <p class="metadata">Generated: ${summary.generatedAt}</p>
        </header>

        <div class="summary-cards">
            <div class="card total"><div class="card-value">${summary.totalTests}</div><div class="card-label">Total Tests</div></div>
            <div class="card passed"><div class="card-value">${summary.passed}</div><div class="card-label">Passed</div></div>
            <div class="card failed"><div class="card-value">${summary.failed}</div><div class="card-label">Failed</div></div>
            <div class="card skipped"><div class="card-value">${summary.skipped}</div><div class="card-label">Skipped</div></div>
            <div class="card rate"><div class="card-value">${summary.passRate}%</div><div class="card-label">Pass Rate</div></div>
        </div>

        <div class="charts-section">
            <div class="chart-container">
                <h3 class="chart-title">Test Results Distribution</h3>
                <canvas id="resultsChart"></canvas>
            </div>
            <div class="chart-container">
                <h3 class="chart-title">Error Classification</h3>
                <canvas id="errorsChart"></canvas>
            </div>
        </div>

        ${summary.failed > 0 ? `
        <div class="errors-section">
            <h2 class="section-title">❌ Failed Tests Analysis</h2>
            ${[...summary.codeErrors, ...summary.apiErrors, ...summary.environmentErrors, ...summary.unknownErrors].map(r => `
                <div class="error-item">
                    <div class="error-title">${r.testName}</div>
                    <span class="error-category ${r.errorClassification?.type || 'unknown'}">${r.errorClassification?.category || 'Unknown'}</span>
                    <div class="error-message">${r.errorMessage?.substring(0, 200)}${r.errorMessage && r.errorMessage.length > 200 ? '...' : ''}</div>
                </div>
            `).join('')}
        </div>
        ` : ''}
    </div>

    <script>
        const ctx1 = document.getElementById('resultsChart').getContext('2d');
        new Chart(ctx1, {
            type: 'doughnut',
            data: {
                labels: ['Passed', 'Failed', 'Skipped'],
                datasets: [{
                    data: [${summary.passed}, ${summary.failed}, ${summary.skipped}],
                    backgroundColor: ['#10B981', '#EF4444', '#F59E0B'],
                    borderWidth: 2
                }]
            },
            options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
        });

        const ctx2 = document.getElementById('errorsChart').getContext('2d');
        new Chart(ctx2, {
            type: 'bar',
            data: {
                labels: ['Code', 'API', 'Environment', 'Unknown'],
                datasets: [{
                    label: 'Errors',
                    data: [${summary.codeErrors.length}, ${summary.apiErrors.length}, ${summary.environmentErrors.length}, ${summary.unknownErrors.length}],
                    backgroundColor: ['#EF4444', '#F59E0B', '#3B82F6', '#6B7280']
                }]
            },
            options: { responsive: true, scales: { y: { beginAtZero: true } } }
        });
    </script>
</body>
</html>`;
}

export function runAnalysis(resultsPath?: string): ReportSummary {
  const defaultResultsPath = path.join(process.cwd(), 'playwright-report', 'results.json');
  const reportsDir = path.join(process.cwd(), 'reports');
  const resultsFile = resultsPath || defaultResultsPath;

  if (!fs.existsSync(resultsFile)) {
    console.warn(`[test-report-analyzer] Results file not found: ${resultsFile}`);
    return { totalTests: 0, passed: 0, failed: 0, skipped: 0, codeErrors: [], apiErrors: [], environmentErrors: [], unknownErrors: [], passRate: '0', generatedAt: new Date().toISOString() };
  }

  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

  const summary = analyzeResults(resultsFile);

  const htmlPath = path.join(reportsDir, 'test-report.html');
  fs.writeFileSync(htmlPath, generateHTMLReport(summary));

  const mdPath = path.join(reportsDir, 'test-report-summary.md');
  const mdContent = `# Test Report Summary

**Generated:** ${summary.generatedAt}

## Results

| Metric | Value |
|--------|-------|
| Total Tests | ${summary.totalTests} |
| Passed | ${summary.passed} |
| Failed | ${summary.failed} |
| Skipped | ${summary.skipped} |
| Pass Rate | ${summary.passRate}% |

## Error Breakdown

- **Code Errors:** ${summary.codeErrors.length}
- **API Errors:** ${summary.apiErrors.length}
- **Environment Errors:** ${summary.environmentErrors.length}
- **Unknown Errors:** ${summary.unknownErrors.length}
`;
  fs.writeFileSync(mdPath, mdContent);

  console.log(`[test-report-analyzer] HTML: ${htmlPath}`);
  console.log(`[test-report-analyzer] Markdown: ${mdPath}`);

  return summary;
}

// Run if executed directly (not imported as a module)
if (require.main === module) {
  runAnalysis();
}

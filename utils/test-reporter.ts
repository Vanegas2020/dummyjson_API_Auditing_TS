import type { Reporter, FullConfig, Suite, TestCase, TestResult, FullResult } from '@playwright/test/reporter';
import * as fs from 'fs';
import * as path from 'path';
import { runAnalysis } from './test-report-analyzer';

/**
 * Custom Playwright reporter that auto-generates test-report.html and
 * test-report-summary.md in the reports/ directory after every test run.
 *
 * It writes its own results.json so it does not depend on the built-in
 * JSON reporter's flush order.
 */
export default class TestReporter implements Reporter {
  private rootSuite!: Suite;

  onBegin(_config: FullConfig, suite: Suite): void {
    this.rootSuite = suite;
  }

  onTestEnd(_test: TestCase, _result: TestResult): void {
    // Individual results captured via rootSuite tree in onEnd
  }

  async onEnd(_result: FullResult): Promise<void> {
    try {
      // Build results.json from the in-memory suite tree
      const reporterResultsPath = path.join(process.cwd(), 'playwright-report', 'results.json');
      const reporterDir = path.dirname(reporterResultsPath);
      if (!fs.existsSync(reporterDir)) fs.mkdirSync(reporterDir, { recursive: true });

      const jsonPayload = this.buildJsonPayload();
      fs.writeFileSync(reporterResultsPath, JSON.stringify(jsonPayload, null, 2), 'utf-8');

      runAnalysis(reporterResultsPath);
    } catch (e: unknown) {
      console.warn('[TestReporter] Report generation failed:', e);
    }
  }

  private buildJsonPayload(): object {
    return {
      config: {},
      suites: this.rootSuite ? this.rootSuite.suites.map(s => this.serializeSuite(s)) : [],
    };
  }

  private serializeSuite(suite: Suite): object {
    return {
      title: suite.title,
      file: (suite as any).location?.file ?? '',
      suites: suite.suites.map(s => this.serializeSuite(s)),
      specs: suite.tests.map(test => ({
        title: test.title,
        tests: [
          {
            status: test.outcome(),
            results: test.results.map(r => ({
              status: r.status,
              duration: r.duration,
              error: r.error
                ? { message: r.error.message ?? '', stack: r.error.stack ?? '' }
                : undefined,
              errors: r.errors?.map(e => ({ message: e.message ?? '', stack: e.stack ?? '' })) ?? [],
            })),
          },
        ],
      })),
    };
  }

  printsToStdio(): boolean {
    return false;
  }
}

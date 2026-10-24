import axios from 'axios';
import { JSDOM } from 'jsdom';
import axe from 'axe-core';
import { PageAuditResult, AuditViolation, AuditSummary, Severity } from '../types/audit.js';
import { RemediationEngine } from './remediation.js';

export class A11yScanner {
  private userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 AccessiShieldBot/1.0';

  /**
   * Scans a target URL and returns a detailed compliance audit.
   */
  async scanUrl(url: string): Promise<PageAuditResult> {
    const startTime = Date.now();

    // 1. Fetch page HTML
    const response = await axios.get(url, {
      headers: {
        'User-Agent': this.userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7'
      },
      timeout: 15000,
      maxRedirects: 5
    });

    const html = response.data;
    const finalUrl = response.request?.res?.responseUrl || url;

    // 2. Initialize virtual DOM
    const dom = new JSDOM(html, {
      url: finalUrl,
      runScripts: 'outside-only',
      pretendToBeVisual: true
    });

    // 3. Run axe audit directly on the JSDOM document
    const axeResults: any = await new Promise((resolve, reject) => {
      axe.run(
        dom.window.document.documentElement,
        {
          runOnly: {
            type: 'tag',
            values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']
          }
        },
        (err: Error | null, results: any) => {
          if (err) return reject(err);
          resolve(results);
        }
      );
    });

    // 4. Transform and enrich violations
    const violations: AuditViolation[] = [];

    let criticalCount = 0;
    let seriousCount = 0;
    let moderateCount = 0;
    let minorCount = 0;
    let legalBlockersCount = 0;

    for (const v of axeResults.violations || []) {
      const impact: Severity = (v.impact as Severity) || 'moderate';

      if (impact === 'critical') criticalCount += v.nodes.length;
      else if (impact === 'serious') seriousCount += v.nodes.length;
      else if (impact === 'moderate') moderateCount += v.nodes.length;
      else minorCount += v.nodes.length;

      // Identify high-risk EAA legal blockers (forms, checkout buttons, contrast, language)
      const isBlocker = ['label', 'button-name', 'link-name', 'color-contrast', 'html-has-lang', 'image-alt'].includes(v.id);
      if (isBlocker) {
        legalBlockersCount += v.nodes.length;
      }

      for (const node of v.nodes) {
        const selector = Array.isArray(node.target) ? node.target.join(' > ') : String(node.target || '');
        const htmlSnippet = node.html || '';
        const remediation = RemediationEngine.generateFix(v.id, htmlSnippet, selector, impact);

        violations.push({
          id: v.id,
          impact,
          standard: ['EAA_2025', 'WCAG_2_1_AA'],
          description: v.description,
          help: v.help,
          helpUrl: v.helpUrl,
          selector,
          htmlSnippet,
          failureSummary: node.failureSummary || '',
          isLegalBlocker: isBlocker,
          remediation
        });
      }
    }

    const totalViolations = violations.length;

    // 5. Calculate Compliance Score (Penalize critical and legal blockers heavier)
    const penalty = (criticalCount * 6) + (seriousCount * 3.5) + (moderateCount * 1.5) + (minorCount * 0.5);
    const complianceScore = Math.max(0, Math.min(100, Math.round(100 - penalty)));

    let status: 'NON_CONFORME' | 'PARTIELLEMENT_CONFORME' | 'CONFORME' = 'NON_CONFORME';
    if (complianceScore >= 90 && legalBlockersCount === 0) {
      status = 'CONFORME';
    } else if (complianceScore >= 50) {
      status = 'PARTIELLEMENT_CONFORME';
    }

    const summary: AuditSummary = {
      totalViolations,
      criticalCount,
      seriousCount,
      moderateCount,
      minorCount,
      legalBlockersCount,
      complianceScore,
      status
    };

    const durationMs = Date.now() - startTime;

    return {
      url: finalUrl,
      auditedAt: new Date().toISOString(),
      durationMs,
      summary,
      violations,
      legalNoticeSummary: this.generateLegalNotice(summary)
    };
  }

  private generateLegalNotice(summary: AuditSummary): string {
    if (summary.status === 'CONFORME') {
      return "Le site respecte les exigences essentielles d'accessibilité numérique de la directive européenne EAA 2025 (EN 301 549).";
    }
    return `ATTENTION : Ce site présente ${summary.legalBlockersCount} point(s) de non-conformité critique(s) sous la directive EAA 2025 (amendes et sanctions administratives encourues).`;
  }
}

export type Severity = 'critical' | 'serious' | 'moderate' | 'minor';

export type LegalStandard = 'EAA_2025' | 'WCAG_2_1_AA' | 'WCAG_2_2_AA' | 'RGAA_4_1';

export interface RemediationSnippet {
  type: 'html' | 'css' | 'javascript';
  description: string;
  originalCode?: string;
  recommendedCode: string;
  explanation: string;
}

export interface AuditViolation {
  id: string;
  impact: Severity;
  standard: LegalStandard[];
  description: string;
  help: string;
  helpUrl: string;
  selector: string;
  htmlSnippet: string;
  failureSummary: string;
  isLegalBlocker: boolean; // Direct fine risk under EAA (e.g. checkout blocker, unlabelled cart inputs)
  remediation: RemediationSnippet;
}

export interface AuditSummary {
  totalViolations: number;
  criticalCount: number;
  seriousCount: number;
  moderateCount: number;
  minorCount: number;
  legalBlockersCount: number;
  complianceScore: number; // 0 to 100%
  status: 'NON_CONFORME' | 'PARTIELLEMENT_CONFORME' | 'CONFORME';
}

export interface PageAuditResult {
  url: string;
  auditedAt: string;
  durationMs: number;
  summary: AuditSummary;
  violations: AuditViolation[];
  legalNoticeSummary: string;
}

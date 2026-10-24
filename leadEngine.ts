import { A11yScanner } from '../engine/scanner.js';
import { PageAuditResult } from '../types/audit.js';

export interface ColdOutreachDraft {
  recipientDomain: string;
  recipientEmail?: string;
  subject: string;
  emailBodyText: string;
  auditSummary: {
    score: number;
    blockers: number;
    criticalViolations: string[];
  };
}

export class LeadEngine {
  private scanner = new A11yScanner();

  /**
   * Automatically inspects a prospect's site and generates a proof-based outreach draft
   */
  async analyzeProspect(url: string, contactEmail?: string): Promise<ColdOutreachDraft | null> {
    try {
      const result: PageAuditResult = await this.scanner.scanUrl(url);

      // Only qualify prospects who actually have issues (almost all of them!)
      if (result.summary.legalBlockersCount === 0 && result.summary.complianceScore >= 95) {
        return null; // Skip compliant sites
      }

      const domain = new URL(result.url).hostname.replace('www.', '');
      const criticalViolations = result.violations
        .filter(v => v.isLegalBlocker || v.impact === 'critical')
        .slice(0, 3)
        .map(v => `${v.help} (élément : ${v.selector})`);

      const subject = `[Conformité EAA 2025] Anomalies d'accessibilité détectées sur ${domain}`;

      const emailBodyText = `Bonjour,

Notre robot de conformité réglementaire a analysé le tunnel d'expérience de ${domain} au regard de la Directive Européenne sur l'Accessibilité Numérique (EAA 2025 / norme EN 301 549).

Votre score actuel ressort à ${result.summary.complianceScore}/100 avec ${result.summary.legalBlockersCount} point(s) de blocage légal majeur(s) :
${criticalViolations.map(c => `• ${c}`).join('\n')}

Ces anomalies exposent votre entreprise à des risques de sanctions administratives et bloquent l'accès à certains utilisateurs malvoyants ou naviguant au clavier.

Vous pouvez consulter votre rapport d'audit technique complet et obtenir les correctifs de code directement ici :
👉 https://app.accessishield.com/audit/${encodeURIComponent(domain)}

Notre plateforme permet de corriger ces anomalies et d'activer une surveillance continue hebdomadaire pour garantir le maintien de votre conformité.

Bien cordialement,
L'équipe AccessiShield
https://accessishield.com
`;

      return {
        recipientDomain: domain,
        recipientEmail: contactEmail,
        subject,
        emailBodyText,
        auditSummary: {
          score: result.summary.complianceScore,
          blockers: result.summary.legalBlockersCount,
          criticalViolations
        }
      };
    } catch (err: any) {
      console.error(`Erreur d'analyse prospect pour ${url}:`, err.message);
      return null;
    }
  }
}

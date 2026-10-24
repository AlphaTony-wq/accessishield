import axios from 'axios';
import * as cheerio from 'cheerio';
import { LeadEngine, ColdOutreachDraft } from './leadEngine.js';

export interface DiscoveredTarget {
  name: string;
  url: string;
  category: 'ecommerce' | 'agency' | 'saas';
  contactEmail?: string;
  scannedAt?: string;
  qualifiedDraft?: ColdOutreachDraft | null;
}

export class TargetCrawler {
  private leadEngine = new LeadEngine();

  /**
   * Analyse une liste d'URLs cibles (e-commerces, agences) et produit la campagne de prospection prête à l'envoi
   */
  async processBatch(targetUrls: string[]): Promise<{
    processed: number;
    qualifiedLeads: DiscoveredTarget[];
    totalBlockersFound: number;
  }> {
    const qualifiedLeads: DiscoveredTarget[] = [];
    let totalBlockersFound = 0;

    for (const rawUrl of targetUrls) {
      try {
        const normalizedUrl = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;
        console.log(`[Crawler] 🔎 Analyse de la cible : ${normalizedUrl}...`);

        // Tente de trouver un email de contact sur la page
        const contactEmail = await this.extractContactEmail(normalizedUrl);

        // Analyse la conformité et génère le draft d'outbound
        const draft = await this.leadEngine.analyzeProspect(normalizedUrl, contactEmail || undefined);

        if (draft && draft.auditSummary.blockers > 0) {
          totalBlockersFound += draft.auditSummary.blockers;
          qualifiedLeads.push({
            name: draft.recipientDomain,
            url: normalizedUrl,
            category: 'ecommerce',
            contactEmail: contactEmail || undefined,
            scannedAt: new Date().toISOString(),
            qualifiedDraft: draft
          });
          console.log(`[Crawler] 🎯 Lead qualifié : ${draft.recipientDomain} (${draft.auditSummary.blockers} bloqueurs EAA, score: ${draft.auditSummary.score}/100)`);
        } else {
          console.log(`[Crawler] ℹ️ Site déjà conforme ou sans bloqueur : ${normalizedUrl}`);
        }
      } catch (err: any) {
        console.error(`[Crawler] ⚠️ Erreur sur ${rawUrl}:`, err.message);
      }
    }

    return {
      processed: targetUrls.length,
      qualifiedLeads,
      totalBlockersFound
    };
  }

  /**
   * Extrait rapidement les emails de contact depuis les balises mailto: ou le contenu public
   */
  private async extractContactEmail(url: string): Promise<string | null> {
    try {
      const res = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AccessiShieldBot/1.0' },
        timeout: 8000
      });
      const $ = cheerio.load(res.data);

      // 1. Recherche liens mailto
      const mailto = $('a[href^="mailto:"]').first().attr('href');
      if (mailto) {
        const email = mailto.replace('mailto:', '').split('?')[0].trim();
        if (email.includes('@') && !email.includes('sentry') && !email.includes('wix')) {
          return email;
        }
      }

      // 2. Recherche par expression régulière dans le texte du footer / contact
      const text = $('body').text();
      const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (match && match[0] && !match[0].endsWith('.png') && !match[0].endsWith('.jpg')) {
        return match[0];
      }

      return null;
    } catch {
      return null;
    }
  }
}

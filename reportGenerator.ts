import { PageAuditResult } from '../types/audit.js';

export class ReportGenerator {
  /**
   * Generates a modern, responsive HTML audit report
   */
  static generateHtmlReport(result: PageAuditResult): string {
    const { summary, violations, url, auditedAt } = result;
    const dateFormatted = new Date(auditedAt).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const statusBadgeClass =
      summary.status === 'CONFORME'
        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
        : summary.status === 'PARTIELLEMENT_CONFORME'
        ? 'bg-amber-100 text-amber-800 border-amber-300'
        : 'bg-rose-100 text-rose-800 border-rose-300';

    return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rapport d'Audit EAA 2025 — ${url}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-50 text-slate-900 font-sans antialiased min-h-screen">
  <!-- Top Banner -->
  <div class="bg-indigo-900 text-white py-3 px-6 text-sm flex justify-between items-center shadow-md">
    <div class="flex items-center gap-2 font-semibold">
      <span>🛡️ AccessiShield</span>
      <span class="text-xs bg-indigo-700 px-2 py-0.5 rounded text-indigo-200">Directive Européenne EAA 2025</span>
    </div>
    <div class="text-indigo-200 text-xs">
      Audit certifié • ${dateFormatted}
    </div>
  </div>

  <main class="max-w-5xl mx-auto px-6 py-10 space-y-8">
    <!-- Header Card -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
      <div class="space-y-2">
        <div class="flex items-center gap-3">
          <span class="px-3 py-1 rounded-full text-xs font-bold border ${statusBadgeClass}">
            ${summary.status}
          </span>
          <span class="text-slate-400 text-sm">Norme EN 301 549 / WCAG 2.1 AA</span>
        </div>
        <h1 class="text-2xl font-bold tracking-tight text-slate-900">
          Rapport d'Audit : <span class="text-indigo-600 break-all">${url}</span>
        </h1>
        <p class="text-slate-600 text-sm">
          ${result.legalNoticeSummary}
        </p>
      </div>

      <!-- Score Circle -->
      <div class="flex flex-col items-center justify-center bg-slate-50 border border-slate-200 rounded-2xl p-6 min-w-[160px]">
        <div class="text-4xl font-extrabold ${summary.complianceScore >= 80 ? 'text-emerald-600' : summary.complianceScore >= 50 ? 'text-amber-500' : 'text-rose-600'}">
          ${summary.complianceScore}%
        </div>
        <div class="text-xs font-medium text-slate-500 uppercase tracking-wider mt-1">Conformité EAA</div>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div class="text-2xl font-bold text-rose-600">${summary.legalBlockersCount}</div>
        <div class="text-xs font-medium text-slate-500 mt-1">Bloqueurs Légaux Critiques</div>
      </div>
      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div class="text-2xl font-bold text-amber-600">${summary.seriousCount}</div>
        <div class="text-xs font-medium text-slate-500 mt-1">Anomalies Majeures</div>
      </div>
      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div class="text-2xl font-bold text-slate-700">${summary.moderateCount}</div>
        <div class="text-xs font-medium text-slate-500 mt-1">Anomalies Modérées</div>
      </div>
      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div class="text-2xl font-bold text-indigo-600">${summary.totalViolations}</div>
        <div class="text-xs font-medium text-slate-500 mt-1">Total Infractions</div>
      </div>
    </div>

    <!-- Remediation & Issues List -->
    <div class="space-y-4">
      <div class="flex justify-between items-center">
        <h2 class="text-xl font-bold text-slate-900">Détail des Non-Conformités & Correctifs</h2>
        <span class="text-xs text-slate-500">${violations.length} points analysés</span>
      </div>

      ${violations.length === 0 ? `
        <div class="bg-emerald-50 border border-emerald-200 p-8 rounded-xl text-center text-emerald-800">
          🎉 Félicitations ! Aucune infraction d'accessibilité majeure n'a été détectée sur cette page.
        </div>
      ` : violations.map((v, i) => `
        <div class="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold px-2.5 py-1 rounded uppercase ${
                v.impact === 'critical' ? 'bg-rose-100 text-rose-800' :
                v.impact === 'serious' ? 'bg-amber-100 text-amber-800' :
                'bg-slate-100 text-slate-800'
              }">${v.impact}</span>
              <span class="font-semibold text-slate-900">#${i + 1} — ${v.help}</span>
            </div>
            <a href="${v.helpUrl}" target="_blank" class="text-xs text-indigo-600 hover:underline">Documentation WCAG →</a>
          </div>

          <p class="text-sm text-slate-600">${v.description}</p>

          <div class="bg-slate-900 rounded-lg p-4 text-xs font-mono text-slate-200 overflow-x-auto">
            <div class="text-slate-400 mb-1">// Élément détecté (${v.selector})</div>
            <code>${v.htmlSnippet.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code>
          </div>

          <!-- Suggested Fix Box -->
          <div class="bg-emerald-50 border border-emerald-200 rounded-lg p-4 space-y-2">
            <div class="text-xs font-bold text-emerald-900 flex items-center gap-1">
              <span>💡 Correctif de code recommandé</span>
            </div>
            <p class="text-xs text-emerald-800">${v.remediation.explanation}</p>
            <pre class="bg-emerald-900/90 text-emerald-100 p-3 rounded font-mono text-xs overflow-x-auto"><code>${v.remediation.recommendedCode.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
          </div>
        </div>
      `).join('')}
    </div>

    <!-- CTA Section -->
    <div class="bg-gradient-to-r from-indigo-900 to-indigo-800 text-white rounded-2xl p-8 text-center space-y-4 shadow-lg">
      <h3 class="text-2xl font-bold">Mettez votre site en conformité légale continue</h3>
      <p class="text-indigo-200 text-sm max-w-2xl mx-auto">
        La directive EAA impose une conformité permanente. Activez la surveillance hebdomadaire automatique et téléchargez votre déclaration officielle d'accessibilité.
      </p>
      <div class="pt-2">
        <a href="#subscribe" class="inline-block bg-white text-indigo-900 font-bold px-8 py-3 rounded-xl shadow-md hover:bg-indigo-50 transition">
          Activer la Surveillance Continue (dès 89 € / mois)
        </a>
      </div>
    </div>
  </main>
</body>
</html>`;
  }
}

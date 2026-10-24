import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { A11yScanner } from './engine/scanner.js';
import { ReportGenerator } from './engine/reportGenerator.js';
import { LeadEngine } from './outbound/leadEngine.js';
import { TargetCrawler } from './outbound/targetCrawler.js';
import { BillingService, PlanTier, PLANS } from './billing/stripeService.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const scanner = new A11yScanner();
const leadEngine = new LeadEngine();
const crawler = new TargetCrawler();

// 1. Landing Page avec formulaire de scan et grille tarifaire branchée sur Stripe
app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AccessiShield — Conformité et Surveillance d'Accessibilité EAA 2025</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-900 text-slate-100 font-sans antialiased min-h-screen">
  <header class="border-b border-slate-800 py-4 px-8 max-w-6xl mx-auto flex justify-between items-center">
    <div class="flex items-center gap-3">
      <div class="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/30">🛡️</div>
      <span class="text-xl font-bold tracking-tight text-white">AccessiShield</span>
      <span class="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-medium ml-2">EAA 2025 / RGAA</span>
    </div>
    <div class="flex items-center gap-6 text-sm">
      <a href="#pricing" class="text-slate-300 hover:text-white transition">Tarifs</a>
      <a href="#how" class="text-slate-300 hover:text-white transition">Fonctionnement</a>
      <a href="#scanner" class="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 rounded-lg transition shadow-md shadow-indigo-600/30">Auditer mon site</a>
    </div>
  </header>

  <section class="max-w-5xl mx-auto px-6 py-20 text-center space-y-6">
    <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold uppercase tracking-wider">
      ⚠️ Sanctions européennes EAA en vigueur
    </div>
    <h1 class="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
      Votre site est-il conforme à la <span class="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-sky-400">Directive EAA 2025</span> ?
    </h1>
    <p class="text-lg text-slate-400 max-w-2xl mx-auto">
      Auditez votre boutique ou votre application web en 3 secondes, obtenez les snippets de remédiation de code exacts et activez la surveillance continue certifiée.
    </p>

    <div id="scanner" class="max-w-2xl mx-auto pt-6">
      <form action="/audit" method="GET" class="flex flex-col sm:flex-row gap-3 bg-slate-800/80 p-2.5 rounded-2xl border border-slate-700 shadow-2xl backdrop-blur">
        <input 
          type="url" 
          name="url" 
          required 
          placeholder="https://votre-site-ou-boutique.com" 
          class="flex-1 bg-transparent px-4 py-3 text-white placeholder-slate-500 focus:outline-none text-sm"
        />
        <button 
          type="submit" 
          class="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-3 rounded-xl transition shadow-lg shadow-indigo-600/40 flex items-center justify-center gap-2 text-sm"
        >
          <span>Lancer l'audit gratuit</span>
          <span>→</span>
        </button>
      </form>
      <div class="flex items-center justify-center gap-6 text-xs text-slate-500 mt-3">
        <span>⚡ Scan instantané en 3s</span>
        <span>•</span>
        <span>🔒 Aucune installation requise</span>
        <span>•</span>
        <span>📋 Conforme norme EN 301 549</span>
      </div>
    </div>
  </section>

  <!-- Tarifs / Stripe Checkout Triggers -->
  <section id="pricing" class="max-w-6xl mx-auto px-6 py-16 border-t border-slate-800 space-y-12">
    <div class="text-center space-y-3">
      <h2 class="text-3xl font-bold text-white">Tarifs transparents pour une conformité totale</h2>
      <p class="text-slate-400 text-sm">Activez votre abonnement en 1 clic et protégez votre activité contre les mises en demeure.</p>
    </div>

    <div class="grid md:grid-cols-3 gap-8">
      <!-- Solo -->
      <div class="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 space-y-6 flex flex-col justify-between hover:border-slate-600 transition">
        <div class="space-y-4">
          <div class="text-lg font-bold text-white">Solo E-commerce</div>
          <p class="text-xs text-slate-400">Pour 1 boutique ou site indépendant.</p>
          <div class="flex items-baseline gap-1">
            <span class="text-4xl font-extrabold text-white">89 €</span>
            <span class="text-slate-400 text-xs">/ mois</span>
          </div>
          <ul class="text-xs text-slate-300 space-y-3 pt-4 border-t border-slate-700/60">
            <li class="flex items-center gap-2">✓ 1 site monitoré 24h/24</li>
            <li class="flex items-center gap-2">✓ Scan complet hebdomadaire</li>
            <li class="flex items-center gap-2">✓ Détection des infractions critiques EAA</li>
            <li class="flex items-center gap-2">✓ Snippets de code correctifs prêts à coller</li>
            <li class="flex items-center gap-2">✓ Déclaration officielle d'accessibilité générée</li>
          </ul>
        </div>
        <form action="/create-checkout-session" method="POST">
          <input type="hidden" name="plan" value="solo">
          <button type="submit" class="w-full bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 rounded-xl transition text-sm">
            Souscrire Solo (89 €/mois)
          </button>
        </form>
      </div>

      <!-- Pro (Featured) -->
      <div class="bg-gradient-to-b from-indigo-950/80 to-slate-800/90 border-2 border-indigo-500 rounded-2xl p-8 space-y-6 flex flex-col justify-between shadow-2xl shadow-indigo-500/20 relative">
        <div class="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
          Recommandé
        </div>
        <div class="space-y-4">
          <div class="text-lg font-bold text-white">Pro / Multi-sites</div>
          <p class="text-xs text-indigo-200">Pour marques en croissance & plusieurs domaines.</p>
          <div class="flex items-baseline gap-1">
            <span class="text-4xl font-extrabold text-white">149 €</span>
            <span class="text-slate-400 text-xs">/ mois</span>
          </div>
          <ul class="text-xs text-slate-200 space-y-3 pt-4 border-t border-indigo-500/30">
            <li class="flex items-center gap-2">✓ <strong>Jusqu'à 3 sites monitorés</strong></li>
            <li class="flex items-center gap-2">✓ <strong>Scans quotidiens continus</strong></li>
            <li class="flex items-center gap-2">✓ Audit complet du tunnel panier & checkout</li>
            <li class="flex items-center gap-2">✓ Alertes instantanées par email et Webhook</li>
            <li class="flex items-center gap-2">✓ Support prioritaire conformité</li>
          </ul>
        </div>
        <form action="/create-checkout-session" method="POST">
          <input type="hidden" name="plan" value="pro">
          <button type="submit" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition text-sm shadow-lg shadow-indigo-600/40">
            Souscrire Pro (149 €/mois)
          </button>
        </form>
      </div>

      <!-- Agency -->
      <div class="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 space-y-6 flex flex-col justify-between hover:border-slate-600 transition">
        <div class="space-y-4">
          <div class="text-lg font-bold text-white">Agency Partner</div>
          <p class="text-xs text-slate-400">Pour agences web et prestataires digitaux.</p>
          <div class="flex items-baseline gap-1">
            <span class="text-4xl font-extrabold text-white">299 €</span>
            <span class="text-slate-400 text-xs">/ mois</span>
          </div>
          <ul class="text-xs text-slate-300 space-y-3 pt-4 border-t border-slate-700/60">
            <li class="flex items-center gap-2">✓ <strong>Jusqu'à 25 sites clients</strong></li>
            <li class="flex items-center gap-2">✓ <strong>Portail White-Label (votre logo)</strong></li>
            <li class="flex items-center gap-2">✓ Rapports PDF certifiés à revendre</li>
            <li class="flex items-center gap-2">✓ Accès API complet</li>
          </ul>
        </div>
        <form action="/create-checkout-session" method="POST">
          <input type="hidden" name="plan" value="agency">
          <button type="submit" class="w-full bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 rounded-xl transition text-sm">
            Devenir Partenaire (299 €/mois)
          </button>
        </form>
      </div>
    </div>
  </section>
</body>
</html>`);
});

// 2. Route de création de session Stripe Checkout
app.post('/create-checkout-session', async (req, res) => {
  const plan = (req.body.plan as PlanTier) || 'solo';
  const customerEmail = req.body.email;
  const siteUrl = req.body.siteUrl;

  try {
    const session = await BillingService.createCheckoutSession(plan, customerEmail, siteUrl);
    if (session.url) {
      return res.redirect(303, session.url);
    }
    res.status(500).send("Impossible de créer la session Stripe");
  } catch (err: any) {
    res.status(500).send(`Erreur Stripe : ${err.message}`);
  }
});

// 3. Page de Confirmation après Paiement (Success Callback)
app.get('/checkout/success', (req, res) => {
  const plan = req.query.plan as string || 'pro';
  const site = req.query.site as string || 'votre site';
  res.send(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Abonnement Activé — AccessiShield</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-900 text-slate-100 flex items-center justify-center min-h-screen px-4">
  <div class="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-8 text-center space-y-6 shadow-2xl">
    <div class="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center text-3xl mx-auto border border-emerald-500/30">
      ✓
    </div>
    <div class="space-y-2">
      <h1 class="text-2xl font-bold text-white">Souscription Confirmée !</h1>
      <p class="text-sm text-slate-400">
        Votre abonnement <strong class="text-white">${plan.toUpperCase()}</strong> est actif. La surveillance continue pour <strong>${site}</strong> a démarré.
      </p>
    </div>
    <div class="bg-slate-900/80 p-4 rounded-xl text-xs text-slate-300 text-left space-y-2 border border-slate-700/50">
      <div class="font-semibold text-emerald-400">Statut du compte :</div>
      <div>• Prochain scan automatique : dans 24h</div>
      <div>• Déclaration d'accessibilité générée : disponible au téléchargement</div>
      <div>• Alertes de régression : activées par email</div>
    </div>
    <a href="/" class="inline-block w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition text-sm">
      Accéder à mon tableau de bord
    </a>
  </div>
</body>
</html>`);
});

// 4. Route d'audit HTML dynamique
app.get('/audit', async (req, res) => {
  const targetUrl = req.query.url as string;
  if (!targetUrl) return res.status(400).send('Paramètre ?url manquant');

  try {
    const result = await scanner.scanUrl(targetUrl);
    const htmlReport = ReportGenerator.generateHtmlReport(result);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(htmlReport);
  } catch (err: any) {
    res.status(500).send(`Erreur lors de l'audit de ${targetUrl}: ${err.message}`);
  }
});

// 5. API Scan JSON
app.get('/api/scan', async (req, res) => {
  const targetUrl = req.query.url as string;
  if (!targetUrl) return res.status(400).json({ error: 'url parameter is required' });

  try {
    const result = await scanner.scanUrl(targetUrl);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. API Batch Prospecting Crawler (Pipeline d'acquisition de masse)
app.post('/api/crawler/batch', async (req, res) => {
  const { urls } = req.body;
  if (!urls || !Array.isArray(urls)) {
    return res.status(400).json({ error: 'urls array is required' });
  }

  const result = await crawler.processBatch(urls);
  res.json({ success: true, result });
});

app.listen(port, () => {
  console.log(`🛡️ AccessiShield SaaS Server running on http://localhost:${port}`);
});

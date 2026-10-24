import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { JSDOM } from 'jsdom';
import axe from 'axe-core';

dotenv.config();

const app = express();
const port = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'rk_live_placeholder';
const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-12-18.acacia' });

// Health check endpoint
app.get('/healthz', (req, res) => res.status(200).send('OK'));

// Landing Page
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
      <div class="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center font-bold text-white shadow-lg">🛡️</div>
      <span class="text-xl font-bold tracking-tight text-white">AccessiShield</span>
      <span class="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-medium ml-2">EAA 2025 / RGAA</span>
    </div>
    <div class="flex items-center gap-6 text-sm">
      <a href="#pricing" class="text-slate-300 hover:text-white transition">Tarifs</a>
      <a href="#scanner" class="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 rounded-lg transition">Auditer mon site</a>
    </div>
  </header>

  <section class="max-w-5xl mx-auto px-6 py-20 text-center space-y-6">
    <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold uppercase">
      ⚠️ Sanctions européennes EAA en vigueur
    </div>
    <h1 class="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
      Votre site est-il conforme à la <span class="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-sky-400">Directive EAA 2025</span> ?
    </h1>
    <p class="text-lg text-slate-400 max-w-2xl mx-auto">
      Auditez votre boutique ou votre application web en 3 secondes, obtenez les snippets de remédiation de code exacts et activez la surveillance continue certifiée.
    </p>

    <div id="scanner" class="max-w-2xl mx-auto pt-6">
      <form action="/audit" method="GET" class="flex flex-col sm:flex-row gap-3 bg-slate-800/80 p-2.5 rounded-2xl border border-slate-700 shadow-2xl">
        <input type="url" name="url" required placeholder="https://votre-site-ou-boutique.com" class="flex-1 bg-transparent px-4 py-3 text-white placeholder-slate-500 focus:outline-none text-sm"/>
        <button type="submit" class="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-3 rounded-xl transition flex items-center justify-center gap-2 text-sm">
          <span>Lancer l'audit gratuit</span> <span>→</span>
        </button>
      </form>
    </div>
  </section>

  <section id="pricing" class="max-w-6xl mx-auto px-6 py-16 border-t border-slate-800 space-y-12">
    <div class="text-center space-y-3">
      <h2 class="text-3xl font-bold text-white">Tarifs pour une conformité totale</h2>
      <p class="text-slate-400 text-sm">Activez votre abonnement en 1 clic et protégez votre activité.</p>
    </div>

    <div class="grid md:grid-cols-3 gap-8">
      <div class="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 space-y-6 flex flex-col justify-between">
        <div class="space-y-4">
          <div class="text-lg font-bold text-white">Solo E-commerce</div>
          <div class="text-4xl font-extrabold text-white">89 € <span class="text-xs text-slate-400 font-normal">/ mois</span></div>
          <ul class="text-xs text-slate-300 space-y-2 pt-4 border-t border-slate-700/60">
            <li>✓ 1 site monitoré 24h/24</li>
            <li>✓ Scan complet hebdomadaire</li>
            <li>✓ Détection des infractions critiques EAA</li>
            <li>✓ Snippets de code correctifs prêts à coller</li>
          </ul>
        </div>
        <form action="/create-checkout-session" method="POST">
          <input type="hidden" name="plan" value="solo">
          <button type="submit" class="w-full bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 rounded-xl transition text-sm">Souscrire Solo (89 €/m)</button>
        </form>
      </div>

      <div class="bg-gradient-to-b from-indigo-950 to-slate-800 border-2 border-indigo-500 rounded-2xl p-8 space-y-6 flex flex-col justify-between shadow-2xl relative">
        <div class="space-y-4">
          <div class="text-lg font-bold text-white">Pro / Multi-sites</div>
          <div class="text-4xl font-extrabold text-white">149 € <span class="text-xs text-slate-400 font-normal">/ mois</span></div>
          <ul class="text-xs text-slate-200 space-y-2 pt-4 border-t border-indigo-500/30">
            <li>✓ Jusqu'à 3 sites monitorés</li>
            <li>✓ Scans quotidiens continus</li>
            <li>✓ Audit complet du tunnel panier & checkout</li>
            <li>✓ Alertes instantanées par email</li>
          </ul>
        </div>
        <form action="/create-checkout-session" method="POST">
          <input type="hidden" name="plan" value="pro">
          <button type="submit" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition text-sm">Souscrire Pro (149 €/m)</button>
        </form>
      </div>

      <div class="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 space-y-6 flex flex-col justify-between">
        <div class="space-y-4">
          <div class="text-lg font-bold text-white">Agency Partner</div>
          <div class="text-4xl font-extrabold text-white">299 € <span class="text-xs text-slate-400 font-normal">/ mois</span></div>
          <ul class="text-xs text-slate-300 space-y-2 pt-4 border-t border-slate-700/60">
            <li>✓ Jusqu'à 25 sites clients</li>
            <li>✓ Portail White-Label</li>
            <li>✓ Rapports PDF certifiés</li>
            <li>✓ Accès API complet</li>
          </ul>
        </div>
        <form action="/create-checkout-session" method="POST">
          <input type="hidden" name="plan" value="agency">
          <button type="submit" class="w-full bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 rounded-xl transition text-sm">Devenir Agence (299 €/m)</button>
        </form>
      </div>
    </div>
  </section>
</body>
</html>`);
});

// Live Audit
app.get('/audit', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send('Parametre ?url requis');
  try {
    const pageRes = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 AccessiShieldBot/1.0' },
      timeout: 12000
    });
    const dom = new JSDOM(pageRes.data, { url, pretendToBeVisual: true });
    const axeResults = await new Promise((resolve, reject) => {
      axe.run(dom.window.document.documentElement, (err, r) => err ? reject(err) : resolve(r));
    });
    const violations = axeResults.violations || [];
    const penalty = violations.length * 4;
    const score = Math.max(0, 100 - penalty);

    res.send(`<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Audit ${url}</title><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-slate-900 text-slate-100 p-8 max-w-4xl mx-auto"><div class="bg-slate-800 p-6 rounded-2xl border border-slate-700 space-y-4"><h1 class="text-2xl font-bold">Audit d'Accessibilité : ${url}</h1><div class="text-4xl font-extrabold text-indigo-400">${score}/100</div><p class="text-sm text-slate-400">${violations.length} anomalies detectees.</p><div class="space-y-3 pt-4">${violations.map((v, i) => `<div class="bg-slate-900 p-4 rounded-xl border border-slate-700/50"><div class="font-bold text-rose-400">#${i+1} ${v.help}</div><div class="text-xs text-slate-400 mt-1">${v.description}</div></div>`).join('')}</div><div class="pt-6"><a href="/#pricing" class="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold inline-block">Mettre mon site en conformite continue</a></div></div></body></html>`);
  } catch (err) {
    res.status(500).send('Erreur scan: ' + err.message);
  }
});

// Stripe Checkout
app.post('/create-checkout-session', async (req, res) => {
  const plan = req.body.plan || 'pro';
  const prices = { solo: 8900, pro: 14900, agency: 29900 };
  const appUrl = process.env.APP_URL || 'https://accessishield.onrender.com';
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: { name: 'AccessiShield - Offre ' + plan.toUpperCase() },
          unit_amount: prices[plan] || 14900,
          recurring: { interval: 'month' }
        },
        quantity: 1
      }],
      success_url: appUrl + '/checkout/success?plan=' + plan,
      cancel_url: appUrl + '/#pricing'
    });
    res.redirect(303, session.url);
  } catch (e) {
    res.status(500).send('Stripe Error: ' + e.message);
  }
});

app.get('/checkout/success', (req, res) => {
  res.send('<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-slate-900 text-white flex items-center justify-center min-h-screen text-center"><div class="bg-slate-800 p-8 rounded-2xl border border-slate-700 max-w-md"><h1 class="text-2xl font-bold text-emerald-400">Paiement Reussi !</h1><p class="text-sm text-slate-300 mt-2">Votre abonnement est actif et la surveillance de votre site a demarre.</p><a href="/" class="mt-6 inline-block bg-indigo-600 px-6 py-2 rounded-xl text-sm font-bold">Retour a l accueil</a></div></body></html>');
});

app.listen(port, '0.0.0.0', () => {
  console.log('AccessiShield running on port ' + port);
});

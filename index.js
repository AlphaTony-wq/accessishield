import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { A11yScanner } from './scanner.js';
import { ReportGenerator } from './reportGenerator.js';
import { LeadEngine } from './leadEngine.js';
import { TargetCrawler } from './targetCrawler.js';
import { BillingService, PLANS } from './stripeService.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const scanner = new A11yScanner();
const leadEngine = new LeadEngine();
const crawler = new TargetCrawler();

// Health check for Render
app.get('/healthz', (req, res) => res.status(200).send('OK'));

app.get('/', (req, res) => {
  res.send('<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>AccessiShield</title><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-slate-900 text-slate-100 flex flex-col items-center justify-center min-h-screen px-4 text-center"><div class="max-w-2xl space-y-6"><div class="text-4xl font-extrabold text-white">AccessiShield EAA 2025</div><p class="text-slate-300">Conformite et surveillance d accessibilite web</p><form action="/audit" method="GET" class="flex gap-2"><input type="url" name="url" required placeholder="https://votre-site.com" class="px-4 py-3 bg-slate-800 rounded-xl flex-1 border border-slate-700 text-white"><button type="submit" class="bg-indigo-600 px-6 py-3 rounded-xl font-bold">Auditer</button></form></div></body></html>');
});

app.get('/audit', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).send('URL manquante');
  try {
    const result = await scanner.scanUrl(targetUrl);
    const htmlReport = ReportGenerator.generateHtmlReport(result);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(htmlReport);
  } catch (err) {
    res.status(500).send('Erreur: ' + err.message);
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log('AccessiShield running on port ' + port);
});

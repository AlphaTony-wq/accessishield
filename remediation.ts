import { RemediationSnippet, Severity } from '../types/audit.js';

/**
 * Intelligent Remediation Engine
 * Transforms raw WCAG / axe-core violations into ready-to-implement developer code snippets.
 */
export class RemediationEngine {
  static generateFix(ruleId: string, htmlSnippet: string, selector: string, impact: Severity): RemediationSnippet {
    switch (ruleId) {
      case 'label':
      case 'form-field-multiple-labels':
        return {
          type: 'html',
          description: 'Ajouter une étiquette accessible ou un attribut aria-label au champ de formulaire',
          originalCode: htmlSnippet,
          recommendedCode: this.fixFormLabel(htmlSnippet),
          explanation: 'Chaque champ de saisie (particulièrement dans le panier et le tunnel de commande) DOIT avoir un libellé visible (<label for="id">) ou au minimum un attribut aria-label="Nom du champ" pour être conforme à la directive EAA.'
        };

      case 'image-alt':
      case 'image-redundant-alt':
        return {
          type: 'html',
          description: 'Ajouter ou corriger le texte alternatif descriptif (attribut alt)',
          originalCode: htmlSnippet,
          recommendedCode: this.fixImageAlt(htmlSnippet),
          explanation: 'Si l\'image est décorative, utilisez alt="". Si elle représente un produit ou une information clé, décrivez brièvement son contenu textuel sans répéter "image de".'
        };

      case 'button-name':
      case 'link-name':
        return {
          type: 'html',
          description: 'Donner un nom accessible au bouton ou lien interactif',
          originalCode: htmlSnippet,
          recommendedCode: this.fixButtonName(htmlSnippet),
          explanation: 'Les boutons contenant uniquement une icône (ex: panier, recherche, fermeture) sont invisibles pour les lecteurs d\'écran sans texte explicite ou attribut aria-label.'
        };

      case 'color-contrast':
        return {
          type: 'css',
          description: 'Ajuster le ratio de contraste de couleur pour atteindre au moins 4.5:1 (texte normal) ou 3:1 (grand texte)',
          originalCode: htmlSnippet,
          recommendedCode: `${selector} {\n  /* Assurer un contraste suffisant avec la couleur de fond */\n  color: #111827; /* Exemple de couleur sombre contrastée */\n}`,
          explanation: 'Le texte actuel ne présente pas un contraste suffisant avec son arrière-plan selon le critère WCAG 1.4.3 (niveau AA requis par l\'EAA).'
        };

      case 'html-has-lang':
      case 'html-lang-valid':
        return {
          type: 'html',
          description: 'Définir la langue principale de la page sur la balise <html>',
          originalCode: '<html ...>',
          recommendedCode: '<html lang="fr">',
          explanation: 'L\'attribut lang="fr" (ou la langue de votre marché) permet aux synthèses vocales de prononcer correctement les mots dès le chargement de la page.'
        };

      default:
        return {
          type: 'html',
          description: `Corriger la violation d'accessibilité [${ruleId}]`,
          originalCode: htmlSnippet,
          recommendedCode: `<!-- Inspecter et corriger l'élément ciblé par : ${selector} -->\n${htmlSnippet}`,
          explanation: 'Consultez la recommandation WCAG associée pour adapter le balisage sémantique de cet élément.'
        };
    }
  }

  private static fixFormLabel(html: string): string {
    if (html.includes('<input') && !html.includes('aria-label')) {
      return html.replace('<input', '<input aria-label="Description du champ"');
    }
    return html;
  }

  private static fixImageAlt(html: string): string {
    if (html.includes('<img') && !html.includes('alt=')) {
      return html.replace('<img', '<img alt="Description précise du produit"');
    }
    return html;
  }

  private static fixButtonName(html: string): string {
    if (html.includes('<button') && !html.includes('aria-label')) {
      return html.replace('<button', '<button aria-label="Action du bouton (ex: Ajouter au panier)"');
    }
    if (html.includes('<a') && !html.includes('aria-label')) {
      return html.replace('<a', '<a aria-label="Destination du lien"');
    }
    return html;
  }
}

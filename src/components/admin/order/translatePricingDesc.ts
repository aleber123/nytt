/**
 * Translate Swedish pricingBreakdown line descriptions to English for the
 * admin UI. Order data is stored in the customer's order locale (often sv),
 * but the admin surface is English-only.
 */

export function translatePricingDesc(desc: string): string {
  if (!desc) return '';
  const map: Record<string, string> = {
    'Apostille - Officiell avgift': 'Apostille - Official Fee',
    'Apostille - Serviceavgift': 'Apostille - Service Fee',
    'Notarisering - Officiell avgift': 'Notarization - Official Fee',
    'Notarisering - Serviceavgift': 'Notarization - Service Fee',
    'UD-legalisering - Officiell avgift': 'UD Legalization - Official Fee',
    'UD-legalisering - Serviceavgift': 'UD Legalization - Service Fee',
    'Utrikesdepartementets legalisering - Officiell avgift': 'Ministry of Foreign Affairs - Official Fee',
    'Ambassadlegalisering - Officiell avgift': 'Embassy Legalization - Official Fee',
    'Ambassadlegalisering - Serviceavgift': 'Embassy Legalization - Service Fee',
    'Handelskammarens legalisering - Officiell avgift': 'Chamber of Commerce - Official Fee',
    'Handelskammarlegalisering - Officiell avgift': 'Chamber of Commerce - Official Fee',
    'Handelskammarlegalisering - Serviceavgift': 'Chamber of Commerce - Service Fee',
    'Auktoriserad översättning - Officiell avgift': 'Certified Translation - Official Fee',
    'Expresshantering': 'Express Handling',
    'Expresstjänst': 'Express Service',
    'Returservice': 'Return Service',
    'Returfrakt': 'Return Shipping',
    'Skannade kopior': 'Scanned Copies',
    'Scannade kopior': 'Scanned Copies',
    'Dokumenthämtning': 'Document Pickup',
    'Upphämtningstjänst': 'Pickup Service',
  };
  if (map[desc]) return map[desc];

  const svcFeePatterns: [RegExp, string][] = [
    [/DOX Visumpartner serviceavgift \(Notarisering\)/, 'DOX Visumpartner Service Fee (Notarization)'],
    [/DOX Visumpartner serviceavgift \(Apostille\)/, 'DOX Visumpartner Service Fee (Apostille)'],
    [/DOX Visumpartner serviceavgift \(Ambassadlegalisering\)/, 'DOX Visumpartner Service Fee (Embassy Legalization)'],
    [/DOX Visumpartner serviceavgift \(Utrikesdepartementets legalisering\)/, 'DOX Visumpartner Service Fee (Ministry of Foreign Affairs)'],
    [/DOX Visumpartner serviceavgift \(Handelskammarens legalisering\)/, 'DOX Visumpartner Service Fee (Chamber of Commerce)'],
    [/DOX Visumpartner serviceavgift \(Auktoriserad översättning\)/, 'DOX Visumpartner Service Fee (Certified Translation)'],
    [/DOX Visumpartner serviceavgift \((.+)\)/, 'DOX Visumpartner Service Fee ($1)'],
  ];
  for (const [pattern, replacement] of svcFeePatterns) {
    if (pattern.test(desc)) return desc.replace(pattern, replacement);
  }
  if (desc.includes(' - Officiell avgift')) return desc.replace(' - Officiell avgift', ' - Official Fee');
  if (desc.includes(' - officiell avgift')) return desc.replace(' - officiell avgift', ' - Official Fee');
  return desc;
}

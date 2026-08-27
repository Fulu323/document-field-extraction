import type { ExtractedField } from './types';

const FIELD_TEMPLATES: Array<{ label: string; sample: string[] }> = [
  { label: 'Document Type', sample: ['Invoice', 'Purchase Order', 'Receipt', 'Contract'] },
  { label: 'Vendor Name', sample: ['Acme Supplies Ltd', 'Northwind Traders', 'Globex Corp', 'Initech GmbH'] },
  { label: 'Reference Number', sample: ['INV-20394', 'PO-88213', 'REC-00219', 'CTR-4471'] },
  { label: 'Issue Date', sample: ['2026-07-14', '2026-08-01', '2026-06-22', '2026-08-19'] },
  { label: 'Total Amount', sample: ['1,240.00', '389.50', '9,875.20', '52.00'] },
  { label: 'Currency', sample: ['EUR', 'USD', 'GBP'] },
];

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function randomId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function generateMockFields(): ExtractedField[] {
  return FIELD_TEMPLATES.map((template) => ({
    id: randomId(),
    label: template.label,
    value: pick(template.sample),
    confidence: Math.round((0.68 + Math.random() * 0.31) * 100) / 100,
  }));
}

import { buildActorBox, buildCaseChip, buildMailShell, buildOrderTable, escapeHtml } from './shell';

export interface DuplicateSkuRow {
  sku: string;
  description: string;
  lineCount: number;
}

export interface OrderDuplicateSkusMailInput {
  orderNumber: string;
  clientName: string;
  statusLabel: string;
  actorName: string;
  actorEmail: string;
  motivo: string;
  duplicateSkus: DuplicateSkuRow[];
}

function buildDuplicateSkusTable(rows: DuplicateSkuRow[]): string {
  const body = rows
    .map(
      (row) => `    <tr style="background-color: #fef2f2;">
      <td style="padding: 12px 10px; border-bottom: 1px solid #fecaca; font-size: 13px; color: #b91c1c; font-weight: 700;">${escapeHtml(row.sku)}</td>
      <td style="padding: 12px 10px; border-bottom: 1px solid #fecaca; font-size: 13px; color: #dc2626;">${escapeHtml(row.description)}</td>
      <td style="padding: 12px 10px; border-bottom: 1px solid #fecaca; font-size: 13px; color: #b91c1c; text-align: center; font-weight: 700;">${escapeHtml(row.lineCount)}</td>
    </tr>`,
    )
    .join('\n');

  return `<h2 style="color: #000000; font-size: 17px; font-weight: 600; margin: 0 0 14px 0;">SKUs duplicados</h2>
<div style="margin: 0 0 14px 0; padding: 12px 14px; border: 1px solid #fecaca; border-radius: 8px; background-color: #fef2f2;">
  <p style="margin: 0; color: #b91c1c; font-size: 13px; line-height: 1.45;">
    Hay más de un renglón con el mismo código. Revise cantidades y descripciones antes de continuar el picking.
  </p>
</div>
<table style="border: 1px solid #e5e5e5; border-radius: 8px; width: 100%; border-collapse: collapse; overflow: hidden;">
  <thead>
    <tr style="background-color: #f5f5f5;">
      <th style="padding: 10px; text-align: left; font-size: 12px; color: #525252; border-bottom: 1px solid #e5e5e5;">SKU</th>
      <th style="padding: 10px; text-align: left; font-size: 12px; color: #525252; border-bottom: 1px solid #e5e5e5;">Descripción</th>
      <th style="padding: 10px; text-align: center; font-size: 12px; color: #525252; border-bottom: 1px solid #e5e5e5;">Renglones</th>
    </tr>
  </thead>
  <tbody>
${body}
  </tbody>
</table>`;
}

export function buildOrderDuplicateSkusMail(input: OrderDuplicateSkusMailInput) {
  const extraRowsHtml = `<tr style="border-bottom: 1px solid #e5e5e5;">
    <td style="padding: 14px 16px; border-right: 1px solid #e5e5e5; width: 50%;">
      <div style="font-size: 12px; color: #737373; margin-bottom: 4px;">Picker</div>
      <div style="font-size: 15px; color: #171717; font-weight: 500;">${escapeHtml(input.actorName)}</div>
    </td>
    <td style="padding: 14px 16px; width: 50%;">
      <div style="font-size: 12px; color: #737373; margin-bottom: 4px;">SKUs repetidos</div>
      <div style="font-size: 15px; color: #171717; font-weight: 600;">${input.duplicateSkus.length}</div>
    </td>
  </tr>
  <tr>
    <td colspan="2" style="padding: 14px 16px;">
      <div style="font-size: 12px; color: #737373; margin-bottom: 4px;">Motivo</div>
      <div style="font-size: 15px; color: #171717; font-weight: 500;">${escapeHtml(input.motivo || '—')}</div>
    </td>
  </tr>`;

  const bodyHtml = `${buildCaseChip('SKUs duplicados', input.statusLabel, 'orange')}
${buildActorBox('Reportado por', input.actorName, input.actorEmail)}
${buildOrderTable({ tipoDoc: 'Pedido', orderNumber: input.orderNumber, clientName: input.clientName, extraRowsHtml })}
${buildDuplicateSkusTable(input.duplicateSkus)}`;

  const html = buildMailShell({
    title: 'SKUs duplicados',
    subtitle: 'La app detectó renglones repetidos del mismo SKU',
    bodyHtml,
  });

  const skusJoined = input.duplicateSkus.map((r) => r.sku).join(', ');

  return {
    subject: `SKUs duplicados en el pedido #${input.orderNumber}`,
    text: `Se detectaron SKUs duplicados en el Pedido #${input.orderNumber} (${input.clientName}). SKUs: ${skusJoined}.`,
    html,
  };
}

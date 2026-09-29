import { buildActorBox, buildCaseChip, buildMailShell, buildOrderTable, escapeHtml } from './shell';

export interface OrderCompletedMailInput {
  orderNumber: string;
  clientName: string;
  statusLabel: string;
  actorName: string;
  actorEmail: string;
  bundlesCreated: number;
  bundlesDefined: number;
  /** ISO string; se formatea a DD/MM/YYYY HH:mm en el correo. */
  finishedAt: string;
}

function formatFinishedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';

  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function buildOrderCompletedMail(input: OrderCompletedMailInput) {
  const extraRowsHtml = `<tr style="border-bottom: 1px solid #e5e5e5;">
    <td style="padding: 14px 16px; border-right: 1px solid #e5e5e5; width: 50%;">
      <div style="font-size: 12px; color: #737373; margin-bottom: 4px;">Picker</div>
      <div style="font-size: 15px; color: #171717; font-weight: 500;">${escapeHtml(input.actorName)}</div>
    </td>
    <td style="padding: 14px 16px; width: 50%;">
      <div style="font-size: 12px; color: #737373; margin-bottom: 4px;">Bultos</div>
      <div style="font-size: 15px; color: #171717; font-weight: 500;">${input.bundlesCreated} / ${input.bundlesDefined}</div>
    </td>
  </tr>
  <tr>
    <td colspan="2" style="padding: 14px 16px;">
      <div style="font-size: 12px; color: #737373; margin-bottom: 4px;">Picking finalizado</div>
      <div style="font-size: 15px; color: #171717; font-weight: 500;">${escapeHtml(formatFinishedAt(input.finishedAt))}</div>
    </td>
  </tr>`;

  const bodyHtml = `${buildCaseChip('Completado', input.statusLabel, 'green')}
${buildActorBox('Reportado por', input.actorName, input.actorEmail)}
${buildOrderTable({ tipoDoc: 'Pedido', orderNumber: input.orderNumber, clientName: input.clientName, extraRowsHtml })}`;

  const html = buildMailShell({
    title: 'Pedido completado',
    subtitle: 'El picking finalizó el pedido',
    bodyHtml,
  });

  return {
    subject: `Pedido #${input.orderNumber} completado`,
    text: `${input.actorName} completó el picking del Pedido #${input.orderNumber} (${input.clientName}).`,
    html,
  };
}

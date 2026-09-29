import { buildActorBox, buildCaseChip, buildMailShell, buildOrderTable, escapeHtml } from './shell';

export interface OrderRejectedMailInput {
  orderNumber: string;
  clientName: string;
  statusLabel: string;
  /** Quien rechaza es el auditor/chequeador, no el picker (ver correos.md §6, aclarado con el equipo). */
  actorName: string;
  actorEmail: string;
  motivo: string;
}

export function buildOrderRejectedMail(input: OrderRejectedMailInput) {
  const extraRowsHtml = `<tr>
    <td colspan="2" style="padding: 14px 16px;">
      <div style="font-size: 12px; color: #737373; margin-bottom: 4px;">Motivo del rechazo</div>
      <div style="font-size: 15px; color: #171717; font-weight: 500;">${escapeHtml(input.motivo || 'Sin motivo')}</div>
    </td>
  </tr>`;

  const alertBox = `<div style="margin: 0; padding: 12px 14px; border: 1px solid #fecaca; border-radius: 8px; background-color: #fef2f2;">
  <p style="margin: 0; color: #b91c1c; font-size: 13px; line-height: 1.45;">
    El pedido vuelve a almacén / jefe según el flujo de la app. Revise el motivo antes de reasignar.
  </p>
</div>`;

  const bodyHtml = `${buildCaseChip('Rechazo', input.statusLabel, 'orange')}
${buildActorBox('Reportado por', input.actorName, input.actorEmail)}
${buildOrderTable({ tipoDoc: 'Pedido', orderNumber: input.orderNumber, clientName: input.clientName, extraRowsHtml })}
${alertBox}`;

  const html = buildMailShell({
    title: 'Pedido rechazado',
    subtitle: 'El picking rechazó un pedido',
    bodyHtml,
  });

  return {
    subject: `Pedido #${input.orderNumber} rechazado`,
    text: `${input.actorName} rechazó el Pedido #${input.orderNumber} (${input.clientName}). Motivo: ${input.motivo || 'Sin motivo'}.`,
    html,
  };
}

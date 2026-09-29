/**
 * Shell HTML de marca compartido por los 3 correos que dispara la app
 * (correos.md §4). Estilos inline, sin clases: el cliente de correo del
 * destinatario no corre CSS externo.
 */

const LOGO_URL =
  'https://firebasestorage.googleapis.com/v0/b/benserca-app.firebasestorage.app/o/logos%2Flogo-dark-full.png?alt=media&token=64122b11-e47a-4626-9e7d-012c1b90a106';

/** Escapa `&`, `<`, `>`, `"`, `'` en cualquier valor dinámico antes de inyectarlo en el HTML. */
export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface MailShellInput {
  title: string;
  subtitle: string;
  bodyHtml: string;
}

export function buildMailShell({ title, subtitle, bodyHtml }: MailShellInput): string {
  const year = new Date().getFullYear();
  const safeTitle = escapeHtml(title);

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${safeTitle}</title>
</head>
<body style="margin: 0; padding: 20px; background-color: #f5f5f5; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="max-width: 640px; margin: 0 auto;">
  <tr>
    <td style="background-color: #ffffff; padding: 28px 30px; text-align: center; border-bottom: 3px solid #000000;">
      <img src="${LOGO_URL}" alt="Benserca" style="max-width: 220px; width: 100%; height: auto; margin: 0 auto 16px auto; display: block;">
      <h1 style="color: #000000; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 0.3px;">${safeTitle}</h1>
      <p style="margin: 8px 0 0 0; color: #737373; font-size: 14px;">${escapeHtml(subtitle)}</p>
    </td>
  </tr>
  <tr>
    <td style="background-color: #ffffff; padding: 36px 30px;">
      ${bodyHtml}
      <p style="margin-top: 28px; color: #525252; font-size: 14px; line-height: 1.5;">
        Revise el pedido en la plataforma para dar seguimiento.
      </p>
      <p style="margin-top: 16px; color: #525252; font-size: 14px; line-height: 1.5;">
        Saludos cordiales,<br>
        El equipo de Benserca
      </p>
    </td>
  </tr>
  <tr>
    <td style="background-color: #000000; padding: 18px; text-align: center; color: #e5e5e5; font-size: 12px;">
      <p style="margin: 0;">&copy; ${year} Benserca. Todos los derechos reservados.</p>
      <p style="margin: 8px 0 0 0;">Venezuela</p>
    </td>
  </tr>
</table>
</body>
</html>`;
}

export type CaseChipTone = 'orange' | 'green';

const CHIP_TONE_STYLE: Record<CaseChipTone, string> = {
  orange: 'background-color: #fff7ed; color: #c2410c; border: 1px solid #fdba74;',
  green: 'background-color: #ecfdf5; color: #047857; border: 1px solid #a7f3d0;',
};

export function buildCaseChip(
  caseLabel: string,
  statusLabel: string,
  tone: CaseChipTone = 'orange',
): string {
  return `<div style="text-align: center; margin-bottom: 16px;">
  <span style="display: inline-block; ${CHIP_TONE_STYLE[tone]} font-size: 13px; font-weight: 700; padding: 6px 14px; border-radius: 999px; margin: 0 6px 8px 0;">
    Caso: ${escapeHtml(caseLabel)}
  </span>
  <span style="display: inline-block; background-color: #f5f5f5; color: #000000; font-size: 13px; font-weight: 600; padding: 6px 14px; border-radius: 999px; border: 1px solid #e5e5e5; margin: 0 0 8px 0;">
    ${escapeHtml(statusLabel)}
  </span>
</div>`;
}

export function buildActorBox(label: string, actorName: string, actorEmail: string): string {
  return `<div style="text-align: center; margin-bottom: 28px; padding: 18px; border: 1px solid #e5e5e5; border-radius: 8px; background-color: #fafafa;">
  <p style="margin: 0; font-weight: 600; color: #171717; font-size: 16px;">${escapeHtml(label)}: ${escapeHtml(actorName)}</p>
  <p style="margin: 5px 0 0 0; color: #525252; font-size: 14px;">Correo: ${escapeHtml(actorEmail)}</p>
</div>`;
}

export interface OrderTableInput {
  tipoDoc: string;
  orderNumber: string | number;
  clientName: string;
  extraRowsHtml?: string;
}

/**
 * Tabla de datos del pedido (correos.md §4). Se omiten las filas de Zona y
 * Vendedor / código de cliente: el `Order` de la app hoy no trae esos campos
 * (no están mapeados desde `lo_orders`, ver orders.mapper.ts).
 */
export function buildOrderTable({
  tipoDoc,
  orderNumber,
  clientName,
  extraRowsHtml = '',
}: OrderTableInput): string {
  return `<h2 style="color: #000000; font-size: 17px; font-weight: 600; margin: 0 0 14px 0;">Detalles del pedido</h2>
<table style="border: 1px solid #e5e5e5; border-radius: 8px; margin: 0 0 28px 0; width: 100%; border-collapse: collapse;">
  <tr style="border-bottom: 1px solid #e5e5e5;">
    <td colspan="2" style="padding: 14px 16px;">
      <div style="font-size: 12px; color: #737373; margin-bottom: 4px; text-align: center; font-weight: 600; text-transform: uppercase; letter-spacing: 0.4px;">Documento</div>
      <div style="font-size: 18px; color: #171717; font-weight: 700; text-align: center;">${escapeHtml(tipoDoc)} #${escapeHtml(orderNumber)}</div>
    </td>
  </tr>
  <tr${extraRowsHtml ? ' style="border-bottom: 1px solid #e5e5e5;"' : ''}>
    <td colspan="2" style="padding: 14px 16px;">
      <div style="font-size: 12px; color: #737373; margin-bottom: 4px;">Cliente</div>
      <div style="font-size: 15px; color: #171717; font-weight: 500;">${escapeHtml(clientName)}</div>
    </td>
  </tr>
  ${extraRowsHtml}
</table>`;
}

import type { Payload } from 'payload'

export interface OrderEmailItem {
  title: string
  quantity: number
  price: number
}

export interface OrderEmailData {
  orderId: string
  customerEmail: string
  items: OrderEmailItem[]
  total: number
  storeName?: string
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function buildOrderConfirmationHtml(data: OrderEmailData): string {
  const storeName = data.storeName || 'Dark Card Collection'
  const rows = data.items
    .map(
      (item) => `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #27272a; color: #ededed; font-size: 14px;">${escapeHtml(item.title)}</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #27272a; color: #a1a1aa; font-size: 14px; text-align: center;">${item.quantity}</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #27272a; color: #ededed; font-size: 14px; text-align: right;">€ ${item.price.toFixed(2)}</td>
        </tr>`
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="it">
  <body style="margin: 0; padding: 0; background-color: #0a0a0a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; background-color: #1a1a1a; border: 2px solid #27272a; border-radius: 12px; padding: 32px;">
            <tr>
              <td style="padding-bottom: 20px;">
                <span style="color: #ffffff; font-weight: 900; font-size: 20px; letter-spacing: 0.5px; font-family: Arial, Helvetica, sans-serif;">DARK CARD</span>
                <span style="color: #FACC15; font-weight: 300; font-size: 20px; letter-spacing: 0.5px; font-family: Arial, Helvetica, sans-serif;"> COLLECTION</span>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom: 24px;">
                <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-family: Arial, Helvetica, sans-serif;">Grazie per il tuo ordine!</h1>
                <p style="margin: 8px 0 0; color: #a1a1aa; font-size: 14px; font-family: Arial, Helvetica, sans-serif;">
                  Ordine <strong style="color: #FACC15;">${escapeHtml(data.orderId)}</strong> confermato.
                  Ti invieremo un'email di spedizione appena il pacco parte.
                </p>
              </td>
            </tr>
            <tr>
              <td>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <thead>
                    <tr>
                      <th style="padding: 8px 0; border-bottom: 2px solid #27272a; color: #a1a1aa; font-size: 11px; text-transform: uppercase; text-align: left; font-family: Arial, Helvetica, sans-serif;">Prodotto</th>
                      <th style="padding: 8px 0; border-bottom: 2px solid #27272a; color: #a1a1aa; font-size: 11px; text-transform: uppercase; text-align: center; font-family: Arial, Helvetica, sans-serif;">Q.tà</th>
                      <th style="padding: 8px 0; border-bottom: 2px solid #27272a; color: #a1a1aa; font-size: 11px; text-transform: uppercase; text-align: right; font-family: Arial, Helvetica, sans-serif;">Prezzo</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${rows}
                  </tbody>
                </table>
                <p style="margin: 20px 0 0; padding-top: 16px; border-top: 2px solid #FACC15; color: #ffffff; font-size: 18px; font-weight: 700; text-align: right; font-family: Arial, Helvetica, sans-serif;">
                  Totale: € ${data.total.toFixed(2)}
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding-top: 24px;">
                <p style="margin: 0; color: #a1a1aa; font-size: 12px; font-family: Arial, Helvetica, sans-serif;">
                  ${storeName}, per assistenza rispondi a questa email.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

export async function sendOrderConfirmationEmail(payload: Payload, data: OrderEmailData): Promise<void> {
  const storeName = data.storeName || 'Dark Card Collection'

  await payload.sendEmail({
    to: data.customerEmail,
    subject: `Conferma ordine ${data.orderId} | ${storeName}`,
    html: buildOrderConfirmationHtml(data),
  })
}

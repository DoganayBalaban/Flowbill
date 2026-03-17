interface MagicLinkEmailData {
  clientName: string;
  magicLink: string;
  freelancerName: string;
}

export const buildMagicLinkEmailTemplate = (data: MagicLinkEmailData): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Access Your Invoices</title>
  <style>
    body { margin: 0; padding: 0; background: #f4f6f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .wrapper { max-width: 600px; margin: 32px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: #1a1a2e; padding: 32px 40px; }
    .header h1 { margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: 0.05em; }
    .header p  { margin: 4px 0 0; color: #a0aec0; font-size: 13px; }
    .body { padding: 32px 40px; }
    .greeting { color: #1a1a2e; font-size: 15px; margin-bottom: 8px; }
    .intro { color: #4a5568; font-size: 14px; margin-bottom: 28px; line-height: 1.6; }
    .btn { display: inline-block; background: #4361ee; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 15px; font-weight: 600; text-align: center; }
    .btn-wrap { text-align: center; margin-bottom: 28px; }
    .notice { background: #fff8e1; border-left: 4px solid #f6c90e; border-radius: 4px; padding: 12px 16px; font-size: 12px; color: #7b6a00; margin-bottom: 24px; }
    .footer { background: #f7f8fc; padding: 20px 40px; text-align: center; font-size: 12px; color: #a0aec0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>CLIENT PORTAL</h1>
      <p>Secure Invoice Access</p>
    </div>
    <div class="body">
      <p class="greeting">Hello ${data.clientName},</p>
      <p class="intro">
        ${data.freelancerName} has shared your invoices with you via a secure portal.
        Click the button below to access your invoices. No account or password required.
      </p>
      <div class="btn-wrap">
        <a href="${data.magicLink}" class="btn">View My Invoices &rarr;</a>
      </div>
      <div class="notice">
        &#9203; This link expires in <strong>15 minutes</strong>. If it expires, ask ${data.freelancerName} to send a new one.
      </div>
    </div>
    <div class="footer">
      Sent via <strong>Flowbill</strong> &middot; This link is for ${data.clientName} only. Do not share it.
    </div>
  </div>
</body>
</html>
`;

interface OverdueInvoiceRow {
  invoice_number: string;
  client_name: string;
  due_date: Date | string;
  total: number;
  currency: string;
}

interface OverdueReminderEmailData {
  firstName: string;
  invoices: OverdueInvoiceRow[];
  dashboardUrl: string;
}

export const buildOverdueReminderEmailTemplate = (
  data: OverdueReminderEmailData,
): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Overdue Invoices</title>
  <style>
    body { margin: 0; padding: 0; background: #f4f6f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .wrapper { max-width: 600px; margin: 32px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: #c53030; padding: 32px 40px; }
    .header h1 { margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: 0.05em; }
    .header p  { margin: 4px 0 0; color: #feb2b2; font-size: 13px; }
    .body { padding: 32px 40px; }
    .greeting { color: #1a1a2e; font-size: 15px; margin-bottom: 8px; }
    .intro { color: #4a5568; font-size: 14px; margin-bottom: 28px; line-height: 1.6; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 28px; font-size: 13px; }
    th { text-align: left; padding: 8px; background: #f7f8fc; color: #718096; font-weight: 600; border-bottom: 2px solid #e8ecf0; }
    td { padding: 10px 8px; border-bottom: 1px solid #e8ecf0; color: #4a5568; }
    .amount { font-weight: 700; color: #c53030; }
    .btn { display: inline-block; background: #4361ee; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 15px; font-weight: 600; text-align: center; }
    .btn-wrap { text-align: center; margin-bottom: 28px; }
    .footer { background: #f7f8fc; padding: 20px 40px; text-align: center; font-size: 12px; color: #a0aec0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>OVERDUE INVOICES</h1>
      <p>Action required</p>
    </div>
    <div class="body">
      <p class="greeting">Hi ${data.firstName},</p>
      <p class="intro">
        You have <strong>${data.invoices.length} overdue invoice${data.invoices.length > 1 ? "s" : ""}</strong>
        that require your attention. Consider following up with your clients.
      </p>

      <table>
        <thead>
          <tr>
            <th>Invoice #</th>
            <th>Client</th>
            <th>Due Date</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          ${data.invoices
            .map(
              (inv) => `
          <tr>
            <td>#${inv.invoice_number}</td>
            <td>${inv.client_name}</td>
            <td>${fmtDate(inv.due_date)}</td>
            <td class="amount">${fmtMoney(inv.total, inv.currency)}</td>
          </tr>`,
            )
            .join("")}
        </tbody>
      </table>

      <div class="btn-wrap">
        <a href="${data.dashboardUrl}" class="btn">View Overdue Invoices &rarr;</a>
      </div>
    </div>
    <div class="footer">
      Sent via <strong>Flowbill</strong> &middot; This is an automated reminder.
    </div>
  </div>
</body>
</html>
`;

interface InvoiceEmailData {
  invoiceNumber: string;
  clientName: string;
  issueDate: Date | string;
  dueDate: Date | string;
  subtotal: number | string;
  tax: number | string;
  discount: number | string;
  total: number | string;
  currency: string;
  downloadUrl: string;
  notes?: string | null;
}

const fmtDate = (d: Date | string) =>
  new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const fmtMoney = (val: number | string, currency: string) =>
  `${Number(val).toFixed(2)} ${currency}`;

/**
 * Builds the HTML body for an invoice email.
 * The PDF download is a 10-minute pre-signed S3 link — no attachment needed.
 */
export const buildInvoiceEmailTemplate = (data: InvoiceEmailData): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invoice ${data.invoiceNumber}</title>
  <style>
    body { margin: 0; padding: 0; background: #f4f6f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .wrapper { max-width: 600px; margin: 32px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: #1a1a2e; padding: 32px 40px; }
    .header h1 { margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: 0.05em; }
    .header p  { margin: 4px 0 0; color: #a0aec0; font-size: 13px; }
    .body { padding: 32px 40px; }
    .greeting { color: #1a1a2e; font-size: 15px; margin-bottom: 8px; }
    .intro { color: #4a5568; font-size: 14px; margin-bottom: 28px; line-height: 1.6; }
    .summary { background: #f7f8fc; border-radius: 6px; padding: 20px 24px; margin-bottom: 28px; }
    .summary-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; color: #4a5568; border-bottom: 1px solid #e8ecf0; }
    .summary-row:last-child { border-bottom: none; font-weight: 700; color: #1a1a2e; font-size: 16px; padding-top: 12px; }
    .summary-row:last-child span:last-child { color: #4361ee; }
    .btn { display: inline-block; background: #4361ee; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 15px; font-weight: 600; text-align: center; }
    .btn-wrap { text-align: center; margin-bottom: 28px; }
    .notice { background: #fff8e1; border-left: 4px solid #f6c90e; border-radius: 4px; padding: 12px 16px; font-size: 12px; color: #7b6a00; margin-bottom: 24px; }
    .notes { border-top: 1px solid #e8ecf0; padding-top: 20px; font-size: 13px; color: #718096; line-height: 1.6; }
    .footer { background: #f7f8fc; padding: 20px 40px; text-align: center; font-size: 12px; color: #a0aec0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>INVOICE</h1>
      <p>#${data.invoiceNumber}</p>
    </div>
    <div class="body">
      <p class="greeting">Hello ${data.clientName},</p>
      <p class="intro">
        Please find your invoice summary below. Use the button to securely download your PDF copy.
      </p>

      <div class="summary">
        <div class="summary-row"><span>Invoice #</span><span>${data.invoiceNumber}</span></div>
        <div class="summary-row"><span>Issue Date</span><span>${fmtDate(data.issueDate)}</span></div>
        <div class="summary-row"><span>Due Date</span><span>${fmtDate(data.dueDate)}</span></div>
        <div class="summary-row"><span>Subtotal</span><span>${fmtMoney(data.subtotal, data.currency)}</span></div>
        <div class="summary-row"><span>Tax</span><span>${fmtMoney(data.tax, data.currency)}</span></div>
        <div class="summary-row"><span>Discount</span><span>- ${fmtMoney(data.discount, data.currency)}</span></div>
        <div class="summary-row"><span>Total Due</span><span>${fmtMoney(data.total, data.currency)}</span></div>
      </div>

      <div class="btn-wrap">
        <a href="${data.downloadUrl}" class="btn">⬇ Download Invoice PDF</a>
      </div>

      <div class="notice">
        ⏱ This download link expires in <strong>10 minutes</strong>. Please download your invoice promptly.
      </div>

      ${data.notes ? `<div class="notes"><strong>Notes:</strong><br/>${data.notes}</div>` : ""}
    </div>
    <div class="footer">
      Sent via <strong>Flowbill</strong> · You received this because an invoice was created for you.
    </div>
  </div>
</body>
</html>
`;

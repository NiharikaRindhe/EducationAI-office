// Printable login-credential slips: a grid of cut-out cards the class
// teacher hands to each student/teacher. This is how credentials actually
// reach users in a school — the lab has a printer; kids don't have email.

export interface CredentialSlip {
  fullName: string;
  username: string;
  /** e.g. "Class 3-B" for students, "Teacher" for staff */
  roleLine: string;
  password?: string;
  pin?: string;
}

export function printCredentialSlips(slips: CredentialSlip[], title: string) {
  const cards = slips
    .map(
      (s) => `
      <div class="card">
        <div class="brand">EduAI</div>
        <div class="name">${escapeHtml(s.fullName)}</div>
        <div class="role">${escapeHtml(s.roleLine)}</div>
        <table>
          <tr><td>Login ID</td><td class="mono">${escapeHtml(s.username)}</td></tr>
          ${s.pin ? `<tr><td>PIN</td><td class="mono big">${escapeHtml(s.pin)}</td></tr>` : ''}
          ${s.password ? `<tr><td>Password</td><td class="mono big">${escapeHtml(s.password)}</td></tr>` : ''}
        </table>
        <div class="note">Keep this slip safe. Ask your teacher if you forget your login.</div>
      </div>`,
    )
    .join('');

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; padding: 10mm; }
    h1 { font-size: 14px; margin-bottom: 6mm; }
    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 5mm; }
    .card { border: 1px dashed #94a3b8; border-radius: 8px; padding: 5mm; page-break-inside: avoid; }
    .brand { font-size: 10px; font-weight: 700; letter-spacing: 1px; color: #64748b; text-transform: uppercase; }
    .name { font-size: 15px; font-weight: 700; margin-top: 2mm; }
    .role { font-size: 11px; color: #64748b; margin-bottom: 3mm; }
    table { width: 100%; font-size: 11px; border-collapse: collapse; }
    td { padding: 1mm 0; vertical-align: top; }
    td:first-child { color: #64748b; width: 22mm; }
    .mono { font-family: ui-monospace, Consolas, monospace; word-break: break-all; }
    .big { font-size: 14px; font-weight: 700; }
    .note { font-size: 9px; color: #94a3b8; margin-top: 3mm; }
    @media print { h1 { display: none; } }
  </style></head>
  <body><h1>${escapeHtml(title)} — print this page, cut along the dashed lines</h1>
  <div class="grid">${cards}</div>
  <script>window.onload = () => window.print();</script>
  </body></html>`;

  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(html);
  win.document.close();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

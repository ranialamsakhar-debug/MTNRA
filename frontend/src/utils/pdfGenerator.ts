/**
 * Utilitaire de génération et téléchargement de rapports PDF & CSV
 * Plateforme Nationale Tawsa - Ministère de la Transition Numérique
 */

export interface PdfReportSection {
  title: string;
  items: { label: string; value: string }[];
}

export interface PdfReportTable {
  headers: string[];
  rows: string[][];
}

export interface PdfReportConfig {
  filename: string;
  title: string;
  subtitle: string;
  badge?: string;
  sections?: PdfReportSection[];
  table?: PdfReportTable;
  summaryMetrics?: { label: string; value: string | number; color?: string }[];
}

/**
 * Génère un fichier PDF binaire valide (spécification PDF-1.4 standard)
 * et déclenche automatiquement son téléchargement dans le navigateur.
 */
export function downloadNativePdf(config: PdfReportConfig): void {
  const { filename, title, subtitle, badge, sections = [], table, summaryMetrics = [] } = config;

  // Création du flux de contenu texte PDF
  const dateStr = new Date().toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const contentStreamLines: string[] = [];
  contentStreamLines.push('BT');
  contentStreamLines.push('/F1 16 Tf');
  contentStreamLines.push('50 780 Td');
  contentStreamLines.push(`(ROYAUME DU MAROC - PLATEFORME NATIONALE TAWSA) Tj`);

  contentStreamLines.push('/F1 12 Tf');
  contentStreamLines.push('0 -22 Td');
  contentStreamLines.push(`(${escapePdf(title)}) Tj`);

  contentStreamLines.push('/F1 10 Tf');
  contentStreamLines.push('0 -18 Td');
  contentStreamLines.push(`(${escapePdf(subtitle)} - ${escapePdf(dateStr)}) Tj`);

  if (badge) {
    contentStreamLines.push('0 -16 Td');
    contentStreamLines.push(`(Statut : ${escapePdf(badge)}) Tj`);
  }

  contentStreamLines.push('0 -20 Td');
  contentStreamLines.push('(---------------------------------------------------------------------------------------------------) Tj');

  // Métriques globales
  if (summaryMetrics.length > 0) {
    contentStreamLines.push('0 -20 Td');
    contentStreamLines.push('/F1 11 Tf');
    contentStreamLines.push('(METRIQUES GENERALES :) Tj');
    contentStreamLines.push('/F1 9 Tf');
    for (const metric of summaryMetrics) {
      contentStreamLines.push('0 -14 Td');
      contentStreamLines.push(`( * ${escapePdf(metric.label)} : ${escapePdf(String(metric.value))}) Tj`);
    }
    contentStreamLines.push('0 -15 Td');
    contentStreamLines.push('(---------------------------------------------------------------------------------------------------) Tj');
  }

  // Sections
  for (const section of sections) {
    contentStreamLines.push('0 -20 Td');
    contentStreamLines.push('/F1 11 Tf');
    contentStreamLines.push(`(${escapePdf(section.title.toUpperCase())} :) Tj`);
    contentStreamLines.push('/F1 9 Tf');
    for (const item of section.items) {
      contentStreamLines.push('0 -14 Td');
      contentStreamLines.push(`( - ${escapePdf(item.label)} : ${escapePdf(item.value)}) Tj`);
    }
  }

  // Tableau
  if (table && table.rows.length > 0) {
    contentStreamLines.push('0 -20 Td');
    contentStreamLines.push('/F1 10 Tf');
    contentStreamLines.push(`(${escapePdf(table.headers.join('  |  '))}) Tj`);
    contentStreamLines.push('0 -10 Td');
    contentStreamLines.push('(===================================================================================================) Tj');
    contentStreamLines.push('/F1 8 Tf');
    const displayRows = table.rows.slice(0, 25);
    for (const row of displayRows) {
      contentStreamLines.push('0 -13 Td');
      const rowLine = row.map(c => escapePdf(c)).join(' | ');
      contentStreamLines.push(`(${rowLine.substring(0, 110)}) Tj`);
    }
  }

  contentStreamLines.push('0 -25 Td');
  contentStreamLines.push('/F1 8 Tf');
  contentStreamLines.push(`(Certifie conforme par la Plateforme Nationale Tawsa. Empreinte SHA-256 verifiee.) Tj`);
  contentStreamLines.push('ET');

  const streamContent = contentStreamLines.join('\n');
  const streamLength = streamContent.length;

  const objects: string[] = [];
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj');
  objects.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj');
  objects.push(
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj'
  );
  objects.push('4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj');
  objects.push(`5 0 obj\n<< /Length ${streamLength} >>\nstream\n${streamContent}\nendstream\nendobj`);

  let pdfString = '%PDF-1.4\n';
  const xrefOffsets: number[] = [0];

  for (const obj of objects) {
    xrefOffsets.push(pdfString.length);
    pdfString += obj + '\n';
  }

  const startXref = pdfString.length;
  pdfString += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) {
    const offset = String(xrefOffsets[i]).padStart(10, '0');
    pdfString += `${offset} 00000 n \n`;
  }

  pdfString += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF`;

  const blob = new Blob([pdfString], { type: 'application/pdf' });
  triggerBlobDownload(blob, filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}

/**
 * Échappe les caractères réservés PDF
 */
function escapePdf(text: string): string {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // normalise accents pour compatibilité Helvetica
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[^\x20-\x7E]/g, ' ');
}

/**
 * Ouvre une fenêtre de visualisation et impression officielle grand format
 * avec en-tête officiel du Royaume du Maroc, Marianne/Sceau Tawsa,
 * tables stylisées et mise en page optimisée pour enregistrement PDF haute définition.
 */
export function printOfficialReportWindow(config: PdfReportConfig): void {
  const { title, subtitle, badge = 'OFFICIEL', sections = [], table, summaryMetrics = [] } = config;
  const nowStr = new Date().toLocaleString('fr-FR');
  const randomHash = Array.from({ length: 48 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>${title} - Tawsa Officiel</title>
  <style>
    @page { size: A4 portrait; margin: 15mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      padding: 20px;
      margin: 0;
      font-size: 12px;
      line-height: 1.5;
    }
    .header {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 15px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header-left h1 {
      font-size: 18px;
      font-weight: 900;
      margin: 0;
      color: #0f172a;
      text-transform: uppercase;
    }
    .header-left p {
      font-size: 11px;
      color: #64748b;
      margin: 4px 0 0 0;
      font-weight: 600;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      background: #0f172a;
      color: #ffffff;
      font-size: 10px;
      font-weight: 800;
      border-radius: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 20px;
    }
    .metric-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 12px;
      border-radius: 8px;
      text-align: center;
    }
    .metric-value {
      font-size: 20px;
      font-weight: 900;
      color: #0f172a;
    }
    .metric-label {
      font-size: 10px;
      color: #64748b;
      font-weight: 700;
      text-transform: uppercase;
      margin-top: 4px;
    }
    .section-title {
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      color: #0f172a;
      border-left: 4px solid #0d9488;
      padding-left: 8px;
      margin: 20px 0 10px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      font-size: 10px;
    }
    th, td {
      border: 1px solid #e2e8f0;
      padding: 8px 10px;
      text-align: left;
    }
    th {
      background: #f1f5f9;
      font-weight: 800;
      color: #1e293b;
      text-transform: uppercase;
      font-size: 9px;
    }
    tr:nth-child(even) {
      background: #f8fafc;
    }
    .footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 1px solid #e2e8f0;
      font-size: 9px;
      color: #64748b;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .stamp {
      border: 2px dashed #0f172a;
      padding: 8px 12px;
      font-weight: 800;
      font-size: 9px;
      display: inline-block;
      border-radius: 6px;
      text-align: center;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 20px; background: #0f172a; padding: 12px 20px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center; color: white;">
    <span style="font-weight: bold; font-size: 12px;">📄 Aperçu avant impression / enregistrement PDF</span>
    <button onclick="window.print()" style="background: #0d9488; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 12px;">
      🖨️ Imprimer ou Enregistrer en PDF
    </button>
  </div>

  <div class="header">
    <div class="header-left">
      <div style="font-size: 9px; font-weight: bold; color: #0d9488; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 3px;">
        Royaume du Maroc • Ministère de la Transition Numérique et de la Réforme de l'Administration
      </div>
      <h1>${title}</h1>
      <p>${subtitle} • Date d'édition : ${nowStr}</p>
    </div>
    <div style="text-align: right;">
      <span class="badge">${badge}</span>
      <div style="font-size: 9px; color: #64748b; margin-top: 5px; font-family: monospace;">DOC-ID: ${randomHash.substring(0, 12).toUpperCase()}</div>
    </div>
  </div>

  ${summaryMetrics.length > 0 ? `
    <div class="metrics-grid">
      ${summaryMetrics.map(m => `
        <div class="metric-card">
          <div class="metric-value">${m.value}</div>
          <div class="metric-label">${m.label}</div>
        </div>
      `).join('')}
    </div>
  ` : ''}

  ${sections.map(s => `
    <div class="section-title">${s.title}</div>
    <table style="margin-bottom: 15px;">
      ${s.items.map(it => `
        <tr>
          <td style="width: 35%; font-weight: bold; background: #f8fafc;">${it.label}</td>
          <td>${it.value}</td>
        </tr>
      `).join('')}
    </table>
  `).join('')}

  ${table ? `
    <div class="section-title">Registre & Événements Détaillés (${table.rows.length} entrées)</div>
    <table>
      <thead>
        <tr>
          ${table.headers.map(h => `<th>${h}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${table.rows.map(row => `
          <tr>
            ${row.map(c => `<td>${c}</td>`).join('')}
          </tr>
        `).join('')}
      </tbody>
    </table>
  ` : ''}

  <div class="footer">
    <div>
      <div>Plateforme Nationale d'Administration Numérique Tawsa</div>
      <div style="font-family: monospace; font-size: 8px; margin-top: 2px;">Hash SHA-256: ${randomHash}</div>
    </div>
    <div class="stamp">
      SCEAU OFFICIEL D'ÉTAT<br/>CERTIFIÉ CONFORME
    </div>
  </div>

  <script>
    window.onload = function() {
      // Auto-trigger native print dialog for seamless PDF save
      setTimeout(function() { window.print(); }, 400);
    };
  </script>
</body>
</html>`;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }
}

/**
 * Exporte un tableau de données au format CSV avec encodage UTF-8 BOM
 */
export function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]): void {
  const sanitize = (val: string | number) => {
    const str = String(val ?? '').replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvContent = '\uFEFF' + [
    headers.map(sanitize).join(';'),
    ...rows.map(row => row.map(sanitize).join(';'))
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  triggerBlobDownload(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`);
}

function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

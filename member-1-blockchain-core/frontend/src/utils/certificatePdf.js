import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

/**
 * Generates a high-resolution QR code data URL from a string/URL.
 */
export async function generateQrCodeDataUrl(text) {
  return await QRCode.toDataURL(text, {
    errorCorrectionLevel: 'H',
    margin: 1,
    width: 256,
    color: {
      dark: '#0F172A',
      light: '#FFFFFF'
    }
  });
}

/**
 * Builds a professional jsPDF document for the academic/professional certificate.
 * Page format: A4 Landscape (297mm x 210mm).
 */
export function buildCertificatePdfDoc(data, qrDataUrl) {
  // A4 Landscape: width = 297, height = 210
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 297;
  const pageHeight = 210;

  // 1. Background tint
  doc.setFillColor(252, 253, 255);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // 2. Elegant double borders
  // Outer primary navy border
  doc.setDrawColor(15, 23, 42); // #0f172a
  doc.setLineWidth(1.5);
  doc.rect(8, 8, pageWidth - 16, pageHeight - 16);

  // Inner gold / accent border
  doc.setDrawColor(217, 119, 6); // Amber #d97706
  doc.setLineWidth(0.6);
  doc.rect(11, 11, pageWidth - 22, pageHeight - 22);

  // Corner decorative flourishes
  const cornerSize = 6;
  doc.setFillColor(217, 119, 6);
  // Top-left
  doc.rect(11, 11, cornerSize, cornerSize, 'F');
  // Top-right
  doc.rect(pageWidth - 11 - cornerSize, 11, cornerSize, cornerSize, 'F');
  // Bottom-left
  doc.rect(11, pageHeight - 11 - cornerSize, cornerSize, cornerSize, 'F');
  // Bottom-right
  doc.rect(pageWidth - 11 - cornerSize, pageHeight - 11 - cornerSize, cornerSize, cornerSize, 'F');

  // 3. Header Branding
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('CREDCHAIN', pageWidth / 2, 20, { align: 'center' });

  doc.setTextColor(100, 116, 139); // Slate 500
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('DECENTRALIZED DIGITAL CREDENTIAL TRUST PLATFORM', pageWidth / 2, 24, { align: 'center' });

  // 4. Certificate Title
  doc.setTextColor(180, 83, 9); // Amber 700
  doc.setFont('times', 'bold');
  doc.setFontSize(22);
  doc.text('CERTIFICATE OF ACHIEVEMENT', pageWidth / 2, 34, { align: 'center' });

  // 5. Institution Name
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  const instName = (data.institutionName || data.institutionId || 'Authorized Institution').toUpperCase();
  doc.text(instName, pageWidth / 2, 44, { align: 'center' });

  // 6. Presentation Line
  doc.setTextColor(71, 85, 105);
  doc.setFont('times', 'italic');
  doc.setFontSize(11);
  doc.text('This is to officially certify that', pageWidth / 2, 53, { align: 'center' });

  // 7. Student Name
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  const student = data.studentName || 'Student Name';
  doc.text(student, pageWidth / 2, 65, { align: 'center' });

  // Decorative underline under student name
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.8);
  const nameWidth = doc.getTextWidth(student);
  const lineStart = Math.max(30, (pageWidth - nameWidth - 20) / 2);
  const lineEnd = Math.min(pageWidth - 30, (pageWidth + nameWidth + 20) / 2);
  doc.line(lineStart, 68, lineEnd, 68);

  // 8. Purpose / Description
  doc.setTextColor(71, 85, 105);
  doc.setFont('times', 'italic');
  doc.setFontSize(11);
  doc.text('has successfully demonstrated competence and achieved completion in', pageWidth / 2, 75, { align: 'center' });

  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  const purpose = data.purpose || 'Blockchain Technology Course';
  doc.text(purpose, pageWidth / 2, 83, { align: 'center' });

  // 9. Core Metadata Line
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  const idText = `Certificate ID: ${data.certificateId || 'N/A'}`;
  const issueText = `Issue Date: ${data.issueDate || 'N/A'}`;
  const expiryText = `Expiry Date: ${data.expiryDate || 'Never'}`;
  doc.text(`${idText}     |     ${issueText}     |     ${expiryText}`, pageWidth / 2, 91, { align: 'center' });

  // 10. Blockchain Proof Panel (Lower Section)
  const proofBoxY = 97;
  const proofBoxHeight = 88;
  const proofBoxWidth = pageWidth - 32;

  // Background panel for blockchain proof
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.roundedRect(16, proofBoxY, proofBoxWidth, proofBoxHeight, 3, 3, 'FD');

  // Proof Title Bar
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(16, proofBoxY, proofBoxWidth, 7, 3, 3, 'F');
  // Square out bottom corners of title bar
  doc.rect(16, proofBoxY + 4, proofBoxWidth, 3, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('IMMUTABLE BLOCKCHAIN PROOF & CRYPTOGRAPHIC VERIFICATION', 20, proofBoxY + 5);

  // Status Badge in proof header
  doc.setFillColor(16, 185, 129); // Green badge
  doc.roundedRect(pageWidth - 58, proofBoxY + 1.2, 38, 4.6, 1.5, 1.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text('BLOCKCHAIN VERIFIED', pageWidth - 39, proofBoxY + 4.5, { align: 'center' });

  // Left Column: Cryptographic Proof details
  const labelX = 22;
  const valX = 58;
  let currY = proofBoxY + 13;
  const lineGap = 7;

  const renderField = (label, val, isMono = true) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(label, labelX, currY);

    if (isMono) {
      doc.setFont('courier', 'bold');
      doc.setFontSize(7.5);
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
    }
    doc.setTextColor(15, 23, 42);

    // Truncate or wrap if long
    const maxWidth = 160;
    const textStr = String(val || 'N/A');
    if (doc.getTextWidth(textStr) > maxWidth) {
      doc.setFontSize(6.5);
    }
    doc.text(textStr, valX, currY);
    currY += lineGap;
  };

  renderField('Certificate Hash:', data.certificateHash || data.hash);
  renderField('Transaction Hash:', data.transactionHash || data.txHash);
  renderField('Block Number:', data.blockNumber ? `#${data.blockNumber}` : 'N/A', false);
  renderField('Block Hash:', data.blockHash);
  renderField('Issuer Wallet:', data.issuerWallet || data.issuer);
  renderField('Network / Chain:', 'Hardhat Local (Chain ID: 31337)', false);
  renderField('Registry Contract:', '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512', true);
  renderField('Verification Facade:', '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0', true);

  // Right Column: High-Resolution QR Code & Verification Instructions
  const qrSize = 34;
  const qrX = pageWidth - 65;
  const qrY = proofBoxY + 12;

  if (qrDataUrl) {
    // QR Code Background border
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.4);
    doc.roundedRect(qrX - 2, qrY - 2, qrSize + 4, qrSize + 4, 2, 2, 'FD');

    doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
  }

  // QR Label & Instructions
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('PUBLIC QR VERIFICATION', qrX + (qrSize / 2), qrY + qrSize + 6, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Scan using any mobile device', qrX + (qrSize / 2), qrY + qrSize + 10, { align: 'center' });
  doc.text('or visit the CredChain portal to', qrX + (qrSize / 2), qrY + qrSize + 13.5, { align: 'center' });
  doc.text('instantaneously verify authenticity.', qrX + (qrSize / 2), qrY + qrSize + 17, { align: 'center' });

  // 11. Footer Notice
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('This digital credential is cryptographic proof anchored on the Ethereum Virtual Machine blockchain. Tampering invalidates the mathematical hash.', pageWidth / 2, pageHeight - 12, { align: 'center' });

  return doc;
}

/**
 * Downloads the generated certificate PDF directly to the user's computer.
 */
export function downloadCertificatePdf(data, qrDataUrl, filename) {
  const doc = buildCertificatePdfDoc(data, qrDataUrl);
  const safeFilename = filename || `${data.certificateId || 'credential'}_certificate.pdf`;
  doc.save(safeFilename);
}

/**
 * Returns a Blob URL for live inline PDF preview in an <iframe> or modal.
 */
export function getCertificatePdfBlobUrl(data, qrDataUrl) {
  const doc = buildCertificatePdfDoc(data, qrDataUrl);
  return doc.output('bloburl');
}

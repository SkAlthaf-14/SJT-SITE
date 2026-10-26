/**
 * SJT FARMS - STANDARDS-COMPLIANT QR CODE GENERATOR (ISO/IEC 18004)
 *
 * Built on maintained 'qrcode' engine with high error correction (Level H - ~30% recovery)
 * and guaranteed quiet zone margin.
 * Fully tested with independent jsQR decoder across mobile and desktop viewports.
 */

import QRCode from 'qrcode';

export interface QRCodeData {
  size: number;
  modules: boolean[][];
  svgPath: string;
  viewBox: string;
  margin: number;
  totalSize: number;
}

export interface QRGenerationOptions {
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  margin?: number;
}

/**
 * Validates whether the given text is a safe, non-empty UPI payment URI payload.
 */
export function validateUpiPayload(uri: string): { valid: boolean; reason?: string } {
  if (!uri || typeof uri !== 'string' || uri.trim().length === 0) {
    return { valid: false, reason: 'Empty payment payload' };
  }
  if (!uri.startsWith('upi://pay?')) {
    return { valid: false, reason: 'Payload must begin with upi://pay?' };
  }
  // Decode to handle both literal '@' and '%40' encoded VPAs
  const decoded = decodeURIComponent(uri);
  if (!uri.includes('pa=') || (!uri.includes('@') && !uri.includes('%40')) || !decoded.includes('@')) {
    return { valid: false, reason: 'Payload missing valid merchant VPA (pa parameter)' };
  }
  if (!uri.includes('am=')) {
    return { valid: false, reason: 'Payload missing order amount (am parameter)' };
  }
  if (!uri.includes('cu=INR')) {
    return { valid: false, reason: 'Payload currency must be INR (cu parameter)' };
  }
  return { valid: true };
}

/**
 * Standards-compliant QR Code generator using maintained ISO/IEC 18004 library.
 * Generates exact module matrix and SVG path with proper quiet zone margin and high error correction.
 */
export function generateQRCode(
  text: string,
  options: QRGenerationOptions = {}
): QRCodeData {
  const ecLevel = options.errorCorrectionLevel || 'H';
  const margin = typeof options.margin === 'number' ? Math.max(0, options.margin) : 4;

  const qr = QRCode.create(text, {
    errorCorrectionLevel: ecLevel,
  });

  const moduleCount = qr.modules.size;
  const modules: boolean[][] = [];
  let path = '';

  for (let r = 0; r < moduleCount; r++) {
    modules[r] = [];
    for (let c = 0; c < moduleCount; c++) {
      const isDark = Boolean(qr.modules.get(c, r));
      modules[r][c] = isDark;
      if (isDark) {
        // Shift by quiet zone margin so modules never touch container edges
        const x = c + margin;
        const y = r + margin;
        path += `M${x},${y}h1v1h-1z `;
      }
    }
  }

  const totalSize = moduleCount + margin * 2;

  return {
    size: moduleCount,
    modules,
    svgPath: path.trim(),
    viewBox: `0 0 ${totalSize} ${totalSize}`,
    margin,
    totalSize,
  };
}

/**
 * Generates high-resolution Data URL for PNG download or in-app gallery upload.
 */
export async function generateQRCodeDataUrl(
  text: string,
  width: number = 512
): Promise<string> {
  return QRCode.toDataURL(text, {
    width,
    margin: 4,
    errorCorrectionLevel: 'H',
    color: {
      dark: '#20150F',
      light: '#FFFFFF',
    },
  });
}

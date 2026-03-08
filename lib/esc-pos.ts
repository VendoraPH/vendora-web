/**
 * ESC/POS receipt formatter for POS-58 thermal printers.
 * Generates raw ESC/POS byte commands that can be sent to the printer device.
 */

const ESC = '\x1B';
const GS = '\x1D';

const CMD = {
  INIT: ESC + '@',           // Initialize printer
  CENTER: ESC + 'a\x01',    // Center alignment
  LEFT: ESC + 'a\x00',      // Left alignment
  BOLD_ON: ESC + 'E\x01',   // Emphasis on
  BOLD_OFF: ESC + 'E\x00',  // Emphasis off
  CUT: GS + 'V\x00',        // Full cut
  LF: '\x0A',               // Line feed
  KICK_DRAWER: ESC + 'p\x00\x19\xFA',  // Open cash drawer (pin 2, 50ms on, 500ms off)
};

// POS-58 normal font fits ~32 chars per line
const LINE_WIDTH = 32;

function pad(left: string, right: string, width = LINE_WIDTH): string {
  const gap = width - left.length - right.length;
  return left + ' '.repeat(Math.max(1, gap)) + right;
}

function dashes(width = LINE_WIDTH): string {
  return '-'.repeat(width);
}

function fmt(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export interface ReceiptPrintData {
  transactionNumber: string;
  date: string;
  customerName: string;
  items: Array<{ name: string; qty: number; price: number }>;
  subtotal: number;
  vatableSales: number;
  tax: number;
  total: number;
  paymentMethod: string;
  amountTendered: number;
  change: number;
  openDrawer?: boolean;
}

export function formatReceipt(data: ReceiptPrintData): string {
  let t = '';

  // Initialize
  t += CMD.INIT;

  // Header
  t += CMD.CENTER;
  t += CMD.BOLD_ON;
  t += 'VENDORA POS' + CMD.LF;
  t += CMD.BOLD_OFF;
  t += 'Point of Sale System' + CMD.LF;
  t += CMD.LEFT;
  t += dashes() + CMD.LF;

  // Transaction info
  t += pad('TXN:', data.transactionNumber) + CMD.LF;
  t += pad('Date:', data.date) + CMD.LF;
  t += pad('Customer:', data.customerName) + CMD.LF;
  t += pad('Cashier:', 'Staff') + CMD.LF;
  t += dashes() + CMD.LF;

  // Items
  for (const item of data.items) {
    t += CMD.BOLD_ON + item.name + CMD.BOLD_OFF + CMD.LF;
    t += pad(
      `${item.qty} x P${fmt(item.price)}`,
      `P${fmt(item.qty * item.price)}`
    ) + CMD.LF;
  }
  t += dashes() + CMD.LF;

  // Totals
  t += pad('Subtotal:', `P${fmt(data.subtotal)}`) + CMD.LF;
  t += pad('Vatable Sales:', `P${fmt(data.vatableSales)}`) + CMD.LF;
  t += pad('Tax (12% VAT):', `P${fmt(data.tax)}`) + CMD.LF;
  t += dashes() + CMD.LF;

  // Grand Total — bold only, same font size as everything else
  t += CMD.BOLD_ON;
  t += pad('TOTAL:', `P${fmt(data.total)}`) + CMD.LF;
  t += CMD.BOLD_OFF;
  t += dashes() + CMD.LF;

  // Payment
  t += pad(`Payment (${data.paymentMethod}):`, `P${fmt(data.amountTendered)}`) + CMD.LF;
  t += pad('Change:', `P${fmt(data.change)}`) + CMD.LF;
  t += dashes() + CMD.LF;

  // Footer
  t += CMD.CENTER;
  t += 'Thank you for your purchase!' + CMD.LF;
  t += 'Please come again' + CMD.LF;

  // Open cash drawer if requested (must be before cut — printer resets after cut)
  if (data.openDrawer) {
    t += CMD.KICK_DRAWER;
  }

  // Feed and cut
  t += CMD.LF + CMD.LF + CMD.LF;
  t += CMD.CUT;

  return t;
}

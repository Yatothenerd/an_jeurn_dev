// Plain (server-evaluable) helpers for the KHQR payment section. Must NOT be a
// "use client" module: it's imported by the Server Component `page.tsx`, and a
// function imported from a client module becomes an opaque client reference
// (not callable) on the server. Keeping it here lets both the server page and
// the client section component import a real function.

export interface KhqrQrItem {
  currency?: string;
  qrImageUrl?: string;
  recipientName?: string;
  amount?: string;
}

export interface KhqrContent {
  title?: string;
  hideTitle?: boolean;
  items?: KhqrQrItem[];
  // Legacy single-QR fields (pre add/drop list):
  recipientName?: string;
  amount?: string;
  currency?: string;
  qrImageUrl?: string;
}

/** Normalize legacy single-QR content and the new list into one array of QRs that have an image. */
export function khqrItems(content: KhqrContent): KhqrQrItem[] {
  if (content.items && content.items.length > 0) {
    return content.items.filter((i) => i.qrImageUrl);
  }
  if (content.qrImageUrl) {
    return [{ currency: content.currency, qrImageUrl: content.qrImageUrl, recipientName: content.recipientName, amount: content.amount }];
  }
  return [];
}

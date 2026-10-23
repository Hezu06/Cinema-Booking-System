export function getClientTicketUrl(bookingId: string): string {
  const resultUrl = process.env.CLIENT_PAYMENT_RESULT_URL;
  if (resultUrl) {
    try {
      const parsed = new URL(resultUrl);
      return `${parsed.origin}/ticket/${bookingId}`;
    } catch {
      // fallback to default
    }
  }
  const base = process.env.CLIENT_URL || (process.env.NODE_ENV === "production" ? "https://cbs-project8.vercel.app" : "http://localhost:5173");
  return `${base.replace(/\/$/, "")}/ticket/${bookingId}`;
}

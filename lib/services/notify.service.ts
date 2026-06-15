// All notification delivery goes through QStash so callers are never blocked.
// If QStash is not configured the call is a no-op (graceful degradation).

const SENDGRID_API = "https://api.sendgrid.com/v3/mail/send";

export class NotifyService {
  // Enqueue an email via Upstash QStash → our /api/notify/email handler
  static async enqueueEmail(to: string, subject: string, html: string): Promise<void> {
    const token = process.env.QSTASH_TOKEN;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!token || !appUrl) {
      // Fallback: send directly (only in dev where QStash is unavailable)
      await this.sendEmailDirect(to, subject, html).catch(console.error);
      return;
    }

    await fetch(`https://qstash.upstash.io/v2/publish/${appUrl}/api/notify/email`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "Upstash-Delay": "0s",
      },
      body: JSON.stringify({ to, subject, html }),
    }).catch(console.error);
  }

  // Direct SendGrid call — used as fallback or from QStash handler
  static async sendEmailDirect(to: string, subject: string, html: string): Promise<void> {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      console.warn("NotifyService: SENDGRID_API_KEY not set, skipping email");
      return;
    }

    const from = process.env.SENDGRID_FROM_EMAIL ?? "noreply@anjeurn.com";
    const res = await fetch(SENDGRID_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: from, name: "Anjeurn" },
        subject,
        content: [{ type: "text/html", value: html }],
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error("SendGrid error:", res.status, text);
    }
  }

  // Pre-built templates
  static async notifyRsvp(clientEmail: string, eventTitle: string, guestName: string, status: string): Promise<void> {
    await this.enqueueEmail(
      clientEmail,
      `New RSVP for ${eventTitle}`,
      `<p>Hi,</p><p><strong>${guestName}</strong> has responded <strong>${status}</strong> to your event <em>${eventTitle}</em>.</p><p>— Anjeurn</p>`
    );
  }

  static async notifyNewWish(clientEmail: string, eventTitle: string, guestName: string): Promise<void> {
    await this.enqueueEmail(
      clientEmail,
      `New wish for ${eventTitle}`,
      `<p><strong>${guestName}</strong> left a wish on your invitation for <em>${eventTitle}</em>.</p><p>— Anjeurn</p>`
    );
  }

  static async sendWelcomeEmail(to: string, name: string, email: string, password: string): Promise<void> {
    await this.enqueueEmail(
      to,
      "Welcome to Anjeurn — Your Account Details",
      `<p>Hello ${name},</p><p>Your Anjeurn account has been created.</p><p><strong>Email:</strong> ${email}<br><strong>Password:</strong> ${password}</p><p>Please change your password after first login.</p><p>— Anjeurn Team</p>`
    );
  }
}

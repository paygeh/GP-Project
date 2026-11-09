// Server-only by usage (imported solely from the "use server" booking action).
import { Resend } from "resend";
import {
  formatDateLong,
  formatTime,
  formatPrice,
  formatDuration,
} from "@/lib/format";

export type RequestEmailInput = {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  notes: string;
  startTime: Date;
  serviceName: string;
  priceCents: number;
  durationMinutes: number;
};

/**
 * Notify Lizzy of a new appointment request. Never throws — email problems must
 * not lose the request (it's always saved and visible in the admin dashboard).
 */
export async function sendAppointmentRequestEmail(
  b: RequestEmailInput,
): Promise<void> {
  const to = process.env.NOTIFY_EMAIL;
  const from = process.env.FROM_EMAIL ?? "Imagine That <onboarding@resend.dev>";
  const apiKey = process.env.RESEND_API_KEY;

  const subject = `New appointment request — ${b.customerName} (${b.serviceName})`;
  const text = [
    `New appointment request from ${b.customerName}.`,
    ``,
    `Service:  ${b.serviceName} (${formatDuration(b.durationMinutes)}, ${formatPrice(b.priceCents)})`,
    `When:     ${formatDateLong(b.startTime)} at ${formatTime(b.startTime)}`,
    `Name:     ${b.customerName}`,
    `Email:    ${b.customerEmail}`,
    `Phone:    ${b.customerPhone}`,
    b.notes ? `Notes:    ${b.notes}` : ``,
    ``,
    `Reach out to confirm, then approve or decline it in your dashboard.`,
  ]
    .filter((l) => l !== null)
    .join("\n");

  const html = `
  <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1b0f16">
    <div style="background:#16060f;padding:20px 24px;border-radius:12px 12px 0 0">
      <p style="margin:0;color:#ff3dab;letter-spacing:.2em;font-size:12px;text-transform:uppercase">New appointment request</p>
    </div>
    <div style="border:1px solid #f1dbe8;border-top:none;border-radius:0 0 12px 12px;padding:24px">
      <p style="margin:0 0 16px">You have a new request from <strong>${b.customerName}</strong>.</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        ${row("Service", `${b.serviceName} — ${formatDuration(b.durationMinutes)}, ${formatPrice(b.priceCents)}`)}
        ${row("When", `${formatDateLong(b.startTime)} at ${formatTime(b.startTime)}`)}
        ${row("Name", b.customerName)}
        ${row("Email", b.customerEmail)}
        ${row("Phone", b.customerPhone)}
        ${b.notes ? row("Notes", b.notes) : ""}
      </table>
      <p style="margin:20px 0 0;font-size:13px;color:#7c6670">
        Reach out to confirm, then approve or decline it in your dashboard.
      </p>
    </div>
  </div>`;

  // Dev / unconfigured fallback: log instead of sending.
  if (!apiKey || !to) {
    console.log(
      `\n[email] appointment request (not sent — ${
        !apiKey ? "RESEND_API_KEY" : "NOTIFY_EMAIL"
      } not set)\nTo: ${to ?? "(unset)"}\nSubject: ${subject}\n${text}\n`,
    );
    return;
  }

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from,
      to,
      subject,
      text,
      html,
      replyTo: b.customerEmail,
    });
  } catch (err) {
    console.error("[email] failed to send appointment request:", err);
  }
}

function row(label: string, value: string): string {
  return `<tr>
    <td style="padding:6px 0;color:#7c6670;width:90px;vertical-align:top">${label}</td>
    <td style="padding:6px 0;font-weight:600">${value}</td>
  </tr>`;
}

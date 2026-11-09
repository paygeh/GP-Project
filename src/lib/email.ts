// Email via Gmail SMTP (nodemailer). Server-only by usage (imported only from
// the "use server" booking action). Both senders are resilient: an email
// problem is logged but never fails the saved request.
import nodemailer, { type Transporter } from "nodemailer";
import {
  formatDateLong,
  formatTime,
  formatPrice,
  formatDuration,
} from "@/lib/format";

let transporter: Transporter | null = null;

/** Build (once) the Gmail transport, or null if credentials aren't set. */
function getTransport(): Transporter | null {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, ""); // strip spaces
  if (!user || !pass) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });
  }
  return transporter;
}

function fromAddress(): string {
  return (
    process.env.FROM_EMAIL ??
    `Imagine That <${process.env.GMAIL_USER ?? "no-reply@example.com"}>`
  );
}

export type RequestEmailInput = {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  notes: string;
  startTime: Date;
  serviceName: string;
  priceCents: number;
  depositCents: number;
  durationMinutes: number;
};

/** Notify Lizzy of a new appointment request. Never throws. */
export async function sendAppointmentRequestEmail(
  b: RequestEmailInput,
): Promise<void> {
  const to = process.env.NOTIFY_EMAIL;
  const transport = getTransport();

  const subject = `New appointment request — ${b.customerName} (${b.serviceName})`;
  const text = [
    `New appointment request from ${b.customerName}.`,
    ``,
    `Service:  ${b.serviceName} (${formatDuration(b.durationMinutes)}, ${formatPrice(b.priceCents)})`,
    b.depositCents > 0 ? `Deposit:  ${formatPrice(b.depositCents)}` : ``,
    `When:     ${formatDateLong(b.startTime)} at ${formatTime(b.startTime)}`,
    `Name:     ${b.customerName}`,
    `Email:    ${b.customerEmail}`,
    `Phone:    ${b.customerPhone}`,
    b.notes ? `Notes:    ${b.notes}` : ``,
    ``,
    `Reach out to confirm, then approve or decline it in your dashboard.`,
  ].join("\n");

  const html = `
  <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1b0f16">
    <div style="background:#16060f;padding:20px 24px;border-radius:12px 12px 0 0">
      <p style="margin:0;color:#ff3dab;letter-spacing:.2em;font-size:12px;text-transform:uppercase">New appointment request</p>
    </div>
    <div style="border:1px solid #f1dbe8;border-top:none;border-radius:0 0 12px 12px;padding:24px">
      <p style="margin:0 0 16px">You have a new request from <strong>${b.customerName}</strong>.</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        ${row("Service", `${b.serviceName} — ${formatDuration(b.durationMinutes)}, ${formatPrice(b.priceCents)}`)}
        ${b.depositCents > 0 ? row("Deposit", `${formatPrice(b.depositCents)} to book`) : ""}
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

  if (!transport || !to) {
    console.log(
      `\n[email] appointment request (not sent — ${
        !transport ? "GMAIL creds" : "NOTIFY_EMAIL"
      } not set)\nTo: ${to ?? "(unset)"}\nSubject: ${subject}\n${text}\n`,
    );
    return;
  }

  try {
    await transport.sendMail({
      from: fromAddress(),
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

export type ClientEmailInput = {
  customerName: string;
  customerEmail: string;
  startTime: Date;
  serviceName: string;
  priceCents: number;
  depositCents: number;
  durationMinutes: number;
  businessName: string;
  contactEmail: string;
  contactPhone: string;
};

/** Send the client a summary of their request plus how to reach Lizzy. Never throws. */
export async function sendClientSummaryEmail(
  b: ClientEmailInput,
): Promise<void> {
  const transport = getTransport();

  const contactBits = [
    b.contactEmail ? `email ${b.contactEmail}` : "",
    b.contactPhone ? `call or text ${b.contactPhone}` : "",
  ].filter(Boolean);
  const contactLine = contactBits.length
    ? `Questions or need to change something? ${contactBits.join(" or ")}.`
    : `Questions? Just reply to this email and Lizzy will help.`;

  const firstName = b.customerName.split(" ")[0];
  const subject = `Your appointment request — ${b.businessName}`;
  const text = [
    `Hi ${firstName},`,
    ``,
    `Thanks for your request! Lizzy will reach out to confirm. Here are the details:`,
    ``,
    `Service:  ${b.serviceName} (${formatDuration(b.durationMinutes)}, ${formatPrice(b.priceCents)})`,
    b.depositCents > 0 ? `Deposit:  ${formatPrice(b.depositCents)} to book` : ``,
    `When:     ${formatDateLong(b.startTime)} at ${formatTime(b.startTime)}`,
    ``,
    `This is a request, not a confirmed booking yet — Lizzy will contact you to finalize it.`,
    contactLine,
    ``,
    `— ${b.businessName}`,
  ].join("\n");

  const html = `
  <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1b0f16">
    <div style="background:#16060f;padding:22px 24px;border-radius:12px 12px 0 0;text-align:center">
      <p style="margin:0;color:#ff3dab;letter-spacing:.2em;font-size:12px;text-transform:uppercase">Request received</p>
      <p style="margin:6px 0 0;color:#fff;font-size:18px">${b.businessName}</p>
    </div>
    <div style="border:1px solid #f1dbe8;border-top:none;border-radius:0 0 12px 12px;padding:24px">
      <p style="margin:0 0 14px">Hi ${firstName}, thanks for your request! Here&apos;s a summary:</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        ${row("Service", `${b.serviceName} — ${formatDuration(b.durationMinutes)}, ${formatPrice(b.priceCents)}`)}
        ${b.depositCents > 0 ? row("Deposit", `${formatPrice(b.depositCents)} to book`) : ""}
        ${row("When", `${formatDateLong(b.startTime)} at ${formatTime(b.startTime)}`)}
      </table>
      <p style="margin:18px 0 0;padding:12px 14px;background:#fceaf3;border-radius:8px;font-size:13px">
        This is a <strong>request</strong>, not a confirmed booking yet — Lizzy will
        reach out to finalize your appointment.
      </p>
      <p style="margin:16px 0 0;font-size:13px;color:#7c6670">${contactLine}</p>
    </div>
  </div>`;

  if (!transport) {
    console.log(
      `\n[email] client summary (not sent — GMAIL creds not set)\nTo: ${b.customerEmail}\nSubject: ${subject}\n${text}\n`,
    );
    return;
  }

  try {
    await transport.sendMail({
      from: fromAddress(),
      to: b.customerEmail,
      subject,
      text,
      html,
      replyTo: b.contactEmail || process.env.NOTIFY_EMAIL || undefined,
    });
  } catch (err) {
    console.error("[email] failed to send client summary:", err);
  }
}

function row(label: string, value: string): string {
  return `<tr>
    <td style="padding:6px 0;color:#7c6670;width:90px;vertical-align:top">${label}</td>
    <td style="padding:6px 0;font-weight:600">${value}</td>
  </tr>`;
}

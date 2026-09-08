// @smartlot/edge-function send-activity-email
// Sends transactional emails (activity conduit, member invites, triage/status updates, comment alerts).
// Primary provider: Mailtrap (Sandbox testing or Sending API) with fallback to Resend API.

const MAILTRAP_SANDBOX_BASE = "https://sandbox.api.mailtrap.io/api/send";
const MAILTRAP_SEND_BASE = "https://send.api.mailtrap.io/api/send";
const RESEND_API_URL = "https://api.resend.com/emails";

const FROM_EMAIL = "notifications@smartlot.app";
const FROM_NAME = "SmartLot";

// ─── Types ────────────────────────────────────────────────────────────────────

export type EmailType = "activity_conduit" | "member_invite" | "status_update" | "comment_notification";

export interface ActivityEmailPayload {
  type?: "activity_conduit";
  referenceId: string; // e.g. "SL-12345"
  activityTitle: string;
  activityType: string;
  priority: string;
  location: string;
  buildingName: string;
  unit: string;
  description: string;
  requestorName: string;
  requestorEmail: string;
  managerEmail: string;
  attachmentUrls?: string[];
}

export interface MemberInvitePayload {
  type: "member_invite";
  toEmail: string;
  toName: string;
  role: string;
  schemeName: string;
  schemeId: string;
  lotNumber?: number | string;
  inviterName?: string;
  joinUrl?: string;
}

export interface StatusUpdatePayload {
  type: "status_update";
  toEmail: string;
  requestorName: string;
  referenceId: string;
  activityTitle: string;
  oldStatus: string;
  newStatus: string;
  reason?: string;
  actionType?: "approved" | "rejected" | "closed" | "in_progress" | "status_change";
}

export interface CommentNotificationPayload {
  type: "comment_notification";
  toEmail: string;
  recipientName: string;
  referenceId: string;
  activityTitle: string;
  commenterName: string;
  commenterRole: string;
  commentText: string;
}

export type AnyEmailPayload =
  | ActivityEmailPayload
  | MemberInvitePayload
  | StatusUpdatePayload
  | CommentNotificationPayload;

// ─── CORS headers ─────────────────────────────────────────────────────────────

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── HTML Email Builders ──────────────────────────────────────────────────────

function buildConduitEmailHtml(p: ActivityEmailPayload): string {
  const priorityColor: Record<string, string> = {
    Urgent: "#FF4757",
    High: "#FFB020",
    Normal: "#0055FF",
    Medium: "#0055FF",
    Low: "#64748B",
    Emergency: "#FF4757",
  };
  const pColor = priorityColor[p.priority] ?? "#64748B";

  const attachmentSection =
    p.attachmentUrls && p.attachmentUrls.length > 0
      ? `<p style="margin:0 0 12px"><strong style="color:#334155">Attachments:</strong><br/>${p.attachmentUrls
          .map((url) => `<a href="${url}" style="color:#0055FF">${url}</a>`)
          .join("<br/>")}</p>`
      : "";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>SmartLot Activity ${p.referenceId}</title>
</head>
<body style="margin:0;padding:0;background:#F4F6F9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F6F9;padding:40px 20px">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #E2E8F0;box-shadow:0 4px 12px rgba(0,0,0,0.05)">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0055FF 0%,#0040CC 100%);padding:32px 40px">
              <p style="margin:0 0 4px;color:rgba(255,255,255,0.75);font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase">SmartLot Activity Management</p>
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:800">New Activity: #${p.referenceId}</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:13px">${p.activityTitle}</p>
            </td>
          </tr>

          <!-- Meta row -->
          <tr>
            <td style="padding:24px 40px 0">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-right:8px">
                    <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:12px 16px">
                      <p style="margin:0 0 2px;color:#94A3B8;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px">Building</p>
                      <p style="margin:0;color:#0F172A;font-size:13px;font-weight:700">${p.buildingName}</p>
                    </div>
                  </td>
                  <td style="padding-right:8px">
                    <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:12px 16px">
                      <p style="margin:0 0 2px;color:#94A3B8;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px">Unit / Lot</p>
                      <p style="margin:0;color:#0F172A;font-size:13px;font-weight:700">${p.unit}</p>
                    </div>
                  </td>
                  <td>
                    <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:12px 16px">
                      <p style="margin:0 0 2px;color:#94A3B8;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px">Priority</p>
                      <p style="margin:0;font-size:13px;font-weight:800;color:${pColor}">${p.priority}</p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:24px 40px">
              <p style="margin:0 0 8px;color:#94A3B8;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px">Activity Type</p>
              <p style="margin:0 0 20px;color:#0F172A;font-size:14px;font-weight:600">${p.activityType} — ${p.location}</p>

              <p style="margin:0 0 8px;color:#94A3B8;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px">Description</p>
              <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:16px;margin-bottom:20px">
                <p style="margin:0;color:#334155;font-size:13px;line-height:1.6">${p.description.replace(/\n/g, "<br/>")}</p>
              </div>

              ${attachmentSection}

              <p style="margin:0 0 8px;color:#94A3B8;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px">Submitted by</p>
              <p style="margin:0 0 24px;color:#0F172A;font-size:13px;font-weight:600">${p.requestorName} &lt;${p.requestorEmail}&gt;</p>

              <!-- Reply CTA -->
              <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:12px;padding:20px;margin-bottom:24px">
                <p style="margin:0 0 8px;color:#1D4ED8;font-size:13px;font-weight:700">How to Respond</p>
                <p style="margin:0;color:#1E40AF;font-size:12px;line-height:1.6">
                  Simply <strong>Reply All</strong> to this email. Your response will be automatically captured and attached to activity <strong>#${p.referenceId}</strong> on SmartLot.
                  You do <em>not</em> need a SmartLot account to respond.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F8FAFC;border-top:1px solid #E2E8F0;padding:20px 40px">
              <p style="margin:0;color:#94A3B8;font-size:11px">
                This notification was sent by <strong style="color:#64748B">SmartLot Activity Management</strong>.
                Activity reference: <strong style="color:#64748B">#${p.referenceId}</strong>.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

function buildInviteEmailHtml(p: MemberInvitePayload): string {
  const inviter = p.inviterName || "Strata Administration";
  const lotInfo = p.lotNumber ? `Lot ${p.lotNumber}` : "Registered Lot";
  const joinLink = p.joinUrl || `https://smartlot.app/join?scheme=${encodeURIComponent(p.schemeId)}`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>You're invited to SmartLot: ${p.schemeName}</title>
</head>
<body style="margin:0;padding:0;background:#F4F6F9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F6F9;padding:40px 20px">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #E2E8F0;box-shadow:0 4px 12px rgba(0,0,0,0.05)">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0055FF 0%,#00D4B2 100%);padding:32px 40px">
              <p style="margin:0 0 4px;color:rgba(255,255,255,0.8);font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase">SmartLot Strata Onboarding</p>
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:800">You're invited to join ${p.schemeName}</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:13px">Plan ID: ${p.schemeId} • ${lotInfo}</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 40px">
              <p style="margin:0 0 16px;color:#0F172A;font-size:15px;font-weight:600">Hi ${p.toName},</p>
              <p style="margin:0 0 20px;color:#334155;font-size:14px;line-height:1.6">
                <strong>${inviter}</strong> has invited you to access <strong>${p.schemeName}</strong> on SmartLot as a <strong>${p.role}</strong>.
              </p>

              <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:20px;margin-bottom:24px">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding-bottom:8px">
                      <span style="color:#94A3B8;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px">Scheme / Site</span><br/>
                      <strong style="color:#0F172A;font-size:14px">${p.schemeName} (${p.schemeId})</strong>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-bottom:8px">
                      <span style="color:#94A3B8;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px">Assigned Lot / Unit</span><br/>
                      <strong style="color:#0F172A;font-size:14px">${lotInfo}</strong>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <span style="color:#94A3B8;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px">Access Role</span><br/>
                      <strong style="color:#0055FF;font-size:14px">${p.role}</strong>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Button CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
                <tr>
                  <td align="center">
                    <a href="${joinLink}" target="_blank" style="display:inline-block;background:#0055FF;color:#ffffff;font-size:14px;font-weight:700;padding:14px 32px;border-radius:12px;text-decoration:none;box-shadow:0 4px 12px rgba(0,85,255,0.25)">
                      Activate Your SmartLot Access &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;color:#64748B;font-size:12px;line-height:1.5">
                With SmartLot, you can submit maintenance requests, vote on scheme motions, access by-laws, and track compliance notices securely from any device.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F8FAFC;border-top:1px solid #E2E8F0;padding:20px 40px">
              <p style="margin:0;color:#94A3B8;font-size:11px">
                Sent by <strong style="color:#64748B">SmartLot Onboarding Engine</strong> for ${p.schemeName}.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

function buildStatusUpdateEmailHtml(p: StatusUpdatePayload): string {
  const statusLabel = p.newStatus.replace(/_/g, " ").toUpperCase();
  const isApproved = p.newStatus === "approved" || p.actionType === "approved";
  const isRejected = p.newStatus === "rejected" || p.actionType === "rejected";
  const isClosed = p.newStatus === "closed" || p.actionType === "closed";

  const bannerColor = isApproved
    ? "linear-gradient(135deg,#0055FF 0%,#00D4B2 100%)"
    : isRejected
    ? "linear-gradient(135deg,#FF4757 0%,#B3002D 100%)"
    : isClosed
    ? "linear-gradient(135deg,#10B981 0%,#059669 100%)"
    : "linear-gradient(135deg,#0055FF 0%,#0040CC 100%)";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Update on Activity #${p.referenceId}</title>
</head>
<body style="margin:0;padding:0;background:#F4F6F9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F6F9;padding:40px 20px">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #E2E8F0;box-shadow:0 4px 12px rgba(0,0,0,0.05)">

          <!-- Header -->
          <tr>
            <td style="background:${bannerColor};padding:32px 40px">
              <p style="margin:0 0 4px;color:rgba(255,255,255,0.8);font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase">Activity Status Update</p>
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:800">#${p.referenceId}: ${statusLabel}</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:13px">${p.activityTitle}</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 40px">
              <p style="margin:0 0 16px;color:#0F172A;font-size:15px;font-weight:600">Hi ${p.requestorName},</p>
              <p style="margin:0 0 20px;color:#334155;font-size:14px;line-height:1.6">
                Your activity <strong>#${p.referenceId}</strong> status has changed to <strong style="color:#0055FF">${statusLabel}</strong>.
              </p>

              ${
                p.reason
                  ? `
              <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:16px;margin-bottom:20px">
                <p style="margin:0 0 4px;color:#94A3B8;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px">Decision Note / Statutory Rationale</p>
                <p style="margin:0;color:#334155;font-size:13px;line-height:1.6">${p.reason.replace(/\n/g, "<br/>")}</p>
              </div>
              `
                  : ""
              }

              <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:12px;padding:16px;margin-bottom:24px">
                <p style="margin:0;color:#1E40AF;font-size:12px;line-height:1.5">
                  You can view full history, comments, and attachments directly on your SmartLot dashboard.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F8FAFC;border-top:1px solid #E2E8F0;padding:20px 40px">
              <p style="margin:0;color:#94A3B8;font-size:11px">
                Sent by <strong style="color:#64748B">SmartLot Activity Tracker</strong>.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

function buildCommentNotificationEmailHtml(p: CommentNotificationPayload): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>New comment on #${p.referenceId}</title>
</head>
<body style="margin:0;padding:0;background:#F4F6F9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F6F9;padding:40px 20px">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #E2E8F0;box-shadow:0 4px 12px rgba(0,0,0,0.05)">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0055FF 0%,#0040CC 100%);padding:32px 40px">
              <p style="margin:0 0 4px;color:rgba(255,255,255,0.75);font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase">SmartLot Message Notification</p>
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:800">New Message on #${p.referenceId}</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:13px">${p.activityTitle}</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 40px">
              <p style="margin:0 0 16px;color:#0F172A;font-size:15px;font-weight:600">Hi ${p.recipientName},</p>
              <p style="margin:0 0 12px;color:#64748B;font-size:13px">
                <strong>${p.commenterName}</strong> (${p.commenterRole}) posted an update:
              </p>

              <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-left:4px solid #0055FF;border-radius:8px;padding:16px;margin-bottom:24px">
                <p style="margin:0;color:#0F172A;font-size:13px;line-height:1.6">${p.commentText.replace(/\n/g, "<br/>")}</p>
              </div>

              <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:12px;padding:16px">
                <p style="margin:0;color:#1E40AF;font-size:12px;line-height:1.5">
                  Reply directly to this email or open your SmartLot portal to respond.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F8FAFC;border-top:1px solid #E2E8F0;padding:20px 40px">
              <p style="margin:0;color:#94A3B8;font-size:11px">
                SmartLot Activity Management • Reference: #${p.referenceId}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// ─── Main Deno Server ─────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  }

  let payload: AnyEmailPayload;

  try {
    payload = (await req.json()) as AnyEmailPayload;
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  }

  // Check providers: Mailtrap first, then Resend
  const mailtrapToken = Deno.env.get("MAILTRAP_API_TOKEN") || Deno.env.get("MAILTRAP_TOKEN");
  const mailtrapInboxId = Deno.env.get("MAILTRAP_INBOX_ID");
  const resendKey = Deno.env.get("RESEND_API_KEY");

  // Determine Email Type
  const emailType = (payload as any).type || "activity_conduit";

  let to: string[] = [];
  let cc: string[] | undefined = undefined;
  let replyTo: string | undefined = undefined;
  let subject = "";
  let html = "";
  let referenceId = "";

  if (emailType === "member_invite") {
    const p = payload as MemberInvitePayload;
    if (!p.toEmail || !p.schemeName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: toEmail, schemeName" }),
        { status: 422, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }
    to = [p.toEmail];
    subject = `[SmartLot] You are invited to join ${p.schemeName}`;
    html = buildInviteEmailHtml(p);
    referenceId = p.schemeId;
  } else if (emailType === "status_update") {
    const p = payload as StatusUpdatePayload;
    if (!p.toEmail || !p.referenceId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: toEmail, referenceId" }),
        { status: 422, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }
    to = [p.toEmail];
    subject = `[SmartLot #${p.referenceId}] Status Updated: ${p.newStatus.replace(/_/g, " ").toUpperCase()}`;
    html = buildStatusUpdateEmailHtml(p);
    referenceId = p.referenceId;
    replyTo = `requests+${p.referenceId.replace("#", "")}@mail.smartlot.app`;
  } else if (emailType === "comment_notification") {
    const p = payload as CommentNotificationPayload;
    if (!p.toEmail || !p.referenceId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: toEmail, referenceId" }),
        { status: 422, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }
    to = [p.toEmail];
    subject = `[SmartLot #${p.referenceId}] New message from ${p.commenterName}`;
    html = buildCommentNotificationEmailHtml(p);
    referenceId = p.referenceId;
    replyTo = `requests+${p.referenceId.replace("#", "")}@mail.smartlot.app`;
  } else {
    // Default / activity_conduit
    const p = payload as ActivityEmailPayload;
    if (!p.referenceId || !p.activityTitle || !p.managerEmail || !p.requestorEmail) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: referenceId, activityTitle, managerEmail, requestorEmail" }),
        { status: 422, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }
    to = [p.managerEmail];
    cc = [p.requestorEmail];
    subject = `[SmartLot #${p.referenceId}] ${p.activityTitle}`;
    replyTo = `requests+${p.referenceId.replace("#", "")}@mail.smartlot.app`;
    html = buildConduitEmailHtml(p);
    referenceId = p.referenceId;
  }

  // 1. Dispatch via Mailtrap if token is configured
  if (mailtrapToken) {
    const endpoint = mailtrapInboxId
      ? `${MAILTRAP_SANDBOX_BASE}/${mailtrapInboxId}`
      : MAILTRAP_SEND_BASE;

    const mailtrapBody: Record<string, any> = {
      from: { email: FROM_EMAIL, name: FROM_NAME },
      to: to.map(email => ({ email })),
      subject,
      html,
      category: `smartlot-${emailType}`,
    };

    if (cc && cc.length > 0) {
      mailtrapBody.cc = cc.map(email => ({ email }));
    }
    if (replyTo) {
      mailtrapBody.headers = { "Reply-To": replyTo };
    }

    try {
      const mtRes = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${mailtrapToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(mailtrapBody),
      });

      const mtData = await mtRes.json().catch(() => ({}));
      if (!mtRes.ok) {
        console.error("[send-activity-email] Mailtrap error:", mtData);
        return new Response(
          JSON.stringify({ success: false, provider: "mailtrap", error: mtData?.errors ?? mtData?.message }),
          { status: 502, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
        );
      }

      console.log(`[send-activity-email] 📬 Dispatched via Mailtrap to ${to.join(", ")}`);
      return new Response(
        JSON.stringify({ success: true, provider: "mailtrap", messageIds: mtData?.message_ids ?? [mtData?.id] }),
        { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    } catch (err: any) {
      console.error("[send-activity-email] Mailtrap network error:", err?.message ?? err);
      return new Response(
        JSON.stringify({ success: false, error: err?.message }),
        { status: 503, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }
  }

  // 2. Fallback to Resend if configured
  if (resendKey) {
    const emailBody: Record<string, any> = {
      from: "SmartLot <onboarding@resend.dev>",
      to,
      subject,
      html,
      tags: [
        { name: "type", value: emailType },
        { name: "reference_id", value: referenceId },
      ],
    };

    if (cc && cc.length > 0) emailBody.cc = cc;
    if (replyTo) emailBody.reply_to = replyTo;

    try {
      const resendRes = await fetch(RESEND_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailBody),
      });

      const resendData = await resendRes.json().catch(() => ({}));
      if (!resendRes.ok) {
        console.error("[send-activity-email] Resend error:", resendData);
        return new Response(
          JSON.stringify({ success: false, provider: "resend", error: resendData?.message }),
          { status: 502, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
        );
      }

      console.log(`[send-activity-email] ✅ Dispatched via Resend to ${to.join(", ")}`);
      return new Response(
        JSON.stringify({ success: true, provider: "resend", resendId: resendData?.id }),
        { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    } catch (fetchErr: any) {
      console.error("[send-activity-email] Fetch failed:", fetchErr?.message ?? fetchErr);
      return new Response(
        JSON.stringify({ success: false, error: fetchErr?.message }),
        { status: 503, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }
  }

  // 3. Fallback: Clean simulation mode (logs payload without erroring)
  console.log(`[send-activity-email] ✉️ [Sandbox Simulation] ${emailType} email dispatched to: ${to.join(", ")} | Subject: ${subject}`);
  return new Response(
    JSON.stringify({
      success: true,
      simulated: true,
      type: emailType,
      to,
      subject,
      message: "Email logged in sandbox testing mode. To receive in Mailtrap, set MAILTRAP_API_TOKEN in .env",
    }),
    { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
  );
});

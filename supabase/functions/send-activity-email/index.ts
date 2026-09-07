// @smartlot/edge-function send-activity-email
// Sends the conduit email to the strata manager (CC resident) via Resend API.
// Called from the client immediately after a resident_request is inserted.
// Uses Resend sandbox mode until mail.smartlot.app domain is verified.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// ─── Constants ────────────────────────────────────────────────────────────────

const RESEND_API_URL = "https://api.resend.com/emails";

// Sandbox from-address — no domain verification needed.
// Replace with noreply@mail.smartlot.app once DNS is configured.
const FROM_ADDRESS = "SmartLot <onboarding@resend.dev>";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ActivityEmailPayload {
  referenceId: string;          // e.g. "SL-12345"
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

// ─── CORS headers ─────────────────────────────────────────────────────────────

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── Email HTML builder ───────────────────────────────────────────────────────

function buildEmailHtml(p: ActivityEmailPayload): string {
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
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #E2E8F0">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0055FF 0%,#0040CC 100%);padding:32px 40px">
              <p style="margin:0 0 4px;color:rgba(255,255,255,0.7);font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase">SmartLot Activity Management</p>
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:800">New Activity: #${p.referenceId}</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:13px">${p.activityTitle}</p>
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
                Reply-To is configured to capture your response automatically.
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

// ─── Main handler ─────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  }

  let payload: ActivityEmailPayload;

  try {
    payload = await req.json() as ActivityEmailPayload;
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  }

  const { referenceId, activityTitle, managerEmail, requestorEmail, requestorName } = payload;

  if (!referenceId || !activityTitle || !managerEmail || !requestorEmail) {
    return new Response(
      JSON.stringify({ error: "Missing required fields: referenceId, activityTitle, managerEmail, requestorEmail" }),
      { status: 422, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  }

  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) {
    return new Response(
      JSON.stringify({ error: "RESEND_API_KEY not configured" }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  }

  const subject = `[SmartLot #${referenceId}] ${activityTitle}`;
  const replyTo = `requests+${referenceId}@mail.smartlot.app`;

  const emailBody = {
    from: FROM_ADDRESS,
    to: [managerEmail],
    cc: [requestorEmail],
    reply_to: replyTo,
    subject,
    html: buildEmailHtml(payload),
    tags: [
      { name: "reference_id", value: referenceId },
      { name: "source", value: "smartlot-activity" },
    ],
  };

  let resendData: any = null;
  let resendError: string | null = null;

  try {
    const resendRes = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailBody),
    });

    resendData = await resendRes.json();

    if (!resendRes.ok) {
      resendError = resendData?.message ?? `Resend responded ${resendRes.status}`;
      console.error("[send-activity-email] Resend error:", resendError, resendData);
      // Return partial success — the activity was still created, just email failed
      return new Response(
        JSON.stringify({ success: false, error: resendError, resendData }),
        { status: 502, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
      );
    }
  } catch (fetchErr) {
    const msg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
    console.error("[send-activity-email] Fetch failed:", msg);
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 503, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
    );
  }

  console.log(
    `[send-activity-email] ✅ Email dispatched for #${referenceId} → ${managerEmail} (CC: ${requestorName} <${requestorEmail}>). Resend ID: ${resendData?.id}`,
  );

  return new Response(
    JSON.stringify({ success: true, resendId: resendData?.id }),
    { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } },
  );
});

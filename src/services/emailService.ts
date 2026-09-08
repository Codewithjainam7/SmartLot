// @smartlot/services emailService
// Client service to trigger transactional emails via Mailtrap (Sandbox testing) & Supabase Edge Functions.

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Direct client-side Mailtrap testing configuration (optional, for rapid local sandbox testing)
const mailtrapApiToken = (import.meta.env.VITE_MAILTRAP_API_TOKEN || import.meta.env.MAILTRAP_API_TOKEN) as string | undefined;
const mailtrapInboxId = (import.meta.env.VITE_MAILTRAP_INBOX_ID || import.meta.env.MAILTRAP_INBOX_ID) as string | undefined;

export interface ActivityEmailPayload {
  referenceId: string;
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
  toEmail: string;
  recipientName: string;
  referenceId: string;
  activityTitle: string;
  commenterName: string;
  commenterRole: string;
  commentText: string;
}

function buildHtmlForType(body: Record<string, any>): { subject: string; html: string } {
  const type = body.type || 'activity_conduit';

  if (type === 'member_invite') {
    const schemeName = body.schemeName || 'SmartLot Scheme';
    const role = body.role || 'Resident';
    const lotNumber = body.lotNumber ? `Lot ${body.lotNumber}` : 'Assigned Lot';
    const joinUrl = body.joinUrl || `https://smartlot.app/join?scheme=${encodeURIComponent(body.schemeId || 'SP101')}`;
    const inviter = body.inviterName || 'Strata Administration';

    return {
      subject: `[SmartLot] You are invited to join ${schemeName}`,
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;padding:30px;background:#F4F6F9">
          <div style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #E2E8F0;max-width:600px;margin:0 auto;box-shadow:0 4px 12px rgba(0,0,0,0.05)">
            <div style="background:linear-gradient(135deg,#0055FF 0%,#00D4B2 100%);padding:28px 36px">
              <p style="margin:0 0 4px;color:rgba(255,255,255,0.8);font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase">SmartLot Strata Onboarding</p>
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:800">You're invited to join ${schemeName}</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.9);font-size:13px">${lotNumber} • Plan: ${body.schemeId || 'SP101'}</p>
            </div>
            <div style="padding:28px 36px">
              <p style="margin:0 0 16px;color:#0F172A;font-size:14px;font-weight:600">Hi ${body.toName || 'Resident'},</p>
              <p style="margin:0 0 20px;color:#334155;font-size:13px;line-height:1.6">
                <strong>${inviter}</strong> has invited you to access <strong>${schemeName}</strong> as a <strong>${role}</strong>.
              </p>
              <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:16px;margin-bottom:24px">
                <p style="margin:0 0 6px;color:#64748B;font-size:12px"><strong>Role:</strong> <span style="color:#0055FF;font-weight:700">${role}</span></p>
                <p style="margin:0;color:#64748B;font-size:12px"><strong>Lot / Unit:</strong> ${lotNumber}</p>
              </div>
              <div style="text-align:center;margin-bottom:24px">
                <a href="${joinUrl}" target="_blank" style="display:inline-block;background:#0055FF;color:#ffffff;font-size:13px;font-weight:700;padding:12px 28px;border-radius:10px;text-decoration:none">
                  Activate SmartLot Access &rarr;
                </a>
              </div>
              <p style="margin:0;color:#94A3B8;font-size:11px;border-top:1px solid #E2E8F0;padding-top:16px">SmartLot Automated Onboarding Engine</p>
            </div>
          </div>
        </div>
      `,
    };
  }

  if (type === 'status_update') {
    const ref = body.referenceId || 'N/A';
    const status = (body.newStatus || 'UPDATED').replace(/_/g, ' ').toUpperCase();
    return {
      subject: `[SmartLot #${ref}] Status Updated: ${status}`,
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;padding:30px;background:#F4F6F9">
          <div style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #E2E8F0;max-width:600px;margin:0 auto;box-shadow:0 4px 12px rgba(0,0,0,0.05)">
            <div style="background:linear-gradient(135deg,#0055FF 0%,#0040CC 100%);padding:28px 36px">
              <p style="margin:0 0 4px;color:rgba(255,255,255,0.75);font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase">Activity Status Update</p>
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:800">#${ref}: ${status}</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px">${body.activityTitle || 'Activity Notice'}</p>
            </div>
            <div style="padding:28px 36px">
              <p style="margin:0 0 14px;color:#0F172A;font-size:14px;font-weight:600">Hi ${body.requestorName || 'Resident'},</p>
              <p style="margin:0 0 16px;color:#334155;font-size:13px;line-height:1.6">
                Your activity <strong>#${ref}</strong> status has been updated to <strong style="color:#0055FF">${status}</strong>.
              </p>
              ${body.reason ? `
                <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:14px;margin-bottom:20px">
                  <p style="margin:0 0 4px;color:#94A3B8;font-size:10px;font-weight:700;text-transform:uppercase">Statutory Rationale / Note</p>
                  <p style="margin:0;color:#334155;font-size:13px">${body.reason}</p>
                </div>
              ` : ''}
              <p style="margin:0;color:#94A3B8;font-size:11px;border-top:1px solid #E2E8F0;padding-top:16px">SmartLot Activity Tracker</p>
            </div>
          </div>
        </div>
      `,
    };
  }

  if (type === 'comment_notification') {
    const ref = body.referenceId || 'N/A';
    return {
      subject: `[SmartLot #${ref}] New message from ${body.commenterName || 'Participant'}`,
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;padding:30px;background:#F4F6F9">
          <div style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #E2E8F0;max-width:600px;margin:0 auto;box-shadow:0 4px 12px rgba(0,0,0,0.05)">
            <div style="background:linear-gradient(135deg,#0055FF 0%,#0040CC 100%);padding:28px 36px">
              <p style="margin:0 0 4px;color:rgba(255,255,255,0.75);font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase">SmartLot Message</p>
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:800">New Message on #${ref}</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px">${body.activityTitle || ''}</p>
            </div>
            <div style="padding:28px 36px">
              <p style="margin:0 0 14px;color:#0F172A;font-size:14px;font-weight:600">Hi ${body.recipientName || 'Member'},</p>
              <p style="margin:0 0 10px;color:#64748B;font-size:12px"><strong>${body.commenterName}</strong> (${body.commenterRole || 'Member'}) posted:</p>
              <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-left:4px solid #0055FF;border-radius:8px;padding:14px;margin-bottom:20px">
                <p style="margin:0;color:#0F172A;font-size:13px;line-height:1.5">${(body.commentText || '').replace(/\n/g, '<br/>')}</p>
              </div>
              <p style="margin:0;color:#94A3B8;font-size:11px;border-top:1px solid #E2E8F0;padding-top:16px">SmartLot Activity Management</p>
            </div>
          </div>
        </div>
      `,
    };
  }

  // Default: Conduit email
  const ref = body.referenceId || 'N/A';
  return {
    subject: `[SmartLot #${ref}] ${body.activityTitle || 'New Request'}`,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;padding:30px;background:#F4F6F9">
        <div style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #E2E8F0;max-width:600px;margin:0 auto;box-shadow:0 4px 12px rgba(0,0,0,0.05)">
          <div style="background:linear-gradient(135deg,#0055FF 0%,#0040CC 100%);padding:28px 36px">
            <p style="margin:0 0 4px;color:rgba(255,255,255,0.75);font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase">SmartLot Activity Management</p>
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:800">New Activity: #${ref}</h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px">${body.activityTitle || ''}</p>
          </div>
          <div style="padding:28px 36px">
            <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:14px;margin-bottom:16px">
              <p style="margin:0 0 4px;color:#64748B;font-size:12px"><strong>Building:</strong> ${body.buildingName || 'N/A'} • <strong>Unit:</strong> ${body.unit || 'N/A'}</p>
              <p style="margin:0;color:#64748B;font-size:12px"><strong>Priority:</strong> <span style="color:#FF4757;font-weight:700">${body.priority || 'Normal'}</span> • <strong>Type:</strong> ${body.activityType || 'General'}</p>
            </div>
            <p style="margin:0 0 6px;color:#94A3B8;font-size:10px;font-weight:700;text-transform:uppercase">Description</p>
            <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:14px;margin-bottom:20px">
              <p style="margin:0;color:#334155;font-size:13px;line-height:1.6">${(body.description || '').replace(/\n/g, '<br/>')}</p>
            </div>
            <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:10px;padding:14px;margin-bottom:20px">
              <p style="margin:0 0 4px;color:#1D4ED8;font-size:12px;font-weight:700">How to Respond</p>
              <p style="margin:0;color:#1E40AF;font-size:12px;line-height:1.5">Reply All to this email. Your response will be automatically attached to activity #${ref}.</p>
            </div>
            <p style="margin:0;color:#94A3B8;font-size:11px;border-top:1px solid #E2E8F0;padding-top:16px">Submitted by ${body.requestorName || 'Resident'} &lt;${body.requestorEmail || ''}&gt;</p>
          </div>
        </div>
      </div>
    `,
  };
}

/**
 * Sends directly to Mailtrap Sandbox API from client if token is present in .env
 */
async function sendDirectToMailtrap(body: Record<string, any>): Promise<{ success: boolean; simulated?: boolean; provider?: string } | null> {
  if (!mailtrapApiToken) return null;

  try {
    const endpoint = mailtrapInboxId
      ? `https://sandbox.api.mailtrap.io/api/send/${mailtrapInboxId}`
      : `https://send.api.mailtrap.io/api/send`;

    const toEmail = body.toEmail || body.managerEmail;
    if (!toEmail) return null;

    const toList = [{ email: toEmail, name: body.toName || body.requestorName || 'Recipient' }];
    const ccList = body.requestorEmail && body.managerEmail ? [{ email: body.requestorEmail }] : undefined;
    const { subject, html } = buildHtmlForType(body);

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mailtrapApiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: { email: 'notifications@smartlot.app', name: 'SmartLot' },
        to: toList,
        cc: ccList,
        headers: body.referenceId ? { 'Reply-To': `requests+${String(body.referenceId).replace('#', '')}@mail.smartlot.app` } : undefined,
        subject,
        html,
        category: `smartlot-${body.type || 'general'}`,
      }),
    });

    if (res.ok) {
      console.log(`[SmartLot Email] 📬 Direct Mailtrap dispatch successful to ${toEmail}`);
      return { success: true, provider: 'mailtrap_direct' };
    }
    return null;
  } catch (err) {
    console.warn('[SmartLot Email] Direct Mailtrap dispatch notice:', err);
    return null;
  }
}

async function sendViaEdgeFunction(body: Record<string, any>): Promise<{ success: boolean; simulated?: boolean; error?: string; provider?: string }> {
  // 1. Try direct Mailtrap dispatch if configured in Vite .env
  const directResult = await sendDirectToMailtrap(body);
  if (directResult?.success) {
    return directResult;
  }

  // 2. Dispatch via Supabase Edge function
  if (!supabaseUrl || !anonKey) {
    console.log(`[SmartLot Email] ✉️ [Sandbox Simulation] ${body.type || 'activity_conduit'} to:`, body.toEmail || body.managerEmail);
    return { success: true, simulated: true };
  }

  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/send-activity-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${anonKey}`,
        'apikey': anonKey,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.warn(`[SmartLot Email] Edge function responded ${res.status}:`, data);
      return { success: false, error: data?.error || `HTTP ${res.status}` };
    }

    if (data.simulated) {
      console.log(`[SmartLot Email] ✉️ [Sandbox Simulation]: ${body.type || 'activity_conduit'} → ${data.to?.join(', ') || 'recipient'}`);
    } else {
      console.log(`[SmartLot Email] 📬 Dispatched via ${data.provider || 'email provider'}:`, data);
    }

    return { success: true, simulated: Boolean(data.simulated), provider: data.provider };
  } catch (err: any) {
    console.warn('[SmartLot Email] Network notice during email dispatch:', err?.message ?? err);
    return { success: false, error: err?.message };
  }
}

/**
 * Dispatches the Story 1 conduit email to the Strata Manager with CC to Resident.
 */
export async function dispatchActivityConduitEmail(payload: ActivityEmailPayload) {
  return sendViaEdgeFunction({
    type: 'activity_conduit',
    ...payload,
  });
}

/**
 * Dispatches an onboarding invitation email to a newly assigned occupant/owner on a scheme.
 */
export async function dispatchMemberInviteEmail(payload: MemberInvitePayload) {
  return sendViaEdgeFunction({
    type: 'member_invite',
    ...payload,
  });
}

/**
 * Dispatches a status / triage update notification email to the resident.
 */
export async function dispatchStatusUpdateEmail(payload: StatusUpdatePayload) {
  return sendViaEdgeFunction({
    type: 'status_update',
    ...payload,
  });
}

/**
 * Dispatches a comment alert email when a new message is posted to a ticket thread.
 */
export async function dispatchCommentNotificationEmail(payload: CommentNotificationPayload) {
  return sendViaEdgeFunction({
    type: 'comment_notification',
    ...payload,
  });
}

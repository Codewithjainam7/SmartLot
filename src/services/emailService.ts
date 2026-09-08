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
        subject: body.activityTitle ? `[SmartLot #${body.referenceId || ''}] ${body.activityTitle}` : `[SmartLot] Notification`,
        html: `<div style="font-family:sans-serif;padding:20px;background:#F4F6F9">
          <div style="background:#fff;border-radius:12px;padding:24px;border:1px solid #E2E8F0">
            <h2 style="color:#0055FF;margin-top:0">SmartLot Notification</h2>
            <p><strong>Type:</strong> ${body.type || 'Notification'}</p>
            <p><strong>Reference:</strong> #${body.referenceId || body.schemeId || 'N/A'}</p>
            <p>${body.description || body.reason || body.commentText || 'SmartLot automated notification'}</p>
          </div>
        </div>`,
        category: `smartlot-${body.type || 'general'}`,
      }),
    });

    if (res.ok) {
      console.log(`[SmartLot Email] 📬 Direct Mailtrap dispatch successful to ${toEmail}`);
      return { success: true, provider: 'mailtrap_direct' };
    }
    return null;
  } catch (err) {
    console.warn('[SmartLot Email] Direct Mailtrap dispatch failed, falling back to Edge Function:', err);
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

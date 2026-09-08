// @smartlot/services emailService
// Client service to trigger transactional emails via Supabase Edge Functions with Resend.

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

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

async function sendViaEdgeFunction(body: Record<string, any>): Promise<{ success: boolean; simulated?: boolean; error?: string }> {
  if (!supabaseUrl || !anonKey) {
    console.warn('[SmartLot Email] Supabase URL or Anon Key missing in environment.');
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
      console.log(`[SmartLot Email] ✉️ Simulated dispatch: ${body.type || 'activity_conduit'} → ${data.to?.join(', ') || 'recipient'}`);
    } else {
      console.log(`[SmartLot Email] ✅ Email dispatched via Resend: ${data.resendId}`);
    }

    return { success: true, simulated: Boolean(data.simulated) };
  } catch (err: any) {
    console.warn('[SmartLot Email] Network error calling edge function:', err?.message ?? err);
    // Non-fatal — we return graceful fallback
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

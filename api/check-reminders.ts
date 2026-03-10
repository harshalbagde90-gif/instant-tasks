import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// GET /api/check-reminders?secret=YOUR_CRON_SECRET
// Called by cron-job.org every minute to dispatch due reminders.

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // 🔐 Verify cron secret so random callers can't trigger spam
    const secret = req.query.secret || req.headers['x-cron-secret'];
    if (secret !== process.env.CRON_SECRET) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
        return res.status(500).json({ error: 'Supabase not configured' });
    }

    // Use service role key to bypass RLS (backend only!)
    const supabase = createClient(supabaseUrl, serviceKey);

    // Find tasks due within a 2-minute lookback window (safe buffer for 1-min cron)
    // reminder_sent flag ensures no duplicate emails even if window overlaps
    const now   = new Date();
    const end   = new Date(now);
    const start = new Date(now.getTime() - 2 * 60 * 1000); // 2-min buffer

    // NOTE:
    // Some deployments may have `tasks.reminder` as TEXT instead of timestamptz.
    // Filtering by gte/lt directly in SQL can fail in that case due to lexical comparison.
    // We fetch eligible reminders and perform robust date filtering in JS.
    const { data: candidateTasks, error } = await supabase
        .from('tasks')
        .select('id, title, reminder, reminder_email, email_reminder_enabled, reminder_sent, user_id')
        .eq('email_reminder_enabled', true)
        .eq('reminder_sent', false)
        .not('reminder', 'is', null);

    if (error) {
        console.error('Supabase query error:', error);
        return res.status(500).json({ error: error.message });
    }

    const dueTasks = (candidateTasks || []).filter((task) => {
        if (!task.reminder) return false;
        const parsed = new Date(task.reminder as string);
        if (Number.isNaN(parsed.getTime())) return false;
        return parsed >= start && parsed < end;
    });

    if (!dueTasks || dueTasks.length === 0) {
        return res.status(200).json({ dispatched: 0, message: 'No reminders due.' });
    }

    // Always prefer the current request origin so internal API calls stay on the same host
    // (e.g. custom domain) and avoid deployment/protection mismatches on *.vercel.app URLs.
    const forwardedProtoHeader = req.headers['x-forwarded-proto'];
    const forwardedHostHeader = req.headers['x-forwarded-host'];
    const proto = typeof forwardedProtoHeader === 'string'
        ? forwardedProtoHeader.split(',')[0].trim()
        : 'https';
    const host = typeof forwardedHostHeader === 'string'
        ? forwardedHostHeader.split(',')[0].trim()
        : req.headers.host;

    const requestOrigin = host ? `${proto}://${host}` : null;
    const fallbackOrigin = process.env.PUBLIC_APP_URL || 'https://tangytask.com';
    const baseUrl = requestOrigin || fallbackOrigin;

    const results: { id: string; status: string }[] = [];

    for (const task of dueTasks) {
        const email = task.reminder_email;
        if (!email) {
            results.push({ id: task.id, status: 'skipped – no email' });
            continue;
        }

        try {
            // Call the send-reminder endpoint (same deployment)
            const sendRes = await fetch(`${baseUrl}/api/send-reminder`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: email,
                    taskTitle: task.title,
                    reminderTime: task.reminder,
                    taskId: task.id,
                }),
            });

            if (sendRes.ok) {
                // Mark reminder as sent so it doesn't fire again
                await supabase
                    .from('tasks')
                    .update({ reminder_sent: true })
                    .eq('id', task.id);
                results.push({ id: task.id, status: 'sent' });
            } else {
                const rawBody = await sendRes.text().catch(() => '');
                let parsedBody: any = null;
                try {
                    parsedBody = rawBody ? JSON.parse(rawBody) : null;
                } catch {
                    parsedBody = null;
                }

                const reason =
                    parsedBody?.error ||
                    parsedBody?.message ||
                    (rawBody ? rawBody.slice(0, 180) : '') ||
                    `HTTP ${sendRes.status}`;

                results.push({ id: task.id, status: `send-failed: ${sendRes.status} ${reason}` });
            }
        } catch (err: any) {
            results.push({ id: task.id, status: `error: ${err.message}` });
        }
    }

    const sentCount = results.filter((r) => r.status === 'sent').length;
    console.log('Reminder dispatch results:', results);
    return res.status(200).json({ dispatched: sentCount, processed: results.length, results });
}

import type { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';

type ReminderSubtask = {
    text?: string;
    completed?: boolean;
};

type ReminderPayload = {
    to: string;
    taskTitle: string;
    reminderTime?: string;
    taskId: string;
    category?: string;
    priority?: string;
    notes?: string;
    subtasks?: ReminderSubtask[];
};

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function buildNotesSection(notes?: string) {
    if (!notes?.trim()) return '';
    const compact = notes.trim().replace(/\s+/g, ' ');
    const preview = compact.length > 240 ? `${compact.slice(0, 240)}...` : compact;
    return `
      <div style="margin:0 0 20px;">
        <p style="margin:0 0 8px;font-size:11px;font-weight:800;letter-spacing:1.6px;text-transform:uppercase;color:#9ca3af;">🗒️ Notes</p>
        <div style="background:#121212;border:1px solid #2a2a2a;border-radius:10px;padding:14px 16px;">
          <p style="margin:0;font-size:14px;line-height:1.55;color:#e5e7eb;">${escapeHtml(preview)}</p>
        </div>
      </div>
    `;
}

function buildSubtasksSection(subtasks?: ReminderSubtask[]) {
    if (!Array.isArray(subtasks) || subtasks.length === 0) return '';
    const valid = subtasks.filter((item) => item && typeof item.text === 'string' && item.text.trim());
    if (valid.length === 0) return '';

    const completedCount = valid.filter((item) => !!item.completed).length;
    const preview = valid.slice(0, 5);

    const list = preview.map((item) => {
        const status = item.completed ? '[x]' : '[ ]';
        return `
          <li style="margin:0 0 8px;font-size:14px;color:#e5e7eb;line-height:1.4;">
            <span style="display:inline-block;min-width:28px;color:${item.completed ? '#22c55e' : '#facc15'};font-weight:800;">${status}</span>
            ${escapeHtml(item.text!.trim())}
          </li>
        `;
    }).join('');

    const moreHint = valid.length > preview.length
        ? `<p style="margin:8px 0 0;font-size:12px;color:#9ca3af;">+${valid.length - preview.length} more in app</p>`
        : '';

    return `
      <div style="margin:0 0 20px;">
        <p style="margin:0 0 8px;font-size:11px;font-weight:800;letter-spacing:1.6px;text-transform:uppercase;color:#9ca3af;">✅ Subtasks (${completedCount}/${valid.length} completed)</p>
        <div style="background:#121212;border:1px solid #2a2a2a;border-radius:10px;padding:14px 16px;">
          <ul style="margin:0;padding:0;list-style:none;">
            ${list}
          </ul>
          ${moreHint}
        </div>
      </div>
    `;
}

// POST /api/send-reminder
// Body: { to, taskTitle, reminderTime, taskId, category?, priority?, notes?, subtasks? }
export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const {
        to,
        taskTitle,
        reminderTime,
        taskId,
        category,
        priority,
        notes,
        subtasks,
    } = req.body as ReminderPayload;

    if (!to || !taskTitle) {
        return res.status(400).json({ error: 'Missing required fields: to, taskTitle' });
    }

    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_PASS;

    if (!gmailUser || !gmailPass) {
        console.error('Gmail credentials not configured');
        return res.status(500).json({ error: 'Email service not configured' });
    }

    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: gmailUser,
            pass: gmailPass,
        },
    });

    const formattedTime = reminderTime
        ? new Date(reminderTime).toLocaleString('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short',
            timeZone: 'Asia/Kolkata',
        })
        : 'Now';

    const categoryValue = category?.trim() ? escapeHtml(category.trim()) : 'Uncategorized';
    const priorityValue = priority?.trim() ? escapeHtml(priority.trim()) : 'Normal';
    const priorityTone = priorityValue.toLowerCase();
    const isHighPriority = priorityTone === 'high' || priorityTone === 'urgent';
    const priorityPrefix = isHighPriority ? '⚠️ ' : '';

    const notesSection = buildNotesSection(notes);
    const subtasksSection = buildSubtasksSection(subtasks);

    const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>TangyTask Reminder</title>
    </head>
    <body style="margin:0;padding:0;background:#0a0a0a;font-family:'Inter',Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
        <tr>
          <td align="center">
            <table width="560" cellpadding="0" cellspacing="0" style="background:#101010;border-radius:16px;border:1px solid #222;overflow:hidden;">
              <tr>
                <td style="background:linear-gradient(135deg,#facc15,#f59e0b);padding:28px 32px;text-align:center;">
                  <p style="margin:0;font-size:13px;font-weight:800;letter-spacing:3px;text-transform:uppercase;color:#111827;">TANGYTASK</p>
                  <h1 style="margin:8px 0 0;font-size:22px;font-weight:900;color:#111827;letter-spacing:-0.5px;">⏰ Task Reminder</h1>
                </td>
              </tr>
              <tr>
                <td style="padding:28px;">
                  <p style="margin:0 0 8px;font-size:11px;font-weight:800;letter-spacing:1.6px;text-transform:uppercase;color:#facc15;">📝 Main Task</p>
                  <div style="background:#18181b;border:1px solid #facc1530;border-left:4px solid #facc15;border-radius:10px;padding:18px 20px;margin-bottom:18px;">
                    <p style="margin:0;font-size:18px;font-weight:700;color:#ffffff;line-height:1.5;">${escapeHtml(taskTitle)}</p>
                  </div>

                  <p style="margin:0 0 8px;font-size:11px;font-weight:800;letter-spacing:1.6px;text-transform:uppercase;color:#9ca3af;">🕒 Scheduled For</p>
                  <p style="margin:0 0 14px;font-size:15px;font-weight:700;color:#e5e7eb;">${escapeHtml(formattedTime)} IST</p>

                  <div style="display:flex;gap:8px;margin:0 0 18px;flex-wrap:wrap;">
                    <span style="display:inline-block;background:#171717;border:1px solid #2a2a2a;border-radius:999px;padding:6px 12px;font-size:12px;font-weight:700;color:#facc15;">Category: ${categoryValue}</span>
                    <span style="display:inline-block;background:#171717;border:1px solid #2a2a2a;border-radius:999px;padding:6px 12px;font-size:12px;font-weight:700;color:#facc15;">Priority: ${priorityPrefix}${priorityValue}</span>
                  </div>

                  ${notesSection}
                  ${subtasksSection}

                  <a href="https://tangytask.com" style="display:inline-block;background:#facc15;color:#111827;text-decoration:none;font-size:13px;font-weight:900;letter-spacing:1.2px;text-transform:uppercase;padding:14px 26px;border-radius:10px;">Open in TangyTask</a>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 28px 22px;border-top:1px solid #1f1f1f;">
                  <p style="margin:0;font-size:11px;color:#6b7280;text-align:center;">You received this because a reminder is active in TangyTask.<br/>Task ID: ${escapeHtml(taskId)}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    `;

    try {
        const info = await transporter.sendMail({
            from: `"TangyTask" <${gmailUser}>`,
            to,
            subject: `⏰ TangyTask Reminder | ${taskTitle}`,
            html: htmlBody,
        });

        console.log(`Email sent to ${to}: ${info.messageId}`);
        return res.status(200).json({ success: true, messageId: info.messageId });
    } catch (err: any) {
        console.error('Nodemailer error:', err);
        return res.status(500).json({ error: err.message || 'Failed to send email' });
    }
}

import type { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';

// POST /api/send-reminder
// Body: { to, taskTitle, reminderTime, taskId }
export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { to, taskTitle, reminderTime, taskId } = req.body as {
        to: string;
        taskTitle: string;
        reminderTime: string;
        taskId: string;
    };

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

    const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Task Reminder</title>
    </head>
    <body style="margin:0;padding:0;background:#0a0a0a;font-family:'Inter',Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
        <tr>
          <td align="center">
            <table width="560" cellpadding="0" cellspacing="0" style="background:#111111;border-radius:16px;border:1px solid #222;overflow:hidden;">
              <!-- Header -->
              <tr>
                <td style="background:linear-gradient(135deg,#facc15,#f59e0b);padding:28px 32px;text-align:center;">
                  <p style="margin:0;font-size:13px;font-weight:800;letter-spacing:3px;text-transform:uppercase;color:#1a1a1a;">⏰ INSTANT TASKS</p>
                  <h1 style="margin:8px 0 0;font-size:22px;font-weight:900;color:#1a1a1a;letter-spacing:-0.5px;">Mission Reminder</h1>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding:32px;">
                  <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#facc15;">Your Task</p>
                  <div style="background:#1a1a1a;border:1px solid #facc1530;border-left:4px solid #facc15;border-radius:10px;padding:20px 24px;margin-bottom:24px;">
                    <p style="margin:0;font-size:17px;font-weight:700;color:#ffffff;line-height:1.5;">${taskTitle}</p>
                  </div>
                  <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#888;">Scheduled For</p>
                  <p style="margin:0 0 28px;font-size:15px;font-weight:600;color:#e5e5e5;">${formattedTime}</p>
                  <a href="https://tangytask.com" style="display:inline-block;background:#facc15;color:#1a1a1a;text-decoration:none;font-size:13px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;padding:14px 28px;border-radius:10px;">Open App →</a>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="padding:16px 32px 24px;border-top:1px solid #1e1e1e;">
                  <p style="margin:0;font-size:11px;color:#555;text-align:center;">You received this because you set a reminder in Instant Tasks.<br/>Task ID: ${taskId}</p>
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
            from: `"⚡ Instant Tasks" <${gmailUser}>`,
            to,
            subject: `⏰ Reminder: ${taskTitle}`,
            html: htmlBody,
        });

        console.log(`Email sent to ${to}: ${info.messageId}`);
        return res.status(200).json({ success: true, messageId: info.messageId });
    } catch (err: any) {
        console.error('Nodemailer error:', err);
        return res.status(500).json({ error: err.message || 'Failed to send email' });
    }
}

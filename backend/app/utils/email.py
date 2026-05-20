import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings

logger = logging.getLogger(__name__)


def send_email(to_email: str, subject: str, html_body: str):
    """Send email via SMTP. Silently logs on failure so it never crashes the API."""
    if not settings.SMTP_HOST or not settings.SMTP_USER:
        logger.info(f"[EMAIL SKIP] No SMTP configured. Would send '{subject}' to {to_email}")
        return
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_USER}>"
        msg["To"] = to_email
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_USER, to_email, msg.as_string())
        logger.info(f"[EMAIL SENT] '{subject}' → {to_email}")
    except Exception as e:
        logger.error(f"[EMAIL FAILED] '{subject}' → {to_email}: {e}")


def send_welcome_email(
    to_email: str,
    company_name: str,
    username: str,
    password: str,
    login_url: str = "http://192.168.10.204:5173/login",
    project_url: str = "https://testflow.com",
    support_email: str = "support@testflow.com",
    subject: str = "Welcome to TestFlow — Your Account is Ready",
):
    if not to_email:
        return
    body = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f3f4f6;">
      <!-- Header -->
      <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:36px 32px;border-radius:12px 12px 0 0;text-align:center;">
        <h1 style="color:white;margin:0;font-size:30px;letter-spacing:-0.5px;">TestFlow</h1>
        <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:14px;">Smart Hiring Assessment Platform</p>
      </div>

      <!-- Body -->
      <div style="background:#ffffff;padding:36px 32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
        <h2 style="color:#111827;margin-top:0;font-size:22px;">Welcome to TestFlow, {company_name}! 🎉</h2>
        <p style="color:#374151;line-height:1.65;margin:0 0 16px;">
          Your free trial account has been <strong>activated successfully</strong>. You can now create tests,
          invite candidates, and start automating your hiring process — all from one place.
        </p>

        <!-- About TestFlow -->
        <div style="background:#f5f3ff;border-left:4px solid #6366f1;border-radius:0 8px 8px 0;padding:14px 18px;margin:0 0 20px;">
          <p style="margin:0;color:#4b5563;font-size:14px;line-height:1.6;">
            <strong style="color:#6366f1;">About TestFlow:</strong> TestFlow helps 340+ companies automate their hiring assessments.
            Create tests in minutes, auto-score results, and schedule interviews — all in one platform.
            Visit <a href="{project_url}" style="color:#6366f1;text-decoration:none;font-weight:600;">{project_url}</a> to learn more.
          </p>
        </div>

        <!-- Credentials -->
        <p style="color:#374151;margin:0 0 10px;font-size:14px;">Here are your login credentials:</p>
        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px 24px;margin:0 0 20px;">
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:6px 0;color:#6b7280;font-size:13px;width:110px;">Username</td>
              <td style="padding:6px 0;">
                <code style="background:#e5e7eb;color:#111827;padding:3px 10px;border-radius:4px;font-size:13px;font-weight:700;">{username}</code>
              </td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#6b7280;font-size:13px;">Password</td>
              <td style="padding:6px 0;">
                <code style="background:#e5e7eb;color:#111827;padding:3px 10px;border-radius:4px;font-size:13px;font-weight:700;">{password}</code>
              </td>
            </tr>
          </table>
        </div>

        <!-- Login button -->
        <div style="text-align:center;margin:0 0 28px;">
          <a href="{login_url}" style="
            display:inline-block;padding:13px 32px;
            background:linear-gradient(135deg,#6366f1,#8b5cf6);
            color:#fff;text-decoration:none;border-radius:8px;
            font-weight:700;font-size:15px;
            box-shadow:0 4px 14px rgba(99,102,241,0.35);
          ">Login to TestFlow →</a>
        </div>

        <!-- Tips -->
        <p style="color:#374151;font-size:14px;margin:0 0 8px;"><strong>Get started in 3 steps:</strong></p>
        <ol style="color:#4b5563;font-size:14px;line-height:1.8;margin:0 0 24px;padding-left:20px;">
          <li>Log in with the credentials above</li>
          <li>Create your first test (upload a PDF or add questions manually)</li>
          <li>Invite candidates and track results in real-time</li>
        </ol>

        <!-- Divider -->
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 20px;" />

        <!-- Support -->
        <p style="color:#6b7280;font-size:13px;margin:0;line-height:1.6;">
          Need help? Reach our support team at
          <a href="mailto:{support_email}" style="color:#6366f1;text-decoration:none;font-weight:600;">{support_email}</a>
          — we typically respond within a few hours.
        </p>
      </div>

      <!-- Footer -->
      <div style="text-align:center;padding:16px;color:#9ca3af;font-size:12px;">
        © TestFlow · <a href="{project_url}" style="color:#9ca3af;">{project_url}</a>
      </div>
    </div>
    """
    send_email(to_email, subject, body)


def send_test_assignment_email(
    to_email: str,
    candidate_name: str,
    company_name: str,
    username: str,
    password: str,
    test_title: str,
    login_start: str = None,
    login_end: str = None,
    login_url: str = "http://192.168.10.204:5173/login",
):
    if not to_email:
        return

    window_html = ""
    if login_start and login_end:
        window_html = f"""
        <div style="background:#f5f3ff;border-left:4px solid #a855f7;border-radius:0 8px 8px 0;padding:14px 18px;margin:0 0 20px;">
          <p style="margin:0 0 6px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;font-weight:700;">Test Window</p>
          <p style="margin:0;color:#111827;font-size:14px;">
            <strong>Start:</strong> {login_start}<br>
            <strong>End:</strong> {login_end}
          </p>
        </div>
        """
    else:
        window_html = """
        <div style="background:#f5f3ff;border-left:4px solid #a855f7;border-radius:0 8px 8px 0;padding:14px 18px;margin:0 0 20px;">
          <p style="margin:0;color:#374151;font-size:14px;">You can log in and take the test at any time.</p>
        </div>
        """

    body = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f3f0ff;">
      <!-- Header -->
      <div style="background:linear-gradient(135deg,#a855f7,#6366f1);padding:36px 32px;border-radius:12px 12px 0 0;text-align:center;">
        <h1 style="color:white;margin:0;font-size:28px;letter-spacing:-0.5px;">TestFlow</h1>
        <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:14px;">Online Assessment Platform</p>
      </div>

      <!-- Body -->
      <div style="background:#ffffff;padding:36px 32px;border:1px solid #ede9fe;border-top:none;border-radius:0 0 12px 12px;">
        <h2 style="color:#0f172a;margin-top:0;font-size:20px;">Hello {candidate_name},</h2>
        <p style="color:#374151;line-height:1.65;margin:0 0 20px;">
          <strong style="color:#a855f7;">{company_name}</strong> has invited you to complete an online assessment on TestFlow.
        </p>

        <!-- Test Name -->
        <div style="background:#faf5ff;border:1px solid #ede9fe;border-radius:8px;padding:14px 18px;margin:0 0 20px;text-align:center;">
          <p style="margin:0;color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;">Assessment</p>
          <p style="margin:6px 0 0;color:#0f172a;font-size:18px;font-weight:700;">{test_title}</p>
        </div>

        <!-- Test Window -->
        {window_html}

        <!-- Credentials -->
        <p style="color:#374151;margin:0 0 10px;font-size:14px;font-weight:600;">Your Login Credentials:</p>
        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px 24px;margin:0 0 24px;">
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:6px 0;color:#6b7280;font-size:13px;width:110px;">Username</td>
              <td style="padding:6px 0;">
                <code style="background:#ede9fe;color:#6d28d9;padding:4px 12px;border-radius:4px;font-size:13px;font-weight:700;">{username}</code>
              </td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#6b7280;font-size:13px;">Password</td>
              <td style="padding:6px 0;">
                <code style="background:#ede9fe;color:#6d28d9;padding:4px 12px;border-radius:4px;font-size:13px;font-weight:700;">{password}</code>
              </td>
            </tr>
          </table>
        </div>

        <!-- Login Button -->
        <div style="text-align:center;margin:0 0 28px;">
          <a href="{login_url}" style="
            display:inline-block;padding:13px 36px;
            background:linear-gradient(135deg,#a855f7,#6366f1);
            color:#fff;text-decoration:none;border-radius:8px;
            font-weight:700;font-size:15px;
            box-shadow:0 4px 14px rgba(168,85,247,0.35);
          ">Login &amp; Take Test →</a>
        </div>

        <hr style="border:none;border-top:1px solid #ede9fe;margin:0 0 20px;" />
        <p style="color:#9ca3af;font-size:12px;margin:0;line-height:1.6;">
          This invitation was sent by <strong>{company_name}</strong> via TestFlow.
          If you did not expect this email, please ignore it.
        </p>
      </div>

      <!-- Footer -->
      <div style="text-align:center;padding:16px;color:#a78bfa;font-size:12px;">
        © 2025 TestFlow · Professional Assessment Platform
      </div>
    </div>
    """
    send_email(to_email, f"Assessment Invitation from {company_name} — {test_title}", body)


def send_trial_expiry_warning(to_email: str, company_name: str, days_left: int):
    subject = f"Your TestFlow Trial Ends in {days_left} Day{'s' if days_left != 1 else ''}"
    body = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
      <div style="background:linear-gradient(135deg,#f59e0b,#ef4444);padding:32px;border-radius:12px 12px 0 0;text-align:center;">
        <h1 style="color:white;margin:0;">Trial Expiring Soon</h1>
      </div>
      <div style="background:#ffffff;padding:32px;border:1px solid #e5e7eb;border-radius:0 0 12px 12px;">
        <h2 style="color:#111827;">Hi {company_name},</h2>
        <p style="color:#374151;">Your free trial will expire in <strong>{days_left} day{'s' if days_left != 1 else ''}</strong>.</p>
        <p style="color:#374151;">To continue using TestFlow without interruption, please upgrade your plan by logging in and visiting the Upgrade section.</p>
      </div>
    </div>
    """
    send_email(to_email, subject, body)

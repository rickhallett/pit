"""Email service using Resend."""

import os
from dataclasses import dataclass

import requests

RESEND_API_URL = "https://api.resend.com/emails"


@dataclass
class EmailService:
    """Email delivery via Resend API."""

    api_key: str = os.getenv("RESEND_API_KEY", "")
    from_email: str = os.getenv("FROM_EMAIL", "The Pit <noreply@thepit.cloud>")

    def send_magic_link(self, to_email: str, token: str, base_url: str) -> bool:
        """Send a magic link email.

        Args:
            to_email: Recipient email address
            token: Magic link token
            base_url: Frontend base URL for the verification link

        Returns:
            True if sent successfully, False otherwise
        """
        if not self.api_key:
            # Dev mode — log instead of sending
            print(f"[DEV] Magic link for {to_email}: {base_url}/auth/verify?token={token}")
            return True

        verify_url = f"{base_url}/auth/verify?token={token}"

        response = requests.post(
            RESEND_API_URL,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            json={
                "from": self.from_email,
                "to": [to_email],
                "subject": "Sign in to The Pit",
                "html": self._magic_link_html(verify_url),
                "text": self._magic_link_text(verify_url),
            },
            timeout=10,
        )

        return response.status_code == 200

    def _magic_link_html(self, verify_url: str) -> str:
        """Generate HTML email body."""
        return f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
             background-color: #0a0a0a; color: #e5e5e5; padding: 40px 20px;">
    <div style="max-width: 480px; margin: 0 auto;">
        <h1 style="color: #ffffff; font-size: 24px; margin-bottom: 24px;">
            🥊 Enter The Pit
        </h1>
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
            Click the button below to sign in. This link expires in 1 hour.
        </p>
        <a href="{verify_url}"
           style="display: inline-block; background-color: #dc2626; color: #ffffff;
                  padding: 14px 28px; text-decoration: none; border-radius: 6px;
                  font-weight: 600; font-size: 16px;">
            Sign In
        </a>
        <p style="font-size: 14px; color: #737373; margin-top: 32px;">
            If you didn't request this link, you can safely ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #262626; margin: 32px 0;">
        <p style="font-size: 12px; color: #525252;">
            The Pit — Where AI Models Battle
        </p>
    </div>
</body>
</html>
"""

    def _magic_link_text(self, verify_url: str) -> str:
        """Generate plain text email body."""
        return f"""Enter The Pit

Click the link below to sign in. This link expires in 1 hour.

{verify_url}

If you didn't request this link, you can safely ignore this email.

---
The Pit — Where AI Models Battle
"""


# Singleton instance
email_service = EmailService()

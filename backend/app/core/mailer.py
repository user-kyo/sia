import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pathlib import Path
from app.core.config import settings

def send_security_email(to_email: str, event_type: str):
    """
    Sends a security notification email based on the event_type.
    Currently supports: 'password_changed'
    """
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        print("SMTP_USER or SMTP_PASSWORD not configured. Skipping email send.")
        return False

    # Define subject and template based on event type
    if event_type == "password_changed":
        subject = "Your Password was Changed"
        template_name = "7_password_changed.html"
    else:
        print(f"Unknown event type: {event_type}")
        return False

    # Load HTML template
    template_path = Path(__file__).parent.parent / "templates" / template_name
    if not template_path.exists():
        print(f"Template not found: {template_path}")
        return False
        
    with open(template_path, "r", encoding="utf-8") as f:
        html_content = f.read()

    # Create email message
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_USER}>"
    msg["To"] = to_email

    # Attach HTML content
    part = MIMEText(html_content, "html")
    msg.attach(part)

    # Send email
    try:
        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        print(f"Successfully sent {event_type} email to {to_email}")
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False

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

def send_po_approval_email(
    to_email: str, 
    supplier_name: str, 
    po_number: str, 
    items: list, 
    company_name: str, 
    portal_link: str,
    custom_smtp_user: str = None,
    custom_smtp_password: str = None
):
    """
    Sends an email to the supplier when a Purchase Order is approved.
    Uses custom SMTP credentials if provided, otherwise falls back to system default.
    """
    smtp_user = custom_smtp_user or settings.SMTP_USER
    smtp_password = custom_smtp_password or settings.SMTP_PASSWORD

    if not smtp_user or not smtp_password:
        print("SMTP_USER or SMTP_PASSWORD not configured. Skipping PO email send.")
        return False

    template_path = Path(__file__).parent.parent / "templates" / "po_approved.html"
    if not template_path.exists():
        print(f"Template not found: {template_path}")
        return False
        
    with open(template_path, "r", encoding="utf-8") as f:
        html_content = f.read()

    # Generate items HTML table rows
    items_html = ""
    for item in items:
        name = item.get("product_name", "Unknown Item")
        qty = item.get("quantity", 0)
        items_html += f"<tr><td>{name}</td><td>{qty}</td></tr>\n"

    # Replace placeholders
    html_content = html_content.replace("{supplier_name}", supplier_name)
    html_content = html_content.replace("{po_number}", po_number)
    html_content = html_content.replace("{items_html}", items_html)
    html_content = html_content.replace("{company_name}", company_name)
    html_content = html_content.replace("{portal_link}", portal_link)

    # Create email message
    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"New Purchase Order: #{po_number} from {company_name}"
    
    # Use the company name as the From Name, and the custom email as the sender address
    from_name = company_name if custom_smtp_user else settings.SMTP_FROM_NAME
    msg["From"] = f"{from_name} <{smtp_user}>"
    msg["To"] = to_email

    # Attach HTML content
    part = MIMEText(html_content, "html")
    msg.attach(part)

    # Send email
    try:
        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
        server.starttls()
        server.login(smtp_user, smtp_password)
        server.send_message(msg)
        server.quit()
        print(f"Successfully sent PO approval email to {to_email}")
        return True
    except Exception as e:
        print(f"Failed to send PO email: {e}")
        return False


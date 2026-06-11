import smtplib

host = 'smtp.gmail.com'
port = 587
user = 'stocknrollsystem@gmail.com'
password = 'N4&zP1^wK8*eJ6!r'

print(f"Testing connection to {host}:{port} for {user}...")

try:
    with smtplib.SMTP(host, port) as server:
        server.set_debuglevel(1)  # Print SMTP conversation
        server.ehlo()
        server.starttls()
        server.login(user, password)
        print("SUCCESS: SMTP Authentication worked!")
except Exception as e:
    print(f"ERROR: SMTP Authentication failed: {e}")

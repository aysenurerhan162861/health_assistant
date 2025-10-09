import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path="backend/.env")

SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER", "aysenurerhan11@gmail.com")  # Gmail adresin
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "azmuchpxdnstxrul")  # Gmail App Password

def send_email(to_email: str, subject: str, body: str):
    """
    Basit SMTP tabanlı e-posta gönderici
    """
    msg = MIMEMultipart()
    msg["From"] = SMTP_USER
    msg["To"] = to_email
    msg["Subject"] = subject

    msg.attach(MIMEText(body, "plain"))

    try:
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_USER, to_email, msg.as_string())
        print(f"[EMAIL] Gönderildi: {to_email}")
    except Exception as e:
        print(f"[EMAIL] Gönderilemedi: {to_email} | Hata: {e}")

from fastapi import APIRouter, Request
import smtplib
from email.mime.text import MIMEText
import os
from dotenv import load_dotenv

load_dotenv()  # Load variables from .env

router = APIRouter()  # <-- This is what main.py expects

def send_reset_email(email: str, reset_link: str):
    # SMTP configuration
    smtp_server = "smtp.gmail.com"
    smtp_port = 587
    smtp_user = "acslu.it@gmail.com"
    smtp_password = os.getenv("SMTP_PASSWORD")  # Get password from env

    subject = "Password Reset Request"
    body = f"Click the link below to reset your password:\n{reset_link}"

    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = smtp_user
    msg["To"] = email

    try:
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(smtp_user, smtp_password)
        server.sendmail(smtp_user, [email], msg.as_string())
        server.quit()
        return True
    except Exception as e:
        print("Email send error:", e)
        return False

@router.post("/reset-password")
async def reset_password(request: Request):
    data = await request.json()
    email = data.get("email")
    # Generate a reset link (dummy for now)
    reset_link = f"http://localhost:3000/reset-password?email={email}"
    success = send_reset_email(email, reset_link)
    if success:
        return {"message": "Reset link sent if account exists."}
    else:
        return {"message": "Failed to send reset link."}
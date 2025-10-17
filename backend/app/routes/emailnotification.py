
import smtplib
from email.mime.text import MIMEText
import os
from dotenv import load_dotenv

load_dotenv()

def send_password_change_email(email: str, name: str = "User", sender_email: str = None, sender_password: str = None):
	smtp_server = "smtp.gmail.com"
	smtp_port = 587
	if not sender_email or not sender_password:
		print("Sender email and password must be provided for sending notifications.")
		return False
	smtp_user = sender_email
	smtp_password = sender_password

	subject = "Your Cardiac Delights Account Password Was Changed"
	body = f"""
Hi {name},

This is a notification that your Cardiac Delights account password was recently changed by an administrator/owner.\n\nIf you did not request this change, please contact support immediately.

If you did request this change, you can now log in with your new password.

Thank you,\nCardiac Delights Team
"""

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
		print(f"Password change notification sent to {email} from {smtp_user}")
		return True
	except Exception as e:
		print(f"Failed to send password change notification to {email} from {smtp_user}: {e}")
		return False

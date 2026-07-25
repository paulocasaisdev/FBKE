import os
import smtplib
from email.mime.text import MIMEText
from email.header import Header
from dotenv import load_dotenv

# Garante que o .env é carregado
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
env_path = os.path.join(base_dir, ".env")
load_dotenv(dotenv_path=env_path, override=True)

class EmailService:
    @staticmethod
    def is_configured() -> bool:
        """
        Verifica se as configurações mínimas do SMTP estão presentes no ambiente.
        """
        smtp_server = os.environ.get("SMTP_SERVER")
        smtp_user = os.environ.get("SMTP_USER")
        smtp_password = os.environ.get("SMTP_PASSWORD")
        return bool(smtp_server and smtp_user and smtp_password)

    @staticmethod
    def send_email(to_email: str, subject: str, message_body: str) -> tuple[bool, str]:
        """
        Envia um e-mail real utilizando SMTP configurado via variáveis de ambiente.
        Retorna uma tupla (sucesso: bool, mensagem_erro_ou_info: str).
        """
        smtp_server = os.environ.get("SMTP_SERVER")
        smtp_port = os.environ.get("SMTP_PORT")
        smtp_user = os.environ.get("SMTP_USER")
        smtp_password = os.environ.get("SMTP_PASSWORD")
        smtp_from_name = os.environ.get("SMTP_FROM_NAME") or "Goju-Ryu Karate Kai"

        if not EmailService.is_configured():
            return False, "Configurações de SMTP incompletas no arquivo .env"

        try:
            port = int(smtp_port) if smtp_port else 587
        except ValueError:
            port = 587

        try:
            # Configura o e-mail
            msg = MIMEText(message_body, 'plain', 'utf-8')
            msg['Subject'] = Header(subject, 'utf-8')
            msg['From'] = f"{Header(smtp_from_name, 'utf-8')} <{smtp_user}>"
            msg['To'] = to_email

            # Conexão SMTP SSL vs TLS (STARTTLS)
            if port == 465:
                server = smtplib.SMTP_SSL(smtp_server, port, timeout=10)
            else:
                server = smtplib.SMTP(smtp_server, port, timeout=10)
                server.ehlo()
                server.starttls()
                server.ehlo()

            # Autenticação e Envio
            server.login(smtp_user, smtp_password)
            server.sendmail(smtp_user, [to_email], msg.as_string())
            server.quit()
            
            return True, "E-mail enviado com sucesso."
        except Exception as e:
            return False, f"Erro na conexão/envio SMTP: {str(e)}"

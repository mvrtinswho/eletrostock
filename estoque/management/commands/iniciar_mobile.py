import ipaddress
import socket
from django.conf import settings
from django.core.management import call_command
from django.core.management.base import BaseCommand
class Command(BaseCommand):
    help = "Inicia a API para o Expo Go na rede local (porta 8001)."
    def add_arguments(self, parser):
        parser.add_argument("--port", type=int, default=8001)
        parser.add_argument("--check-only", action="store_true")
    def handle(self, *args, **options):
        addresses = {"127.0.0.1"}
        try:
            addresses.update(socket.gethostbyname_ex(socket.gethostname())[2])
        except OSError:
            pass
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as probe:
                probe.connect(("8.8.8.8", 80))
                addresses.add(probe.getsockname()[0])
        except OSError:
            pass
        local = sorted(ip for ip in addresses if ipaddress.ip_address(ip).version == 4)
        settings.ALLOWED_HOSTS = list(set(settings.ALLOWED_HOSTS + local + ["localhost"]))
        self.stdout.write(self.style.SUCCESS("\nAPI MOBILE · ELETROSTOCK"))
        self.stdout.write("Use um dos endereços abaixo no aplicativo (mesmo Wi-Fi):")
        for ip in local:
            if ip != "127.0.0.1":
                self.stdout.write(f"  http://{ip}:{options['port']}")
        self.stdout.write(f"No computador: http://127.0.0.1:{options['port']}/api/v1/health/")
        self.stdout.write("Mantenha esta janela aberta. Para parar: Ctrl+C.\n")
        if not options["check_only"]:
            call_command("runserver", f"0.0.0.0:{options['port']}", use_reloader=False)

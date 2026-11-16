from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.contrib.auth import get_user_model
class Command(BaseCommand):
    help = "Prepara o banco e solicita a criação do administrador na primeira execução."
    def handle(self, *args, **options):
        call_command("migrate")
        if not get_user_model().objects.filter(is_superuser=True).exists():
            self.stdout.write("Crie seu administrador. A senha não aparece enquanto você digita.")
            call_command("createsuperuser")

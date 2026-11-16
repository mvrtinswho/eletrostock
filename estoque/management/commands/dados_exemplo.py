from django.core.management.base import BaseCommand
from django.db import transaction
from estoque.models import Categoria, Fornecedor, Material, Movimentacao
class Command(BaseCommand):
    help = "Cria materiais fictícios de demonstração, sem duplicar registros."
    @transaction.atomic
    def handle(self, *args, **options):
        fornecedor, _ = Fornecedor.objects.get_or_create(cnpj="00000000000000", defaults={"nome": "Fornecedor Demonstração (fictício)", "email": "contato@example.com"})
        dados = [
            ("CAB-001", "Cabo flexível 2,5 mm²", "Cabos e condutores", "M", "Condutor de cobre, isolação 750 V, cor azul.", 100, 250, 2.80, "A-01"),
            ("DIS-001", "Disjuntor tripolar 63 A", "Proteção elétrica", "UN", "Curva C, montagem em trilho DIN.", 5, 3, 89.90, "B-02"),
            ("CON-001", "Contator tripolar 32 A", "Comando e controle", "UN", "Bobina 220 V CA, 1 contato auxiliar NA.", 5, 20, 149.90, "B-03"),
            ("REL-001", "Relé térmico 23–32 A", "Comando e controle", "UN", "Proteção de sobrecarga para motores.", 4, 2, 119.90, "B-04"),
            ("SEN-001", "Sensor indutivo M18", "Automação", "UN", "PNP, normalmente aberto, alimentação 24 V CC.", 3, 12, 75.00, "C-01"),
            ("FUS-001", "Fusível NH 100 A", "Proteção elétrica", "UN", "Tipo gG, tamanho NH00.", 10, 40, 32.50, "B-05"),
        ]
        for codigo, nome, categoria, unidade, especificacao, minimo, saldo, preco, local in dados:
            cat, _ = Categoria.objects.get_or_create(nome=categoria)
            material, criado = Material.objects.get_or_create(codigo=codigo, defaults={"nome": nome, "categoria": cat, "fornecedor": fornecedor, "unidade": unidade, "especificacao": especificacao, "estoque_minimo": minimo, "preco": preco, "localizacao": local})
            if criado:
                Movimentacao.objects.create(material=material, tipo="E", quantidade=saldo, referencia="Carga inicial de demonstração")
                if codigo == "CON-001":
                    Movimentacao.objects.create(material=material, tipo="S", quantidade=3, referencia="Manutenção do painel · Usina demonstração")
        self.stdout.write(self.style.SUCCESS("Dados fictícios de exemplo disponíveis."))

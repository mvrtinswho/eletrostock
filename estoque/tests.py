from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db.models.deletion import ProtectedError
from django.urls import reverse
from .models import Categoria, Fornecedor, Material, Movimentacao
from .forms import MovimentacaoForm

class EstoqueTests(TestCase):
    def setUp(self):
        self.cat = Categoria.objects.create(nome="Comando")
        self.fornecedor = Fornecedor.objects.create(nome="Exemplo", cnpj="12345678000100")
        self.material = Material.objects.create(codigo="CT-1", nome="Contator", categoria=self.cat, fornecedor=self.fornecedor, estoque_minimo=5, preco=100)
        self.user = get_user_model().objects.create_superuser("admin", "admin@example.com", "TesteSenha123!")
        self.client.force_login(self.user)
    def movimento(self, tipo="E", quantidade=20):
        return Movimentacao.objects.create(material=self.material, tipo=tipo, quantidade=quantidade, referencia="Usina")
    def saldo(self):
        self.material.refresh_from_db()
        return self.material.saldo
    def test_entrada_saida_e_valor(self):
        self.movimento()
        self.movimento("S", 3)
        self.assertEqual(self.saldo(), Decimal("17"))
        response = self.client.get("/")
        self.assertEqual(response.context["valor"], Decimal("1700"))
    def test_saida_insuficiente_nao_grava(self):
        self.movimento(quantidade=2)
        with self.assertRaises(ValidationError):
            self.movimento("S", 3)
        self.assertEqual(self.saldo(), 2)
        self.assertEqual(Movimentacao.objects.count(), 1)
    def test_corrigir_saida_aplica_diferenca(self):
        self.movimento()
        mov = self.movimento("S", 3)
        mov.quantidade = 5
        mov.save()
        self.assertEqual(self.saldo(), 15)
        mov.save()
        self.assertEqual(self.saldo(), 15)
    def test_reducao_entrada_invalida_preserva_banco(self):
        mov = self.movimento()
        self.movimento("S", 15)
        mov.quantidade = 10
        with self.assertRaises(ValidationError):
            mov.save()
        self.assertEqual(self.saldo(), 5)
        mov.refresh_from_db()
        self.assertEqual(mov.quantidade, 20)
    def test_quantidade_zero_e_negativa(self):
        for quantidade in [0, -1]:
            with self.assertRaises(ValidationError):
                self.movimento(quantidade=quantidade)
        self.assertEqual(self.saldo(), 0)
    def test_quantidade_fracionaria(self):
        self.movimento(quantidade=Decimal("10.50"))
        self.movimento("S", Decimal("0.25"))
        self.assertEqual(self.saldo(), Decimal("10.25"))
    def test_nao_troca_material(self):
        mov = self.movimento()
        outro = Material.objects.create(codigo="CT-2", nome="Outro", categoria=self.cat, fornecedor=self.fornecedor)
        mov.material = outro
        with self.assertRaises(ValidationError):
            mov.save()
        self.assertEqual(self.saldo(), 20)
    def test_alerta_e_filtro(self):
        self.movimento(quantidade=2)
        response = self.client.get("/materiais/?baixo=1")
        self.assertContains(response, "Contator")
        self.assertTrue(self.material.baixo_estoque)
        self.assertContains(self.client.get("/materiais/?q=inexistente"), "Nenhum registro")
    def test_paginas_dos_quatro_models(self):
        mov = self.movimento()
        for section, obj in [("categorias", self.cat), ("fornecedores", self.fornecedor), ("materiais", self.material), ("movimentacoes", mov)]:
            for url in [f"/{section}/", f"/{section}/novo/", f"/{section}/{obj.pk}/", f"/{section}/{obj.pk}/editar/"]:
                with self.subTest(url=url):
                    self.assertEqual(self.client.get(url).status_code, 200)
    def test_cadastro_e_edicao_pelas_telas(self):
        response = self.client.post("/categorias/novo/", {"nome": "Cabos", "descricao": "Condutores"})
        self.assertEqual(response.status_code, 302)
        obj = Categoria.objects.get(nome="Cabos")
        self.client.post(f"/categorias/{obj.pk}/editar/", {"nome": "Cabos elétricos", "descricao": ""})
        obj.refresh_from_db()
        self.assertEqual(obj.nome, "Cabos elétricos")
    def test_form_movimento_e_erro_na_tela(self):
        response = self.client.post("/movimentacoes/novo/", {"material": self.material.pk, "tipo": "S", "quantidade": "100", "referencia": "Manutenção"})
        self.assertContains(response, "Estoque insuficiente")
        self.assertEqual(Movimentacao.objects.count(), 0)
        self.assertEqual(self.saldo(), 0)
    def test_edicao_material_preserva_saldo(self):
        self.movimento()
        self.material.nome = "Contator industrial"
        self.material.save()
        self.assertEqual(self.saldo(), 20)
    def test_login_obrigatorio_e_admin(self):
        self.assertEqual(self.client.get("/admin/").status_code, 200)
        for model in ["categoria", "fornecedor", "material", "movimentacao"]:
            self.assertEqual(self.client.get(f"/admin/estoque/{model}/").status_code, 200)
        self.client.logout()
        self.assertEqual(self.client.get("/").status_code, 302)
        self.assertEqual(self.client.get("/entrar/").status_code, 200)
    def test_relacoes_protegidas(self):
        with self.assertRaises(ProtectedError):
            self.cat.delete()
        with self.assertRaises(ProtectedError):
            self.fornecedor.delete()
    def test_admin_sem_exclusao_de_movimentos(self):
        from django.contrib import admin
        from django.test import RequestFactory
        request = RequestFactory().get("/")
        request.user = self.user
        self.assertFalse(admin.site._registry[Movimentacao].has_delete_permission(request))
    def test_dados_demo_idempotentes(self):
        from django.core.management import call_command
        call_command("dados_exemplo", verbosity=0)
        count = Movimentacao.objects.count()
        call_command("dados_exemplo", verbosity=0)
        self.assertEqual(Movimentacao.objects.count(), count)

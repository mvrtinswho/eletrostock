import hashlib
import json
from datetime import timedelta
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import TestCase, Client
from django.utils import timezone
from .models import Categoria, Fornecedor, Material, Movimentacao, ApiToken

class ApiTests(TestCase):
    def setUp(self):
        cache.clear()
        self.user = get_user_model().objects.create_superuser("mobile", "mobile@example.com", "SenhaMobile123!")
        self.client = Client(enforce_csrf_checks=True)
        self.cat = Categoria.objects.create(nome="Cabos")
        self.supplier = Fornecedor.objects.create(nome="Fornecedor", cnpj="12345678000100")
        self.material = Material.objects.create(codigo="CAB-01", nome="Cabo", categoria=self.cat, fornecedor=self.supplier, estoque_minimo=5)
        result = self.post("auth/login/", {"username":"mobile", "password":"SenhaMobile123!"})
        self.token = result.json()["token"]
        self.headers = {"HTTP_AUTHORIZATION":"Bearer " + self.token}
    def post(self, route, data, method="post", auth=False):
        return getattr(self.client, method)("/api/v1/" + route, json.dumps(data), content_type="application/json", **(self.headers if auth else {}))
    def get(self, route, auth=True):
        return self.client.get("/api/v1/" + route, **(self.headers if auth else {}))
    def test_health_and_token_protection(self):
        self.assertEqual(self.get("health/", auth=False).json()["status"], "ok")
        self.assertEqual(self.get("materiais/", auth=False).status_code, 401)
        self.client.force_login(self.user)
        self.assertEqual(self.get("materiais/", auth=False).status_code, 401)
        self.assertEqual(self.get("auth/me/").json()["username"], "mobile")
    def test_token_is_hashed_and_logout_revokes(self):
        token = ApiToken.objects.get()
        self.assertEqual(token.digest, hashlib.sha256(self.token.encode()).hexdigest())
        self.assertNotEqual(token.digest, self.token)
        self.assertEqual(self.post("auth/logout/", {}, auth=True).status_code, 200)
        self.assertEqual(self.get("auth/me/").status_code, 401)
    def test_expired_and_disabled_staff(self):
        ApiToken.objects.update(expires_at=timezone.now()-timedelta(seconds=1))
        self.assertEqual(self.get("auth/me/").status_code, 401)
    def test_staff_required(self):
        get_user_model().objects.create_user("comum", password="Senha123!")
        response=self.post("auth/login/", {"username":"comum", "password":"Senha123!"})
        self.assertEqual(response.status_code, 401)
        self.user.is_staff=False
        self.user.save()
        self.assertEqual(self.get("auth/me/").status_code, 401)
    def test_failed_login_throttled(self):
        for _ in range(10):
            self.assertEqual(self.post("auth/login/", {"username":"mobile", "password":"errada"}).status_code, 401)
        self.assertEqual(self.post("auth/login/", {"username":"mobile", "password":"errada"}).status_code, 429)
    def test_all_resources_create_detail_and_edit(self):
        cases = [
            ("categorias", {"nome":"Automação","descricao":"Sensores"}, {"nome":"Automação industrial","descricao":""}),
            ("fornecedores", {"nome":"Teste","cnpj":"98765432000100","telefone":"","email":""}, {"nome":"Teste atualizado","cnpj":"98765432000100","telefone":"11999999999","email":""}),
            ("materiais", {"codigo":"SEN-1","nome":"Sensor","categoria":self.cat.pk,"fornecedor":self.supplier.pk,"unidade":"UN","estoque_minimo":"2","preco":"12.50","localizacao":"A","especificacao":""}, {"codigo":"SEN-1","nome":"Sensor indutivo","categoria":self.cat.pk,"fornecedor":self.supplier.pk,"unidade":"UN","estoque_minimo":"3","preco":"12.50","localizacao":"B","especificacao":""}),
            ("movimentacoes", {"material":self.material.pk,"tipo":"E","quantidade":"20","referencia":"Compra","observacao":""}, {"material":self.material.pk,"tipo":"E","quantidade":"25","referencia":"Compra corrigida","observacao":""}),
        ]
        for section, create, edit in cases:
            with self.subTest(section=section):
                response=self.post(section+"/",create,auth=True)
                self.assertEqual(response.status_code,201,response.content)
                pk=response.json()["id"]
                self.assertEqual(self.get(f"{section}/{pk}/").status_code,200)
                self.assertEqual(self.post(f"{section}/{pk}/",edit,method="put",auth=True).status_code,200)
                self.assertEqual(self.get(section+"/").status_code,200)
    def test_movements_share_balance_with_web(self):
        entry={"material":self.material.pk,"tipo":"E","quantidade":"20","referencia":"Compra"}
        response=self.post("movimentacoes/",entry,auth=True)
        self.assertEqual(response.status_code,201)
        exit_data={**entry,"tipo":"S","quantidade":"3","referencia":"Manutenção"}
        response=self.post("movimentacoes/",exit_data,auth=True)
        pk=response.json()["id"]
        self.material.refresh_from_db()
        self.assertEqual(self.material.saldo,17)
        self.assertEqual(self.post(f"movimentacoes/{pk}/",{**exit_data,"quantidade":"5"},method="put",auth=True).status_code,200)
        self.material.refresh_from_db()
        self.assertEqual(self.material.saldo,15)
        response=self.post("movimentacoes/",{**exit_data,"quantidade":"100"},auth=True)
        self.assertEqual(response.status_code,400)
        self.assertIn("Estoque insuficiente",str(response.json()))
        self.material.refresh_from_db()
        self.assertEqual(self.material.saldo,15)
        detail=self.get(f"materiais/{self.material.pk}/").json()
        self.assertEqual(len(detail["historico"]),2)
    def test_validation_filtering_and_pagination(self):
        response=self.post("materiais/",{"nome":"Inválido"},auth=True)
        self.assertEqual(response.status_code,400)
        self.assertIn("codigo",response.json()["fields"])
        self.assertEqual(self.get("materiais/?q=naoexiste").json()["count"],0)
        self.assertEqual(self.get("materiais/?baixo=1").json()["count"],1)
        self.assertEqual(self.get("materiais/?categoria=abc").json()["count"],0)
        for i in range(25):
            Categoria.objects.create(nome=f"Categoria {i}")
        data=self.get("categorias/?page=2").json()
        self.assertEqual(data["page"],2)
        self.assertEqual(len(data["results"]),6)
    def test_malformed_json_and_methods(self):
        for data in ['[]','{bad','{"username": []}','{"password": 123}']:
            response=self.client.post("/api/v1/auth/login/",data,content_type="application/json")
            self.assertEqual(response.status_code,400)
        self.assertEqual(self.client.delete("/api/v1/materiais/1/",**self.headers).status_code,405)
        self.assertEqual(self.get("inexistente/").status_code,404)
        self.assertEqual(self.get("materiais/999999/").status_code,404)
    def test_dashboard_and_web_balance_match(self):
        Movimentacao.objects.create(material=self.material,tipo="E",quantidade=Decimal("2.50"),referencia="Compra")
        data=self.get("dashboard/").json()
        self.assertEqual(data["materiais"],1)
        self.assertEqual(data["baixo_estoque"],1)
        self.assertEqual(data["alertas"][0]["saldo"],"2.50")
        self.assertEqual(data["recentes"][0]["quantidade"],"2.50")

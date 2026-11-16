from decimal import Decimal
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models, transaction
from django.db.models import F

class Categoria(models.Model):
    nome = models.CharField("nome", max_length=100, unique=True)
    descricao = models.TextField("descrição", blank=True)
    class Meta:
        ordering = ["nome"]
        verbose_name = "categoria"
    def __str__(self):
        return self.nome

class Fornecedor(models.Model):
    nome = models.CharField("nome / razão social", max_length=150)
    cnpj = models.CharField("CNPJ (14 números)", max_length=14, unique=True)
    telefone = models.CharField("telefone", max_length=25, blank=True)
    email = models.EmailField("e-mail", blank=True)
    class Meta:
        ordering = ["nome"]
        verbose_name = "fornecedor"
        verbose_name_plural = "fornecedores"
    def clean(self):
        if not self.cnpj.isdigit() or len(self.cnpj) != 14:
            raise ValidationError({"cnpj": "Informe os 14 números do CNPJ."})
    def __str__(self):
        return self.nome

class Material(models.Model):
    UNIDADES = [("UN", "Unidade"), ("M", "Metro"), ("KG", "Quilograma"), ("RL", "Rolo"), ("CX", "Caixa")]
    codigo = models.CharField("código", max_length=30, unique=True)
    nome = models.CharField("nome", max_length=150)
    especificacao = models.TextField("especificação técnica", blank=True)
    categoria = models.ForeignKey(Categoria, on_delete=models.PROTECT, related_name="materiais", verbose_name="categoria")
    fornecedor = models.ForeignKey(Fornecedor, on_delete=models.PROTECT, related_name="materiais", verbose_name="fornecedor principal")
    unidade = models.CharField("unidade", max_length=2, choices=UNIDADES, default="UN")
    estoque_minimo = models.DecimalField("estoque mínimo", max_digits=12, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    saldo = models.DecimalField("saldo atual", max_digits=12, decimal_places=2, default=0, editable=False)
    localizacao = models.CharField("localização", max_length=100, blank=True)
    preco = models.DecimalField("custo unitário (R$)", max_digits=12, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    class Meta:
        ordering = ["nome"]
        verbose_name = "material"
        verbose_name_plural = "materiais"
        constraints = [models.CheckConstraint(condition=models.Q(saldo__gte=0), name="saldo_nao_negativo")]
    def save(self, *args, **kwargs):
        if self.pk and not kwargs.get("force_insert"):
            kwargs["update_fields"] = [f.name for f in self._meta.fields if f.name not in {"id", "saldo"}]
        super().save(*args, **kwargs)
    @property
    def baixo_estoque(self):
        return self.saldo < self.estoque_minimo
    def __str__(self):
        return f"{self.codigo} — {self.nome}"

class Movimentacao(models.Model):
    TIPOS = [("E", "Entrada"), ("S", "Saída")]
    material = models.ForeignKey(Material, on_delete=models.PROTECT, related_name="movimentacoes", verbose_name="material")
    tipo = models.CharField("tipo", max_length=1, choices=TIPOS)
    quantidade = models.DecimalField("quantidade", max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal("0.01"))])
    referencia = models.CharField("origem / destino", max_length=150, help_text="Fornecedor, usina, setor ou ordem de manutenção.")
    observacao = models.TextField("observação", blank=True)
    criado_em = models.DateTimeField("registrado em", auto_now_add=True)
    class Meta:
        ordering = ["-criado_em", "-pk"]
        verbose_name = "movimentação"
        verbose_name_plural = "movimentações"
        constraints = [models.CheckConstraint(condition=models.Q(quantidade__gt=0), name="quantidade_positiva")]
    @property
    def efeito(self):
        return self.quantidade if self.tipo == "E" else -self.quantidade
    def clean(self):
        if not self.material_id or self.quantidade is None:
            return
        anterior = type(self).objects.filter(pk=self.pk).first() if self.pk else None
        if anterior and anterior.material_id != self.material_id:
            raise ValidationError({"material": "Não é possível trocar o material de um lançamento registrado."})
        saldo = Material.objects.get(pk=self.material_id).saldo
        if saldo + self.efeito - (anterior.efeito if anterior else 0) < 0:
            raise ValidationError("Estoque insuficiente para esta movimentação ou correção.")
    def save(self, *args, **kwargs):
        with transaction.atomic():
            # Serializa alterações do saldo no SQLite antes de ler o lançamento anterior.
            Material.objects.filter(pk=self.material_id).update(saldo=F("saldo"))
            self.full_clean()
            anterior = type(self).objects.filter(pk=self.pk).first() if self.pk else None
            delta = self.efeito - (anterior.efeito if anterior else 0)
            updated = Material.objects.filter(pk=self.material_id, saldo__gte=-delta).update(saldo=F("saldo") + delta)
            if not updated:
                raise ValidationError("Estoque insuficiente.")
            super().save(*args, **kwargs)
    def delete(self, *args, **kwargs):
        raise ValidationError("Edite o lançamento para corrigir; o histórico não pode ser excluído.")
    def __str__(self):
        return f"{self.get_tipo_display()} · {self.material} · {self.quantidade}"

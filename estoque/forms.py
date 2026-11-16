from django import forms
from .models import Categoria, Fornecedor, Material, Movimentacao
class CategoriaForm(forms.ModelForm):
    class Meta:
        model = Categoria
        fields = ["nome", "descricao"]
class FornecedorForm(forms.ModelForm):
    class Meta:
        model = Fornecedor
        fields = ["nome", "cnpj", "telefone", "email"]
class MaterialForm(forms.ModelForm):
    class Meta:
        model = Material
        fields = ["codigo", "nome", "categoria", "fornecedor", "unidade", "estoque_minimo", "localizacao", "preco", "especificacao"]
class MovimentacaoForm(forms.ModelForm):
    class Meta:
        model = Movimentacao
        fields = ["material", "tipo", "quantidade", "referencia", "observacao"]
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance.pk:
            self.fields["material"].disabled = True

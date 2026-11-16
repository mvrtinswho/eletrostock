from django.contrib import admin
from .models import Categoria, Fornecedor, Material, Movimentacao
admin.site.site_header = "EletroStock · Administração"
admin.site.site_title = "EletroStock"
admin.site.index_title = "Gestão de materiais elétricos"
@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    list_display = ["nome", "descricao"]
    search_fields = ["nome"]
@admin.register(Fornecedor)
class FornecedorAdmin(admin.ModelAdmin):
    list_display = ["nome", "cnpj", "telefone", "email"]
    search_fields = ["nome", "cnpj"]
@admin.register(Material)
class MaterialAdmin(admin.ModelAdmin):
    list_display = ["codigo", "nome", "categoria", "saldo", "unidade", "estoque_minimo", "localizacao"]
    list_filter = ["categoria", "unidade"]
    search_fields = ["codigo", "nome", "especificacao"]
    readonly_fields = ["saldo"]
@admin.register(Movimentacao)
class MovimentacaoAdmin(admin.ModelAdmin):
    list_display = ["material", "tipo", "quantidade", "referencia", "criado_em"]
    list_filter = ["tipo", "material__categoria"]
    search_fields = ["material__nome", "referencia"]
    def get_readonly_fields(self, request, obj=None):
        return ["criado_em", "material"] if obj else ["criado_em"]
    def has_delete_permission(self, request, obj=None):
        return False

from django.contrib import messages
from django.contrib.auth.decorators import login_required, user_passes_test
from django.core.exceptions import ValidationError
from django.core.paginator import Paginator
from django.db.models import F, Q, Sum, DecimalField, ExpressionWrapper
from django.shortcuts import render, redirect, get_object_or_404
from django.http import Http404
from .models import Categoria, Fornecedor, Material, Movimentacao
from .forms import CategoriaForm, FornecedorForm, MaterialForm, MovimentacaoForm
CONFIG = {
 "materiais": (Material, MaterialForm, "Materiais", ["Código", "Material", "Categoria", "Saldo", "Unidade", "Situação"]),
 "categorias": (Categoria, CategoriaForm, "Categorias", ["Nome", "Descrição"]),
 "fornecedores": (Fornecedor, FornecedorForm, "Fornecedores", ["Nome", "CNPJ", "Telefone", "E-mail"]),
 "movimentacoes": (Movimentacao, MovimentacaoForm, "Movimentações", ["Material", "Tipo", "Quantidade", "Origem / destino", "Data"]),
}
def staff(view):
    return login_required(user_passes_test(lambda u: u.is_staff, login_url="login")(view))
def config(section):
    if section not in CONFIG:
        raise Http404
    return CONFIG[section]
def row(obj):
    if isinstance(obj, Material):
        return [obj.codigo, obj.nome, obj.categoria, obj.saldo, obj.unidade, "Estoque baixo" if obj.baixo_estoque else "Regular"]
    if isinstance(obj, Categoria):
        return [obj.nome, obj.descricao or "—"]
    if isinstance(obj, Fornecedor):
        return [obj.nome, obj.cnpj, obj.telefone or "—", obj.email or "—"]
    return [obj.material, obj.get_tipo_display(), obj.quantidade, obj.referencia, obj.criado_em.strftime("%d/%m/%Y %H:%M")]
@staff
def dashboard(request):
    materiais = Material.objects.select_related("categoria")
    baixo = materiais.filter(saldo__lt=F("estoque_minimo"))
    valor = materiais.aggregate(total=Sum(ExpressionWrapper(F("saldo") * F("preco"), output_field=DecimalField())))["total"] or 0
    return render(request, "estoque/dashboard.html", {"total": materiais.count(), "baixo": baixo, "valor": valor, "fornecedores": Fornecedor.objects.count(), "recentes": Movimentacao.objects.select_related("material")[:6]})
@staff
def listing(request, section):
    model, _, title, columns = config(section)
    qs = model.objects.all()
    q = request.GET.get("q", "").strip()
    if section == "materiais":
        qs = qs.select_related("categoria", "fornecedor")
        if q:
            qs = qs.filter(Q(nome__icontains=q) | Q(codigo__icontains=q) | Q(especificacao__icontains=q))
        categoria = request.GET.get("categoria", "")
        if categoria:
            qs = qs.filter(categoria_id=categoria) if categoria.isdigit() else qs.none()
        if request.GET.get("baixo"):
            qs = qs.filter(saldo__lt=F("estoque_minimo"))
    elif section == "movimentacoes":
        qs = qs.select_related("material")
        if q:
            qs = qs.filter(Q(material__nome__icontains=q) | Q(referencia__icontains=q))
    elif q:
        qs = qs.filter(nome__icontains=q)
    page = Paginator(qs, 12).get_page(request.GET.get("page"))
    rows = [{"obj": obj, "cells": row(obj)} for obj in page]
    query = request.GET.copy()
    query.pop("page", None)
    return render(request, "estoque/list.html", {"section": section, "title": title, "columns": columns, "rows": rows, "page": page, "q": q, "categorias": Categoria.objects.all(), "filter_query": query.urlencode()})
@staff
def detail(request, section, pk):
    model, _, title, _ = config(section)
    obj = get_object_or_404(model, pk=pk)
    fields = []
    for field in model._meta.fields:
        if field.name == "id":
            continue
        value = getattr(obj, "get_" + field.name + "_display")() if field.choices else getattr(obj, field.name)
        fields.append((field.verbose_name, value if value != "" else "—"))
    history = obj.movimentacoes.all()[:15] if section == "materiais" else None
    return render(request, "estoque/detail.html", {"section": section, "title": title, "obj": obj, "fields": fields, "history": history})
@staff
def edit(request, section, pk=None):
    model, form_class, title, _ = config(section)
    obj = get_object_or_404(model, pk=pk) if pk else None
    form = form_class(request.POST if request.method == "POST" else None, instance=obj)
    if request.method == "POST" and form.is_valid():
        try:
            saved = form.save()
        except ValidationError as exc:
            form.add_error(None, exc)
        else:
            messages.success(request, "Registro salvo com sucesso.")
            return redirect("detail", section=section, pk=saved.pk)
    return render(request, "estoque/form.html", {"form": form, "section": section, "title": title, "editing": bool(pk)})

"""API JSON para o cliente Expo. Autenticação por token; não utiliza cookies."""
import hashlib
import json
import secrets
from datetime import timedelta
from functools import wraps
from django.contrib.auth import authenticate
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.core.paginator import Paginator
from django.db import transaction
from django.db.models import F, Q, Sum, DecimalField, ExpressionWrapper
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from .models import Categoria, Fornecedor, Material, Movimentacao, ApiToken
from .forms import CategoriaForm, FornecedorForm, MaterialForm, MovimentacaoForm

RESOURCES = {
    "categorias": (Categoria, CategoriaForm),
    "fornecedores": (Fornecedor, FornecedorForm),
    "materiais": (Material, MaterialForm),
    "movimentacoes": (Movimentacao, MovimentacaoForm),
}
def error(message, status=400, fields=None):
    return JsonResponse({"error": message, "fields": fields or {}}, status=status)
def payload(request):
    if len(request.body) > 65536:
        raise ValueError("Requisição muito grande.")
    try:
        data = json.loads(request.body or b"{}")
    except (json.JSONDecodeError, UnicodeDecodeError):
        raise ValueError("Envie um objeto JSON válido.")
    if not isinstance(data, dict):
        raise ValueError("Envie um objeto JSON válido.")
    if any(isinstance(v, (dict, list)) for v in data.values()):
        raise ValueError("Os campos devem conter valores simples.")
    return data
def serialize(obj):
    data = {}
    for field in obj._meta.fields:
        value = getattr(obj, field.attname)
        data[field.name] = value.isoformat() if hasattr(value, "isoformat") else value
    data["label"] = str(obj)
    if isinstance(obj, Material):
        data.update(categoria_nome=obj.categoria.nome, fornecedor_nome=obj.fornecedor.nome, baixo_estoque=obj.baixo_estoque)
    if isinstance(obj, Movimentacao):
        data.update(material_nome=obj.material.nome, material_codigo=obj.material.codigo, unidade=obj.material.unidade, tipo_nome=obj.get_tipo_display())
    return data
def endpoint(methods, auth=True):
    def decorate(view):
        @csrf_exempt
        @wraps(view)
        def wrapped(request, *args, **kwargs):
            if request.method not in methods:
                response = error("Método não permitido.", 405)
                response["Allow"] = ", ".join(methods)
                return response
            if auth:
                header = request.headers.get("Authorization", "")
                if not header.startswith("Bearer ") or len(header) > 512:
                    return error("Entre novamente para continuar.", 401)
                digest = hashlib.sha256(header[7:].encode()).hexdigest()
                token = ApiToken.objects.select_related("user").filter(digest=digest, expires_at__gt=timezone.now()).first()
                if not token or not token.user.is_active or not token.user.is_staff:
                    return error("Sessão expirada ou acesso não autorizado.", 401)
                request.api_token = token
                request.api_user = token.user
            try:
                response = view(request, *args, **kwargs)
            except ValueError as exc:
                response = error(str(exc))
            response["Cache-Control"] = "no-store"
            return response
        return wrapped
    return decorate

@endpoint(["GET"], auth=False)
def health(request):
    return JsonResponse({"service": "EletroStock", "api_version": 1, "status": "ok"})

@endpoint(["POST"], auth=False)
def login(request):
    data = payload(request)
    if not isinstance(data.get("username", ""), str) or not isinstance(data.get("password", ""), str):
        return error("Usuário e senha devem ser textos.")
    username = data.get("username", "").strip()
    ip = request.META.get("REMOTE_ADDR", "")
    key = "api-login-" + hashlib.sha256((ip + ":" + username.casefold()).encode()).hexdigest()
    attempts = cache.get(key, 0)
    if attempts >= 10:
        return error("Muitas tentativas. Aguarde 5 minutos e tente novamente.", 429)
    user = authenticate(request, username=username, password=data.get("password", ""))
    if not user or not user.is_active or not user.is_staff:
        cache.set(key, attempts + 1, 300)
        return error("Usuário ou senha inválidos, ou usuário sem status de equipe.", 401)
    cache.delete(key)
    raw = secrets.token_urlsafe(32)
    expires = timezone.now() + timedelta(days=7)
    with transaction.atomic():
        ApiToken.objects.filter(user=user, expires_at__lte=timezone.now()).delete()
        ApiToken.objects.create(user=user, digest=hashlib.sha256(raw.encode()).hexdigest(), expires_at=expires)
    return JsonResponse({"token": raw, "expires_at": expires.isoformat(), "user": {"username": user.username, "id": user.pk}})

@endpoint(["POST"])
def logout(request):
    request.api_token.delete()
    return JsonResponse({"ok": True})

@endpoint(["GET"])
def me(request):
    return JsonResponse({"username": request.api_user.username, "id": request.api_user.pk})

@endpoint(["GET"])
def dashboard(request):
    qs = Material.objects.select_related("categoria", "fornecedor")
    low = qs.filter(saldo__lt=F("estoque_minimo"))
    value = qs.aggregate(total=Sum(ExpressionWrapper(F("saldo") * F("preco"), output_field=DecimalField())))["total"] or 0
    recent = Movimentacao.objects.select_related("material")[:8]
    return JsonResponse({"materiais": qs.count(), "fornecedores": Fornecedor.objects.count(), "baixo_estoque": low.count(), "valor": value, "alertas": [serialize(obj) for obj in low[:8]], "recentes": [serialize(obj) for obj in recent]})

@endpoint(["GET", "POST", "PUT"])
def resource(request, section, pk=None):
    if section not in RESOURCES:
        return error("Recurso não encontrado.", 404)
    model, form_class = RESOURCES[section]
    qs = model.objects.all()
    if model is Material:
        qs = qs.select_related("categoria", "fornecedor")
    elif model is Movimentacao:
        qs = qs.select_related("material")
    obj = qs.filter(pk=pk).first() if pk else None
    if pk and obj is None:
        return error("Registro não encontrado.", 404)
    if request.method == "GET":
        if obj:
            result = serialize(obj)
            if model is Material:
                result["historico"] = [serialize(m) for m in obj.movimentacoes.select_related("material")[:15]]
            return JsonResponse(result)
        q = request.GET.get("q", "").strip()[:150]
        if q:
            if model is Material:
                qs = qs.filter(Q(nome__icontains=q) | Q(codigo__icontains=q) | Q(especificacao__icontains=q))
            elif model is Movimentacao:
                qs = qs.filter(Q(material__nome__icontains=q) | Q(material__codigo__icontains=q) | Q(referencia__icontains=q))
            else:
                qs = qs.filter(nome__icontains=q)
        if model is Material:
            if request.GET.get("baixo") == "1":
                qs = qs.filter(saldo__lt=F("estoque_minimo"))
            categoria = request.GET.get("categoria", "")
            if categoria:
                qs = qs.filter(categoria_id=categoria) if categoria.isdigit() else qs.none()
        page = Paginator(qs, 20).get_page(request.GET.get("page", 1))
        return JsonResponse({"results": [serialize(o) for o in page], "count": page.paginator.count, "page": page.number, "pages": page.paginator.num_pages})
    if (pk and request.method != "PUT") or (not pk and request.method != "POST"):
        return error("Use POST para criar e PUT para editar.", 405)
    form = form_class(payload(request), instance=obj)
    if not form.is_valid():
        fields = {key: [str(e) for e in errors] for key, errors in form.errors.items()}
        return error("Confira os campos informados.", fields=fields)
    try:
        saved = form.save()
    except ValidationError as exc:
        return error(" ".join(exc.messages))
    saved.refresh_from_db()
    return JsonResponse(serialize(saved), status=200 if pk else 201)

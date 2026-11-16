# Arquitetura e decisões técnicas

O EletroStock tem duas interfaces para o mesmo estoque: páginas renderizadas pelo Django e um aplicativo React Native que consome uma API JSON.

## Organização

| Camada | Arquivos | Responsabilidade |
| --- | --- | --- |
| Configuração | `config/settings.py`, `config/urls.py` | Aplicações, middleware, banco e rotas. |
| Dados e regras | `estoque/models.py` | Cadastros, relações e atualização do saldo. |
| Validação | `estoque/forms.py` | Campos e validação dos cadastros usados pela web e pela API. |
| Web | `estoque/views.py`, `templates/` | Consultas, formulários e páginas protegidas. |
| API | `estoque/api.py`, `estoque/api_urls.py` | Respostas JSON, autenticação e operações dos recursos. |
| Mobile | `mobile/App.js`, `mobile/src/api.js` | Telas, sessão local e comunicação HTTP. |

## Estoque

O saldo do material muda a cada movimentação. Uma saída não pode deixá-lo negativo. A edição de um lançamento aplica a diferença entre a quantidade anterior e a nova; o material de um lançamento existente não pode ser alterado.

As atualizações usam transações e operações no banco. Essas regras ficam no model, de modo que a web, a API e o Admin compartilhem o mesmo comportamento.

## Autenticação

### Web

O login em `/entrar/` usa `LoginView` e `AdminAuthenticationForm`. As páginas de estoque exigem autenticação e status de equipe (`is_staff`). Sessões, cookies e proteção CSRF são gerenciados pelo Django. A saída é feita por POST em `/sair/`.

### API mobile

1. O aplicativo envia usuário e senha em JSON para `POST /api/v1/auth/login/`.
2. O servidor autentica com o Django e exige usuário ativo e com status de equipe.
3. Um token aleatório é gerado com `secrets.token_urlsafe(32)`. O servidor guarda somente seu digest SHA-256 no model `ApiToken`.
4. O aplicativo recebe o token e o envia em `Authorization: Bearer <token>`.
5. Cada requisição protegida verifica o digest, a validade e o status atual do usuário.
6. `POST /api/v1/auth/logout/` exclui o token utilizado.

Os tokens vencem após sete dias. Não há refresh token; após a expiração, o usuário precisa entrar novamente. Um novo login pode criar outra sessão válida para o mesmo usuário. Sair de uma sessão mobile não encerra as outras sessões nem a sessão do navegador.

A senha não é persistida pelo aplicativo. No Android/iOS, servidor, token e identificação do usuário ficam no SecureStore. Na versão web, a sessão fica apenas em memória. Ao receber HTTP 401, o app remove a sessão local e volta ao login.

A API não aceita a sessão do navegador como autorização e seus endpoints são isentos de CSRF. A proteção depende do token enviado explicitamente no cabeçalho.

### Limites de acesso

O acesso à aplicação usa uma regra ampla de equipe. A API não implementa permissões por operação ou por registro. O login da API limita falhas por combinação de IP e usuário: após dez falhas, retorna HTTP 429. O contador usa o cache do Django, sem backend compartilhado configurado.

## Testes existentes

- `estoque/tests.py`: movimentações, saldo, cadastros, páginas e acesso ao Admin.
- `estoque/test_api.py`: autenticação, token armazenado como digest, expiração, revogação, exigência de equipe, limitação de tentativas e operações da API.

Para executar:

```bat
.venv\Scripts\python.exe manage.py test
```

## Escopo e implantação

SQLite e os scripts de inicialização atendem à demonstração local. O aplicativo precisa da API em execução e não oferece modo offline.

Antes de disponibilizar o servidor na internet, configure HTTPS, `DJANGO_SECRET_KEY` própria, `DJANGO_DEBUG=0`, hosts permitidos e cookies seguros. O segredo de desenvolvimento incluído nas configurações não deve ser usado em produção. HTTPS protege a senha e o token durante o transporte.

O sistema não inclui emissão fiscal, custo médio ou múltiplos depósitos.

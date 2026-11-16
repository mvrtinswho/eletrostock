# EletroStock Mobile

Aplicativo em React Native com Expo para acessar o estoque pelo celular. Ele usa a API Django da pasta principal e compartilha os mesmos cadastros do sistema web.

## Telas

- Login.
- Resumo do estoque e alertas de reposição.
- Materiais e histórico de movimentações.
- Categorias e fornecedores.
- Formulários de cadastro e edição.

As listagens possuem pesquisa e paginação. Na consulta de materiais, também é possível mostrar somente os itens abaixo do estoque mínimo.

## Executar

Use Node.js 24 e uma versão do Expo Go compatível com o SDK 58.

Na pasta principal, prepare o Django conforme o [README do projeto](../README.md) e abra `INICIAR_API_MOBILE.bat`. A API usa a porta 8001.

Em outro terminal, dentro da pasta `mobile`:

```bat
npm ci
npx expo login
npm start
```

Entre no Expo com a mesma conta usada no celular e leia o QR Code. Para iniciar pelos scripts do Windows, use `ABRIR_APP_MOBILE.bat` na pasta principal.

No login do EletroStock, informe:

- O endereço mostrado pela API, como `http://192.168.1.10:8001`.
- O usuário e a senha do Django.

O usuário precisa estar ativo e ter status de equipe. O superusuário criado na preparação já possui esse acesso.

## Conexão

Mantenha o computador e o celular na mesma rede Wi-Fi e deixe os terminais da API e do Expo abertos.

Para testar a API no navegador do celular, acesse `http://IP_DO_COMPUTADOR:8001/api/v1/health/`. A resposta deve indicar `"status": "ok"`.

Se o QR Code ficar carregando, execute `INICIAR_EXPO_TUNEL.bat` na pasta principal e leia o novo código. O túnel entrega o aplicativo, mas não disponibiliza a API Django fora da rede local.

Se aparecer erro de conta Expo, confira se o computador e o celular estão conectados à mesma conta. Depois do login, tente abrir o projeto novamente.

Ao trocar de computador, saia pelo menu **Mais** e informe o novo endereço na tela de login. No celular, `localhost` e `127.0.0.1` apontam para o próprio aparelho.

## Arquivos principais

| Arquivo | Função |
| --- | --- |
| `App.js` | Telas, navegação e formulários. |
| `src/api.js` | Requisições e tratamento de erros de conexão. |
| `src/schema.js` | Campos dos formulários e formatação dos valores. |
| `app.json` | Configuração do Expo. |

## API

Base das rotas: `/api/v1/`.

| Rota | Método | Função |
| --- | --- | --- |
| `health/` | GET | Verificar a conexão. |
| `auth/login/` | POST | Autenticar com usuário e senha. |
| `auth/me/` | GET | Consultar o usuário conectado. |
| `auth/logout/` | POST | Encerrar a sessão atual. |
| `dashboard/` | GET | Consultar os indicadores do estoque. |
| `<recurso>/` | GET / POST | Listar ou criar registros. |
| `<recurso>/<id>/` | GET / PUT | Consultar ou editar um registro. |

Os recursos são `materiais`, `categorias`, `fornecedores` e `movimentacoes`. As rotas protegidas recebem o cabeçalho `Authorization: Bearer TOKEN`.

As listagens aceitam `q` e `page`. Materiais também aceitam `baixo=1` e `categoria=<id>`.

A senha não é salva no app. O token fica no SecureStore e expira em sete dias. Ao sair com conexão, ele também é revogado no servidor. Se a saída ocorrer sem conexão, a cópia local é removida, mas o token permanece válido no servidor até expirar.

## Verificar o bundle Android

```bat
npm run export
```

Esse comando gera os arquivos em `dist/`. O aplicativo precisa da API para consultar e alterar o estoque.

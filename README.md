# EletroStock

Controle de estoque de materiais elétricos com aplicação web em Django e aplicativo mobile em React Native. Centraliza cadastros, entradas, saídas e alertas de reposição em uma única base de dados.

Desenvolvido como trabalho final de Desenvolvimento Web com Python e Django, com foco nas regras de movimentação de estoque e na integração entre web e mobile.

**Tecnologias:** Python · Django · SQLite · JavaScript · React Native · Expo

[Executar o projeto](#executar-no-computador) · [Aplicativo mobile](mobile/README.md) · [Arquitetura e decisões técnicas](docs/arquitetura.md) · [Testes](#testes)

## Funcionalidades

- Cadastro de materiais, categorias e fornecedores.
- Registro de entradas e saídas com origem ou destino do material.
- Consulta de saldo e histórico de movimentações.
- Pesquisa por nome, código e especificação técnica.
- Filtro por categoria e por materiais abaixo do estoque mínimo.
- Painel com resumo do estoque e valor estimado dos materiais.
- Administração dos cadastros pelo Django Admin.

## Organização dos dados

| Model | Finalidade |
| --- | --- |
| Categoria | Agrupa os materiais por tipo. |
| Fornecedor | Guarda os dados do fornecedor principal de cada material. |
| Material | Registra código, especificação, unidade, localização, custo e estoque mínimo. |
| Movimentacao | Registra as entradas e saídas de um material. |

Uma categoria e um fornecedor podem ter vários materiais. Cada material pode ter várias movimentações. As relações usam `ForeignKey`.

O model `ApiToken` guarda as sessões de acesso do aplicativo.

O saldo começa em zero e muda a cada movimentação. O sistema bloqueia saídas e correções que deixem o saldo negativo. Ao editar um lançamento, aplica somente a diferença na quantidade. O material de um lançamento já registrado não pode ser trocado.

## Destaques técnicos

- Validação de saldo nas entradas, saídas e correções de movimentações.
- Atualização de estoque com transações no banco de dados.
- Formulários Django compartilhados entre as telas web e a API para validar os cadastros.
- Acesso web por sessão e API mobile por token com validade de sete dias.
- Armazenamento do digest do token no servidor e uso do SecureStore no aplicativo.
- Testes de regras de negócio, páginas, cadastros e autenticação.

Veja os detalhes e as limitações em [Arquitetura e decisões técnicas](docs/arquitetura.md).

## Tecnologias

- Python e Django 5.2.
- SQLite.
- HTML e CSS.
- React Native com Expo SDK 58 para o aplicativo.

## Executar no computador

No Windows, use Python 3.12, 3.13 ou 3.14 com a opção **Add python.exe to PATH** marcada.

Abra `INICIAR.bat` na pasta do projeto. Na primeira execução, o script instala as dependências, prepara o banco e solicita a criação de um administrador.

Com o servidor aberto:

- Sistema: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- Admin: [http://127.0.0.1:8000/admin/](http://127.0.0.1:8000/admin/)

Para preparar pelo terminal, execute na pasta que contém `manage.py`:

```bat
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt
.venv\Scripts\python.exe manage.py preparar
.venv\Scripts\python.exe manage.py runserver
```

O comando `preparar` aplica as migrações e pede a criação de um superusuário caso ainda não exista um. Não há usuário ou senha padrão. Para encerrar o servidor, use Ctrl+C.

### Dados para teste

O banco não é enviado ao GitHub. Para incluir materiais fictícios, execute `DADOS_EXEMPLO.bat` ou:

```bat
.venv\Scripts\python.exe manage.py dados_exemplo
```

A carga inclui cabos, disjuntores, contatores, relés, sensores e fusíveis. Executar o comando novamente não duplica os registros já criados.

## Aplicativo no celular

O aplicativo fica na pasta `mobile`. Para usá-lo, instale o Expo Go no celular e Node.js 24 no computador.

1. Conecte o celular e o computador à mesma rede Wi-Fi.
2. Execute `INICIAR_API_MOBILE.bat` e anote o endereço exibido.
3. Na pasta `mobile`, execute `npx expo login` e entre na mesma conta Expo usada no celular.
4. Abra `ABRIR_APP_MOBILE.bat` e leia o QR Code.
5. Na tela do EletroStock, informe o endereço da API e entre com o usuário criado no Django.

As contas têm funções diferentes: a conta Expo abre o projeto no Expo Go; a conta Django dá acesso aos dados do EletroStock.

Se houver dificuldade ao abrir o QR Code pela rede local, use `INICIAR_EXPO_TUNEL.bat`. A API ainda precisa estar acessível pelo celular. Mais detalhes estão em [mobile/README.md](mobile/README.md).

## Estrutura do projeto

| Pasta ou arquivo | Conteúdo |
| --- | --- |
| `config/` | Configurações do Django e rotas principais. |
| `estoque/models.py` | Models e regras de atualização do saldo. |
| `estoque/forms.py` | Formulários dos cadastros. |
| `estoque/views.py` | Views do sistema web. |
| `estoque/api.py` | API utilizada pelo aplicativo. |
| `estoque/admin.py` | Configuração do Django Admin. |
| `templates/` | Páginas de listagem, detalhes, cadastro, edição e login. |
| `static/` | Estilos do sistema web. |
| `mobile/` | Aplicativo React Native. |

A parte web segue a arquitetura MTV: os models representam os dados, as views tratam as requisições e os templates exibem as páginas.

## Testes

```bat
.venv\Scripts\python.exe manage.py test
```

Os testes verificam as regras de estoque, os cadastros, as páginas, o acesso ao Admin e a autenticação da API.

## Observações

O projeto está preparado para demonstração local. O aplicativo depende da API em execução e não possui modo offline.

O valor do estoque é uma estimativa calculada pelo saldo e pelo custo unitário cadastrado. Não há cálculo de custo médio, emissão de nota fiscal ou controle de múltiplos depósitos.

O arquivo `db.sqlite3`, as dependências e as configurações locais ficam fora do versionamento. Para publicar o servidor na internet, é necessário configurar HTTPS, chave secreta própria e desativar o modo de depuração.

## Autor

[Hiago Martins](https://github.com/mvrtinswho)

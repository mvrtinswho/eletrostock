# EletroStock — Documentação do Projeto

**Sistema de controle de estoque de materiais elétricos**

| Identificação | Informação |
| --- | --- |
| Autor | Hiago Martins |
| Curso | Análise e Desenvolvimento de Sistemas |
| Contexto | Trabalho acadêmico de Desenvolvimento Web com Python e Django |
| Data desta documentação | 16 de novembro de 2026 |
| Código-fonte | [github.com/mvrtinswho/eletrostock](https://github.com/mvrtinswho/eletrostock) |

Esta documentação descreve a implementação disponível no repositório na data indicada. Os requisitos abaixo foram organizados a partir das funcionalidades existentes; não substituem o enunciado de avaliação da disciplina. A cópia do pendrive pode conter scripts de preparação adicionais que não estão no repositório.

## Sumário

1. [Apresentação e objetivo](#1-apresentação-e-objetivo)
2. [Escopo e requisitos](#2-escopo-e-requisitos)
3. [Tecnologias](#3-tecnologias)
4. [Arquitetura MTV](#4-arquitetura-mtv)
5. [Modelagem de dados](#5-modelagem-de-dados)
6. [Regras de negócio](#6-regras-de-negócio)
7. [Telas e utilização](#7-telas-e-utilização)
8. [Autenticação e acesso](#8-autenticação-e-acesso)
9. [API e aplicativo mobile](#9-api-e-aplicativo-mobile)
10. [Instalação e execução](#10-instalação-e-execução)
11. [Testes e verificação](#11-testes-e-verificação)
12. [Versionamento e cópia de segurança](#12-versionamento-e-cópia-de-segurança)
13. [Limitações e evoluções](#13-limitações-e-evoluções)
14. [Roteiro de apresentação](#14-roteiro-de-apresentação)
15. [Mapa dos arquivos](#15-mapa-dos-arquivos)

## 1. Apresentação e objetivo

O EletroStock é um sistema de controle de estoque de materiais elétricos, pensado para organizar materiais utilizados em usinas e indústrias. A aplicação permite cadastrar materiais, categorias e fornecedores, registrar movimentações e consultar saldos e histórico.

O problema tratado é a dificuldade de acompanhar entradas, saídas e necessidades de reposição quando essas informações ficam dispersas. O sistema centraliza os registros e aplica regras para evitar movimentações que deixem o saldo negativo.

O objetivo geral é disponibilizar uma aplicação web para gestão do estoque, com um aplicativo mobile integrado à mesma base de dados por meio de uma API.

### Objetivos específicos

- Organizar os cadastros de materiais, categorias e fornecedores.
- Registrar entradas e saídas com a origem ou o destino do material.
- Atualizar o saldo a partir das movimentações.
- Identificar materiais abaixo do estoque mínimo.
- Facilitar consultas com pesquisa, filtros e paginação.
- Disponibilizar indicadores e histórico de movimentações.
- Proteger o acesso por autenticação.
- Aplicar a arquitetura MTV e o ORM do Django.

## 2. Escopo e requisitos

O público previsto é formado por usuários responsáveis pelo controle de materiais. O acesso à aplicação exige uma conta ativa com status de equipe; o superusuário criado na preparação já possui esse acesso.

### Requisitos funcionais implementados

| Código | Requisito | Implementação principal |
| --- | --- | --- |
| RF01 | Autenticar o usuário e encerrar a sessão web. | Views de autenticação do Django. |
| RF02 | Cadastrar, listar, consultar e editar categorias. | Model Categoria, formulário e views. |
| RF03 | Cadastrar, listar, consultar e editar fornecedores. | Model Fornecedor, formulário e views. |
| RF04 | Cadastrar, listar, consultar e editar materiais. | Model Material, formulário e views. |
| RF05 | Registrar e consultar entradas e saídas. | Model Movimentacao e suas telas. |
| RF06 | Corrigir movimentações sem trocar o material registrado. | Validação no model e no formulário. |
| RF07 | Consultar saldo e histórico por material. | Detalhamento do material. |
| RF08 | Pesquisar e filtrar materiais. | Pesquisa por nome, código e especificação; filtros de categoria e estoque baixo. |
| RF09 | Exibir indicadores do estoque. | Dashboard web e endpoint da API. |
| RF10 | Administrar cadastros pelo Django Admin. | Configuração em estoque/admin.py. |
| RF11 | Consultar e alterar dados pelo aplicativo mobile. | API JSON e cliente React Native. |

A aplicação oferece operações de cadastro, consulta e edição. Não há fluxo de exclusão nas telas próprias nem endpoint DELETE na API. A exclusão de movimentações é bloqueada no Django Admin.

### Características técnicas

| Aspecto | Implementação |
| --- | --- |
| Persistência | SQLite, acessado pelo ORM do Django. |
| Organização | Separação de models, formulários, views, templates e API. |
| Integridade | Chaves estrangeiras, restrições de banco e validações de negócio. |
| Interface | Páginas web em HTML/CSS e aplicativo React Native. |
| Validação | ModelForms compartilhados pela web e pela API. |
| Testabilidade | Testes automatizados com django.test.TestCase. |

Não foram realizados novos testes de carga, usabilidade ou desempenho durante a elaboração desta documentação.

## 3. Tecnologias

| Tecnologia | Uso no projeto |
| --- | --- |
| Python | Linguagem do backend. |
| Django 5.2 | Framework web, ORM, autenticação, formulários, Admin e testes. |
| SQLite | Banco de dados local no arquivo db.sqlite3. |
| HTML e CSS | Estrutura e estilo das páginas web. |
| JavaScript | Código do aplicativo mobile. |
| React Native e Expo | Interface mobile; o README informa Expo SDK 58. |
| Git e GitHub | Histórico e armazenamento do código-fonte. |

A configuração usa português do Brasil e o fuso horário America/Sao_Paulo.

## 4. Arquitetura MTV

MTV significa **Model, Template e View**. É a organização utilizada pela parte web do projeto.

| Camada | Responsabilidade | Exemplos no EletroStock |
| --- | --- | --- |
| Model | Representar os dados, relacionamentos e regras de negócio. | Categoria, Fornecedor, Material e Movimentacao em estoque/models.py. |
| Template | Apresentar os dados e formulários ao usuário. | templates/estoque/list.html, detail.html, form.html e dashboard.html. |
| View | Receber a requisição, consultar os dados e preparar a resposta. | dashboard, listing, detail e edit em estoque/views.py. |

As URLs encaminham cada requisição para a view correspondente. Os formulários validam os dados antes de serem persistidos.

### Exemplo: consultar os materiais

1. O navegador solicita /materiais/.
2. A configuração de URLs direciona a requisição à view listing.
3. O decorador staff exige autenticação e status de equipe.
4. A view consulta o model Material, aplica pesquisa e filtros e pagina os resultados.
5. O template estoque/list.html recebe os dados.
6. O Django devolve a página HTML ao navegador.

### Exemplo: registrar uma movimentação

1. O usuário preenche o formulário de entrada ou saída.
2. A view recebe os dados por POST.
3. MovimentacaoForm valida os campos.
4. O model valida a movimentação e atualiza o saldo em uma transação.
5. Se houver erro, a tela apresenta a mensagem; se houver sucesso, a aplicação redireciona para os detalhes do registro.

O cliente mobile usa os mesmos models e formulários por meio da API. Nesse fluxo, a resposta é JSON, e a apresentação fica a cargo do React Native, sem usar os templates HTML.

## 5. Modelagem de dados

O projeto tem **quatro models de negócio** e um model auxiliar de autenticação mobile, ApiToken. Os usuários são gerenciados pelo sistema de autenticação do Django.

### 5.1 Categoria

Agrupa materiais por tipo.

| Campo | Tipo | Regra |
| --- | --- | --- |
| id | Identificador automático | Chave primária. |
| nome | CharField, até 100 caracteres | Obrigatório e único. |
| descricao | TextField | Opcional. |

### 5.2 Fornecedor

Representa o fornecedor principal associado aos materiais.

| Campo | Tipo | Regra |
| --- | --- | --- |
| id | Identificador automático | Chave primária. |
| nome | CharField, até 150 caracteres | Obrigatório. |
| cnpj | CharField, até 14 caracteres | Único; a validação exige exatamente 14 algarismos. |
| telefone | CharField, até 25 caracteres | Opcional. |
| email | EmailField | Opcional, com validação de formato. |

A validação implementada para CNPJ verifica quantidade e tipo dos caracteres. Ela não calcula os dígitos verificadores nem consulta situação cadastral.

### 5.3 Material

Representa um item controlado no estoque.

| Campo | Tipo | Regra |
| --- | --- | --- |
| id | Identificador automático | Chave primária. |
| codigo | CharField, até 30 caracteres | Obrigatório e único. |
| nome | CharField, até 150 caracteres | Obrigatório. |
| especificacao | TextField | Opcional. |
| categoria | ForeignKey para Categoria | Obrigatória; exclusão protegida. |
| fornecedor | ForeignKey para Fornecedor | Obrigatório; exclusão protegida. |
| unidade | CharField | UN, M, KG, RL ou CX. |
| estoque_minimo | DecimalField, 12 dígitos e 2 casas decimais | Não negativo. |
| saldo | DecimalField, 12 dígitos e 2 casas decimais | Inicia em zero; não editável nos formulários. |
| localizacao | CharField, até 100 caracteres | Opcional. |
| preco | DecimalField, 12 dígitos e 2 casas decimais | Custo unitário não negativo. |

A propriedade baixo_estoque retorna verdadeiro quando saldo é menor que estoque_minimo. A igualdade com o mínimo não é considerada estoque baixo.

### 5.4 Movimentacao

Registra uma entrada ou saída de material.

| Campo | Tipo | Regra |
| --- | --- | --- |
| id | Identificador automático | Chave primária. |
| material | ForeignKey para Material | Obrigatório; não pode ser trocado após o registro. |
| tipo | CharField | E para entrada ou S para saída. |
| quantidade | DecimalField, 12 dígitos e 2 casas decimais | Positiva; validação mínima de 0,01. |
| referencia | CharField, até 150 caracteres | Origem ou destino do material. |
| observacao | TextField | Opcional. |
| criado_em | DateTimeField | Preenchido na criação do registro. |

O histórico é ordenado pelas movimentações mais recentes.

### 5.5 ApiToken

Armazena as sessões de acesso do aplicativo mobile.

| Campo | Finalidade |
| --- | --- |
| user | Chave estrangeira para o usuário Django. |
| digest | Resumo SHA-256 do token, único, com 64 caracteres. |
| created_at | Data e hora de criação. |
| expires_at | Data e hora de expiração. |

O token em texto puro não é armazenado nesse model.

### 5.6 Relacionamentos

| Origem | Relação | Destino |
| --- | --- | --- |
| Categoria | Uma categoria pode possuir muitos materiais. | Material |
| Fornecedor | Um fornecedor pode ser principal de muitos materiais. | Material |
| Material | Um material pode possuir muitas movimentações. | Movimentacao |
| Usuário Django | Um usuário pode possuir muitos tokens mobile. | ApiToken |

Cada material tem uma categoria e um fornecedor principal. Cada movimentação pertence a um único material.

Categoria, fornecedor e material usam relações PROTECT nos vínculos de estoque: um registro referenciado não pode ser excluído enquanto houver registros dependentes. ApiToken usa CASCADE para o usuário.

## 6. Regras de negócio

| Código | Regra |
| --- | --- |
| RN01 | Um novo material inicia com saldo zero. |
| RN02 | Uma entrada acrescenta sua quantidade ao saldo. |
| RN03 | Uma saída desconta sua quantidade do saldo. |
| RN04 | Movimentações e correções não podem deixar saldo negativo. |
| RN05 | A quantidade de uma movimentação deve ser positiva. |
| RN06 | A edição de uma movimentação aplica somente a diferença em relação ao efeito anterior. |
| RN07 | O material de uma movimentação existente não pode ser trocado. |
| RN08 | O saldo é controlado pelas movimentações, não pelo formulário de edição do material. |
| RN09 | O método de exclusão de movimentações e a exclusão pelo Admin são bloqueados; correções usam edição. |
| RN10 | Há alerta quando o saldo é inferior ao estoque mínimo. |

### Exemplo de cálculo

Um material começa com saldo zero.

| Operação | Alteração | Saldo resultante |
| --- | --- | --- |
| Entrada de 20 unidades | +20 | 20 |
| Saída de 3 unidades | -3 | 17 |
| Correção da saída de 3 para 5 unidades | -2 adicionais | 15 |

Tentar registrar uma nova saída de 16 unidades seria rejeitado, pois o saldo disponível é 15.

Na implementação, Movimentacao.save utiliza transaction.atomic e expressões F para atualizar o saldo no banco. As restrições saldo_nao_negativo e quantidade_positiva complementam as validações.

O valor apresentado no painel é a soma de saldo multiplicado pelo custo unitário de cada material. É uma estimativa, sem cálculo de custo médio.

## 7. Telas e utilização

| Tela | Recursos |
| --- | --- |
| Login | Entrada com usuário e senha. |
| Painel | Quantidade de materiais, fornecedores, valor estimado, itens abaixo do mínimo e movimentações recentes. |
| Materiais | Listagem, pesquisa, filtros, cadastro, consulta e edição. |
| Categorias | Listagem, pesquisa, cadastro, consulta e edição. |
| Fornecedores | Listagem, pesquisa, cadastro, consulta e edição. |
| Movimentações | Entradas, saídas, pesquisa, consulta e correção de lançamentos. |
| Detalhes do material | Campos cadastrados e até 15 movimentações recentes. |
| Django Admin | Administração dos cadastros com pesquisa e filtros. |

As listagens web são paginadas com 12 registros por página.

### Fluxo básico de utilização

1. Entrar com uma conta autorizada.
2. Cadastrar uma categoria e um fornecedor.
3. Cadastrar o material com código, unidade, mínimo e custo.
4. Registrar uma entrada para formar o saldo inicial.
5. Registrar uma saída com seu destino.
6. Consultar o saldo, o histórico e os alertas de reposição.

### Rotas web

| Caminho | Função |
| --- | --- |
| / | Painel inicial. |
| /entrar/ | Login. |
| /sair/ | Logout por POST. |
| /admin/ | Administração Django. |
| /<secao>/ | Listagem. |
| /<secao>/novo/ | Cadastro. |
| /<secao>/<id>/ | Detalhamento. |
| /<secao>/<id>/editar/ | Edição. |

As seções válidas da aplicação são materiais, categorias, fornecedores e movimentacoes.

## 8. Autenticação e acesso

### Aplicação web

O login utiliza LoginView e AdminAuthenticationForm. A aplicação exige usuário ativo e com status de equipe. O decorador staff combina login_required com a verificação de is_staff nas views de estoque.

As sessões são gerenciadas pelo Django. Os formulários web usam a proteção CSRF. Após login, o destino padrão é o painel; após logout, a tela de login.

### Aplicativo mobile

A API recebe usuário e senha em JSON, valida as credenciais pelo Django e emite um token aleatório válido por sete dias.

- O servidor guarda somente o digest SHA-256 do token.
- O cliente envia Authorization: Bearer <token> nas rotas protegidas.
- Cada requisição verifica validade e o status ativo/equipe do usuário.
- O logout revoga o token utilizado.
- O aplicativo guarda a sessão no SecureStore nativo e não persiste a senha.
- Não existe renovação automática por refresh token.

Se o logout ocorrer sem conexão, a sessão local é removida, mas o token no servidor pode continuar válido até expirar.

O login da API limita tentativas por IP e usuário usando o cache do Django: ao alcançar dez falhas acumuladas no contador, retorna HTTP 429. A configuração atual não define cache compartilhado entre processos.

O controle da aplicação é amplo por status de equipe; a API não implementa permissões específicas por registro ou operação.

## 9. API e aplicativo mobile

A API fica sob o prefixo /api/v1/. O aplicativo e a interface web usam o mesmo banco do backend; não existe uma cópia independente do estoque no celular.

| Método | Caminho | Autenticação | Finalidade |
| --- | --- | --- | --- |
| GET | /api/v1/health/ | Pública | Verificar o serviço. |
| POST | /api/v1/auth/login/ | Credenciais no JSON | Obter token. |
| GET | /api/v1/auth/me/ | Bearer token | Consultar o usuário conectado. |
| POST | /api/v1/auth/logout/ | Bearer token | Revogar a sessão atual. |
| GET | /api/v1/dashboard/ | Bearer token | Consultar os indicadores. |
| GET | /api/v1/<recurso>/ | Bearer token | Listar registros. |
| POST | /api/v1/<recurso>/ | Bearer token | Criar registro. |
| GET | /api/v1/<recurso>/<id>/ | Bearer token | Consultar registro. |
| PUT | /api/v1/<recurso>/<id>/ | Bearer token | Editar registro. |

Os recursos são materiais, categorias, fornecedores e movimentacoes. As listagens da API usam 20 registros por página.

Os parâmetros q e page controlam pesquisa e paginação. Em materiais, baixo=1 filtra itens abaixo do mínimo, e categoria=<id> filtra a categoria.

### Códigos de resposta

| Código | Situação |
| --- | --- |
| 200 | Consulta, edição, login ou logout concluído. |
| 201 | Cadastro criado. |
| 400 | Dados inválidos ou regra de negócio não atendida. |
| 401 | Token ausente, inválido ou expirado, ou acesso não autorizado. |
| 404 | Recurso ou registro inexistente. |
| 405 | Método HTTP não permitido. |
| 429 | Limite de tentativas de login alcançado. |

A API exige token explicitamente; a sessão do navegador não substitui essa autenticação. Os endpoints da API são isentos de CSRF.

## 10. Instalação e execução

### 10.1 Versão web no Windows

O README do projeto orienta utilizar Python 3.12, 3.13 ou 3.14 com a opção Add python.exe to PATH marcada.

1. Copiar a pasta completa para o computador.
2. Se o projeto estiver em ZIP, extrair todos os arquivos.
3. Executar INICIAR.bat na pasta principal.
4. Aguardar a preparação do ambiente e seguir o cadastro do administrador, caso solicitado.
5. Manter a janela do servidor aberta.
6. Acessar http://127.0.0.1:8000/ no navegador.

Na primeira preparação, o computador precisa de internet para baixar as dependências. Depois de instalado, o sistema web local pode ser usado sem conexão com a internet.

### 10.2 Preparação pelo terminal

Executar na pasta que contém manage.py e requirements.txt:

~~~bat
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt
.venv\Scripts\python.exe manage.py preparar
.venv\Scripts\python.exe manage.py runserver
~~~

O comando preparar aplica as migrações e solicita a criação de um superusuário se ainda não existir um. O projeto não define usuário ou senha padrão.

### 10.3 Dados de exemplo

Para popular uma instalação de demonstração com dados fictícios:

~~~bat
.venv\Scripts\python.exe manage.py dados_exemplo
~~~

Também existe DADOS_EXEMPLO.bat. A carga foi projetada para não duplicar os registros de exemplo em execuções repetidas.

### 10.4 Aplicativo no celular

O README mobile orienta usar Node.js 24 e Expo Go compatível com o SDK 58.

1. Preparar o backend.
2. Executar INICIAR_API_MOBILE.bat; a API mobile usa a porta 8001.
3. Conectar notebook e celular a uma rede que permita comunicação entre eles.
4. Na pasta mobile, instalar as dependências e iniciar o Expo:

~~~bat
npm ci
npx expo login
npm start
~~~

5. Abrir o projeto no Expo Go pelo QR Code.
6. Informar no EletroStock o endereço da API exibido no notebook.
7. Entrar com o usuário Django ativo e com status de equipe.

A conta Expo abre o projeto no Expo Go. A conta Django autoriza o acesso ao estoque. No celular, localhost e 127.0.0.1 apontam para o próprio aparelho, não para o notebook.

O script INICIAR_EXPO_TUNEL.bat é uma alternativa para entregar o projeto Expo. Ele não torna a API Django automaticamente acessível fora da rede local.

### 10.5 Transporte por pendrive

Copiar a pasta completa e manter os arquivos do projeto juntos. A cópia do banco db.sqlite3 é necessária para levar os cadastros e usuários existentes; baixar somente o código do GitHub não leva esse banco.

Ambientes virtuais não devem ser considerados portáteis entre computadores: prepare as dependências no notebook de destino. Se a distribuição EletroStock_PENDRIVE possuir PREPARAR_NOTEBOOK.bat, use esse script conforme as orientações do pacote. Esse arquivo adicional não foi verificado no código do repositório nesta revisão.

## 11. Testes e verificação

Os testes estão organizados em dois arquivos:

| Arquivo | Cenários cobertos |
| --- | --- |
| estoque/tests.py | Entradas e saídas, saldo insuficiente, correção de lançamentos, quantidades inválidas e fracionárias, alteração indevida do material, páginas, cadastros, login, relacionamentos protegidos e restrições do Admin. |
| estoque/test_api.py | Proteção por token, rejeição de sessão web como autorização da API, digest do token, logout, expiração, exigência de equipe, limitação de login, cadastros, edições, filtros, paginação e erros de requisição. |

Para executar:

~~~bat
.venv\Scripts\python.exe manage.py test
~~~

Os arquivos foram inspecionados para elaborar esta documentação. **A suíte não foi executada nesta revisão**, pois o ambiente de execução estava indisponível. Portanto, este documento descreve os testes existentes, sem declarar uma nova execução aprovada.

### Verificação manual para a apresentação

1. Abrir o painel e confirmar que há dados.
2. Consultar um material e seu histórico.
3. Registrar uma entrada e conferir o aumento do saldo.
4. Registrar uma saída e conferir a redução.
5. Tentar uma saída acima do saldo disponível e observar a mensagem.
6. Filtrar materiais abaixo do estoque mínimo.
7. Encerrar a sessão e conferir o retorno ao login.

## 12. Versionamento e cópia de segurança

O repositório está disponível em:

https://github.com/mvrtinswho/eletrostock

O Git registra as alterações do código, enquanto o GitHub permite consultar arquivos e histórico de commits. Alterações posteriores ao envio para o GitHub não aparecem automaticamente na cópia já gravada no pendrive.

O arquivo db.sqlite3 não é versionado. Por isso, versionamento do código e cópia de segurança dos dados têm finalidades diferentes.

Para transportar os dados de uma demonstração local, encerre os processos do servidor e copie a pasta com o banco antes de iniciar o sistema no outro computador. Preserve uma cópia anterior dos dados antes de sobrescrever arquivos.

## 13. Limitações e evoluções

### Limitações atuais

- Projeto preparado para demonstração local.
- Aplicativo mobile dependente da API, sem modo offline.
- Ausência de emissão de nota fiscal.
- Ausência de cálculo de custo médio.
- Ausência de controle de múltiplos depósitos.
- Permissões da API baseadas no status de equipe, sem divisão por operação.
- Ausência de fluxo próprio de exclusão nas telas web e na API.
- Não há trilha completa de auditoria por usuário; o model de movimentação não registra o responsável pelo lançamento.

Para publicar em produção, é necessário preparar a implantação: HTTPS, chave secreta própria, modo de depuração desativado, hosts permitidos, configuração de cookies e estratégia de backup. O servidor de desenvolvimento não deve ser tratado como uma implantação pronta para uso público.

### Possíveis evoluções, ainda não implementadas

- Relatórios e exportações.
- Perfis de acesso com permissões específicas.
- Identificação do usuário responsável por cada movimentação.
- Suporte a múltiplos depósitos.
- Rotina automatizada de backup.
- Implantação com infraestrutura adequada para produção.

## 14. Roteiro de apresentação

| Etapa | O que mostrar | O que explicar |
| --- | --- | --- |
| 1 | Tela inicial e login | O sistema organiza estoque de materiais elétricos e exige acesso autorizado. |
| 2 | Dashboard | Indicadores, valor estimado e itens abaixo do mínimo. |
| 3 | Categorias e fornecedores | Cadastros relacionados aos materiais. |
| 4 | Material | Código, unidade, custo, mínimo e saldo. |
| 5 | Entrada e saída | O saldo muda com as movimentações. |
| 6 | Validação de saída | A aplicação rejeita uma quantidade que deixe saldo negativo. |
| 7 | Código | Localização de Model, Template e View. |
| 8 | Mobile, se preparado | A API permite acessar o mesmo estoque pelo celular. |

### Explicações curtas para perguntas

**O que é MTV?**  
É a separação entre Model, que representa dados e regras; Template, que apresenta as páginas; e View, que recebe e trata as requisições.

**Quantos models existem?**  
Quatro models de negócio: Categoria, Fornecedor, Material e Movimentacao. Existe também ApiToken, auxiliar da autenticação mobile.

**Onde ficam os dados?**  
No banco SQLite, no arquivo db.sqlite3 do backend.

**Como web e celular compartilham o estoque?**  
O aplicativo envia requisições à API Django, que consulta e altera o mesmo banco usado pela aplicação web.

**O projeto usa CRUD?**  
Há criação, leitura e atualização. A exclusão não é oferecida nas telas próprias nem na API; as movimentações têm restrições para preservar o histórico.

**Qual a diferença entre model e MTV?**  
Model é uma camada da arquitetura e também o nome das classes que representam entidades. MTV é o conjunto das três camadas; não significa que o projeto deva ter exatamente três classes de model.

## 15. Mapa dos arquivos

| Arquivo ou pasta | Responsabilidade |
| --- | --- |
| ../manage.py | Entrada dos comandos de administração Django. |
| ../config/settings.py | Configurações de banco, middleware, aplicações e ambiente. |
| ../config/urls.py | Rotas principais, login, logout, Admin e inclusão da API. |
| ../estoque/models.py | Entidades, relacionamentos e regras de saldo. |
| ../estoque/forms.py | Formulários e validação dos cadastros. |
| ../estoque/views.py | Tratamento das páginas web. |
| ../estoque/urls.py | Rotas das páginas de estoque. |
| ../estoque/admin.py | Configuração do Django Admin. |
| ../estoque/api.py | Autenticação por token e operações JSON. |
| ../estoque/api_urls.py | Rotas da API. |
| ../estoque/migrations/ | Evolução da estrutura do banco de dados. |
| ../estoque/tests.py | Testes de estoque e interface web. |
| ../estoque/test_api.py | Testes da API e autenticação. |
| ../templates/ | Templates HTML. |
| ../static/ | Estilos da aplicação web. |
| ../mobile/ | Código do aplicativo React Native. |
| ../README.md | Instruções gerais do projeto. |
| ../mobile/README.md | Instruções de execução e uso do aplicativo. |

Os links abaixo permitem conferir os pontos principais no código:

- [Models e regras de negócio](../estoque/models.py).
- [Formulários](../estoque/forms.py).
- [Views web](../estoque/views.py).
- [API](../estoque/api.py).
- [Testes de estoque](../estoque/tests.py).
- [Testes da API](../estoque/test_api.py).
- [Instruções gerais](../README.md).

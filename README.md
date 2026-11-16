# EletroStock — Estoque de materiais elétricos
Projeto acadêmico de Desenvolvimento Web com Python e Django, voltado a materiais elétricos usados em usinas e indústrias.

## Executar no Windows
1. Instale Python 3.12 ou superior com a opção **Add python.exe to PATH**.
2. **Extraia o ZIP inteiro**. Não execute os arquivos dentro da pasta compactada.
3. Abra a pasta EletroStock que contém **manage.py, requirements.txt e INICIAR.bat**.
4. Dê dois cliques em **INICIAR.bat** e aguarde a instalação.
5. Na primeira execução, crie seu usuário administrador. A senha não aparece enquanto você digita. Guarde suas credenciais.
6. Com o terminal aberto, acesse http://127.0.0.1:8000 e entre com essa conta.
7. Opcional: execute **DADOS_EXEMPLO.bat** para cadastrar materiais fictícios. Atualize a página.
8. Para encerrar o servidor, pressione Ctrl+C no terminal.

Não existe senha padrão. Se esquecer a senha: `.venv\Scripts\python.exe manage.py changepassword SEU_USUARIO`.
O banco SQLite será criado automaticamente. Mantenha uma cópia dele para preservar os registros.

## Instalação manual
Execute no terminal **dentro da pasta que contém manage.py**:
```bat
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt
.venv\Scripts\python.exe manage.py preparar
.venv\Scripts\python.exe manage.py dados_exemplo
.venv\Scripts\python.exe manage.py runserver
```
No Linux/macOS, substitua `.venv\Scripts\python.exe` por `.venv/bin/python`.
Admin: http://127.0.0.1:8000/admin/
O sistema requer usuário ativo com **status de equipe**; superusuários já têm acesso.

## Requisitos atendidos
| Requisito | Implementação |
|---|---|
| Aplicação MTV | Models em estoque/models.py; Templates em templates/; Views em estoque/views.py |
| Pelo menos 3 models relacionados | Categoria, Fornecedor, Material e Movimentacao |
| Administração pelo Django Admin | Todos os quatro models registrados em estoque/admin.py |
| Listar registros | /materiais/, /categorias/, /fornecedores/ e /movimentacoes/ |
| Detalhes | /<seção>/<id>/ |
| Editar registro | /<seção>/<id>/editar/ |
| Criar registro | /<seção>/novo/ |
| GitHub | Código preparado com .gitignore e instruções abaixo; publicação deve ser concluída na sua conta |

## Models e relacionamentos
- **Categoria → Material:** uma categoria agrupa vários materiais.
- **Fornecedor → Material:** um fornecedor principal fornece vários materiais.
- **Material → Movimentacao:** um material possui várias entradas e saídas.
- Relações usam ForeignKey com PROTECT para impedir exclusão de cadastros em uso.

Material inclui código único, nome, especificação técnica, categoria, fornecedor, unidade, estoque mínimo, localização e custo unitário.
Movimentação registra tipo, quantidade, origem/destino, observação e data automática.

## Funcionalidades e regras
- Dashboard com número de materiais, fornecedores, alertas e valor estimado (saldo × custo atual cadastrado).
- Pesquisa por nome, código e especificação; filtro por categoria e estoque baixo; paginação.
- Cadastro, listagem, detalhes e edição para os quatro models.
- Saldo inicia em zero e é atualizado automaticamente, inclusive pelo Admin.
- Quantidades fracionárias suportadas (metros e quilogramas).
- Saídas e correções que deixem o saldo atual negativo são bloqueadas.
- Editar uma movimentação aplica apenas a diferença ao saldo; não troca o material.
- Movimentações não têm exclusão nas telas nem no Admin. Correções são feitas por edição.
- Datas de lançamento são automáticas; o projeto não calcula saldos históricos retroativos.
- Abaixo do mínimo significa saldo **menor** que o mínimo (igual ao mínimo não gera alerta).
- CNPJ é validado por formato de 14 números, sem cálculo dos dígitos verificadores.
- Login, proteção CSRF, escape de conteúdo e acesso restrito a funcionários.

## Testes
```bat
.venv\Scripts\python.exe manage.py check
.venv\Scripts\python.exe manage.py test
.venv\Scripts\python.exe manage.py makemigrations --check --dry-run
```
Testes cobrem saldos, estoque insuficiente, correções, frações, relacionamentos protegidos, páginas dos quatro cadastros, autenticação, Admin e carga de demonstração.

## Histórico Git incluído
O arquivo historico.bundle preserva os commits de criação. Para restaurar esse histórico, execute na pasta EletroStock:

```bat
git clone historico.bundle ..\EletroStock-versionado
cd ..\EletroStock-versionado
```
Depois configure o remoto e execute git push seguindo a seção abaixo. Você também pode começar um repositório novo com git init.

## Versionamento no GitHub
Crie um repositório vazio chamado **eletrostock-django** na sua conta do GitHub, sem adicionar README. Na pasta do projeto:
```bat
git init
git branch -M main
git add .
git commit -m "Cria sistema EletroStock com Django"
git remote add origin https://github.com/SEU_USUARIO/eletrostock-django.git
git push -u origin main
```
Substitua SEU_USUARIO pelo seu usuário real. Se a pasta já tiver Git e o commit inicial, pule esses passos e configure apenas o remoto.
Faça novos commits a cada etapa do seu desenvolvimento. Confira o código publicado no site do GitHub e entregue o link ao professor.
Não versione o banco, a pasta .venv nem senhas. O ZIP contém apenas código, migrações e documentação, sem contas pré-criadas.

## Estrutura
- config/: configurações, rotas globais e WSGI.
- estoque/models.py: estrutura de dados e regras do estoque.
- estoque/forms.py: formulários baseados nos models.
- estoque/views.py e urls.py: requisições, consultas, páginas e rotas.
- estoque/admin.py: administração.
- estoque/migrations/: estrutura reproduzível do banco.
- estoque/management/commands/: preparação e dados fictícios.
- estoque/tests.py: testes automatizados.
- templates/: layout, login, listagem, detalhes, cadastro e edição.
- static/style.css: estilos responsivos; fontes do Google são opcionais, com alternativas locais.

## Roteiro de apresentação
1. Explique o problema: controlar materiais elétricos e evitar falta de peças.
2. Mostre os quatro models e suas ForeignKeys.
3. Faça login e apresente o dashboard.
4. Cadastre categoria e fornecedor; depois, um material com mínimo 5.
5. Registre entrada de 20 e saída de 3: o saldo fica 17.
6. Tente retirar 18: o sistema apresenta erro e mantém o saldo.
7. Edite a saída de 3 para 4: o saldo fica 16.
8. Mostre detalhes, pesquisa e filtro por estoque baixo.
9. Abra o Admin e mostre os mesmos cadastros.
10. Explique MTV: URL chama View, View consulta Model e renderiza Template.
11. Mostre os testes e o histórico de commits no GitHub.

## Limites e publicação
Projeto acadêmico para execução local. Não contempla nota fiscal, compras, múltiplos depósitos, custo médio, trilha de auditoria de edições ou permissões por setor.
As telas permitem funcionários administrarem todos os registros; utilize superusuário na demonstração.
As regras de saldo dependem de salvar movimentações pelo método save; não use bulk_create, QuerySet.update/delete nem SQL direto nesses registros.
Para publicar em produção, configure chave secreta própria, DEBUG=0, hosts, HTTPS, arquivos estáticos e servidor WSGI. Não utilize runserver como servidor de produção.
Dependência: Django 5.2.19 (LTS), documentado em https://www.djangoproject.com/download/.

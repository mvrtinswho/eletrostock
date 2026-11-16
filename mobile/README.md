# EletroStock Mobile — Expo Go
Aplicativo nativo em React Native/Expo conectado ao backend Django do projeto pai.
Inclui login, dashboard, busca, filtros de estoque baixo, paginação, detalhes, cadastro e edição dos quatro recursos.

## Começar no Windows
1. Instale o Expo Go compatível no celular e Node.js LTS no computador (https://nodejs.org/). Se esta pasta já tiver o Node portátil preparado, não precisa instalar Node globalmente.
2. Conecte computador e celular à mesma rede Wi-Fi.
3. Na pasta principal EletroStock, abra **INICIAR_API_MOBILE.bat**. Crie seu administrador caso ainda não exista.
4. Mantenha essa janela aberta. Ela informa o endereço do computador, por exemplo **http://192.168.1.10:8001**.
5. Abra **INICIAR_EXPO.bat** nesta pasta. Aguarde a instalação, se necessária.
6. Leia o QR Code no Expo Go. No iPhone, use a Câmera para abrir o link, conforme a versão do Expo Go disponível.
7. Na tela do aplicativo, confirme o endereço do computador (porta **8001**) e entre com a mesma conta do Django.
8. Mantenha os dois terminais abertos durante o uso. Pare com Ctrl+C.

O endereço sugerido é calculado a partir do servidor do Expo em conexões LAN. Confira-o antes de entrar.
**127.0.0.1 e localhost no celular apontam para o próprio celular**, não para o computador.

## Rodar pelo terminal
Na pasta principal:
```bat
.venv\Scripts\python.exe manage.py preparar
.venv\Scripts\python.exe manage.py iniciar_mobile
```
Em outro terminal, nesta pasta mobile:
```bat
npm ci
npm start
```
Para gerar o bundle Android de validação: `npm run export`.
As dependências estão fixadas em package-lock.json. Não é necessário EAS, APK ou conta de loja para testar uma versão compatível no Expo Go.

## Compatibilidade
Este projeto usa **Expo SDK 58** e versões de React Native e módulos alinhadas ao template oficial instalado.
O SDK do projeto precisa coincidir com o aceito pelo Expo Go instalado no dispositivo.
Confira https://expo.dev/go e https://docs.expo.dev/troubleshooting/expo-go-version-mismatch/.
Se aparecer mensagem de versão incompatível, instale/atualize o Expo Go correspondente. A disponibilidade pode variar por plataforma e loja.

## Conexão e solução de problemas
- Execute primeiro a API. No navegador do celular, teste **http://IP_DO_COMPUTADOR:8001/api/v1/health/**: deve aparecer status ok.
- Se a página não abrir, confira IP, rede Wi-Fi, isolamento de dispositivos na rede e permissão do Python no Firewall para a rede privada. Não desative o Firewall.
- Se o QR Code não abrir, confira Node/Expo Go e se a porta do Metro (8081) é acessível na rede.
- O túnel do Expo, quando utilizado, transporta o código do app; ele não publica automaticamente a API Django. A API ainda precisa ser acessível pelo celular.
- A porta 8001 permite usar o app junto do sistema web original, que pode continuar na porta 8000. Ambos usam o mesmo db.sqlite3.
- O servidor mantém os registros. O aplicativo precisa de conexão e não funciona offline.
- Ao trocar de computador, saia pelo menu Mais e altere o endereço na tela de login.

## Acesso
Somente usuários ativos com status de equipe podem entrar. O superusuário criado pelo Django já atende a essa condição.
A senha não é salva no aplicativo. O token fica no SecureStore nativo, expira em 7 dias e é revogado no servidor ao sair com conexão.
Se sair sem conexão, o token é removido deste celular, mas permanece válido no servidor até expirar.
Os tokens são armazenados como hash no banco. Não compartilhe o banco de dados nem inclua-o no Git.

O tráfego HTTP é adequado apenas à demonstração em rede local de confiança. Para uso externo, publique o backend com HTTPS e configure o endereço HTTPS no app.
O aplicativo nativo não precisa de CORS. Esta entrega tem como alvo Expo Go Android/iOS; não inclui configuração de cliente web Expo.

## Estrutura
- App.js: telas, navegação, formulários e seleção de registros.
- src/api.js: requisições, timeout, autenticação e tratamento de erros.
- src/schema.js: definições dos campos e formatação.
- index.js: entrada registrada pelo Expo.
- app.json: configuração do aplicativo.
- package.json / package-lock.json: dependências e scripts.

## API Django
Base: /api/v1/
| Rota | Método | Uso |
|---|---|---|
| health/ | GET | Verificar conectividade, sem autenticação |
| auth/login/ | POST | username e password; retorna token |
| auth/me/ | GET | Usuário atual |
| auth/logout/ | POST | Revogar token atual |
| dashboard/ | GET | Indicadores, alertas e histórico |
| materiais/ | GET / POST | Listar ou criar |
| materiais/<id>/ | GET / PUT | Detalhar ou editar |
| categorias/, fornecedores/, movimentacoes/ | GET / POST | Listar ou criar |
| <recurso>/<id>/ | GET / PUT | Detalhar ou editar |

Envie Authorization: Bearer TOKEN nas rotas protegidas.
Listagens retornam results, count, page e pages; aceitam q e page.
Materiais aceitam baixo=1 e categoria=<id>. Quantidades são decimais serializados como texto.
As validações e regras de estoque são compartilhadas com o Admin e o sistema web.
Não há exclusão de movimentações, e alterações não podem trocar seu material.

## Expo Go demora ao ler o QR Code
Use **INICIAR_EXPO_TUNEL.bat** na pasta principal. Ele limpa o cache e usa um túnel ngrok para entregar o app, na porta 8082. Feche o projeto antigo no Expo Go e escaneie o novo QR Code. A API continua na porta 8001 e requer conexão pela mesma rede local.

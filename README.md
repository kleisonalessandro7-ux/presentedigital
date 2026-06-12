# Presente Digital

Aplicação pessoal para criar páginas públicas de presentes digitais. Não tem cadastro, pagamento nem multi-tenant.

## Stack

- Next.js 14 com App Router
- TypeScript
- Tailwind CSS
- Framer Motion
- Supabase Postgres para os dados dos presentes
- Vercel Blob para fotos, vídeos e áudio

## Rotas

- `/admin`: painel protegido por senha.
- `/presente/[slug]`: experiência pública fullscreen enviada para a pessoa.
- `/presente/preview`: pré-visualização local antes de salvar.

## Variáveis de ambiente

Crie um `.env.local` a partir do `.env.example`:

```bash
ADMIN_PASSWORD=sua-senha
BLOB_READ_WRITE_TOKEN=seu-token-do-vercel-blob
SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_xxxxxxxxxxxxxxxxx
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxxxxxxxxxxx
AUTH_PROVIDERS=google
```

`ADMIN_PASSWORD` é obrigatória para entrar no admin.

`SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` ativam o banco Supabase. Sem essas credenciais, em desenvolvimento local, o app usa `.local-blob` para testar o fluxo.

`BLOB_READ_WRITE_TOKEN` ativa o Vercel Blob para fotos, vídeos e áudio. Sem esse token, os uploads também ficam locais em desenvolvimento.

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` e `AUTH_PROVIDERS` ativam o login individual opcional por Supabase Auth. Se não configurar essas variáveis, o admin continua funcionando pela senha `ADMIN_PASSWORD`.

## Supabase

Execute o SQL em `supabase/schema.sql` no SQL Editor do seu projeto Supabase.

A tabela principal é `public.gifts`. Ela guarda os campos indexáveis em colunas e o presente completo em `data jsonb`.

A tabela `public.gift_reactions` guarda as respostas enviadas pela pessoa no final do presente.

O app usa a service role key somente no servidor. Não exponha `SUPABASE_SERVICE_ROLE_KEY` no navegador.

Para login com Google, ative o provedor em `Authentication` > `Providers` no Supabase e configure a URL de callback do site na Vercel. Cada conta logada vê e edita apenas os presentes criados por ela. A senha admin continua existindo como acesso mestre.

## Rodar localmente

```bash
npm install
npm run dev
```

Se aparecer erro de cache do Next em desenvolvimento, rode:

```bash
npm run dev:clean
```

Abra `http://localhost:3000/admin`, entre com a senha e preencha o formulário em etapas.

## Recursos românticos incluídos

- Carta selada na abertura com toque/segurar para abrir.
- Tela inicial para começar com som ou continuar sem som.
- Contador animado desde a data especial.
- Modo presente perfeito com modelos para namoro, aniversário, aniversário de namoro, só porque te amo, casamento, pedido de casamento, reconciliação, desculpas e saudade.
- Pacotes prontos para pedido de namoro, Dia dos Namorados, noivado e surpresa elegante.
- Banco de frases com categorias para mensagem, motivos, promessas e mensagens secretas.
- Rascunho automático no navegador para não perder o que foi preenchido.
- Edição e duplicação de presentes já criados.
- Fotos com capa, legenda, posição da legenda, filtro, estilo polaroid, data, lugar e pergunta romântica com resposta revelada.
- Upload de vídeos curtos com legenda.
- Linha do tempo visual em fotos fullscreen com Ken Burns.
- Constelação personalizada com mensagens secretas, estrelas piscando e estrelas cadentes.
- Chuva de motivos pelos quais a pessoa é especial.
- Mapa afetivo com lugares importantes.
- Linha do tempo do casal com eventos marcantes.
- Cupons românticos em formato de vales destacáveis.
- Carta em capítulos antes da mensagem principal.
- Campos íntimos para primeiro momento de amor, momento favorito, coisa nunca dita e piadas internas.
- Pergunta surpresa antes da carta selada.
- Raspadinha para revelar uma frase especial.
- Cápsula do tempo com mensagem futura.
- Promessas em cards finais.
- Áudio pessoal enviado por upload, com controle pequeno durante a apresentação.
- Embed Spotify ou YouTube.
- Palavra secreta opcional para proteger um presente específico.
- Capa personalizada do link para WhatsApp/redes sociais.
- Prévia como destinatário antes de salvar.
- Duração personalizada por tipo de slide.
- Modos de experiência: clássico, scrapbook e cinema.
- Pétalas, corações, granulação cinematográfica e batimento sutil no fundo.
- Álbum final navegável com foto ampliada.
- Final com QR Code, download do QR, copiar link, WhatsApp, reação da pessoa, compartilhar, música, atalhos e botão para ver uma lembrança aleatória.
- Página protegida em `/admin/reacoes/[slug]` para ver as respostas recebidas.

## Como usar

1. Entre em `/admin`.
2. Escolha um template se quiser começar mais rápido.
3. Preencha nomes, datas, linha do tempo, fotos, vídeos, mensagens, cupons, música, voz, tema e extras.
4. Use `Pré-visualizar como destinatário` para ver a experiência antes de salvar.
5. Clique em `Gerar presente` ou `Salvar presente`.
6. Se quiser entregar em papel, abra `/presente/[slug]/imprimir?tipo=convite` para o QR Code, `/presente/[slug]/imprimir?tipo=carta` para a carta com QR Code, `/presente/[slug]/imprimir?tipo=cupons` para os cupons ou `/presente/[slug]/imprimir?tipo=pacote` para imprimir tudo junto.
7. Envie o link gerado em `/presente/[slug]`.

## Armazenamento

No Supabase:

- Tabela: `public.gifts`
- Slug: `slug`
- JSON completo: `data`
- Reações da pessoa: `public.gift_reactions`

No Vercel Blob:

- Fotos: `photos/[slug]/[filename]`
- Áudio: `audio/[slug]/[filename]`
- Vídeos: `videos/[slug]/[filename]`

## Deploy completo: Supabase + Vercel

Este projeto foi feito para subir como um app Next.js na Vercel, usando Supabase para salvar os presentes e Vercel Blob para guardar fotos, vídeos e áudios.

### 1. Antes de publicar

Você precisa ter:

- Uma conta na Vercel.
- Uma conta no Supabase.
- Uma conta no GitHub.
- O projeto funcionando localmente com `npm install` e `npm run build`.

Se quiser conferir antes de subir:

```bash
npm install
npm run build
```

### 2. Criar o banco no Supabase

1. Acesse o Supabase e crie um novo projeto.
2. Dentro do projeto, abra `SQL Editor`.
3. Clique em `New query`.
4. Copie todo o conteúdo de `supabase/schema.sql`.
5. Cole no editor e clique em `Run`.
6. Confira se as tabelas `public.gifts` e `public.gift_reactions` foram criadas.

Depois copie as credenciais:

1. Para a URL, vá em `Integrations` > `Data API` e copie a `Project URL`. Ela será usada como `SUPABASE_URL`.
2. Para a chave, vá em `Project Settings` > `API Keys`.
3. Copie a chave `service_role` ou uma `secret key`. Ela será usada como `SUPABASE_SERVICE_ROLE_KEY`.

Importante: nunca coloque `SUPABASE_SERVICE_ROLE_KEY` com prefixo `NEXT_PUBLIC_`. Essa chave tem acesso administrativo ao banco e deve ficar somente no servidor.

Não é necessário criar login, cadastro ou permissões públicas no Supabase. O app usa a service role key apenas nas rotas de servidor.

### 3. Enviar o projeto para o GitHub

Se o projeto ainda não estiver em um repositório Git, rode:

```bash
git init
git add .
git commit -m "Deploy presente digital"
git branch -M main
git remote add origin https://github.com/seu-usuario/seu-repositorio.git
git push -u origin main
```

Troque `seu-usuario` e `seu-repositorio` pelos dados do seu GitHub.

Antes de enviar, confirme que `.env.local` não foi incluído no commit. As senhas devem ficar somente nas variáveis de ambiente da Vercel.

Se o projeto já estiver no GitHub, basta enviar as alterações:

```bash
git add .
git commit -m "Atualiza presente digital"
git push
```

### 4. Criar o projeto na Vercel

1. Acesse a Vercel.
2. Clique em `Add New` > `Project`.
3. Importe o repositório do GitHub.
4. Em `Framework Preset`, deixe `Next.js`.
5. Em `Install Command`, use `npm install`.
6. Em `Build Command`, use `npm run build`.
7. Em `Output Directory`, deixe vazio ou padrão da Vercel.
8. Antes de finalizar, adicione as variáveis de ambiente abaixo.

### 5. Configurar variáveis de ambiente na Vercel

Adicione em `Settings` > `Environment Variables`:

```bash
ADMIN_PASSWORD=sua-senha-forte
SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role-ou-secret
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sua-chave-publica-publishable
AUTH_PROVIDERS=google
```

Use a mesma configuração para `Production`, `Preview` e `Development`, a menos que você queira ambientes separados.

As variáveis `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` são públicas e servem só para o fluxo de login social. A chave sensível continua sendo apenas `SUPABASE_SERVICE_ROLE_KEY`.

Depois do Vercel Blob ser criado, a Vercel também adicionará:

```bash
BLOB_READ_WRITE_TOKEN=seu-token-do-vercel-blob
```

Se essa variável não aparecer automaticamente, copie o token do Blob Store e adicione manualmente.

### 6. Criar o Vercel Blob

1. No projeto da Vercel, abra a aba `Storage`.
2. Clique em `Create Database`.
3. Escolha `Blob`.
4. Escolha um nome para o store, por exemplo `presente-digital-assets`.
5. Escolha a região mais próxima disponível para quem vai acessar os presentes.
6. Selecione os ambientes do projeto.
7. Confirme a criação.

O Vercel Blob será usado para:

- Fotos em `photos/[slug]/[filename]`.
- Vídeos em `videos/[slug]/[filename]`.
- Áudios em `audio/[slug]/[filename]`.

Depois de criar o Blob, faça um novo deploy para garantir que `BLOB_READ_WRITE_TOKEN` esteja disponível em produção.

### 7. Fazer o deploy

Se você criou o projeto na Vercel pela interface, o primeiro deploy será iniciado automaticamente.

Se você alterou variáveis de ambiente depois do primeiro deploy:

1. Vá em `Deployments`.
2. Abra o último deploy.
3. Clique em `Redeploy`.
4. Aguarde o build terminar.

Não é necessário `vercel.json`; a Vercel detecta o projeto Next.js automaticamente.

### 8. Testar em produção

Depois que o deploy terminar:

1. Acesse `https://seu-projeto.vercel.app/admin`.
2. Entre com a senha definida em `ADMIN_PASSWORD`.
3. Crie um presente com pelo menos uma foto.
4. Clique em `Gerar presente`.
5. Abra o link gerado em `/presente/[slug]`.
6. Teste o link em uma janela anônima para confirmar que a página pública funciona sem login.
7. No Supabase, abra `Table Editor` > `gifts` e confirme que o presente foi salvo.
8. Na Vercel, abra `Storage` > seu Blob Store e confirme que os arquivos enviados aparecem lá.

### 9. Usar domínio próprio

Opcionalmente, você pode colocar um domínio próprio:

1. Na Vercel, abra o projeto.
2. Vá em `Settings` > `Domains`.
3. Adicione seu domínio.
4. Siga as instruções de DNS exibidas pela Vercel.

Depois disso, os links ficarão parecidos com:

```text
https://seudominio.com/presente/nome-do-presente
```

### 10. Baixar variáveis para testar localmente

Opcional. Se quiser puxar as variáveis da Vercel para o `.env.local`:

```bash
npm install -g vercel
vercel login
vercel link
vercel env pull .env.local
```

Depois rode:

```bash
npm run dev
```

### Problemas comuns

- `Erro 401 no /admin`: confira se `ADMIN_PASSWORD` está correto na Vercel e faça redeploy.
- `Presente não salva no Supabase`: confira `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`.
- `Upload de foto, vídeo ou áudio falha`: confira se `BLOB_READ_WRITE_TOKEN` existe no ambiente de produção.
- `Build falha na Vercel`: rode `npm run build` localmente para ver o erro completo.
- `A página antiga continua aparecendo`: faça `Redeploy` na Vercel depois de mudar variáveis.
- `Erro local estranho do Next.js`: rode `npm run dev:clean`.
- `Supabase bloqueando acesso`: não exponha a service role no navegador e não crie políticas públicas desnecessárias.

### Referências oficiais

- Vercel com GitHub: https://vercel.com/docs/git/vercel-for-github
- Variáveis de ambiente na Vercel: https://vercel.com/docs/environment-variables
- Vercel Blob: https://vercel.com/docs/vercel-blob
- SDK do Vercel Blob: https://vercel.com/docs/vercel-blob/using-blob-sdk
- Supabase API e Project URL: https://supabase.com/docs/guides/api
- Chaves do Supabase: https://supabase.com/docs/guides/getting-started/api-keys
- Login com Google no Supabase: https://supabase.com/docs/guides/auth/social-login/auth-google

## Observações

- O embed de música depende das regras de autoplay do navegador.
- O áudio pessoal aparece com controle de reprodução.
- Os links públicos podem ser protegidos por palavra secreta opcional; sem ela, a privacidade depende do slug único que você compartilha.

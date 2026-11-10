# Relatório do site Império da Beleza

Reorganização da arquitetura, separação entre a área do cliente e a área do proprietário, e segurança.

## 1. Estrutura antiga

```
imperio-da-beleza/
├── index.html
├── css/   style.css (site)  ·  app.css (painel)
├── js/    store.js (dados + utilitários)  ·  site.js  ·  admin.js  ·  app.js
├── img/   foto1-4.jpg
└── imperio-da-beleza-completo.html   (cópia de tudo em um arquivo)
```

Tecnologia: HTML, CSS e JavaScript puros, sem servidor, sem banco e sem dependências. Os dados ficavam no `localStorage` do navegador.

## 2. Problemas encontrados

| # | Problema | Gravidade |
| --- | --- | --- |
| 1 | Não havia backend. O painel rodava no navegador de qualquer visitante, e a "proteção" era só esconder a tela | Alta |
| 2 | O PIN do painel estava escrito no JavaScript público | Alta |
| 3 | O que o dono editava ficava só no aparelho dele. O visitante nunca via preço, horário ou foto novos | Alta |
| 4 | O código do painel era enviado a todos os visitantes | Média |
| 5 | Nenhuma validação no servidor. As fotos entravam sem checagem de tipo ou tamanho | Média |
| 6 | `store.js` misturava dados, utilitários e gravação. `style.css` misturava a base do painel com o site | Baixa |
| 7 | Cópia duplicada em arquivo único, repetindo o painel inseguro | Baixa |

Sobre o segredo do item 2: ele foi removido do código. Não repito o valor aqui. Se esse PIN for usado em outro lugar, troque lá também.

## 3. Estrutura nova

```
imperio-da-beleza/
├── server/
│   ├── index.js         servidor, rotas, arquivos estáticos, cabeçalhos de segurança
│   ├── config.js        variáveis de ambiente e caminhos
│   ├── auth.js          senha com hash, sessões, limite de tentativas
│   ├── storage.js       leitura e gravação dos arquivos de dados
│   ├── validation.js    validação de tudo que o painel envia
│   └── uploads.js       validação e gravação das fotos
├── data/
│   ├── site.default.json   conteúdo inicial (público)
│   ├── site.json           conteúdo editado pelo dono (criado ao salvar)
│   ├── clients.json        clientes do dono (privado, criado ao salvar)
│   └── auth.json           hash da senha (privado, criado no primeiro início)
├── public/                 o que o visitante recebe
│   ├── index.html
│   ├── css/  base.css · site.css
│   ├── js/   utils.js · site.js · main.js
│   ├── img/  foto1-4.jpg
│   └── uploads/            fotos enviadas pelo dono
├── admin/                  só é entregue com login
│   ├── login.html          única página aberta ao público
│   ├── index.html
│   ├── css/admin.css
│   └── js/   login.js · api.js · panel.js
├── .env.example · .gitignore · package.json · README.md · RELATORIO.md
```

## 4. Responsabilidade de cada pasta

| Pasta | Papel |
| --- | --- |
| `public/` | Site do cliente. Só contém o que pode ser visto por qualquer pessoa |
| `admin/` | Painel do proprietário, protegido no servidor |
| `server/` | Regras: quem entra, o que é válido, o que cada rota devolve |
| `data/` | Fonte de verdade de todo o conteúdo. Nada aqui é servido diretamente |
| `public/uploads/` | Fotos enviadas, com nome aleatório, servidas como imagem |

## 5. Área do cliente (`/`)

Uma página, com a mesma arte de antes. Os dados vêm de `GET /api/public/site`.

| Tela / seção | O que mostra |
| --- | --- |
| Início | Título, subtítulo, "Agendar pelo WhatsApp", "Ver serviços" e o horário de atendimento |
| Poste e cartões | Poste vermelho, branco e azul na lateral. Os cartões entram pela esquerda e saem pela direita conforme a rolagem |
| Sobre nós | Texto do dono, foto do espaço e três diferenciais |
| Serviços e preços | Cartões com preço, duração e link de WhatsApp com o nome do serviço. Serviços desativados não aparecem |
| Galeria | As 4 fotos, endereço e "Como chegar" (Google Maps) |
| Depoimentos | Depoimento de exemplo |
| Contato | Endereço, horários de cada dia, Instagram, WhatsApp e mapa |
| Botão flutuante | "Agendar pelo WhatsApp", sempre visível |

O cliente não agenda no site: todo botão abre o WhatsApp do dono com a mensagem pronta. Se o número ainda não foi cadastrado, o botão avisa "Informe o WhatsApp no painel do dono".

## 6. Área do proprietário (`/admin`)

Entrada em `/admin/login`, com senha. Depois do login:

| Aba | O que o dono controla |
| --- | --- |
| Clientes | Tabela com cliente, WhatsApp, serviço, dia, hora e status. Resumo do dia, filtros e cadastro de cliente que chegou pelo WhatsApp |
| Serviços | Nome, descrição, preço, duração, ativo ou inativo, criar e remover |
| Aparência do site | Textos, WhatsApp, Instagram, endereço, cor principal, cor de destaque, fonte, cores do poste e as 4 fotos |
| Horários | Dias abertos e horário de abertura e fechamento de cada dia |
| Configurações | Troca de senha e backup (exportar e importar) |

Também há "Ver site" (abre o site público) e "Sair". Tudo que o dono altera é gravado no servidor e aparece para o visitante.

## 7. Fluxo de dados

```
PROPRIETÁRIO → painel (/admin) → PUT /api/admin/data → validação → data/*.json → GET /api/public/site → site → CLIENTE
```

```
CLIENTE → site → GET /api/public/site → somente cfg, horários, serviços ativos e fotos
```

Nunca: `CLIENTE → /admin → dados do dono`.

## 8. Segurança

| Tema | Como está |
| --- | --- |
| Autenticação | Senha inicial padrão `123` (combinada para a entrega), guardada como hash `scrypt` com sal próprio. O painel avisa em vermelho até o dono trocar. A nova senha tem de 8 a 128 caracteres. Sessão por cookie `HttpOnly` e `SameSite=Strict` (e `Secure` em HTTPS), com validade de 8 horas |
| Autorização | O servidor confere a sessão em `/admin`, nos arquivos do painel e em toda rota `/api/admin/*`. Sem sessão, páginas redirecionam ao login e APIs respondem 401 |
| Força bruta | 5 senhas erradas por IP bloqueiam por 10 minutos |
| Dados | `site.json` (público), `clients.json` e `auth.json` (privados) ficam separados. A API pública devolve só os campos necessários e nunca os clientes |
| Validação | Todo dado recebido é reconstruído com campos permitidos, tamanhos, formatos, faixas e listas fixas. Dado inválido é recusado com 400 |
| Requisições | Só aceita escrita em JSON e da mesma origem (proteção contra CSRF) |
| Uploads | Só JPEG, PNG e WebP, até 2 MB. O tipo é conferido pelo conteúdo do arquivo, não pelo nome. Nome aleatório, servidos com `nosniff` |
| Segredos | Nenhum segredo no front-end. A senha fica só como hash em `data/auth.json`; `.env` e `data/` estão no `.gitignore` |
| Cabeçalhos | `Content-Security-Policy` (scripts só do próprio site), `X-Frame-Options`, `nosniff` e `Referrer-Policy` |
| Arquivos | Acesso a `data/`, `server/`, `.env` e caminhos com `..` devolve 404 |

Testes (seguros, sem destruir nada), rodando com `npm test`:

- **119 verificações automáticas** em `tests/security.test.js`, sempre com uma pasta de dados temporária, sem tocar nos dados reais. Cobrem: visitante sem login em páginas e APIs do painel, tentativa de ler `data/`, `server/`, `.env` e caminhos com `..` ou `%00`, dono entrando e alterando conteúdo (e o site público refletindo), serviço desativado sumindo do site, dados inválidos, origem externa, corpo enorme, uploads falsos, grandes e SVG, troca de senha, fim da sessão e bloqueio por tentativas.
- **8 verificações no navegador:** site público, senha errada e certa, edição de título, preço e WhatsApp pelo painel, e conferência do que o visitante passa a ver.

Falhas encontradas ao refazer a auditoria, já corrigidas:

| Falha | Correção |
| --- | --- |
| Uma requisição com caractere nulo (`/%00`) derrubava a resposta com erro 500 | O servidor recusa o endereço com 400 |
| Corpo grande demais fechava a conexão sem responder | Responde 413 e depois encerra a conexão |
| Se o `.env.example` fosse copiado sem trocar a senha, o texto de exemplo virava a senha do painel | Na versão atual a senha inicial é sempre a padrão `123`, sem depender do `.env` |

Limite desta verificação: foram testes com o servidor local. Nada foi testado em hospedagem real, atrás de HTTPS ou de proxy.

## 9. O que foi preservado

- Todo o visual: poste, cartões, cores, tipografia, proporção áurea, fotos, espaçamentos, menu de três tracinhos.
- O comportamento do site: rolagem, animação dos cartões, botões do WhatsApp, horário e mapa.
- As abas do painel e a tabela de clientes.
- O estilo de código combinado: sem comentários, blocos separados por linha em branco.

## 10. O que foi alterado

- Entrou um servidor (Node.js, sem bibliotecas) com login, API pública, API do painel, validação e envio de fotos.
- Os dados saíram do navegador e passaram para `data/`.
- O PIN no código foi removido. A senha inicial é a padrão `123` e fica guardada só como hash.
- `store.js` virou `utils.js` (utilitários) mais o servidor (dados). `style.css` foi dividido em `base.css` e `site.css`. O painel saiu de `js/` e `css/` para `admin/`.
- O painel ganhou: campo "Ativo" em cada serviço, troca de senha e foto enviada ao servidor.
- Saíram: a cópia em arquivo único (`imperio-da-beleza-completo.html`), a tela de agendamento no site (já removida antes) e o botão "Restaurar tudo ao padrão" do painel.
- O site agora precisa do servidor rodando. Não abre mais com dois cliques.
- **Esqueci minha senha:** link no login, página para informar o e-mail e página para escolher a nova senha. O e-mail leva um link de uso único (30 minutos), nunca a senha. O e-mail de recuperação é editável no painel, pedindo a senha atual.
- **Fontes locais:** Playfair Display, Inter, Cinzel e Oswald agora ficam em `public/fonts/`, e a política de segurança não libera mais nenhum site externo.
- **Sessões salvas em disco:** reiniciar o servidor não desconecta mais o dono. O arquivo guarda só o hash dos códigos.
- **Limpeza de imagens:** fotos trocadas e sem uso são apagadas ao salvar (só as que têm mais de 1 hora).
- **Painel e site no celular:** conferidos em telas de 360 e 390 pixels de largura, com toque. Ajustei o cabeçalho do painel, o tamanho das letras dos campos (16 px, para o iPhone não ampliar a tela ao digitar) e a área de toque das caixas de marcar.
- **"Ver site" no painel:** abre em outra aba, então a aba do painel continua aberta. O logo do painel agora leva de volta ao painel.
- **Endereços padronizados:** cliente em `/` e dono em `/admin`, com ficha de entrega em `ENTREGA-AO-DONO.md`.
- **Alto contraste:** botão ◐ no topo do site, que o visitante liga e desliga. A escolha fica guardada no aparelho dele.
- **Hospedagem:** `PORT`, `/healthz`, `TRUST_PROXY`, cookie `Secure` automático em HTTPS e `DATA_DIR`.

## 11. O que ainda precisa ser feito

- **Cadastrar o WhatsApp Business do dono** no painel. Sem ele, os botões não funcionam.
- **Configurar o envio de e-mail** (variáveis `SMTP_*`, `OWNER_EMAIL` e `PUBLIC_URL`) na hospedagem. Sem isso o "Esqueci minha senha" avisa que o envio não está disponível.
- **Testar o e-mail com uma conta real.** O código de envio foi testado só contra um servidor de e-mail falso, local.
- **Preencher o conteúdo real:** preços (hoje aparecem "Consulte"), texto de "Sobre nós", endereço e Instagram.
- **Depoimentos e os três diferenciais** continuam fixos no código e não são editáveis pelo painel. O depoimento atual é de exemplo e deve ser trocado antes de publicar.
- **Ordem das seções e versão com espaço para anúncios:** não foram feitas. O painel não muda a ordem das seções, e não existe uma versão do site com laterais reservadas para os anúncios de hospedagem gratuita.
- **Menu e ordem das seções:** o menu do site é fixo, então não criei controles de links, ordem ou ativação de seções.
- **Senha padrão `123`:** é fraca de propósito, para a entrega. Entre o momento em que o site vai ao ar e a troca da senha, qualquer pessoa que descubra o endereço `/admin` consegue entrar. O dono deve trocar no primeiro acesso, antes de divulgar o site.
- **Um único usuário:** não há mais de um nível de acesso.
- **Publicação:** HTTPS, hospedagem com Node.js e disco que não apaga, e rotina de backup de `data/` e `public/uploads/`.
- **Celular:** a conferência foi feita por emulação no Chromium, não em aparelhos reais. A tabela de clientes do painel rola para o lado no celular.
- **Testes de tela:** os de segurança e de fluxo são automáticos (`npm test`). As telas foram conferidas à mão.

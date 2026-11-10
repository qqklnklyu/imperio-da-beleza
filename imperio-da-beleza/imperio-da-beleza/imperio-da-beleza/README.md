# Império da Beleza

Site da barbearia com painel do proprietário. O cliente vê o site e agenda pelo WhatsApp. O dono entra em `/admin` para controlar preços, serviços, horários, textos, fotos, cores e a lista de clientes.

## Requisitos

- Node.js 18 ou mais novo (https://nodejs.org). Não há nada para instalar com `npm install`: o projeto não usa bibliotecas externas.

## Como rodar

1. (Opcional) Copie `.env.example` para `.env` e ajuste a porta.
2. Rode `node server/index.js` (ou `npm start`).
3. Abra `http://127.0.0.1:3000` (site) e `http://127.0.0.1:3000/admin` (painel).

## Endereços padronizados

| Quem | Endereço |
| --- | --- |
| Cliente | `https://SEU-DOMINIO/` |
| Dono (painel) | `https://SEU-DOMINIO/admin` |
| Recuperar senha | `https://SEU-DOMINIO/admin/esqueci` |

Ao iniciar, o servidor mostra no terminal os endereços do cliente e do painel, montados a partir de `PUBLIC_URL`.

**Domínio.** Sem domínio próprio, use o endereço que a hospedagem der (algo como `https://nome.up.railway.app`) e acrescente `/admin`. Para ter `seusite.com.br`:
1. Registre o domínio. Um `.com.br` custa R$ 40 por ano no Registro.br e pode ser registrado com CPF ou CNPJ.
2. No painel do domínio, abra a zona de DNS e crie um registro do tipo A com nome `@` apontando para o IP da VPS, e outro com nome `www` para o mesmo IP. Em plataformas como a Railway, a hospedagem indica o valor de um registro CNAME no lugar do A.
3. Espere a propagação (de alguns minutos a algumas horas) e ajuste `PUBLIC_URL` para `https://seusite.com.br`.
4. Ative o HTTPS (o Caddy faz isso sozinho; plataformas como a Railway também).

Há uma ficha pronta para entregar ao dono em `ENTREGA-AO-DONO.md`.

## Primeiro acesso do dono

- **Endereço do painel:** o endereço do site mais `/admin`. Exemplo: `https://seusite.com/admin`.
- **Senha inicial:** `123`. É sempre a mesma em uma instalação nova, até o dono trocar.
- O painel mostra um aviso vermelho até a senha ser trocada (Configurações → Segurança). A nova senha precisa de 8 a 128 caracteres.
- Depois da troca, a senha fica guardada com hash em `data/auth.json`. Se a pasta `data/` for apagada, a senha volta a ser `123`.

## Esqueci minha senha (e-mail)

- Na tela de login do painel há o link "Esqueci minha senha". O dono informa o e-mail e recebe um **link** para escolher uma nova senha. O link vale por 30 minutos e só funciona uma vez.
- O sistema **nunca envia a senha**: ela fica guardada só como hash e não existe como ser lida. Por isso o e-mail traz um link.
- **E-mail do dono:** o primeiro endereço vem da variável `OWNER_EMAIL`. Depois o dono pode trocar em Configurações → E-mail de recuperação (pede a senha atual).
- **Para o e-mail sair**, o servidor precisa de uma conta de envio (SMTP), nas variáveis `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` e `SMTP_FROM`. Use o e-mail do domínio da hospedagem, ou outro provedor com SMTP. Sem isso o painel avisa que o envio não está configurado.
- `PUBLIC_URL` precisa ser o endereço real do site (ex.: `https://seusite.com.br`). O link do e-mail usa esse endereço, e nunca o que vem do navegador.
- Algumas hospedagens bloqueiam portas de e-mail. Se nada chegar, veja os logs do servidor e teste outra porta (587 com `SMTP_SECURE=false`, ou 465 com `SMTP_SECURE=true`).
- Reiniciar o servidor invalida links de redefinição já enviados. As sessões do painel continuam valendo.

## Alto contraste

- O botão ◐ no topo do site liga e desliga o alto contraste (texto branco e fundos pretos). A escolha fica guardada no aparelho do visitante.

## Fontes e links externos

- As fontes (Playfair Display, Inter, Cinzel e Oswald, licença SIL OFL) ficam em `public/fonts/`, com as licenças em `public/fonts/licencas/`. O site não chama Google Fonts nem nenhum outro site para carregar a aparência.
- Os únicos links para fora são os botões que o visitante clica: WhatsApp e "Como chegar" (Google Maps). Eles são montados pelo código a partir dos dados do painel.

## Publicar na internet

- O servidor lê `PORT` do ambiente. Se `PORT` existir e `HOST` não, ele escuta em `0.0.0.0` (necessário na maioria das hospedagens).
- A rota `/healthz` responde `{"ok":true}` para verificação de saúde.
- Atrás de um proxy ou plataforma (Render, Railway, Caddy, Nginx), defina `TRUST_PROXY=true` para o bloqueio por tentativas enxergar o IP real. O cookie recebe `Secure` automaticamente quando a conexão chega por HTTPS (`X-Forwarded-Proto`).
- **A hospedagem precisa de disco persistente.** O servidor grava em `data/` e em `public/uploads/`. Em planos com disco temporário, cada reinício apaga as edições, os clientes e a senha (volta a `123`). Para guardar em outro lugar, defina `DATA_DIR`.
- Faça cópia de `data/` e `public/uploads/` com frequência. O botão "Exportar backup" do painel também serve.
- Nunca envie `.env` nem `data/` para o Git ou para um site público.

## Testes

Rode `npm test`. Os testes sobem um servidor temporário em outra porta, com dados temporários, e conferem login, proteção das rotas, validação, uploads e senha. Eles não alteram `data/` nem `public/uploads/`.

## Pastas

| Pasta | O que tem |
| --- | --- |
| `public/` | Tudo que o visitante recebe: página, estilos, scripts, fotos e uploads |
| `admin/` | Painel do proprietário. Só é entregue a quem fez login |
| `server/` | Servidor, login, validação dos dados e envio de fotos |
| `tests/` | Testes automáticos de segurança |
| `data/` | Dados do site (`site.json`), clientes (`clients.json`) e senha (`auth.json`). Nada disso é público |

## Publicar na internet

- Use HTTPS e defina `COOKIE_SECURE=true`.
- Para aceitar conexões de fora, defina `HOST=0.0.0.0` e deixe um proxy reverso (Nginx, Caddy) na frente.
- Faça cópia de `data/` e `public/uploads/` com frequência. O botão "Exportar backup" do painel também serve.
- Nunca envie `.env` nem `data/` para o Git ou para um site público.

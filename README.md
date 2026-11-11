# Império da Beleza

Site vitrine da barbearia Império da Beleza, em Ibirá - SP. Sem painel, sem banco de dados e sem dependências.

## Rodar no computador

```
npm start
```

Abra http://localhost:3000

## Publicar no Render

1. Suba esta pasta em um novo repositório no GitHub.
2. No Render: New → Web Service → escolha o repositório.
3. Runtime: Node. Build Command: deixe vazio. Start Command: `npm start`.
4. Health Check Path: `/healthz`.

Alternativa: New → Static Site, Publish Directory `.` (ponto), sem Build Command.

## Onde editar

- WhatsApp e Instagram: links em `index.html` (procure por `5517992285617` e `severo.andrade`).
- Horários, textos e serviços: direto em `index.html`.
- Fotos: substitua os arquivos de `img/`.

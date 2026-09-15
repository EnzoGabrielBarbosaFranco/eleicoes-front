# Eleições Frontend

Frontend em HTML, CSS e JavaScript puro. Não é necessário executar `npm install`.

## Executar localmente

Na pasta do frontend, inicie um servidor estático:

```powershell
cd C:\Users\Enzo\Projetos\eleicoes-front
py -m http.server 5500
```

Também é possível usar a extensão **Live Server** do VS Code na porta 5500. Acesse o endereço usando `127.0.0.1`, pois os backends precisam liberar exatamente essa origem no CORS:

```text
http://127.0.0.1:5500
```

## Eleições 2022

Inicie o backend de 2022 na porta 8787. As páginas da raiz usam somente esse backend e sempre enviam `ano=2022`:

- `http://127.0.0.1:5500/`
- `http://127.0.0.1:5500/300x250.html`
- `http://127.0.0.1:5500/300x600.html`
- `http://127.0.0.1:5500/horizontal.html`
- `http://127.0.0.1:5500/970x250.html`

## Eleições 2026

Inicie o backend de 2026 na porta 8788:

```powershell
cd C:\Users\Enzo\Projetos\backend-eleicoes\backend-2026
npm run dev
```

As páginas da pasta `/2026/` usam somente esse backend e sempre enviam `ano=2026`:

- `http://127.0.0.1:5500/2026/`
- `http://127.0.0.1:5500/2026/300x250.html`
- `http://127.0.0.1:5500/2026/300x600.html`
- `http://127.0.0.1:5500/2026/horizontal.html`
- `http://127.0.0.1:5500/2026/970x250.html`

Enquanto os resultados não estiverem disponíveis, as páginas de 2026 mostram apenas o estado de espera e consultam novamente o status a cada 120 segundos. Não existe fallback para 2022.

Em produção, o frontend de 2022 usa `https://backend-eleicoes.enzo-eleicoes-backend.workers.dev` e o frontend de 2026 usa `https://backend-eleicoes-2026.enzo-eleicoes-backend.workers.dev`.

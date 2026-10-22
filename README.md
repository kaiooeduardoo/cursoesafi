# Observatório DOE Brasil — Dashboard público

Painel estático para apresentar dados de convênios e parcerias extraídos de Diários Oficiais estaduais.

## Como usar

1. Abra a página publicada em GitHub Pages ou Netlify.
2. Selecione a UF de origem da planilha.
3. Clique em **Escolher Excel** e importe um `.xlsx` com abas `Instrumentos` e `Aditivos` no padrão do modelo.
4. Explore filtros e indicadores. Exporte CSV ou use **Salvar PDF**.

A página abre com **dados de demonstração da Paraíba, de 15/07/2026**. Ao importar outro Excel, esses dados são substituídos. Selecionar uma UF **não consulta automaticamente** o DOE daquele estado.

## Segurança e limites

- Todo o processamento do arquivo é feito **no navegador**, sem upload para servidor.
- Não há API, backend nem armazenamento remoto dos dados importados.
- O HTML inclui uma biblioteca JavaScript para leitura de XLSX e os dados de demonstração da Paraíba.
- A planilha é a fonte dos indicadores; confira os atos e valores no diário oficial de origem.
- O painel espera colunas `Tipo de instrumento`, `Valor original (R$)`, `Órgão concedente` etc.; exportações com outro esquema precisam ser adaptadas.

## Hospedagem

**GitHub Pages:** Settings → Pages → Deploy from a branch → `main` / `(root)` → Save.

**Netlify:** Add new project → Import an existing project → GitHub → selecione o repositório; build command em branco, publish directory `.`.

Este é um protótipo didático, não um sistema oficial de transparência governamental.

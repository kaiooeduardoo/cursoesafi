# Observatório DOE Brasil

Dashboard estático para visualizar informações sobre convênios, parcerias e alterações publicados nos Diários Oficiais estaduais. A extração documental é feita separadamente no ChatGPT; este site importa **planilhas Excel no padrão do Observatório**.

**Site:** https://kaiooeduardoo.github.io/cursoesafi/index.html  
**Guia de uso:** https://kaiooeduardoo.github.io/cursoesafi/como-usar.html

## Funcionalidades

- Importação local de `.xlsx` com identificação automática da UF.
- Indicadores de instrumentos originais, TEDs e alterações, com valores separados.
- Filtros por órgão, natureza e município; pesquisa e tabelas detalhadas.
- Exportação CSV com neutralização de fórmulas e impressão em PDF pelo navegador.
- Links de origem identificados pelo **domínio informado no Excel**, sem presumir validação oficial.

## Como utilizar

1. Consulte [Como usar](como-usar.html) e baixe `INSTRUCOES_CHATGPT.md`, `CRITERIOS_EXTRACAO.md` e `MODELO_EXTRACAO.xlsx`.
2. Configure o ChatGPT para analisar um Diário Oficial e gerar a planilha conforme o modelo.
3. Abra `index.html` no navegador ou acesse o site público e importe o `.xlsx`.

Os dados de Paraíba exibidos inicialmente são **demonstrativos**, não uma base atualizada.

## Estrutura

```text
index.html                     Dashboard
como-usar.html                 Guia público
assets/dashboard.css           Estilos do dashboard
assets/dashboard.js            Leitura, validação e visualização do Excel
assets/demo-data.js            Dados da demonstração
assets/help.css                Estilos da página de ajuda
assets/help.js                 Ação de copiar prompt
assets/vendor/jszip.min.js     Biblioteca JSZip 3.10.1 (terceiros)
MODELO_EXTRACAO.xlsx           Planilha-modelo (6 abas)
CRITERIOS_EXTRACAO.md          Critérios de extração documental
INSTRUCOES_CHATGPT.md          Configuração sugerida para o ChatGPT
PROMPT_EXEMPLO.txt             Exemplo de solicitação
SECURITY.md                    Modelo de segurança e limites
tests/security-smoke.mjs       Verificação básica das proteções
```

## Execução e publicação

Nenhuma instalação é necessária. Abra `index.html` diretamente ou publique os arquivos na raiz de um repositório configurado para GitHub Pages (`main` / `root`). Preserve a estrutura de pastas, inclusive `assets/`.

O site não usa API de IA nem backend e não envia planilhas para servidores. A [política de segurança](SECURITY.md) restringe conexões de scripts, porém links externos só são abertos por ação do usuário.

## Verificação rápida

Execute `python tests/verify-package.py` para verificar a integridade dos arquivos e, com Node.js instalado, `node tests/security-smoke.mjs` para conferir a proteção básica contra fórmulas CSV, a leitura estrutural de um XLSX válido e a rejeição de dados descompactados excessivos. A validação completa requer também teste manual no navegador com planilhas reais.

## Limitações

- O site **não lê o PDF do Diário Oficial** nem verifica automaticamente a autenticidade do conteúdo da planilha.
- Valores publicados não equivalem a pagamentos efetivamente realizados.
- A identificação da UF depende dos registros importados; campos ausentes podem exigir conferência manual.
- Para proteção do navegador, o importador aplica limites de arquivo, compactação e quantidade de registros.

A biblioteca JSZip é distribuída com seus avisos de licença originais. Os demais arquivos permanecem sob os direitos de seus respectivos autores; a publicação no GitHub não implica, por si só, concessão de licença de reutilização.

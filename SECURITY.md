# Segurança — Observatório DOE Brasil

Este é um site estático de visualização. O Excel é interpretado **localmente no navegador**. O site não oferece autenticação, armazenamento remoto nem análise de documentos PDF.

## Controles implementados

- **CSP:** scripts e estilos são carregados de arquivos locais (`'self'`); `connect-src 'none'` impede conexões iniciadas por scripts. Como o projeto usa GitHub Pages, a CSP é definida por `<meta>`; políticas que exigem cabeçalho HTTP (por exemplo, `frame-ancestors`) não são fornecidas nessa implantação.
- **XSS:** dados externos em gráficos, indicadores, filtros e tabelas são tratados como texto ou escapados antes de compor HTML.
- **URLs:** apenas HTTPS com estrutura básica válida é exibido como link. O domínio é apresentado ao usuário, sem chamar o endereço de oficial ou fazer uma validação remota.
- **CSV Injection:** células que podem ser interpretadas como fórmulas por softwares de planilha são prefixadas com apóstrofo antes da exportação.
- **XLSX:** o importador verifica extensão, tamanho (até 15 MB), diretório ZIP, tamanho descompactado (até 100 MB no total), tamanho de componentes, quantidade de entradas, linhas e células.
- **Links externos:** abrem em nova aba com `rel="noopener noreferrer"`.

## Limites e responsabilidades

- A proteção contra arquivos maliciosos é **mitigação**, não garantia absoluta contra travamentos do navegador.
- O sistema não verifica assinaturas digitais, domínios governamentais nem a correção dos dados extraídos pela IA. Confira a publicação oficial antes de reutilizar as informações.
- PDFs ou páginas consultados por ferramentas de IA devem ser tratados como **dados não confiáveis**, ignorando instruções inseridas no material analisado. Esta diretriz está nos arquivos Markdown.
- A CSP reduz superfícies de ataque, mas não substitui testes, revisão das dependências e atualização contínua.
- O CSV deve ser aberto inicialmente em ambiente controlado se provier de fontes desconhecidas; ferramentas de planilhas podem interpretar arquivos de maneiras diferentes.

## Relatar problemas

Para relatar uma vulnerabilidade, utilize **Report a vulnerability** na aba *Security* do repositório, caso esse recurso esteja ativado. Caso contrário, procure um canal privado do mantenedor. Não publique dados sensíveis ou detalhes exploráveis em issues públicas.

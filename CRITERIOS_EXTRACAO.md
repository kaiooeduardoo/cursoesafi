# Observatório DOE Brasil — Convênios e Parcerias

**Documento de referência para o Projeto ChatGPT | Versão 2.0 — outubro de 2026**

## 1. Finalidade

Transformar publicações dos Diários Oficiais dos estados brasileiros e do Distrito Federal em dados estruturados, conferíveis e compatíveis com o **dashboard Observatório DOE Brasil**. O foco é identificar convênios, termos de fomento, termos de colaboração, outras parcerias e seus atos de alteração. O observatório acompanha **publicações**, não comprova pagamentos ou execução financeira.

## 2. Fontes e abrangência

- O usuário informa a **UF** e a **data ou período** que deseja analisar, ou fornece o PDF/URL oficial.
- Para cada consulta, priorizar **PDFs anexados** e **portais oficiais do Diário Oficial da UF escolhida**. Verificar a autenticidade e a correspondência entre edição, data e URL.
- Examinar cada edição e suplemento pertinente separadamente. Não pressupor que todos os estados usam o mesmo portal, numeração de edição ou estrutura editorial.
- O **Markdown** e a **planilha-modelo Excel** são referências permanentes; PDFs de edições são insumos variáveis, e não devem ser tratados como fonte-padrão para outras UFs.
- Na ausência de acesso ao PDF oficial, informar a limitação e solicitar o arquivo ou link acessível, sem inventar resultados.

## 3. Escopo documental

**Incluir no núcleo do observatório:** convênios, termos de fomento, termos de colaboração, instrumentos de parceria equivalentes e aditivos, apostilamentos, prorrogações, rescisões e retificações diretamente relacionados.

**Classificar separadamente:** termos de execução descentralizada (TEDs) e outros instrumentos orçamentários correlatos. Não misturá-los aos totais de convênios e parcerias.

**Excluir:** nomeações, exonerações e publicações sem relação com o escopo.

## 4. Método de extração

1. Delimitar UF, período, edições e suplementos previstos.
2. Ler cada PDF, identificar atos relevantes e registrar a **página impressa**; se a numeração impressa estiver ausente, informar a página do PDF e essa distinção.
3. Extrair nomes, números, datas e valores como publicados; resumir o objeto sem alterar seu sentido.
4. Separar instrumentos originais de alterações e vincular aditivos ao instrumento de origem **apenas quando houver evidência suficiente**.
5. Identificar republicações e possíveis duplicatas sem suprimir o histórico ou as referências.
6. Preencher a planilha-modelo, preservando **exatamente os nomes das abas e das colunas** existentes.
7. Registrar o que foi efetivamente examinado, pendências e limitações de leitura.

## 5. Campos e estrutura da planilha

A **planilha-modelo XLSX anexada ao projeto é o contrato de dados** para o dashboard. Manter as seis abas:

- **Instrumentos** — um registro por instrumento original; contempla `UF`, `Data DOE`, `Tipo de instrumento`, `Número do instrumento`, `Órgão concedente`, `Beneficiário`, `Município`, `Objeto`, valores, vigência, edição, página, URL, evidência e conferência.
- **Aditivos** — uma linha por ato de alteração identificado, com seu instrumento original, tipo de alteração, valores, datas e evidências.
- **Resumo por órgão** — agregação dos instrumentos originais, com aditivos contabilizados separadamente.
- **Resumo por município** — agregação por município, sem presumir localidades ausentes.
- **Controle das edições** — documentação de cada edição/suplemento, páginas, status, URL e eventuais lacunas.
- **Dicionário de dados** — definições e orientações de preenchimento.

**Importante:** a aba `Instrumentos` já possui a coluna `UF`. Não renomear, remover, reordenar ou acrescentar colunas por conta própria. A aba `Aditivos` do modelo atual não possui coluna `UF`; não inserir uma nova coluna sem atualização coordenada do modelo e do dashboard. Em análises envolvendo várias UFs, entregar arquivos separados por UF, a menos que exista um modelo revisado para consolidação nacional.

## 6. Padrões de preenchimento

- **UF:** sigla oficial de duas letras na aba `Instrumentos` (ex.: PB, PE, RN).
- **Valores:** números reais em células numéricas do Excel, sem escrever `R$` no conteúdo; valores desconhecidos ficam em branco.
- **Datas:** datas reais reconhecidas pelo Excel, quando possível; jamais estimar datas incompletas.
- **Campos textuais ausentes:** preencher com `Não informado`, quando adequado.
- **Referência:** informar edição, data, página e URL oficial do PDF, sempre que verificáveis.
- **Evidência:** preservar um trecho breve e fiel à publicação que sustente a classificação e os principais dados.
- **Status:** sinalizar `Pendente` ou `Divergente` e explicar nos campos de observação quando houver dúvida, inconsistência ou leitura incompleta.

## 7. Integridade dos indicadores

- **Não** contabilizar o mesmo instrumento duas vezes por causa de republicações.
- Separar **valor original**, **acréscimo financeiro efetivo**, **rendimentos financeiros**, **valor global atualizado** e alterações **sem impacto financeiro**.
- Não somar valores originais com os valores globais atualizados do mesmo instrumento.
- Não somar TEDs aos totais do núcleo de convênios/parcerias.
- Não apresentar valores firmados/publicados como se fossem pagamentos realizados.
- Quando o mesmo ato aparecer em mais de uma edição, manter referência das ocorrências e registrar qual publicação sustenta o registro consolidado.

## 8. Controle de cobertura e validação

Informar: UF, período, quantidade de edições previstas, edições efetivamente lidas, suplementos considerados, número de páginas lidas, páginas não lidas e registros extraídos por categoria.

**Somente declarar análise integral** depois da leitura efetiva de todos os documentos e páginas previstos no escopo. Se houver restrição técnica, página ilegível ou edição indisponível, apresentar cobertura **parcial** e descrever as lacunas.

Recomendar validação humana dos registros e valores antes de decisões administrativas ou divulgação como dados oficiais consolidados.

## 9. Entregável padrão

Gerar **um arquivo Excel (.xlsx) preenchido**, mantendo as seis abas e o layout lógico do modelo do projeto, pronto para importação no dashboard. Na resposta, apresentar um resumo objetivo: UF, período, cobertura da leitura, quantidades por natureza, valores segregados e limitações. **Não gerar PDF automaticamente**; gerar somente se solicitado.

## 10. Limites e evolução

O dashboard é uma camada de **visualização de planilhas**, não um coletor automático de Diários Oficiais. A coleta e a extração são realizadas em cada análise no ChatGPT ou em um processo externo. A compatibilidade efetiva deve ser verificada importando um Excel de teste no dashboard publicado após qualquer alteração do modelo.

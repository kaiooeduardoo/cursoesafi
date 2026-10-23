"use strict";

const demo = window.DOE_DEMO;
const $ = (id) => document.getElementById(id);
const money = new Intl.NumberFormat("pt-BR", {
  style: "currency", currency: "BRL", maximumFractionDigits: 2
});
const integer = new Intl.NumberFormat("pt-BR");

const STATE_NAMES = Object.freeze({
  AC: "Acre", AL: "Alagoas", AP: "Amapá", AM: "Amazonas",
  BA: "Bahia", CE: "Ceará", DF: "Distrito Federal", ES: "Espírito Santo",
  GO: "Goiás", MA: "Maranhão", MT: "Mato Grosso", MS: "Mato Grosso do Sul",
  MG: "Minas Gerais", PA: "Pará", PB: "Paraíba", PR: "Paraná",
  PE: "Pernambuco", PI: "Piauí", RJ: "Rio de Janeiro",
  RN: "Rio Grande do Norte", RS: "Rio Grande do Sul", RO: "Rondônia",
  RR: "Roraima", SC: "Santa Catarina", SP: "São Paulo",
  SE: "Sergipe", TO: "Tocantins"
});

const LIMITS = Object.freeze({
  fileBytes: 15 * 1024 * 1024,
  zipItems: 500,
  totalUncompressedBytes: 100 * 1024 * 1024,
  entryUncompressedBytes: 30 * 1024 * 1024,
  xmlBytes: 25 * 1024 * 1024,
  rowsPerSheet: 20000,
  cellsPerSheet: 350000,
  charactersPerCell: 50000
});

let source = demo;
let loadedName = "Demonstração • Paraíba • 15/07/2026";
let tab = "Instrumentos";
let imported = false;
let detectedUF = "PB";
let detectionStatus = "demo";

const missing = (value) => value == null ||
  String(value).trim() === "" ||
  /^(não informado|não se aplica)$/i.test(String(value).trim());

const fieldText = (value) => missing(value) ? "Não informado" : String(value).trim();

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[character]));
}

function amount(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  let normalized = String(value ?? "").replace(/R\$|\s/g, "");
  if (!normalized) return 0;
  if (normalized.includes(",")) normalized = normalized.replace(/\./g, "").replace(",", ".");
  const result = Number(normalized);
  return Number.isFinite(result) ? result : 0;
}

function isTed(row) {
  return /\bTED\b|execução descentralizada/i.test(fieldText(row["Tipo de instrumento"]));
}

function normalizeUF(value) {
  const candidate = String(value ?? "").trim().toUpperCase();
  if (STATE_NAMES[candidate]) return candidate;
  const simplified = (text) => text.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/\s+/g, " ");
  return Object.keys(STATE_NAMES).find((uf) => simplified(STATE_NAMES[uf]) === simplified(candidate)) || "";
}

function identifyUF() {
  const rows = source.Instrumentos;
  const all = rows.map((row) => normalizeUF(row.UF ?? row.Uf ?? row.uf ?? row.Estado ?? row.estado)).filter(Boolean);
  const unique = [...new Set(all)];
  if (unique.length === 1) {
    detectedUF = unique[0];
    detectionStatus = all.length === rows.length ? "complete" : "partial";
  } else if (unique.length > 1) {
    detectedUF = "BR";
    detectionStatus = "multiple";
  } else {
    detectedUF = "";
    detectionStatus = "missing";
  }
  $("uf").value = "";
  updateUF();
}

function updateUF() {
  let label;
  let detail;
  if (!imported) {
    label = "Paraíba (PB) — demonstração";
    detail = "Ao importar o Excel, a UF será identificada automaticamente pela coluna UF da aba Instrumentos.";
  } else if (detectionStatus === "complete") {
    label = `${STATE_NAMES[detectedUF]} (${detectedUF})`;
    detail = `UF identificada automaticamente nos ${source.Instrumentos.length} registros da planilha.`;
  } else if (detectionStatus === "partial") {
    label = `${STATE_NAMES[detectedUF]} (${detectedUF}) — parcial`;
    detail = "Alguns registros não informam UF. Confira a origem do arquivo.";
  } else if (detectionStatus === "multiple") {
    label = "Vários estados";
    detail = "A planilha contém registros de mais de uma UF. Os valores estão consolidados.";
  } else {
    const selected = $("uf").value;
    label = selected ? `${STATE_NAMES[selected]} (${selected}) — informado manualmente` : "UF não identificada";
    detail = "A coluna UF não contém um estado válido. Informe manualmente ou corrija a planilha.";
  }
  $("ufDetected").textContent = label;
  $("ufHelp").textContent = detail;
  $("ufFallback").style.display = imported && detectionStatus === "missing" ? "block" : "none";
  $("subtitle").textContent = imported
    ? `DOE • ${label} • ${loadedName}`
    : "Demonstração: DOE da Paraíba (15/07/2026) • Importe um Excel para analisar outra UF";
}

function cleanRows(rows) {
  return rows.filter((row) => Object.values(row).some((value) => !missing(value)) &&
    !String(row["ID registro"] ?? row["ID aditivo"] ?? "").startsWith("EXEMPLO"));
}

function checkZipEntries(buffer) {
  const view = new DataView(buffer);
  const size = buffer.byteLength;
  if (size < 22) throw new Error("Arquivo XLSX incompleto.");

  let end = -1;
  for (let offset = size - 22; offset >= Math.max(0, size - 65557); offset--) {
    if (view.getUint32(offset, true) === 0x06054b50 &&
        offset + 22 + view.getUint16(offset + 20, true) === size) {
      end = offset;
      break;
    }
  }
  if (end < 0) throw new Error("Estrutura ZIP do XLSX não reconhecida.");

  const entries = view.getUint16(end + 10, true);
  const centralSize = view.getUint32(end + 12, true);
  const centralOffset = view.getUint32(end + 16, true);
  if (entries === 0xffff || centralSize === 0xffffffff || centralOffset === 0xffffffff) {
    throw new Error("XLSX em ZIP64 não suportado pelo importador local.");
  }
  if (entries > LIMITS.zipItems || centralOffset + centralSize > size) {
    throw new Error("O arquivo excede os limites de estrutura permitidos.");
  }

  let total = 0;
  let cursor = centralOffset;
  for (let i = 0; i < entries; i++) {
    if (cursor + 46 > size || view.getUint32(cursor, true) !== 0x02014b50) {
      throw new Error("Diretório interno do XLSX inválido.");
    }
    const flags = view.getUint16(cursor + 8, true);
    const method = view.getUint16(cursor + 10, true);
    const compressed = view.getUint32(cursor + 20, true);
    const uncompressed = view.getUint32(cursor + 24, true);
    const next = cursor + 46 + view.getUint16(cursor + 28, true) +
      view.getUint16(cursor + 30, true) + view.getUint16(cursor + 32, true);
    if (flags & 1 || ![0, 8].includes(method)) throw new Error("Formato de compactação do XLSX não suportado.");
    if (next > size || uncompressed === 0xffffffff) throw new Error("Entrada XLSX inválida.");
    total += uncompressed;
    if (uncompressed > LIMITS.entryUncompressedBytes || total > LIMITS.totalUncompressedBytes ||
        (uncompressed > 2 * 1024 * 1024 && uncompressed / Math.max(1, compressed) > 300)) {
      throw new Error("Conteúdo descompactado excede os limites de segurança.");
    }
    cursor = next;
  }
  if (cursor !== centralOffset + centralSize) throw new Error("Estrutura ZIP inconsistente.");
}

function parseXml(xml, name) {
  if (new Blob([xml]).size > LIMITS.xmlBytes) {
    throw new Error(`${name} excede o limite de tamanho de XML.`);
  }
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  if (doc.getElementsByTagName("parsererror").length) {
    throw new Error(`XML inválido em ${name}.`);
  }
  return doc;
}

function worksheetRows(xml, sharedStrings) {
  const documentXml = parseXml(xml, "planilha");
  const rowNodes = documentXml.getElementsByTagNameNS("*", "row");
  if (rowNodes.length > LIMITS.rowsPerSheet + 1) {
    throw new Error("A planilha excede o limite de 20.000 linhas por aba.");
  }
  let cellCount = 0;
  const table = [];
  for (const row of rowNodes) {
    const current = {};
    const cells = row.getElementsByTagNameNS("*", "c");
    cellCount += cells.length;
    if (cellCount > LIMITS.cellsPerSheet) throw new Error("A planilha contém células demais.");
    for (const cell of cells) {
      const ref = (cell.getAttribute("r") || "").match(/^[A-Z]+/);
      if (!ref) continue;
      let column = 0;
      for (const char of ref[0]) column = column * 26 + char.charCodeAt(0) - 64;
      const kind = cell.getAttribute("t");
      let content = cell.getElementsByTagNameNS("*", "v")[0]?.textContent || "";
      if (kind === "s") content = sharedStrings[Number(content)] || "";
      if (kind === "inlineStr") {
        content = Array.from(cell.getElementsByTagNameNS("*", "t"))
          .map((node) => node.textContent).join("");
      }
      if (content.length > LIMITS.charactersPerCell) {
        throw new Error("O arquivo contém uma célula com texto excessivamente longo.");
      }
      current[column - 1] = content;
    }
    table.push(current);
  }
  const header = table[0] || {};
  const headers = Object.values(header).map(String);
  const records = table.slice(1).map((row) =>
    Object.fromEntries(Object.entries(header).map(([index, label]) => [label, row[index] ?? ""]))
  ).filter((row) => Object.values(row).some((value) => String(value).trim()));
  return { records, headers };
}

function resolveWorksheetPath(target) {
  if (!target || /^\w+:\/\//.test(target) || target.includes("\\") || target.includes("..")) {
    return null;
  }
  const normalized = target.startsWith("/") ? target.slice(1) :
    target.startsWith("xl/") ? target : `xl/${target}`;
  return normalized.replace(/\/\.\//g, "/");
}

async function loadExcel(file) {
  try {
    if (!/\.xlsx$/i.test(file.name)) throw new Error("Selecione um arquivo .xlsx.");
    if (file.size > LIMITS.fileBytes) throw new Error("Arquivo acima de 15 MB. Utilize um Excel menor.");
    $("status").textContent = "Lendo arquivo local e verificando sua estrutura...";

    const buffer = await file.arrayBuffer();
    checkZipEntries(buffer);
    const zip = await JSZip.loadAsync(buffer);
    const sharedEntry = zip.file("xl/sharedStrings.xml");
    let sharedStrings = [];
    if (sharedEntry) {
      const documentXml = parseXml(await sharedEntry.async("string"), "textos compartilhados");
      sharedStrings = Array.from(documentXml.getElementsByTagNameNS("*", "si"))
        .map((node) => Array.from(node.getElementsByTagNameNS("*", "t"))
          .map((textNode) => textNode.textContent).join(""));
      if (sharedStrings.some((str) => str.length > LIMITS.charactersPerCell)) {
        throw new Error("A planilha contém um texto excessivamente longo.");
      }
    }

    const workbook = zip.file("xl/workbook.xml");
    const relationships = zip.file("xl/_rels/workbook.xml.rels");
    if (!workbook || !relationships) throw new Error("Estrutura XLSX não reconhecida.");
    const workbookDoc = parseXml(await workbook.async("string"), "workbook");
    const relDoc = parseXml(await relationships.async("string"), "relacionamentos");

    const targets = {};
    for (const rel of relDoc.getElementsByTagNameNS("*", "Relationship")) {
      if (rel.getAttribute("TargetMode") !== "External") {
        targets[rel.getAttribute("Id")] = rel.getAttribute("Target");
      }
    }
    const tabs = {};
    const names = [];
    for (const sheet of workbookDoc.getElementsByTagNameNS("*", "sheet")) {
      const name = sheet.getAttribute("name") || "";
      names.push(name);
      const normalized = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .trim().toLowerCase();
      const expected = normalized === "instrumentos" ? "Instrumentos" :
        normalized === "aditivos" ? "Aditivos" : null;
      if (!expected) continue;
      const id = sheet.getAttribute("r:id") ||
        sheet.getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships", "id");
      const path = resolveWorksheetPath(targets[id]);
      const entry = path && zip.file(path);
      if (entry) tabs[expected] = worksheetRows(await entry.async("string"), sharedStrings);
    }
    if (!tabs.Instrumentos) {
      throw new Error(`A aba "Instrumentos" não foi encontrada. Abas presentes: ${names.join(", ") || "nenhuma"}.`);
    }
    const required = ["Tipo de instrumento", "Valor original (R$)", "Órgão concedente", "Beneficiário"];
    if (required.some((field) => !tabs.Instrumentos.headers.includes(field))) {
      throw new Error("A aba Instrumentos não possui os cabeçalhos necessários do modelo.");
    }

    source = {
      Instrumentos: cleanRows(tabs.Instrumentos.records),
      Aditivos: cleanRows(tabs.Aditivos?.records || [])
    };
    loadedName = file.name;
    tab = "Instrumentos";
    imported = true;
    for (const id of ["search", "org", "cat", "city"]) $(id).value = "";
    identifyUF();
    initFilters();
    render();
    $("status").textContent = `✓ ${integer.format(source.Instrumentos.length)} instrumentos e ` +
      `${integer.format(source.Aditivos.length)} alterações importados de ${file.name}. ` +
      "Dados processados localmente, sem envio do Excel a servidores.";
  } catch (error) {
    $("status").textContent = `Erro ao importar: ${error.message}`;
    console.error("Falha de importação XLSX:", error);
  }
}

function fillSelect(id, field, allLabel) {
  const select = $(id);
  select.replaceChildren();
  const first = document.createElement("option");
  first.value = "";
  first.textContent = allLabel;
  select.appendChild(first);
  const values = [...new Set(source.Instrumentos.map((row) => fieldText(row[field]))
    .filter((item) => item !== "Não informado"))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  for (const item of values) {
    const option = document.createElement("option");
    option.value = item;
    option.textContent = item;
    select.appendChild(option);
  }
}

function initFilters() {
  fillSelect("org", "Órgão concedente", "Todos os órgãos");
  fillSelect("cat", "Tipo de instrumento", "Todos os tipos");
  fillSelect("city", "Município", "Todos os municípios");
}

function instrumentsFiltered() {
  const query = $("search").value.trim().toLocaleLowerCase("pt-BR");
  return source.Instrumentos.filter((row) =>
    (!$("org").value || fieldText(row["Órgão concedente"]) === $("org").value) &&
    (!$("cat").value || fieldText(row["Tipo de instrumento"]) === $("cat").value) &&
    (!$("city").value || fieldText(row["Município"]) === $("city").value) &&
    (!query || Object.values(row).join(" ").toLocaleLowerCase("pt-BR").includes(query))
  );
}

function changesFiltered() {
  const query = $("search").value.trim().toLocaleLowerCase("pt-BR");
  return source.Aditivos.filter((row) =>
    (!$("org").value || fieldText(row["Órgão concedente"]) === $("org").value) &&
    (!query || Object.values(row).join(" ").toLocaleLowerCase("pt-BR").includes(query))
  );
}

function aggregates(rows, category, amountField = "") {
  const values = new Map();
  for (const row of rows) {
    const key = fieldText(row[category]);
    values.set(key, (values.get(key) || 0) + (amountField ? amount(row[amountField]) : 1));
  }
  return [...values].sort((first, second) => second[1] - first[1]);
}

function drawBars(id, values, isCurrency = false) {
  const parent = $(id);
  parent.replaceChildren();
  const list = values.slice(0, 6);
  if (!list.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "Sem dados para os filtros selecionados.";
    parent.appendChild(empty);
    return;
  }
  const max = Math.max(...list.map((row) => row[1]), 0);
  for (const [name, value] of list) {
    const row = document.createElement("div");
    row.className = "barrow";
    row.title = name;
    const label = document.createElement("div");
    label.className = "barlabel";
    label.textContent = name;
    const track = document.createElement("div");
    track.className = "track";
    const fill = document.createElement("div");
    fill.className = "fill";
    fill.style.width = `${max ? Math.max(2, 100 * value / max) : 0}%`;
    track.appendChild(fill);
    const total = document.createElement("div");
    total.className = "num";
    total.textContent = isCurrency ? money.format(value) : integer.format(value);
    row.append(label, track, total);
    parent.appendChild(row);
  }
}

// Composição por natureza: gráfico de rosca e legenda textual acessível.
function drawDonut(id, categories) {
  const parent = $(id);
  parent.replaceChildren();
  const positive = categories.filter((entry) => entry[1] > 0);
  const total = positive.reduce((sum, entry) => sum + entry[1], 0);
  if (!total) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "Sem dados para os filtros selecionados.";
    parent.appendChild(empty);
    return;
  }

  const entries = positive.length > 6
    ? [...positive.slice(0, 5), ["Outras naturezas", positive.slice(5).reduce((sum, row) => sum + row[1], 0)]]
    : positive;
  const palette = ["#39d2b7", "#68a5f5", "#ae91ef", "#efb862", "#e78fac", "#75c9a5"];
  const percent = (value) => `${(value / total * 100).toLocaleString("pt-BR", {maximumFractionDigits: 1})}%`;
  const wrap = document.createElement("div");
  wrap.className = "donut-layout";
  const graphic = document.createElement("div");
  graphic.className = "donut-graphic";
  graphic.setAttribute("role", "img");
  graphic.setAttribute("aria-label", `Distribuição de ${total} instrumentos entre ${positive.length} naturezas. Consulte a legenda para as quantidades.`);

  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", "0 0 240 240");
  svg.setAttribute("aria-hidden", "true");
  svg.classList.add("donut-svg");
  const track = document.createElementNS(ns, "circle");
  track.setAttribute("cx", "120");
  track.setAttribute("cy", "120");
  track.setAttribute("r", "83");
  track.setAttribute("fill", "none");
  track.setAttribute("stroke", "#2a3c50");
  track.setAttribute("stroke-width", "28");
  svg.appendChild(track);

  const position = (degrees) => {
    const radians = degrees * Math.PI / 180;
    return [120 + 83 * Math.cos(radians), 120 + 83 * Math.sin(radians)];
  };
  let angle = -90;
  entries.forEach(([name, value], index) => {
    const sweep = 360 * value / total;
    const segment = document.createElementNS(ns, entries.length === 1 ? "circle" : "path");
    if (entries.length === 1) {
      segment.setAttribute("cx", "120");
      segment.setAttribute("cy", "120");
      segment.setAttribute("r", "83");
      segment.setAttribute("fill", "none");
    } else {
      const gap = Math.min(2.2, sweep * 0.16);
      const start = angle + gap / 2;
      const end = angle + sweep - gap / 2;
      const [sx, sy] = position(start);
      const [ex, ey] = position(end);
      segment.setAttribute("d", `M ${sx} ${sy} A 83 83 0 ${end - start > 180 ? 1 : 0} 1 ${ex} ${ey}`);
      segment.setAttribute("fill", "none");
    }
    segment.setAttribute("stroke", palette[index]);
    segment.setAttribute("stroke-width", "28");
    segment.classList.add("donut-segment");
    const title = document.createElementNS(ns, "title");
    title.textContent = `${name}: ${integer.format(value)} (${percent(value)})`;
    segment.appendChild(title);
    svg.appendChild(segment);
    angle += sweep;
  });
  const center = document.createElement("div");
  center.className = "donut-center";
  const number = document.createElement("strong");
  number.className = "donut-total";
  number.textContent = integer.format(total);
  const description = document.createElement("span");
  description.textContent = total === 1 ? "instrumento" : "instrumentos";
  center.append(number, description);
  graphic.append(svg, center);

  const legend = document.createElement("div");
  legend.className = "donut-legend";
  for (const [index, [name, value]] of entries.entries()) {
    const item = document.createElement("div");
    item.className = "donut-legend-item";
    item.title = name;
    const dot = document.createElement("span");
    dot.className = "donut-dot";
    dot.style.backgroundColor = palette[index];
    const label = document.createElement("span");
    label.className = "donut-legend-name";
    label.textContent = name;
    const stat = document.createElement("span");
    stat.className = "donut-legend-stat";
    const count = document.createElement("strong");
    count.textContent = integer.format(value);
    const share = document.createElement("small");
    share.textContent = percent(value);
    stat.append(count, share);
    item.append(dot, label, stat);
    legend.appendChild(item);
  }
  wrap.append(graphic, legend);
  parent.appendChild(wrap);
}

function officialLink(row) {
  const raw = row["URL PDF oficial"];
  if (missing(raw)) return "—";
  const urlString = String(raw).trim();
  if (urlString.length > 2048 || /[\u0000-\u0020\u007f]/.test(urlString)) return "—";
  try {
    const url = new URL(urlString);
    if (url.protocol !== "https:" || !url.hostname.includes(".") ||
        url.username || url.password || !["", "443"].includes(url.port)) return "—";
    const hostname = url.hostname;
    return `<a class="link" href="${escapeHtml(url.href)}" target="_blank" ` +
      `rel="noopener noreferrer" title="Link informado na planilha. Verifique a autenticidade da fonte.">` +
      `Fonte informada: ${escapeHtml(hostname)} ↗</a>`;
  } catch {
    return "—";
  }
}

function render() {
  updateUF();
  const instruments = instrumentsFiltered();
  const changes = changesFiltered();
  $("k1").textContent = integer.format(instruments.length);
  $("k2").textContent = money.format(instruments.filter((row) => !isTed(row))
    .reduce((total, row) => total + amount(row["Valor original (R$)"]), 0));
  $("k3").textContent = money.format(instruments.filter(isTed)
    .reduce((total, row) => total + amount(row["Valor original (R$)"]), 0));
  $("k4").textContent = integer.format(changes.length);
  drawDonut("categoryChart", aggregates(instruments, "Tipo de instrumento"));
  drawBars("orgChart", aggregates(instruments, "Órgão concedente", "Valor original (R$)"), true);
  $("tabInstrumentos").classList.toggle("on", tab === "Instrumentos");
  $("tabAditivos").classList.toggle("on", tab === "Aditivos");

  const records = tab === "Instrumentos" ? instruments : changes;
  const columns = tab === "Instrumentos"
    ? ["Número do instrumento", "Tipo de instrumento", "Órgão concedente", "Beneficiário", "Município", "Valor original (R$)", "Página impressa", "URL PDF oficial"]
    : ["Instrumento original", "Tipo de alteração", "Órgão concedente", "Beneficiário", "Valor do aditivo (R$)", "Página impressa", "URL PDF oficial"];

  $("counts").textContent = `${integer.format(records.length)} registros visíveis • ${loadedName}`;
  if (!records.length) {
    $("table").innerHTML = '<div class="empty">Nenhum registro encontrado.</div>';
    return;
  }
  let output = "<table><thead><tr>" + columns.map((column) =>
    `<th>${escapeHtml(column.replace(" (R$)", ""))}</th>`).join("") + "</tr></thead><tbody>";
  for (const row of records.slice(0, 500)) {
    output += "<tr>" + columns.map((column) => {
      const value = row[column];
      if (column === "URL PDF oficial") return `<td>${officialLink(row)}</td>`;
      if (/Valor /.test(column)) return `<td class="num">${missing(value) ? "—" : money.format(amount(value))}</td>`;
      if (column === "Tipo de instrumento") {
        return `<td><span class="pill ${isTed(row) ? "alt" : ""}">${escapeHtml(fieldText(value))}</span></td>`;
      }
      return `<td title="${escapeHtml(fieldText(value))}">${escapeHtml(fieldText(value))}</td>`;
    }).join("") + "</tr>";
  }
  output += "</tbody></table>";
  $("table").innerHTML = output;
  if (records.length > 500) $("counts").textContent += " • exibindo os primeiros 500";
}

function csvCell(value) {
  let text = String(value ?? "");
  if (/^[\s\u0000-\u001f\uFEFF]*[=+\-@]/u.test(text) || /^[\t\r\n]/.test(text)) {
    text = "'" + text;
  }
  return `"${text.replace(/"/g, '""')}"`;
}

function exportCsv() {
  const records = tab === "Instrumentos" ? instrumentsFiltered() : changesFiltered();
  if (!records.length) {
    alert("Não há dados para exportar.");
    return;
  }
  const headers = Object.keys(records[0]);
  const line = (values) => values.map(csvCell).join(";");
  const content = "\ufeff" + line(headers) + "\r\n" +
    records.map((row) => line(headers.map((header) => row[header]))).join("\r\n");
  const href = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = href;
  link.download = `DOE_${detectionStatus === "missing" ? ($("uf").value || "NI") : (detectedUF || "BR")}_${tab}_filtrados.csv`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(href), 3000);
}

$("file").addEventListener("change", (event) => {
  if (event.target.files[0]) void loadExcel(event.target.files[0]);
  event.target.value = "";
});
$("pick").addEventListener("click", () => $("file").click());
$("print").addEventListener("click", () => window.print());
$("export").addEventListener("click", exportCsv);
$("theme").addEventListener("click", () => document.body.classList.toggle("light"));
for (const id of ["org", "cat", "city", "search"]) {
  $(id).addEventListener(id === "search" ? "input" : "change", render);
}
$("uf").addEventListener("change", updateUF);
$("tabInstrumentos").addEventListener("click", () => { tab = "Instrumentos"; render(); });
$("tabAditivos").addEventListener("click", () => { tab = "Aditivos"; render(); });
const drop = $("drop");
for (const event of ["dragenter", "dragover"]) {
  drop.addEventListener(event, (ev) => { ev.preventDefault(); drop.classList.add("drag"); });
}
for (const event of ["dragleave", "drop"]) {
  drop.addEventListener(event, (ev) => { ev.preventDefault(); drop.classList.remove("drag"); });
}
drop.addEventListener("drop", (ev) => {
  if (ev.dataTransfer.files[0]) void loadExcel(ev.dataTransfer.files[0]);
});

initFilters();
render();

"""Verificação estrutural do pacote público, sem dependências externas."""
from pathlib import Path
import json
import re
import zipfile
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
files = [
    "index.html", "como-usar.html", "README.md", "SECURITY.md",
    "INSTRUCOES_CHATGPT.md", "CRITERIOS_EXTRACAO.md",
    "MODELO_EXTRACAO.xlsx", "PROMPT_EXEMPLO.txt",
    "assets/dashboard.js", "assets/demo-data.js", "assets/dashboard.css",
    "assets/help.js", "assets/help.css", "assets/vendor/jszip.min.js",
]
for name in files:
    assert (ROOT / name).is_file(), f"Arquivo ausente: {name}"

for html in ("index.html", "como-usar.html"):
    content = (ROOT / html).read_text(encoding="utf-8")
    assert "Content-Security-Policy" in content
    assert "connect-src 'none'" in content
    assert not re.search(r"<script(?![^>]*\bsrc=)[^>]*>", content)
    assert not re.search(r"\bonclick\s*=", content)
    for ref in re.findall(r'(?:src|href)="(assets/[^\"]+)"', content):
        assert (ROOT / ref).is_file(), f"Referência inválida: {ref}"

help_html = (ROOT / "como-usar.html").read_text(encoding="utf-8")
assert "https://github.com/kaiooeduardoo/cursoesafi" in help_html
assert "v3.0?" not in help_html

with zipfile.ZipFile(ROOT / "MODELO_EXTRACAO.xlsx") as book:
    assert not any("vbaProject.bin" in item for item in book.namelist())
    workbook = ET.fromstring(book.read("xl/workbook.xml"))
    sheets = [node.attrib["name"] for node in workbook.iter() if node.tag.endswith("}sheet")]
    assert sheets == [
        "Instrumentos", "Aditivos", "Resumo por órgão", "Resumo por município",
        "Controle das edições", "Dicionário de dados",
    ], sheets

sample = (ROOT / "assets/demo-data.js").read_text(encoding="utf-8")
start = sample.index("window.DOE_DEMO = ") + len("window.DOE_DEMO = ")
records = json.loads(sample[start:].strip().removesuffix(";"))
assert len(records["Instrumentos"]) == 23
assert len(records["Aditivos"]) == 7
print("OK: arquivos, referências locais, CSP, modelo XLSX e dados de demonstração.")

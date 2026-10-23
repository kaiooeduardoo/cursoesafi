import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const js = readFileSync(join(root, 'assets/dashboard.js'), 'utf8');

function loadFunction(name, next) {
  const begin = js.indexOf(`function ${name}(`);
  const end = js.indexOf(`\nfunction ${next}(`, begin);
  assert.ok(begin >= 0 && end > begin, `Função ${name} não encontrada`);
  const context = { DataView, Blob, Error, Uint8Array };
  const constants = js.slice(js.indexOf('const LIMITS ='), js.indexOf('let source ='));
  vm.runInNewContext(`${constants}\n${js.slice(begin, end)}; this.fn = ${name};`, context);
  return context.fn;
}

const csvCell = loadFunction('csvCell', 'exportCsv');
for (const value of ['=SUM(A1:A2)', '+cmd', '-2+3', '@SUM(A1)', '  =HYPERLINK("https://bad.example","x")', '\t=SUM(1,2)']) {
  assert.ok(csvCell(value).startsWith('"\''), `Fórmula não neutralizada: ${JSON.stringify(value)}`);
}
assert.equal(csvCell('Nome "Teste"'), '"Nome ""Teste"""');

const inspectZip = loadFunction('checkZipEntries', 'parseXml');
const model = readFileSync(join(root, 'MODELO_EXTRACAO.xlsx'));
inspectZip(model.buffer.slice(model.byteOffset, model.byteOffset + model.byteLength));

const JSZip = (await import('../assets/vendor/jszip.min.js')).default;
const bomb = new JSZip();
bomb.file('xl/sharedStrings.xml', 'A'.repeat(8 * 1024 * 1024));
const compressed = await bomb.generateAsync({type:'uint8array', compression:'DEFLATE', compressionOptions:{level:9}});
assert.throws(() => inspectZip(compressed.buffer.slice(compressed.byteOffset, compressed.byteOffset + compressed.byteLength)), /limites de segurança/);
console.log('OK: CSV Injection, XLSX válido e arquivo compactado excessivamente.');

import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const code = readFileSync(join(root, 'assets/dashboard.js'), 'utf8');
const begin = code.indexOf('function drawDonut(');
const end = code.indexOf('\nfunction officialLink(', begin);
assert.ok(begin >= 0 && end > begin);

const makeElement = (tag) => ({
  tag, children: [], attributes: {}, style: {}, className: '', textContent: '', title: '',
  classList: { add() {} },
  append(...elements) { this.children.push(...elements); },
  appendChild(element) { this.children.push(element); },
  replaceChildren(...elements) { this.children = [...elements]; },
  setAttribute(name, value) { this.attributes[name] = String(value); }
});
const rootElement = makeElement('div');
const context = {
  document: { createElement: makeElement, createElementNS: (_ns, name) => makeElement(name) },
  $: () => rootElement,
  integer: new Intl.NumberFormat('pt-BR')
};
vm.runInNewContext(`${code.slice(begin, end)}; this.draw = drawDonut;`, context);
context.draw('categoryChart', [['Convênios/parcerias', 11], ['TED', 11], ['Termo de fomento', 1]]);
assert.equal(rootElement.children.length, 1);
const layout = rootElement.children[0];
assert.equal(layout.children.length, 2);
const [graphic, legend] = layout.children;
assert.equal(legend.children.length, 3);
assert.equal(graphic.children[1].children[0].textContent, '23');
assert.equal(legend.children[0].children[2].children[1].textContent, '47,8%');
assert.equal(legend.children[2].children[2].children[1].textContent, '4,3%');
context.draw('categoryChart', [['Fomento', 1]]);
assert.equal(rootElement.children[0].children[0].children[0].children[1].tag, 'circle');
context.draw('categoryChart', []);
assert.ok(rootElement.children[0].textContent.includes('Sem dados'));
context.draw('categoryChart', Array.from({length: 8}, (_, index) => [`Natureza ${index + 1}`, 10 - index]));
assert.equal(rootElement.children[0].children[1].children.length, 6);
assert.equal(rootElement.children[0].children[1].children[5].children[1].textContent, 'Outras naturezas');
console.log('OK: gráfico de rosca, legenda, percentuais, estado vazio e agrupamento de categorias.');

// Resumen de comidas por colaborador (mis_comidas) a partir del historial por quincena.
// Correr: cd tests && node --test historial.test.js   (no necesita el emulador)
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const fuente = (n) => html.match(new RegExp(`function ${n}\\([^)]*\\) \\{[\\s\\S]*?\\n\\}`))[0];
// eslint-disable-next-line no-new-func
const { resumenComidas } = new Function(fuente('orderDocId') + fuente('resumenComidas') + '\nreturn { resumenComidas };')();

const historial = {
  '2026-10-Q1': { '1108': { nombre: 'A', comidas: 1 }, '15': { nombre: 'B', comidas: 4 }, _cortesias: [{ nombre: 'C', comidas: 1 }] },
  '2026-10-Q2': { '1108': { nombre: 'A', comidas: 2 }, '5a': { nombre: 'D', comidas: 1 } },
  '2026-9-Q2': { '0015': { nombre: 'B', comidas: 2 } },
};

test('suma las comidas de cada quincena del colaborador', () => {
  assert.deepStrictEqual(resumenComidas(historial, '1108'), { '2026-10-Q1': 1, '2026-10-Q2': 2 });
});

test('reconoce el numero con ceros a la izquierda o en minusculas', () => {
  assert.deepStrictEqual(resumenComidas(historial, '15'), { '2026-10-Q1': 4, '2026-9-Q2': 2 });
  assert.deepStrictEqual(resumenComidas(historial, '5A'), { '2026-10-Q2': 1 });
});

test('no incluye cortesias ni a otras personas', () => {
  assert.deepStrictEqual(resumenComidas(historial, '999'), {});
});

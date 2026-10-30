// "Pedidos de hoy" en el panel de admin: total, platillos, personas y cortesías del día.
// Correr: cd tests && node --test pedidos-hoy.test.js   (no necesita el emulador)
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const dayMap = html.match(/const DAY_MAP = \{[^}]*\};/)[0];
const fuente = html.match(/function resumenHoy\(fecha\) \{[\s\S]*?\n\}/)[0];

function resumen(ordersData, cortesiasData, fecha) {
  const menuData = { dias: [
    { dia: 'Miercoles', fecha: 28, platoFuerte: 'Croquetas de atún' },
    { dia: 'Jueves', fecha: 29, platoFuerte: 'Pollo al tamarindo' },
  ] };
  // eslint-disable-next-line no-new-func
  return new Function('menuData', 'ordersData', 'cortesiasData', 'fecha', dayMap + fuente + '\nreturn resumenHoy(fecha);')(
    menuData, ordersData, cortesiasData, fecha);
}

const miercoles = new Date(2026, 9, 28, 10, 0);
const pedidos = [
  { nombre: 'Persona B', numEmpleado: '20', detalle: { Miercoles: 1, Jueves: 1 }, opciones: {} },
  { nombre: 'Persona A', numEmpleado: '3', detalle: { Miercoles: 1 }, opciones: { Miercoles: 'Ensalada' } },
  { nombre: 'Persona C', numEmpleado: '7', detalle: { Jueves: 1 }, opciones: {} },
];
const cortesias = [{ nombre: 'Invitado', dias: { Miercoles: 1 } }, { nombre: 'Otro día', dias: { Jueves: 1 } }];

test('cuenta solo el día de hoy, con platillos, personas y cortesías', () => {
  const r = resumen(pedidos, cortesias, miercoles);
  assert.strictEqual(r.dia.dia, 'Miercoles');
  assert.strictEqual(r.total, 3);
  assert.deepStrictEqual(r.platillos, { 'Croquetas de atún': 2, Ensalada: 1 });
  assert.deepStrictEqual(r.personas.map(p => p.num), ['3', '20']);
  assert.deepStrictEqual(r.cortesias, ['Invitado']);
});

test('sin servicio hoy (fin de semana o día fuera del menú)', () => {
  assert.strictEqual(resumen(pedidos, cortesias, new Date(2026, 9, 31)), null);
});

test('día del menú sin pedidos', () => {
  const r = resumen([], [], new Date(2026, 9, 29));
  assert.strictEqual(r.total, 0);
});

// "Enviar Orden a Cocina" debe incluir las cortesías en los totales y en el detalle.
// Correr: cd tests && node --test orden-cocina.test.js   (no necesita el emulador)
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const fuente = html.match(/function enviarOrdenCocinera\(\) \{[\s\S]*?\n\}/)[0];

function ordenCocina({ ordersData, cortesiasData }) {
  let mensaje = null;
  const window = { open: (url) => { mensaje = decodeURIComponent(url.split('text=')[1]); } };
  const showToast = () => {};
  const menuData = { semana: 4, mes: 'Octubre', anio: 2026, dias: [
    { dia: 'Miercoles', fecha: 28, platoFuerte: 'Croquetas' },
    { dia: 'Jueves', fecha: 29, platoFuerte: 'Pollo' },
  ] };
  // eslint-disable-next-line no-new-func
  new Function('window', 'showToast', 'menuData', 'ordersData', 'cortesiasData', fuente + '\nenviarOrdenCocinera();')(
    window, showToast, menuData, ordersData, cortesiasData);
  return mensaje;
}

const empleado = { nombre: 'Empleado Prueba', numEmpleado: '1', total: 1, detalle: { Miercoles: 1 }, opciones: {} };
const cortesia = { nombre: 'Invitado Prueba', dias: { Miercoles: 1 } };

test('las cortesías se suman al total del día y salen en su sección', () => {
  const msg = ordenCocina({ ordersData: [empleado], cortesiasData: [cortesia] });
  assert.match(msg, /Total: 2 comidas/);
  assert.match(msg, /\*Miercoles 28\*: 2 comidas/);
  assert.match(msg, /\*Cortesías:\*\nInvitado Prueba: Mie \(1\)/);
});

test('se puede mandar la orden aunque solo haya cortesías', () => {
  const msg = ordenCocina({ ordersData: [], cortesiasData: [cortesia] });
  assert.ok(msg, 'debe abrir WhatsApp con la orden');
  assert.match(msg, /Total: 1 comida/);
});

test('sin cortesías el mensaje queda como antes', () => {
  const msg = ordenCocina({ ordersData: [empleado], cortesiasData: [] });
  assert.match(msg, /Total: 1 comida/);
  assert.doesNotMatch(msg, /Cortesías/);
});

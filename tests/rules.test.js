// Pruebas de firestore.rules con el emulador.
// Correr: cd tests && npm install && npm test   (necesita Java para el emulador)
const { test, before, after, beforeEach } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
const { doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, collection, serverTimestamp } = require('firebase/firestore');

const ADMIN_PIN = '111111';
const SUPER_PIN = '222222';
let env;

const pedido = (numEmpleado, extra = {}) => ({
  nombre: 'Prueba', numEmpleado, fecha: new Date().toISOString(), total: 1,
  detalle: { Lunes: 1 }, opciones: { Lunes: 'Milanesa' }, ...extra,
});

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-menu-yama',
    firestore: { rules: fs.readFileSync(path.join(__dirname, '..', 'firestore.rules'), 'utf8') },
  });
});
after(async () => { await env.cleanup(); });
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'config/secrets'), { adminPin: ADMIN_PIN, superPin: SUPER_PIN });
    await setDoc(doc(db, 'config/menu'), { mes: 'Octubre' });
    await setDoc(doc(db, 'orders/456'), pedido('456'));
    await setDoc(doc(db, 'orders/789'), pedido('0789')); // pedido viejo con cero a la izquierda
    await setDoc(doc(db, 'historial/2026-10-Q2'), { '123': { nombre: 'Prueba', comidas: 2 }, '456': { nombre: 'Otro', comidas: 3 } });
    await setDoc(doc(db, 'mis_comidas/123'), { quincenas: { '2026-10-Q2': 2 } });
    await setDoc(doc(db, 'mis_comidas/456'), { quincenas: { '2026-10-Q2': 3 } });
  });
});

// Empleado que entro por el Gestor: custom token con claim numEmp
const emp = (n) => env.authenticatedContext(`emp_${n}`, { numEmp: n }).firestore();
const anon = () => env.authenticatedContext('anon_1', { firebase: { sign_in_provider: 'anonymous' } }).firestore();

async function adminDb(level = 'admin', pin = ADMIN_PIN, uid = 'anon_admin') {
  const db = env.authenticatedContext(uid, { firebase: { sign_in_provider: 'anonymous' } }).firestore();
  await assertSucceeds(setDoc(doc(db, `admin_sessions/${uid}`), { pin, level, createdAt: serverTimestamp() }));
  return db;
}

test('empleado crea, lee, modifica y borra SU pedido', async () => {
  const db = emp('123');
  await assertSucceeds(setDoc(doc(db, 'orders/123'), pedido('123')));
  await assertSucceeds(getDoc(doc(db, 'orders/123')));
  await assertSucceeds(updateDoc(doc(db, 'orders/123'), { detalle: { Lunes: 1, Martes: 1 }, total: 2 }));
  await assertSucceeds(deleteDoc(doc(db, 'orders/123')));
});

test('empleado con pedido viejo "0789" lo puede modificar y cancelar', async () => {
  const db = emp('789');
  await assertSucceeds(getDoc(doc(db, 'orders/789')));
  await assertSucceeds(setDoc(doc(db, 'orders/789'), pedido('0789', { total: 2, detalle: { Lunes: 1, Martes: 1 } })));
  await assertSucceeds(deleteDoc(doc(db, 'orders/789')));
});

test('empleado NO toca el pedido de otro', async () => {
  const db = emp('123');
  await assertFails(setDoc(doc(db, 'orders/456'), pedido('456')));
  await assertFails(setDoc(doc(db, 'orders/999'), pedido('999')));
  await assertFails(updateDoc(doc(db, 'orders/456'), { total: 0 }));
  await assertFails(deleteDoc(doc(db, 'orders/456')));
  await assertFails(getDoc(doc(db, 'orders/456')));
  await assertFails(getDocs(collection(db, 'orders')));
});

test('empleado NO guarda su id con otro numEmpleado', async () => {
  const db = emp('123');
  await assertFails(setDoc(doc(db, 'orders/123'), pedido('456')));
});

test('empleado sigue sin poder mandar campos extra ni totales invalidos', async () => {
  const db = emp('123');
  await assertFails(setDoc(doc(db, 'orders/123'), pedido('123', { hack: true })));
  await assertFails(setDoc(doc(db, 'orders/123'), pedido('123', { total: 99 })));
});

test('anonimo (sin Gestor) no pide, no cancela, no lee pedidos; si ve el menu', async () => {
  const db = anon();
  await assertFails(setDoc(doc(db, 'orders/123'), pedido('123')));
  await assertFails(deleteDoc(doc(db, 'orders/456')));
  await assertFails(getDoc(doc(db, 'orders/456')));
  await assertFails(getDocs(collection(db, 'orders')));
  await assertSucceeds(getDoc(doc(db, 'config/menu')));
});

test('sin token no hay nada', async () => {
  const db = env.unauthenticatedContext().firestore();
  await assertFails(getDoc(doc(db, 'config/menu')));
  await assertFails(setDoc(doc(db, 'orders/123'), pedido('123')));
});

test('claim numEmp que no es string no sirve', async () => {
  const db = env.authenticatedContext('emp_x', { numEmp: 123 }).firestore();
  await assertFails(setDoc(doc(db, 'orders/123'), pedido('123')));
});

test('admin con PIN (anonimo) sigue pudiendo todo en orders', async () => {
  const db = await adminDb();
  await assertSucceeds(getDocs(collection(db, 'orders')));
  await assertSucceeds(setDoc(doc(db, 'orders/999'), pedido('999')));
  await assertSucceeds(deleteDoc(doc(db, 'orders/456')));
});

test('admin con PIN desde una sesion del Gestor (uid emp_*) tambien funciona', async () => {
  const uid = 'emp_123';
  const db = env.authenticatedContext(uid, { numEmp: '123' }).firestore();
  await assertSucceeds(setDoc(doc(db, `admin_sessions/${uid}`), { pin: ADMIN_PIN, level: 'admin', createdAt: serverTimestamp() }));
  await assertSucceeds(deleteDoc(doc(db, 'orders/456')));
});

test('PIN incorrecto no crea sesion ni da acceso', async () => {
  const db = anon();
  await assertFails(setDoc(doc(db, 'admin_sessions/anon_1'), { pin: '000000', level: 'admin', createdAt: serverTimestamp() }));
  await assertFails(getDocs(collection(db, 'orders')));
});

test('super con PIN escribe el catalogo; nadie lee config/secrets', async () => {
  const db = await adminDb('super', SUPER_PIN);
  await assertSucceeds(setDoc(doc(db, 'config/catalogo'), { '123': { nombre: 'Prueba' } }));
  await assertFails(getDoc(doc(db, 'config/secrets')));
  await assertFails(getDoc(doc(emp('123'), 'config/secrets')));
});

test('historial: el colaborador ya no lo lee, solo su resumen en mis_comidas', async () => {
  const db = emp('123');
  await assertFails(getDoc(doc(db, 'historial/2026-10-Q2')));
  await assertFails(getDocs(collection(db, 'historial')));
  await assertSucceeds(getDoc(doc(db, 'mis_comidas/123')));
  await assertFails(getDoc(doc(db, 'mis_comidas/456')));
  await assertFails(getDocs(collection(db, 'mis_comidas')));
  await assertFails(setDoc(doc(db, 'mis_comidas/123'), { quincenas: { '2026-10-Q2': 99 } }));
});

test('historial: anonimo no lee ni historial ni resumenes', async () => {
  const db = anon();
  await assertFails(getDoc(doc(db, 'historial/2026-10-Q2')));
  await assertFails(getDoc(doc(db, 'mis_comidas/123')));
});

test('historial: el admin con PIN lee el historial y escribe los resumenes', async () => {
  const db = await adminDb();
  await assertSucceeds(getDocs(collection(db, 'historial')));
  await assertSucceeds(setDoc(doc(db, 'historial/2026-10-Q2'), { '123': { nombre: 'Prueba', comidas: 3 } }));
  await assertSucceeds(setDoc(doc(db, 'mis_comidas/123'), { quincenas: { '2026-10-Q2': 3 } }));
  await assertSucceeds(getDocs(collection(db, 'mis_comidas')));
});

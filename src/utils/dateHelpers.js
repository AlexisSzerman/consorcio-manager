// Todas las fechas de negocio (vencimiento, fecha_pago) se manejan como strings 'YYYY-MM-DD'

export function hoyStr() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function esHoy(fechaStr) {
  return fechaStr === hoyStr();
}

export function esVencido(fechaStr) {
  if (!fechaStr) return false;
  return fechaStr < hoyStr();
}

export function esEstaSemana(fechaStr) {
  if (!fechaStr) return false;
  const f = new Date(fechaStr + 'T00:00:00');
  const hoy = new Date(hoyStr() + 'T00:00:00');
  const diffDias = (f - hoy) / (1000 * 60 * 60 * 24);
  return diffDias >= 0 && diffDias <= 7;
}

export function formatMonto(monto) {
  if (!monto || monto <= 0) return '-';
  return `$${Number(monto).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
}

// Convierte 'YYYY-MM-DD' a 'DD/MM/YYYY' para mostrar en pantalla
export function formatFechaDDMMYYYY(fechaStr) {
  if (!fechaStr) return null;
  const [y, m, d] = fechaStr.split('-');
  return `${d}/${m}/${y}`;
}

// Siempre muestra el número de factura con el prefijo "FC", sin importar
// si el usuario tipeó solo el número o ya incluyó algún prefijo propio.
export function formatFactura(numFactura) {
  if (!numFactura) return null;
  const soloNumero = numFactura.toString().replace(/^[a-zA-Z\s-]+/, '').trim();
  return soloNumero ? `FC ${soloNumero}` : numFactura;
}

const NOMBRES_MES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function formatMesLabel(mesStr) {
  const [anio, mes] = mesStr.split('-').map(Number);
  return `${NOMBRES_MES[mes - 1]} ${anio}`;
}

// Genera la lista de meses para el selector del dashboard: un rango fijo
// alrededor del mes actual (2 hacia atrás, 3 hacia adelante) más cualquier
// mes que ya tenga movimientos cargados (por si hay algo más viejo o más
// nuevo que ese rango). Así nunca hay que tocar código al cambiar de mes.
export function getMesesDisponibles(movimientos = []) {
  const hoy = new Date();
  const mesesSet = new Set();

  for (let offset = -2; offset <= 3; offset++) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() + offset, 1);
    const mesStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    mesesSet.add(mesStr);
  }

  movimientos.forEach((m) => {
    if (m.vencimiento) mesesSet.add(m.vencimiento.slice(0, 7));
  });

  return Array.from(mesesSet)
    .sort()
    .map((mesStr) => ({ value: mesStr, label: formatMesLabel(mesStr) }));
}

// Formatea un timestamp ISO (estado_actualizado_en) para mostrar en el badge global.
// Ej: "22/07/2026 14:35"
export function formatFechaHora(isoString) {
  if (!isoString) return '-';
  const d = new Date(isoString);
  const fecha = d.toLocaleDateString('es-AR');
  const hora = d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  return `${fecha} ${hora}`;
}
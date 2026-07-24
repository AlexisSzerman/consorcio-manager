// Todas las fechas de negocio (vencimiento, fecha_pago) se manejan como strings 'YYYY-MM-DD'

export function hoyStr() {
  return new Date().toISOString().split('T')[0];
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
  return `$ ${Number(monto).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
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

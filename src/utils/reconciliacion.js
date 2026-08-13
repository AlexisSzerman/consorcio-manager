// utils/reconciliacion.js

/**
 * Devuelve los movimientos del Libro Diario que podrían ser el pago de una factura
 * pendiente del Dashboard: mismo proveedor, mismo consorcio, y que todavía no
 * hayan sido usados como pago de otra factura ni descartados como sugerencia.
 *
 * @param {Object} factura - un "movimiento" del Dashboard (la factura pendiente)
 * @param {Array} movimientosLibroDiario - libroDiarioParaReconciliar (ya filtrado a categoria=proveedor, tipo=egreso)
 * @param {Array} libroDiarioPeriodos - para resolver el consorcio_id de cada movimiento vía su período
 * @param {Array} pagosParciales - para saber qué movimientos ya están vinculados a algún pago
 * @param {Array} descartadas - reconciliacionesDescartadas, para excluir sugerencias ya descartadas
 */
export function buscarCandidatosPago({
  factura,
  movimientosLibroDiario,
  libroDiarioPeriodos,
  pagosParciales,
  descartadas = [],
}) {
  if (!factura.proveedor_id) return [];
  if (factura.estado === 'PAGADO' || factura.estado === 'DEBITO_AUTOMATICO') return [];

  const idsYaUsados = new Set(
    pagosParciales.filter((p) => p.libro_diario_movimiento_id).map((p) => p.libro_diario_movimiento_id)
  );
  const idsDescartados = new Set(
    descartadas.filter((d) => d.factura_id === factura.id).map((d) => d.libro_diario_movimiento_id)
  );

  const totalPagado = pagosParciales
    .filter((p) => p.movimiento_id === factura.id)
    .reduce((s, p) => s + Number(p.monto), 0);
  const pendiente = Number(factura.monto) - totalPagado;

  const candidatos = movimientosLibroDiario.filter((m) => {
    if (idsYaUsados.has(m.id)) return false;
    if (idsDescartados.has(m.id)) return false;
    if (m.proveedor_id !== factura.proveedor_id) return false;
    const periodo = libroDiarioPeriodos.find((p) => p.id === m.periodo_id);
    return periodo && periodo.consorcio_id === factura.consorcio_id;
  });

  return candidatos
    .map((m) => ({ ...m, diferenciaConPendiente: Math.abs(Number(m.monto) - pendiente) }))
    .sort((a, b) => a.diferenciaConPendiente - b.diferenciaConPendiente);
}

/**
 * Chequeo liviano para saber si una factura tiene AL MENOS un candidato,
 * usado para decidir si se muestra el ⚠️ en la fila sin tener que
 * calcular y ordenar toda la lista completa.
 */
export function tieneCandidatosPago(args) {
  return buscarCandidatosPago(args).length > 0;
}
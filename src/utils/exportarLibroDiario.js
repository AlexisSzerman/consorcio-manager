// utils/exportarLibroDiario.js
import * as XLSX from 'xlsx';
import { formatFechaDDMMYYYY } from './dateHelpers';

const LABELS_CATEGORIA = {
  servicio: 'Servicio',
  proveedor: 'Proveedor',
  unidad: 'Unidad',
  gastos_bancarios: 'Gastos Bancarios / Impuestos',
  sin_clasificar: 'Sin clasificar',
};

function resolverNombreCategoria(m, { proveedores, unidades, servicios }) {
  switch (m.categoria) {
    case 'proveedor': {
      const p = proveedores.find((x) => x.id === m.proveedor_id);
      return p ? p.nombre : '(proveedor no encontrado)';
    }
    case 'unidad': {
      const u = unidades.find((x) => x.id === m.unidad_id);
      return u ? `${u.numero_unidad} - ${u.propietario_nombre}` : '(unidad no encontrada)';
    }
    case 'servicio': {
      const s = servicios.find((x) => x.id === m.servicio_id);
      return s ? s.nombre : '(servicio no encontrado)';
    }
    default:
      return '';
  }
}

/**
 * @param {Array} periodosConMovimientos - [{ periodo, movimientos }, ...]
 *   'periodo' es el objeto período (con .periodo, .cuenta, .banco, .saldo_inicial, .saldo_final)
 *   'movimientos' son los movimientos de ESE período únicamente
 * @param {Object} catalogos - { proveedores, unidades, servicios } (compartidos entre todos los períodos)
 */
export function exportarLibroDiarioExcel(periodosConMovimientos, { proveedores, unidades, servicios }) {
  const esMultiple = periodosConMovimientos.length > 1;

  // --- Hoja 1: Resumen (una fila por período + totales generales) ---
  const filasResumen = periodosConMovimientos.map(({ periodo, movimientos }) => {
    const totalIngresos = movimientos
      .filter((m) => m.tipo === 'ingreso')
      .reduce((acc, m) => acc + Number(m.monto), 0);

    const totalEgresos = movimientos
      .filter((m) => m.tipo === 'egreso')
      .reduce((acc, m) => acc + Number(m.monto), 0);

    return {
      Período: periodo.periodo,
      Cuenta: periodo.cuenta,
      Banco: periodo.banco || '—',
      'Saldo inicial': periodo.saldo_inicial ?? '',
      'Saldo final': periodo.saldo_final ?? '',
      'Total ingresos': totalIngresos,
      'Total egresos': totalEgresos,
      Neto: totalIngresos - totalEgresos,
      'Sin clasificar': movimientos.filter((m) => m.categoria === 'sin_clasificar').length,
    };
  });

  if (esMultiple) {
    const totalGeneralIngresos = filasResumen.reduce((acc, f) => acc + f['Total ingresos'], 0);
    const totalGeneralEgresos = filasResumen.reduce((acc, f) => acc + f['Total egresos'], 0);

    filasResumen.push({
      Período: 'TOTAL',
      Cuenta: '',
      Banco: '',
      'Saldo inicial': '',
      'Saldo final': '',
      'Total ingresos': totalGeneralIngresos,
      'Total egresos': totalGeneralEgresos,
      Neto: totalGeneralIngresos - totalGeneralEgresos,
      'Sin clasificar': filasResumen.reduce((acc, f) => acc + f['Sin clasificar'], 0),
    });
  }

  // --- Hoja 2: Detalle de movimientos (todos los períodos juntos) ---
const filasDetalle = periodosConMovimientos.flatMap(({ periodo, movimientos }) =>
  [...movimientos]
    .sort((a, b) => a.orden_original - b.orden_original)
    .map((m) => ({
      Período: periodo.periodo,
      Fecha: formatFechaDDMMYYYY(m.fecha),
      Detalle: m.detalle,
      Ingreso: m.tipo === 'ingreso' ? m.monto : '',
      Egreso: m.tipo === 'egreso' ? m.monto : '',
      Categoría: LABELS_CATEGORIA[m.categoria] || m.categoria,
      'Proveedor / Unidad / Servicio': resolverNombreCategoria(m, { proveedores, unidades, servicios }),
      'Nombre original banco': m.texto_original_banco || '',
      Confirmado: m.confirmado ? 'Sí' : 'No',
      'Saldo informado banco': m.saldo_informado_banco ?? '',
    }))
);
  const wb = XLSX.utils.book_new();

  const wsResumen = XLSX.utils.json_to_sheet(filasResumen);
  wsResumen['!cols'] = [
    { wch: 12 }, { wch: 18 }, { wch: 16 }, { wch: 14 },
    { wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');

  const wsDetalle = XLSX.utils.json_to_sheet(filasDetalle);
  wsDetalle['!cols'] = [
    { wch: 12 }, { wch: 12 }, { wch: 40 }, { wch: 10 }, { wch: 14 },
    { wch: 22 }, { wch: 30 }, { wch: 30 }, { wch: 12 }, { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(wb, wsDetalle, 'Movimientos');

  const primerPeriodo = periodosConMovimientos[0].periodo;
  const nombreArchivo = esMultiple
    ? `LibroDiario_${primerPeriodo.periodo}_a_${periodosConMovimientos[periodosConMovimientos.length - 1].periodo.periodo}.xlsx`
    : `LibroDiario_${primerPeriodo.periodo}_${(primerPeriodo.banco || 'banco').replace(/\s+/g, '')}.xlsx`;

  XLSX.writeFile(wb, nombreArchivo);
}
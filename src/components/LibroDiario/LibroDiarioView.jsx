import { useState, useEffect } from 'react';
import PeriodoDetalle from './PeriodoDetalle';
import NuevoPeriodoModal from './NuevoPeriodoModal';
import ExportarLibroDiarioBoton from './ExportarLibroDiarioBoton';

const ESTADO_INFO = {
  ok: { label: 'Coincide', color: 'bg-emerald-100 text-emerald-800', icon: 'fa-circle-check' },
  diferencia: { label: 'Diferencia', color: 'bg-red-100 text-red-800', icon: 'fa-triangle-exclamation' },
  abierto: { label: 'Faltan saldos', color: 'bg-slate-100 text-slate-600', icon: 'fa-clock' },
};

function calcularEstadoPeriodo(periodo, movimientos) {
  if (periodo.saldo_inicial_declarado == null || periodo.saldo_final_declarado == null) {
    return 'abierto';
  }
  const totalIngresos = movimientos.filter((m) => m.tipo === 'ingreso').reduce((s, m) => s + Number(m.monto), 0);
  const totalEgresos = movimientos.filter((m) => m.tipo === 'egreso').reduce((s, m) => s + Number(m.monto), 0);
  const saldoCalculado = Number(periodo.saldo_inicial_declarado) + totalIngresos - totalEgresos;
  const diff = Math.abs(saldoCalculado - Number(periodo.saldo_final_declarado));
  return diff < 0.01 ? 'ok' : 'diferencia';
}

export default function LibroDiarioView({
  consorcios,
  periodos,
  movimientosPorPeriodo,
  proveedores,
  servicios,
  unidades,
  onCargarMovimientos,
  onAddPeriodo,
  onUpdatePeriodo,
  onDeletePeriodo,
  onAddMovimiento,
  onAddMovimientosBulk,
  onUpdateMovimiento,
  onDeleteMovimiento,
}) {
  const [consorcioId, setConsorcioId] = useState(consorcios[0]?.id || '');
  const [periodoSeleccionadoId, setPeriodoSeleccionadoId] = useState(null);
  const [mostrarNuevoPeriodo, setMostrarNuevoPeriodo] = useState(false);

  const periodosDelConsorcio = periodos
    .filter((p) => p.consorcio_id === consorcioId)
    .sort((a, b) => b.periodo.localeCompare(a.periodo));

  const consorcioActual = consorcios.find((c) => c.id === consorcioId);
  const periodoSeleccionado = periodos.find((p) => p.id === periodoSeleccionadoId) || null;

  // Precarga los movimientos de todos los períodos visibles, para que el
  // semáforo de reconciliación de la lista sea correcto sin tener que entrar.
  useEffect(() => {
    periodosDelConsorcio.forEach((p) => {
      if (!movimientosPorPeriodo[p.id]) {
        onCargarMovimientos(p.id);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consorcioId, periodos.length]);

  async function abrirPeriodo(periodo) {
    setPeriodoSeleccionadoId(periodo.id);
    if (!movimientosPorPeriodo[periodo.id]) {
      await onCargarMovimientos(periodo.id);
    }
  }

  async function crearPeriodo(periodoStr, cuenta, banco) {
    const nuevo = await onAddPeriodo(consorcioId, periodoStr, cuenta, banco);
    setMostrarNuevoPeriodo(false);
    abrirPeriodo(nuevo);
  }


  if (periodoSeleccionado) {
    return (
      <PeriodoDetalle
        periodo={periodoSeleccionado}
        consorcioNombre={consorcioActual?.nombre}
        movimientos={movimientosPorPeriodo[periodoSeleccionado.id] || []}
        proveedores={proveedores}
        servicios={servicios}
        unidades={consorcioActual?.unidades || []}
        onVolver={() => setPeriodoSeleccionadoId(null)}
        onUpdatePeriodo={onUpdatePeriodo}
        onDeletePeriodo={onDeletePeriodo}
        onAddMovimiento={onAddMovimiento}
        onAddMovimientosBulk={onAddMovimientosBulk}
        onUpdateMovimiento={onUpdateMovimiento}
        onDeleteMovimiento={onDeleteMovimiento}
      />
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Libro Diario</h2>
          <p className="text-slate-500 text-sm">Movimientos bancarios y reconciliación por período</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={consorcioId}
            onChange={(e) => setConsorcioId(e.target.value)}
            className="text-sm border border-slate-300 rounded-lg p-2 bg-white"
          >
            {consorcios.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
            <ExportarLibroDiarioBoton
    periodos={periodosDelConsorcio}
    movimientosPorPeriodo={movimientosPorPeriodo}
    proveedores={proveedores}
    servicios={servicios}
    unidades={consorcioActual?.unidades || []}
  />
          <button
            onClick={() => setMostrarNuevoPeriodo(true)}
            disabled={!consorcioId}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg font-semibold disabled:opacity-50"
          >
            <i className="fa-solid fa-plus mr-1"></i> Nuevo Período
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 divide-y divide-slate-100">
        {periodosDelConsorcio.length === 0 && (
          <p className="p-8 text-center text-slate-400 text-sm">
            Todavía no hay períodos cargados para este consorcio.
          </p>
        )}
        {periodosDelConsorcio.map((periodo) => {
          const movs = movimientosPorPeriodo[periodo.id] || [];
          const estado = calcularEstadoPeriodo(periodo, movs);
          const info = ESTADO_INFO[estado];
          return (
            <div
              key={periodo.id}
              onClick={() => abrirPeriodo(periodo)}
              className="p-4 flex justify-between items-center hover:bg-slate-50 cursor-pointer"
            >
              <div>
                <p className="font-semibold text-slate-800 flex items-center gap-2">
                  {periodo.periodo} — {periodo.cuenta}
                  {periodo.cerrado && <i className="fa-solid fa-lock text-slate-400 text-xs" title="Cerrado"></i>}
                </p>
                <p className="text-xs text-slate-400">{periodo.banco || 'Sin banco asignado'}</p>
              </div>
              <span className={`text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1 ${info.color}`}>
                <i className={`fa-solid ${info.icon}`}></i> {info.label}
              </span>
            </div>
          );
        })}
      </div>

      {mostrarNuevoPeriodo && (
        <NuevoPeriodoModal onCrear={crearPeriodo} onClose={() => setMostrarNuevoPeriodo(false)} />
      )}
    </section>
  );
}
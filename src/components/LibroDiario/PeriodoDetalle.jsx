import { useState } from 'react';
import { formatMonto, formatFechaDDMMYYYY } from '../../utils/dateHelpers';
import NuevoMovimientoLibroModal from './NuevoMovimientoLibroModal';
import EditarMovimientoLibroModal from './EditarMovimientoLibroModal';
import ImportarBancoModal from './ImportarBancoModal';

export default function PeriodoDetalle({
  periodo,
  consorcioNombre,
  movimientos,
  proveedores,
  servicios,
  unidades,
  onVolver,
  onUpdatePeriodo,
  onDeletePeriodo,
  onAddMovimiento,
  onAddMovimientosBulk,
  onUpdateMovimiento,
  onDeleteMovimiento,
}) 

{
  const [saldoInicial, setSaldoInicial] = useState(periodo.saldo_inicial_declarado ?? '');
  const [saldoFinal, setSaldoFinal] = useState(periodo.saldo_final_declarado ?? '');
  const [guardandoSaldos, setGuardandoSaldos] = useState(false);
  const [guardandoCierre, setGuardandoCierre] = useState(false);
  const [mostrarNuevoMov, setMostrarNuevoMov] = useState(false);
  const [mostrarImportar, setMostrarImportar] = useState(false);
  const [movimientoEditando, setMovimientoEditando] = useState(null);

  const movimientosOrdenados = [...movimientos].sort(
    (a, b) => a.fecha.localeCompare(b.fecha) || (a.orden_original || 0) - (b.orden_original || 0)
  );

  const totalIngresos = movimientos.filter((m) => m.tipo === 'ingreso').reduce((s, m) => s + Number(m.monto), 0);
  const totalEgresos = movimientos.filter((m) => m.tipo === 'egreso').reduce((s, m) => s + Number(m.monto), 0);
  const inicialNum = saldoInicial === '' ? 0 : Number(saldoInicial);
  const saldoCalculado = inicialNum + totalIngresos - totalEgresos;
  const finalNum = saldoFinal === '' ? null : Number(saldoFinal);
  const coincide = finalNum !== null && Math.abs(saldoCalculado - finalNum) < 0.01;

const CATEGORIA_LABELS = {
  proveedor: 'Proveedores',
  unidad: 'Unidades',
  servicio: 'Servicios',
  gastos_bancarios: 'Gastos Bancarios',
  sin_clasificar: 'Sin clasificar',
};

const desglosePorCategoria = [
  'proveedor',
  'unidad',
  'servicio',
  'gastos_bancarios',
  'sin_clasificar'
]
  .map((cat) => {
    const movsCategoria = movimientos.filter((m) => m.categoria === cat);

    const ingresos = movsCategoria
      .filter((m) => m.tipo === 'ingreso')
      .reduce((s, m) => s + Number(m.monto), 0);

    const egresos = movsCategoria
      .filter((m) => m.tipo === 'egreso')
      .reduce((s, m) => s + Number(m.monto), 0);

    return {
      categoria: cat,
      label: CATEGORIA_LABELS[cat],
      cantidad: movsCategoria.length,
      ingresos,
      egresos,
    };
  })
  .filter((d) => d.cantidad > 0);

  let corrido = inicialNum;
  const filasConSaldo = movimientosOrdenados.map((m) => {
    corrido += m.tipo === 'ingreso' ? Number(m.monto) : -Number(m.monto);
    return { ...m, saldoCorridoCalculado: corrido };
  });

  async function guardarSaldos() {
    setGuardandoSaldos(true);
    try {
      await onUpdatePeriodo(periodo.id, {
        saldo_inicial_declarado: saldoInicial === '' ? null : Number(saldoInicial),
        saldo_final_declarado: saldoFinal === '' ? null : Number(saldoFinal),
      });
    } catch (err) {
      alert('Error al guardar: ' + err.message);
    } finally {
      setGuardandoSaldos(false);
    }
  }

  async function alternarCierre() {
    setGuardandoCierre(true);
    try {
      await onUpdatePeriodo(periodo.id, { cerrado: !periodo.cerrado });
    } catch (err) {
      alert('Error al actualizar el estado del período: ' + err.message);
    } finally {
      setGuardandoCierre(false);
    }
  }

  async function eliminarPeriodo() {
    if (!confirm('¿Eliminar este período completo? Se van a borrar también todos sus movimientos. Esta acción no se puede deshacer.')) return;
    try {
      await onDeletePeriodo(periodo.id);
      onVolver();
    } catch (err) {
      alert('Error al eliminar el período: ' + err.message);
    }
  }

  async function eliminarMovimiento(movId) {
    if (!confirm('¿Eliminar este movimiento?')) return;
    try {
      await onDeleteMovimiento(periodo.id, movId);
    } catch (err) {
      alert('Error al eliminar: ' + err.message);
    }
  }

  async function manejarImportacion(nuevosMovimientos, sugerenciaSaldos) {
    await onAddMovimientosBulk(periodo.id, nuevosMovimientos);
    if (sugerenciaSaldos) {
      if (periodo.saldo_inicial_declarado == null && sugerenciaSaldos.inicial != null) {
        setSaldoInicial(sugerenciaSaldos.inicial);
      }
      if (periodo.saldo_final_declarado == null && sugerenciaSaldos.final != null) {
        setSaldoFinal(sugerenciaSaldos.final);
      }
    }
  }

  function nombreContraparte(m) {
    if (m.categoria === 'proveedor' && m.proveedor_id) {
      return proveedores.find((p) => p.id === m.proveedor_id)?.nombre || m.texto_original_banco || '-';
    }
    if (m.categoria === 'unidad' && m.unidad_id) {
      const u = unidades.find((u) => u.id === m.unidad_id);
      return u ? `${u.numero_unidad} - ${u.propietario_nombre}` : m.texto_original_banco || '-';
    }
    if (m.categoria === 'gastos_bancarios') return 'Gastos Bancarios / Impuestos';
    return m.texto_original_banco || '-';
 
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={onVolver} className="text-slate-500 hover:text-slate-800">
            <i className="fa-solid fa-arrow-left"></i>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-slate-900">
                {consorcioNombre} — {periodo.periodo}
              </h2>
              {periodo.cerrado ? (
                <span className="text-[10px] bg-slate-800 text-white font-bold px-2 py-1 rounded-full">
                  <i className="fa-solid fa-lock mr-1"></i> CERRADO
                </span>
              ) : (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-1 rounded-full">
                  ABIERTO
                </span>
              )}
            </div>
            <p className="text-slate-500 text-sm">
              {periodo.cuenta}
              {periodo.banco ? ` · ${periodo.banco}` : ''}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={alternarCierre}
            disabled={guardandoCierre}
            className={`text-xs font-semibold px-3 py-2 rounded-lg disabled:opacity-50 ${
              periodo.cerrado
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                : 'bg-slate-800 text-white hover:bg-slate-900'
            }`}
          >
            <i className={`fa-solid ${periodo.cerrado ? 'fa-lock-open' : 'fa-lock'} mr-1`}></i>
            {guardandoCierre ? 'Guardando...' : periodo.cerrado ? 'Reabrir período' : 'Cerrar período'}
          </button>
          <button
            onClick={eliminarPeriodo}
            className="text-xs font-semibold px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
          >
            <i className="fa-solid fa-trash-can mr-1"></i> Eliminar período
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
        <h3 className="font-bold text-sm text-slate-700">Control de saldo</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Saldo inicial (banco)</label>
            <input
              type="number"
              step="0.01"
              value={saldoInicial}
              onChange={(e) => setSaldoInicial(e.target.value)}
              className="w-full border rounded-lg p-2 text-sm"
            />
          </div>
          <div className="text-center">
            <p className="text-[10px] text-slate-400 uppercase font-semibold">+ Ingresos</p>
            <p className="text-sm font-bold text-emerald-600">{formatMonto(totalIngresos)}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-slate-400 uppercase font-semibold">- Egresos</p>
            <p className="text-sm font-bold text-red-600">{formatMonto(totalEgresos)}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-slate-400 uppercase font-semibold">= Calculado</p>
            <p className="text-sm font-bold text-slate-800">{formatMonto(saldoCalculado)}</p>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Saldo final (banco)</label>
            <input
              type="number"
              step="0.01"
              value={saldoFinal}
              onChange={(e) => setSaldoFinal(e.target.value)}
              className="w-full border rounded-lg p-2 text-sm"
            />
          </div>
        </div>

        <div className="flex justify-between items-center pt-2 border-t">
          {finalNum === null ? (
            <span className="text-xs bg-slate-100 text-slate-500 px-3 py-1.5 rounded-full font-bold">
              <i className="fa-solid fa-clock mr-1"></i> Ingresá el saldo inicial y final para verificar
            </span>
          ) : coincide ? (
            <span className="text-xs bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-full font-bold">
              <i className="fa-solid fa-circle-check mr-1"></i> Coincide
            </span>
          ) : (
            <span className="text-xs bg-red-100 text-red-800 px-3 py-1.5 rounded-full font-bold">
              <i className="fa-solid fa-triangle-exclamation mr-1"></i>
              Diferencia de {formatMonto(Math.abs(saldoCalculado - finalNum))}
            </span>
          )}

          {desglosePorCategoria.length > 0 && (
          <div className="pt-3 border-t">
            <p className="text-xs font-bold text-slate-600 mb-2">Desglose por categoría</p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {desglosePorCategoria.map((d) => (
                <div key={d.categoria} className="bg-slate-50 rounded-lg p-3">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">
                    {d.label} <span className="text-slate-300">({d.cantidad})</span>
                  </p>
                  {d.ingresos > 0 && (
                    <p className="text-xs font-bold text-emerald-600">+{formatMonto(d.ingresos)}</p>
                  )}
                  {d.egresos > 0 && (
                    <p className="text-xs font-bold text-red-600">-{formatMonto(d.egresos)}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

          <button
            onClick={guardarSaldos}
            disabled={guardandoSaldos}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {guardandoSaldos ? 'Guardando...' : 'Guardar saldos'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <h3 className="font-bold text-sm text-slate-700">Movimientos ({movimientos.length})</h3>
          <div className="flex gap-2">
            <button
  onClick={() => setMostrarImportar(true)}
  disabled={periodo.saldo_inicial_declarado == null}
  title={
    periodo.saldo_inicial_declarado == null
      ? 'Guardá el saldo inicial antes de importar movimientos'
      : ''
  }
  className="text-xs bg-slate-700 hover:bg-slate-800 text-white px-3 py-2 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
>
  <i className="fa-solid fa-file-import mr-1"></i> Importar del banco
</button>
            <button
              onClick={() => setMostrarNuevoMov(true)}
              className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg font-semibold"
            >
              <i className="fa-solid fa-plus mr-1"></i> Agregar movimiento
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-600 uppercase text-xs font-semibold">
              <tr>
                <th className="p-3">Fecha</th>
                <th className="p-3">Proveedor / Unidad</th>
                <th className="p-3">Detalle</th>
                <th className="p-3 text-right">Ingreso</th>
                <th className="p-3 text-right">Egreso</th>
                <th className="p-3 text-right">Saldo</th>
                <th className="p-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filasConSaldo.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="p-3 whitespace-nowrap">{formatFechaDDMMYYYY(m.fecha)}</td>
                  <td className="p-3">
                    <div>{nombreContraparte(m)}</div>
                    {!m.confirmado && m.categoria !== 'gastos_bancarios' && (
                      <span className="text-[10px] text-amber-600 font-semibold">Sin confirmar</span>
                    )}
                  </td>
                  <td className="p-3 text-slate-500 text-xs max-w-xs truncate">{m.detalle}</td>
                  <td className="p-3 text-right font-mono text-emerald-700">
                    {m.tipo === 'ingreso' ? formatMonto(m.monto) : ''}
                  </td>
                  <td className="p-3 text-right font-mono text-red-700">
                    {m.tipo === 'egreso' ? formatMonto(m.monto) : ''}
                  </td>
                  <td className="p-3 text-right font-mono text-slate-700">{formatMonto(m.saldoCorridoCalculado)}</td>
                  <td className="p-3 text-center">
                    <div className="inline-flex gap-1">
                      <button
                        onClick={() => setMovimientoEditando(m)}
                        className="text-slate-400 hover:text-slate-700 px-2"
                      >
                        <i className="fa-solid fa-pen"></i>
                      </button>
                      <button onClick={() => eliminarMovimiento(m.id)} className="text-red-400 hover:text-red-600 px-2">
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {movimientos.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 text-sm">
                    Todavía no hay movimientos en este período.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {mostrarNuevoMov && (
        <NuevoMovimientoLibroModal
          proveedores={proveedores}
          servicios={servicios}
          unidades={unidades}
          onCrear={(campos) => onAddMovimiento(periodo.id, campos)}
          onClose={() => setMostrarNuevoMov(false)}
        />
      )}

      {movimientoEditando && (
        <EditarMovimientoLibroModal
          movimiento={movimientoEditando}
          proveedores={proveedores}
          servicios={servicios}
          unidades={unidades}
          onGuardar={(movId, campos) => onUpdateMovimiento(periodo.id, movId, campos)}
          onClose={() => setMovimientoEditando(null)}
        />
      )}

      {mostrarImportar && (
        <ImportarBancoModal
          periodo={periodo}
          movimientosExistentes={movimientos}
          proveedores={proveedores}
          servicios={servicios}
          unidades={unidades}
          onImportar={manejarImportacion}
          onClose={() => setMostrarImportar(false)}
        />
      )}
    </section>
  );
}
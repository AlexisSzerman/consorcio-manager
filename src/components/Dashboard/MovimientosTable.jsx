import { useState } from 'react';
import MovimientoRow from './MovimientoRow';
import NotaModal from './NotaModal';
import PagoParcialModal from './PagoParcialModal';
import ReconciliacionModal from './ReconciliacionModal';

export default function MovimientosTable({
  movimientos,
  consorcios,
  servicios,
  proveedores,
  pagosParciales,
  libroDiarioParaReconciliar,
  libroDiarioPeriodos,
  reconciliacionesDescartadas,
  onDescartarSugerencia,
  seleccionados,
  onToggleSeleccion,
  onToggleSeleccionarTodos,
  filterEstado,
  onFilterEstadoChange,
  filterConsorcio,
  onFilterConsorcioChange,
  sortBy,
  onSortByChange,
  filtroTiempoRango,
  onLimpiarFiltroTiempo,
  onGuardarMovimiento,
  onEliminarMovimiento,
  onGuardarNota,
  onAgregarPagoParcial,
  onEliminarPagoParcial,
}) {
  const [notaModalMov, setNotaModalMov] = useState(null);
  const [pagoParcialModalMov, setPagoParcialModalMov] = useState(null);
  const [reconciliacionModal, setReconciliacionModal] = useState(null); // { factura, candidatos, pendiente }

  function nombreConsorcio(consorcioId) {
    return consorcios.find((c) => c.id === consorcioId)?.nombre || '-';
  }

  async function confirmarReconciliacion(candidato, monto) {
    await onAgregarPagoParcial(reconciliacionModal.factura.id, monto, candidato.fecha, null, candidato.id);
  }

  async function descartarReconciliacion(candidato) {
    await onDescartarSugerencia(reconciliacionModal.factura.id, candidato.id);
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap gap-4 justify-between items-center">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-600">Consorcio:</label>
            <select
              value={filterConsorcio}
              onChange={(e) => onFilterConsorcioChange(e.target.value)}
              className="text-sm border border-slate-300 rounded-lg p-2 bg-white"
            >
              <option value="TODOS">Todos los consorcios</option>
              {consorcios.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-600">Estado:</label>
            <select
              value={filterEstado}
              onChange={(e) => onFilterEstadoChange(e.target.value)}
              className="text-sm border border-slate-300 rounded-lg p-2 bg-white"
            >
              <option value="TODOS">Todos</option>
              <option value="PENDIENTE">PENDIENTE</option>
              <option value="CARGADA">CARGADA</option>
              <option value="REVISAR">REVISAR</option>
              <option value="PARCIAL">PARCIAL</option>
              <option value="PAGADO">PAGADO</option>
              <option value="DEBITO_AUTOMATICO">DÉBITO AUTOMÁTICO</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-600">Ordenar por:</label>
            <select
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value)}
              className="text-sm border border-slate-300 rounded-lg p-2 bg-white"
            >
              <option value="consorcio">Consorcio</option>
              <option value="proveedor">Proveedor / Servicio</option>
              <option value="fecha">Fecha de vencimiento</option>
            </select>
          </div>
          {filtroTiempoRango && (
            <span className="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded flex items-center gap-1">
              Filtro de fecha activo
              <button onClick={onLimpiarFiltroTiempo} className="hover:text-red-600 ml-1">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </span>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100 text-slate-600 uppercase text-xs font-semibold">
            <tr>
              <th className="p-4 text-center">
                <input
                  type="checkbox"
                  checked={movimientos.length > 0 && movimientos.every((m) => seleccionados.has(m.id))}
                  onChange={() => onToggleSeleccionarTodos(movimientos.map((m) => m.id))}
                  className="w-4 h-4 rounded text-indigo-600"
                />
              </th>
              <th className="p-4">Consorcio</th>
              <th className="p-4">Proveedor / Servicio</th>
              <th className="p-4">Nº Factura</th>
              <th className="p-4">Búsqueda / Link</th>
              <th className="p-4">Vencimiento / Estado</th>
              <th className="p-4">Importe</th>
              <th className="p-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {movimientos.map((mov) => (
              <MovimientoRow
                key={mov.id}
                movimiento={mov}
                consorcioNombre={nombreConsorcio(mov.consorcio_id)}
                servicios={servicios}
                proveedores={proveedores}
                pagosParciales={pagosParciales}
                libroDiarioParaReconciliar={libroDiarioParaReconciliar}
                libroDiarioPeriodos={libroDiarioPeriodos}
                reconciliacionesDescartadas={reconciliacionesDescartadas}
                onDescartarSugerencia={onDescartarSugerencia}
                seleccionado={seleccionados.has(mov.id)}
                onToggleSeleccion={onToggleSeleccion}
                onGuardar={onGuardarMovimiento}
                onEliminar={onEliminarMovimiento}
                onAbrirNota={setNotaModalMov}
                onAbrirPagoParcial={setPagoParcialModalMov}
                onAgregarPagoParcial={onAgregarPagoParcial}
                onAbrirReconciliacion={(factura, candidatos, pendiente) =>
                  setReconciliacionModal({ factura, candidatos, pendiente })
                }
              />
            ))}
            {movimientos.length === 0 && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400 text-sm">
                  No hay vencimientos que coincidan con los filtros seleccionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {notaModalMov && (
        <NotaModal
          movimiento={notaModalMov}
          onClose={() => setNotaModalMov(null)}
          onGuardar={onGuardarNota}
        />
      )}

      {pagoParcialModalMov && (
        <PagoParcialModal
          movimiento={pagoParcialModalMov}
          pagos={pagosParciales.filter((p) => p.movimiento_id === pagoParcialModalMov.id)}
          onAgregar={onAgregarPagoParcial}
          onEliminar={onEliminarPagoParcial}
          onClose={() => setPagoParcialModalMov(null)}
        />
      )}

      {reconciliacionModal && (
        <ReconciliacionModal
          factura={reconciliacionModal.factura}
          candidatos={reconciliacionModal.candidatos}
          pendiente={reconciliacionModal.pendiente}
          onConfirmar={confirmarReconciliacion}
          onDescartar={descartarReconciliacion}
          onClose={() => setReconciliacionModal(null)}
        />
      )}
    </div>
  );
}
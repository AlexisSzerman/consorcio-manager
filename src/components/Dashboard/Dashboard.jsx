import { useState, useMemo } from 'react';
import StatsCards from './StatsCards';
import MovimientosTable from './MovimientosTable';
import UltimaActualizacionBadge from './UltimaActualizacionBadge';
import NuevoMovimientoModal from './NuevoMovimientoModal';
import { esHoy, esEstaSemana, esVencido, getMesesDisponibles, hoyStr } from '../../utils/dateHelpers';

export default function Dashboard({
  movimientos,
  consorcios,
  servicios,
  proveedores,
  pagosParciales,
  ultimaActualizacionGlobal,
  onGuardarMovimiento,
  onEliminarMovimiento,
  onGuardarNota,
  onGenerarMes,
  onCrearMovimientoManual,
  onAgregarPagoParcial,
  onEliminarPagoParcial,
}) {
  const [filterMes, setFilterMes] = useState(hoyStr().slice(0, 7));
  const [filterEstado, setFilterEstado] = useState('TODOS');
  const [filterConsorcio, setFilterConsorcio] = useState('TODOS');
  const [filtroTiempoRango, setFiltroTiempoRango] = useState(null);
  const [sortBy, setSortBy] = useState('consorcio');
  const [generando, setGenerando] = useState(false);
  const [mostrarModalNuevo, setMostrarModalNuevo] = useState(false);

  const mesesDisponibles = useMemo(() => getMesesDisponibles(movimientos), [movimientos]);

  const stats = useMemo(() => {
    let cntVencidos = 0, cntHoy = 0, cntSemana = 0, pendientes = 0, cargadas = 0, pagadas = 0;
    movimientos.forEach((mov) => {
      if (mov.estado !== 'PAGADO' && mov.estado !== 'DEBITO_AUTOMATICO') {
        if (esVencido(mov.vencimiento)) cntVencidos++;
        if (esHoy(mov.vencimiento)) cntHoy++;
        if (esEstaSemana(mov.vencimiento)) cntSemana++;
      }
      if (mov.estado === 'PENDIENTE') pendientes++;
      if (mov.estado === 'CARGADA' || mov.estado === 'REVISAR') cargadas++;
      if (mov.estado === 'PAGADO') pagadas++;
    });
    return { cntVencidos, cntHoy, cntSemana, pendientes, cargadas, pagadas };
  }, [movimientos]);

  const movimientosFiltrados = useMemo(() => {
    const nombreConsorcio = (id) => consorcios.find((c) => c.id === id)?.nombre || '';

    const filtrados = movimientos.filter((mov) => {
      if (filterMes !== 'TODOS') {
        const vencEnMes = mov.vencimiento && mov.vencimiento.startsWith(filterMes);
        const pagoEnMes = mov.fecha_pago && mov.fecha_pago.startsWith(filterMes);
        if (!vencEnMes && !pagoEnMes) return false;
      }

      if (filterEstado !== 'TODOS' && mov.estado !== filterEstado) return false;
      if (filterConsorcio !== 'TODOS' && mov.consorcio_id !== filterConsorcio) return false;
      if (filtroTiempoRango === 'VENCIDO' && !(mov.estado !== 'PAGADO' && mov.estado !== 'DEBITO_AUTOMATICO' && esVencido(mov.vencimiento))) return false;
      if (filtroTiempoRango === 'HOY' && !esHoy(mov.vencimiento)) return false;
      if (filtroTiempoRango === 'SEMANA' && !esEstaSemana(mov.vencimiento)) return false;
      return true;
    });

    // Servicios antes que proveedores, luego alfabético
    const compararTipo = (a, b) => {
      if (a.tipo === b.tipo) return 0;
      return a.tipo === 'servicio' ? -1 : 1;
    };

    const comparadores = {
      consorcio: (a, b) =>
        nombreConsorcio(a.consorcio_id).localeCompare(nombreConsorcio(b.consorcio_id)) ||
        compararTipo(a, b) ||
        a.item_nombre.localeCompare(b.item_nombre),
      proveedor: (a, b) => compararTipo(a, b) || a.item_nombre.localeCompare(b.item_nombre),
      fecha: (a, b) => (a.vencimiento || '').localeCompare(b.vencimiento || ''),
    };

    return [...filtrados].sort(comparadores[sortBy] || comparadores.consorcio);
  }, [movimientos, consorcios, filterMes, filterEstado, filterConsorcio, filtroTiempoRango, sortBy]);

  function filtrarRango(rango) {
    setFiltroTiempoRango(rango);
  }

  async function generarMesActual() {
    if (filterMes === 'TODOS') {
      alert('Por favor selecciona un mes específico en el filtro superior para generar el borrador.');
      return;
    }
    setGenerando(true);
    try {
      const cantidad = await onGenerarMes(filterMes);
      alert(`Se generaron ${cantidad} nuevos ítems en borrador para el periodo ${filterMes}.`);
    } catch (err) {
      alert('Error al generar el borrador: ' + err.message);
    } finally {
      setGenerando(false);
    }
  }

  async function crearMovimientoManual(consorcioId, tipo, itemId) {
    await onCrearMovimientoManual(consorcioId, tipo, itemId);
    setFilterMes('TODOS');
  }

  return (
    <section className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Dashboard General de Vencimientos</h2>
          <p className="text-slate-500 text-sm">Control centralizado de facturas y servicios</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white border border-slate-300 rounded-lg px-3 py-1.5 shadow-sm">
            <i className="fa-regular fa-calendar-days text-indigo-600 mr-2"></i>
            <span className="text-xs font-semibold text-slate-500 mr-2 uppercase">Mes:</span>
            <select
              value={filterMes}
              onChange={(e) => setFilterMes(e.target.value)}
              className="text-sm font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
            >
              {mesesDisponibles.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
              <option value="TODOS">Todos los meses</option>
            </select>
          </div>
          <button
            onClick={generarMesActual}
            disabled={generando}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg font-semibold shadow-sm flex items-center gap-2 disabled:opacity-50"
          >
            <i className="fa-solid fa-arrows-rotate"></i>
            {generando ? 'Generando...' : 'Generar Borrador'}
          </button>
          <button
            onClick={() => setMostrarModalNuevo(true)}
            className="bg-slate-800 hover:bg-slate-900 text-white text-sm px-4 py-2 rounded-lg font-semibold shadow-sm flex items-center gap-2"
          >
            <i className="fa-solid fa-plus"></i> Nuevo
          </button>
        </div>
      </div>

      {mostrarModalNuevo && (
        <NuevoMovimientoModal
          consorcios={consorcios}
          servicios={servicios}
          proveedores={proveedores}
          onCrear={crearMovimientoManual}
          onClose={() => setMostrarModalNuevo(false)}
        />
      )}

      <div className="flex justify-end">
        <UltimaActualizacionBadge isoString={ultimaActualizacionGlobal} />
      </div>

      <StatsCards stats={stats} onFiltrarRango={filtrarRango} />

      <MovimientosTable
        movimientos={movimientosFiltrados}
        consorcios={consorcios}
        servicios={servicios}
        proveedores={proveedores}
        pagosParciales={pagosParciales}
        filterEstado={filterEstado}
        onFilterEstadoChange={setFilterEstado}
        filterConsorcio={filterConsorcio}
        onFilterConsorcioChange={setFilterConsorcio}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        filtroTiempoRango={filtroTiempoRango}
        onLimpiarFiltroTiempo={() => setFiltroTiempoRango(null)}
        onGuardarMovimiento={onGuardarMovimiento}
        onEliminarMovimiento={onEliminarMovimiento}
        onGuardarNota={onGuardarNota}
        onAgregarPagoParcial={onAgregarPagoParcial}
        onEliminarPagoParcial={onEliminarPagoParcial}
      />
    </section>
  );
}
import { useState } from 'react';
import { exportarLibroDiarioExcel } from '../../utils/exportarLibroDiario';

export default function ExportarLibroDiarioBoton({ periodos, movimientosPorPeriodo, proveedores, servicios, unidades }) {
  const [abierto, setAbierto] = useState(false);
  const [seleccionados, setSeleccionados] = useState([]);

  function toggle(periodoId) {
    setSeleccionados((prev) =>
      prev.includes(periodoId) ? prev.filter((id) => id !== periodoId) : [...prev, periodoId]
    );
  }

  function exportar() {
    const periodosConMovimientos = periodos
      .filter((p) => seleccionados.includes(p.id))
      .sort((a, b) => a.periodo.localeCompare(b.periodo))
      .map((periodo) => ({ periodo, movimientos: movimientosPorPeriodo[periodo.id] || [] }));

    exportarLibroDiarioExcel(periodosConMovimientos, { proveedores, unidades, servicios });
    setAbierto(false);
    setSeleccionados([]);
  }

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        disabled={periodos.length === 0}
        className="text-sm px-4 py-2 rounded-lg border border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-semibold disabled:opacity-50"
      >
        <i className="fa-solid fa-file-excel mr-1"></i> Exportar
      </button>
    );
  }

  return (
    <div className="relative">
      <div className="absolute right-0 top-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg p-4 z-10 w-72">
        <p className="text-xs font-bold text-slate-600 mb-2">Elegí los períodos a exportar</p>
        <div className="max-h-48 overflow-y-auto space-y-1 mb-3">
          {periodos.map((p) => (
            <label key={p.id} className="flex items-center gap-2 text-xs p-1 hover:bg-slate-50 rounded cursor-pointer">
              <input type="checkbox" checked={seleccionados.includes(p.id)} onChange={() => toggle(p.id)} />
              {p.periodo} — {p.cuenta}
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={() => setAbierto(false)} className="text-xs px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100">
            Cancelar
          </button>
          <button
            onClick={exportar}
            disabled={seleccionados.length === 0}
            className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold disabled:opacity-50"
          >
            Exportar ({seleccionados.length})
          </button>
        </div>
      </div>

      <button onClick={() => setAbierto(false)} className="text-sm px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold">
        <i className="fa-solid fa-file-excel mr-1"></i> Exportar
      </button>
    </div>
  );
}
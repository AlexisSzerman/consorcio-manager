import { useState, useEffect } from 'react';
import { formatMonto, formatFechaDDMMYYYY } from '../../utils/dateHelpers';

export default function ReconciliacionModal({ factura, candidatos, pendiente, onConfirmar, onDescartar, onClose }) {
  const [guardando, setGuardando] = useState(null); // id del candidato en proceso, o null

  useEffect(() => {
    if (candidatos.length === 0) {
      onClose();
    }
  }, [candidatos.length, onClose]);

  const candidatosOrdenados = [...candidatos].sort((a, b) => {
    const diffA = Math.abs(Number(a.monto) - pendiente);
    const diffB = Math.abs(Number(b.monto) - pendiente);
    return diffA - diffB;
  });

  async function confirmar(candidato) {
    setGuardando(candidato.id);
    try {
      await onConfirmar(candidato, Number(candidato.monto));
      onClose();
    } catch (err) {
      alert('Error al registrar el pago: ' + err.message);
    } finally {
      setGuardando(null);
    }
  }

  async function descartar(candidato) {
    if (!confirm('¿Descartar esta sugerencia? No se te va a volver a mostrar para esta factura.')) return;
    await onDescartar(candidato);
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex justify-between items-start">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Posible pago encontrado</h3>
            <p className="text-sm text-slate-600 mt-1">
              {factura.item_nombre}
              {factura.num_factura ? ` · Nº ${factura.num_factura}` : ''}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Pendiente: <span className="font-semibold text-slate-600">{formatMonto(pendiente)}</span>
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 shrink-0">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-3">
          <p className="text-xs text-slate-500">
            Movimientos del Libro Diario del mismo proveedor, todavía sin vincular a ningún pago. Si ninguno cierra
            el monto exacto, cargalo como pago parcial desde el ícono correspondiente en la fila.
          </p>

          <div className="space-y-2">
            {candidatosOrdenados.map((c) => {
              const diferencia = Math.abs(Number(c.monto) - pendiente);
              const coincideExacto = diferencia <= 0.5;

              return (
                <div
                  key={c.id}
                  className={`rounded-lg border p-3 ${
                    coincideExacto ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-200'
                  }`}
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-800">
                          {formatFechaDDMMYYYY(c.fecha)}
                        </span>
                        {coincideExacto && (
                          <span className="text-[10px] bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded">
                            COINCIDE
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{c.detalle}</p>
                    </div>
                    <span
                      className={`font-mono text-sm font-bold whitespace-nowrap ${
                        coincideExacto ? 'text-emerald-700' : 'text-slate-700'
                      }`}
                    >
                      {formatMonto(c.monto)}
                    </span>
                  </div>

                  <div className="flex justify-end items-center gap-2 mt-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => descartar(c)}
                      className="text-xs text-slate-400 hover:text-red-500 px-2 py-1"
                    >
                      No es este
                    </button>
                    <button
                      onClick={() => confirmar(c)}
                      disabled={!coincideExacto || guardando === c.id}
                      title={!coincideExacto ? 'El monto no coincide con el pendiente' : ''}
                      className={`text-xs px-3 py-1.5 rounded-lg font-semibold disabled:opacity-40 disabled:cursor-not-allowed ${
                        coincideExacto
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {guardando === c.id ? 'Guardando...' : 'Marcar pagado'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
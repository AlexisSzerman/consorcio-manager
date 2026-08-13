import { useState } from 'react';
import { formatMonto, formatFechaDDMMYYYY } from '../../utils/dateHelpers';

export default function ReconciliacionModal({ factura, candidatos, pendiente, onConfirmar, onClose }) {
  const [candidatoElegido, setCandidatoElegido] = useState(null);
  const [monto, setMonto] = useState('');
  const [guardando, setGuardando] = useState(false);

  function elegir(candidato) {
    setCandidatoElegido(candidato);
    setMonto(String(Math.min(Number(candidato.monto), pendiente > 0 ? pendiente : Number(candidato.monto))));
  }

  async function confirmar() {
    const montoNum = parseFloat(monto);
    if (!montoNum || montoNum <= 0) return;
    setGuardando(true);
    try {
      await onConfirmar(candidatoElegido, montoNum);
      onClose();
    } catch (err) {
      alert('Error al registrar el pago: ' + err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Posible pago encontrado</h3>
            <p className="text-xs text-slate-500">
              Factura {factura.num_factura ? `Nº ${factura.num_factura}` : ''} — {factura.item_nombre} — Pendiente:{' '}
              <span className="font-semibold">{formatMonto(pendiente)}</span>
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {!candidatoElegido && (
          <div className="space-y-2">
            <p className="text-xs text-slate-500">
              Estos movimientos del Libro Diario son del mismo proveedor y todavía no están vinculados a ningún
              pago. Elegí el que corresponda:
            </p>
            <div className="divide-y divide-slate-100 border rounded-lg">
              {candidatos.map((c) => (
                <button
                  key={c.id}
                  onClick={() => elegir(c)}
                  className="w-full text-left p-3 hover:bg-slate-50 flex justify-between items-center"
                >
                  <div>
                    <p className="text-sm text-slate-800">{formatFechaDDMMYYYY(c.fecha)}</p>
                    <p className="text-xs text-slate-400 max-w-xs truncate">{c.detalle}</p>
                  </div>
                  <span className="font-mono text-sm font-semibold text-slate-700">{formatMonto(c.monto)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {candidatoElegido && (
          <div className="space-y-3">
            <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600">
              <p>
                <span className="font-semibold">Movimiento:</span> {formatFechaDDMMYYYY(candidatoElegido.fecha)} —{' '}
                {candidatoElegido.detalle}
              </p>
              <p>
                <span className="font-semibold">Monto del movimiento:</span> {formatMonto(candidatoElegido.monto)}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Monto a registrar como pago</label>
              <input
                type="number"
                step="0.01"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                className="w-full border rounded-lg p-2 text-sm"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Por defecto es el menor entre el monto del movimiento y el pendiente de la factura. Ajustalo si
                corresponde un pago parcial distinto.
              </p>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => setCandidatoElegido(null)}
                className="text-xs px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100"
              >
                <i className="fa-solid fa-arrow-left mr-1"></i> Elegir otro movimiento
              </button>
              <button
                onClick={confirmar}
                disabled={guardando}
                className="text-sm px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold disabled:opacity-50"
              >
                {guardando ? 'Registrando...' : 'Registrar como pago'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
import { useState } from 'react';
import { formatMonto, formatFechaDDMMYYYY, hoyStr } from '../../utils/dateHelpers';

export default function PagoParcialModal({ movimiento, pagos, onAgregar, onEliminar, onClose }) {
  const [monto, setMonto] = useState('');
  const [fecha, setFecha] = useState(hoyStr());
  const [nota, setNota] = useState('');
  const [guardando, setGuardando] = useState(false);

  const totalPagado = pagos.reduce((sum, p) => sum + Number(p.monto), 0);
  const pendiente = Math.max(Number(movimiento.monto) - totalPagado, 0);

  async function agregar() {
    const montoNum = parseFloat(monto);
    if (!montoNum || montoNum <= 0) return;
    setGuardando(true);
    try {
      await onAgregar(movimiento.id, montoNum, fecha, nota.trim());
      setMonto('');
      setNota('');
    } catch (err) {
      alert('Error al registrar el pago: ' + err.message);
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(pagoId) {
    if (!confirm('¿Eliminar este pago parcial?')) return;
    try {
      await onEliminar(pagoId, movimiento.id);
    } catch (err) {
      alert('Error al eliminar: ' + err.message);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Pagos parciales</h3>
            <p className="text-xs text-slate-400">{movimiento.item_nombre}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 bg-slate-50 rounded-lg p-3 text-center">
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Total</p>
            <p className="text-sm font-bold text-slate-800">{formatMonto(movimiento.monto)}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Pagado</p>
            <p className="text-sm font-bold text-emerald-600">{formatMonto(totalPagado)}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Resta</p>
            <p className="text-sm font-bold text-amber-600">{formatMonto(pendiente)}</p>
          </div>
        </div>

        {pagos.length > 0 && (
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {pagos.map((p) => (
              <div
                key={p.id}
                className="flex justify-between items-center text-xs bg-white border border-slate-200 rounded-lg px-3 py-2"
              >
                <div>
                  <span className="font-semibold text-slate-700">{formatMonto(p.monto)}</span>
                  <span className="text-slate-400 ml-2">{formatFechaDDMMYYYY(p.fecha)}</span>
                  {p.nota && <p className="text-slate-400 italic">{p.nota}</p>}
                </div>
                <button onClick={() => eliminar(p.id)} className="text-red-400 hover:text-red-600 px-2">
                  <i className="fa-solid fa-trash-can"></i>
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="border-t pt-4 space-y-2">
          <p className="text-xs font-bold text-slate-600">Registrar nuevo pago</p>
          <div className="flex gap-2">
            <input
              type="number"
              step="0.01"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              placeholder="Monto"
              className="flex-1 border rounded-lg p-2 text-sm"
            />
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="border rounded-lg p-2 text-sm"
            />
          </div>
          <input
            type="text"
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Nota (opcional)"
            className="w-full border rounded-lg p-2 text-sm"
          />
          <button
            onClick={agregar}
            disabled={!monto || guardando}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2 rounded-lg disabled:opacity-50"
          >
            {guardando ? 'Guardando...' : 'Agregar pago'}
          </button>
        </div>
      </div>
    </div>
  );
}

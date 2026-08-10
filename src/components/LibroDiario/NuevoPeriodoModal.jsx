import { useState } from 'react';

const BANCOS_CONOCIDOS = ['ICBC', 'Banco Nación', 'Banco Galicia', 'Banco Santander', 'Otro','Banco Ciudad'];

export default function NuevoPeriodoModal({ onCrear, onClose }) {
  const [periodo, setPeriodo] = useState('');
  const [cuenta, setCuenta] = useState('Banco');
  const [banco, setBanco] = useState('');
  const [creando, setCreando] = useState(false);

  async function handleCrear() {
    if (!periodo) return;
    setCreando(true);
    try {
      await onCrear(periodo, cuenta.trim() || 'Banco', banco);
    } catch (err) {
      alert('Error al crear el período: ' + err.message);
    } finally {
      setCreando(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start">
          <h3 className="font-bold text-slate-900 text-lg">Nuevo Período</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">Mes</label>
          <input
            type="month"
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className="w-full border rounded-lg p-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">Cuenta</label>
          <input
            type="text"
            value={cuenta}
            onChange={(e) => setCuenta(e.target.value)}
            placeholder="Ej: ICBC CC $, Caja"
            className="w-full border rounded-lg p-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">Banco (opcional)</label>
          <select
            value={banco}
            onChange={(e) => setBanco(e.target.value)}
            className="w-full border rounded-lg p-2 text-sm bg-white"
          >
            <option value="">Sin especificar</option>
            {BANCOS_CONOCIDOS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="text-sm px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100">
            Cancelar
          </button>
          <button
            onClick={handleCrear}
            disabled={!periodo || creando}
            className="text-sm px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold disabled:opacity-50"
          >
            {creando ? 'Creando...' : 'Crear período'}
          </button>
        </div>
      </div>
    </div>
  );
}

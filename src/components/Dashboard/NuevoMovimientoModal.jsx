import { useState } from 'react';

export default function NuevoMovimientoModal({ consorcios, servicios, proveedores, onCrear, onClose }) {
  const [consorcioId, setConsorcioId] = useState('');
  const [tipo, setTipo] = useState('servicio');
  const [itemId, setItemId] = useState('');
  const [creando, setCreando] = useState(false);

  const catalogo = tipo === 'servicio' ? servicios : proveedores;

  function cambiarTipo(nuevoTipo) {
    setTipo(nuevoTipo);
    setItemId('');
  }

  async function handleCrear() {
    if (!consorcioId || !itemId) return;
    setCreando(true);
    try {
      await onCrear(consorcioId, tipo, itemId);
      onClose();
    } catch (err) {
      alert('Error al crear el vencimiento: ' + err.message);
    } finally {
      setCreando(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Nuevo vencimiento puntual</h3>
            <p className="text-xs text-slate-400">Elegí consorcio y servicio o proveedor</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">Consorcio</label>
          <select
            value={consorcioId}
            onChange={(e) => setConsorcioId(e.target.value)}
            className="w-full border rounded-lg p-2 text-sm bg-white"
          >
            <option value="">Elegir consorcio...</option>
            {consorcios.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">Tipo</label>
          <div className="flex gap-2">
            <button
              onClick={() => cambiarTipo('servicio')}
              className={`flex-1 text-sm px-3 py-2 rounded-lg border ${
                tipo === 'servicio'
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-slate-600 border-slate-300'
              }`}
            >
              <i className="fa-solid fa-bolt mr-1"></i> Servicio
            </button>
            <button
              onClick={() => cambiarTipo('proveedor')}
              className={`flex-1 text-sm px-3 py-2 rounded-lg border ${
                tipo === 'proveedor'
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white text-slate-600 border-slate-300'
              }`}
            >
              <i className="fa-solid fa-truck-field mr-1"></i> Proveedor
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">
            {tipo === 'servicio' ? 'Servicio' : 'Proveedor'}
          </label>
          <select
            value={itemId}
            onChange={(e) => setItemId(e.target.value)}
            className="w-full border rounded-lg p-2 text-sm bg-white"
          >
            <option value="">Elegir del catálogo...</option>
            {catalogo.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nombre}
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
            disabled={!consorcioId || !itemId || creando}
            className="text-sm px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold disabled:opacity-50"
          >
            {creando ? 'Creando...' : 'Crear vencimiento'}
          </button>
        </div>
      </div>
    </div>
  );
}

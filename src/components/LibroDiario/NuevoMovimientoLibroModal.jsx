import { useState } from 'react';
import { hoyStr } from '../../utils/dateHelpers';

export default function NuevoMovimientoLibroModal({ proveedores, servicios, unidades, onCrear, onClose }) {
  const [fecha, setFecha] = useState(hoyStr());
  const [detalle, setDetalle] = useState('');
  const [tipo, setTipo] = useState('egreso');
  const [monto, setMonto] = useState('');
  const [categoria, setCategoria] = useState('sin_clasificar');
  const [proveedorId, setProveedorId] = useState('');
  const [servicioId, setServicioId] = useState('');
  const [unidadId, setUnidadId] = useState('');
  const [textoLibre, setTextoLibre] = useState('');
  const [creando, setCreando] = useState(false);

  async function crear() {
    const montoNum = parseFloat(monto);
    if (!fecha || !detalle.trim() || !montoNum || montoNum <= 0) return;
    setCreando(true);
    try {
      await onCrear({
        fecha,
        detalle: detalle.trim(),
        tipo,
        monto: montoNum,
        categoria,
        proveedor_id: categoria === 'proveedor' ? proveedorId || null : null,
        servicio_id: categoria === 'servicio' ? servicioId || null : null,
        unidad_id: categoria === 'unidad' ? unidadId || null : null,
        texto_original_banco: categoria === 'sin_clasificar' ? textoLibre.trim() || null : null,
        confirmado: true,
        orden_original: 0,
      });
      onClose();
    } catch (err) {
      alert('Error al crear el movimiento: ' + err.message);
    } finally {
      setCreando(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-3 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start">
          <h3 className="font-bold text-slate-900 text-lg">Nuevo movimiento</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setTipo('ingreso')}
            className={`flex-1 text-sm px-3 py-2 rounded-lg border ${
              tipo === 'ingreso' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-300'
            }`}
          >
            Ingreso
          </button>
          <button
            onClick={() => setTipo('egreso')}
            className={`flex-1 text-sm px-3 py-2 rounded-lg border ${
              tipo === 'egreso' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-slate-600 border-slate-300'
            }`}
          >
            Egreso
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Fecha</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full border rounded-lg p-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Monto</label>
            <input
              type="number"
              step="0.01"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              className="w-full border rounded-lg p-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">Detalle</label>
          <input
            type="text"
            value={detalle}
            onChange={(e) => setDetalle(e.target.value)}
            placeholder="Ej: Pago en efectivo, retiro de caja..."
            className="w-full border rounded-lg p-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">Categoría</label>
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="w-full border rounded-lg p-2 text-sm bg-white"
          >
            <option value="sin_clasificar">Sin clasificar / otro</option>
            <option value="proveedor">Proveedor</option>
            <option value="servicio">Servicio</option>
            <option value="unidad">Unidad</option>
            <option value="gastos_bancarios">Gastos Bancarios / Impuestos</option>
          </select>
        </div>

        {categoria === 'proveedor' && (
          <select
            value={proveedorId}
            onChange={(e) => setProveedorId(e.target.value)}
            className="w-full border rounded-lg p-2 text-sm bg-white"
          >
            <option value="">Elegir proveedor...</option>
            {proveedores.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        )}

        {categoria === 'servicio' && (
  <select
    value={servicioId}
    onChange={(e) => setServicioId(e.target.value)}
    className="w-full border rounded-lg p-2 text-sm bg-white"
  >
    <option value="">Elegir servicio...</option>
    {servicios.map((s) => (
      <option key={s.id} value={s.id}>
        {s.nombre}
      </option>
    ))}
  </select>
)}
        {categoria === 'unidad' && (
          <select
            value={unidadId}
            onChange={(e) => setUnidadId(e.target.value)}
            className="w-full border rounded-lg p-2 text-sm bg-white"
          >
            <option value="">Elegir unidad...</option>
            {unidades.map((u) => (
              <option key={u.id} value={u.id}>
                {u.numero_unidad} - {u.propietario_nombre}
              </option>
            ))}
          </select>
        )}
        {categoria === 'sin_clasificar' && (
          <input
            type="text"
            value={textoLibre}
            onChange={(e) => setTextoLibre(e.target.value)}
            placeholder="Texto libre (opcional)"
            className="w-full border rounded-lg p-2 text-sm"
          />
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="text-sm px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100">
            Cancelar
          </button>
          <button
            onClick={crear}
            disabled={creando || !fecha || !detalle.trim() || !monto}
            className="text-sm px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold disabled:opacity-50"
          >
            {creando ? 'Creando...' : 'Agregar'}
          </button>
        </div>
      </div>
    </div>
  );
}

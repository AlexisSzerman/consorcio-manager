import { useState } from 'react';

function ServicioItem({ servicio, onGuardar, onEliminar }) {
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({ nombre: servicio.nombre, link: servicio.link || '' });
  const [guardando, setGuardando] = useState(false);

  function iniciarEdicion() {
    setForm({ nombre: servicio.nombre, link: servicio.link || '' });
    setEditando(true);
  }

  async function guardar() {
    setGuardando(true);
    try {
      await onGuardar(servicio.id, form);
      setEditando(false);
    } catch (err) {
      alert('Error al guardar: ' + err.message);
    } finally {
      setGuardando(false);
    }
  }

  if (editando) {
    return (
      <li className="py-3 space-y-2">
        <input
          type="text"
          value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          placeholder="Nombre del servicio"
          className="w-full border rounded-lg p-2 text-sm"
        />
        <input
          type="text"
          value={form.link}
          onChange={(e) => setForm({ ...form, link: e.target.value })}
          placeholder="https://..."
          className="w-full border rounded-lg p-2 text-sm"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setEditando(false)}
            className="text-xs px-3 py-1.5 rounded-md text-slate-600 hover:bg-slate-100"
          >
            Cancelar
          </button>
          <button
            onClick={guardar}
            disabled={guardando}
            className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-md disabled:opacity-50"
          >
            {guardando ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="py-3 flex justify-between items-center text-sm">
      <div>
        <p className="font-bold text-slate-800">{servicio.nombre}</p>
        <a href={servicio.link} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:underline">
          {servicio.link}
        </a>
      </div>
      <div className="flex gap-1">
        <button onClick={iniciarEdicion} className="text-slate-500 hover:text-slate-700 text-xs px-2 py-1">
          <i className="fa-solid fa-pen"></i>
        </button>
        <button onClick={() => onEliminar(servicio.id)} className="text-red-500 hover:text-red-700 text-xs px-2 py-1">
          <i className="fa-solid fa-trash"></i>
        </button>
      </div>
    </li>
  );
}

function ProveedorItem({ proveedor, onGuardar, onEliminar }) {
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({
    nombre: proveedor.nombre,
    mail: proveedor.mail || '',
    nota: proveedor.nota || '',
  });
  const [guardando, setGuardando] = useState(false);

  function iniciarEdicion() {
    setForm({ nombre: proveedor.nombre, mail: proveedor.mail || '', nota: proveedor.nota || '' });
    setEditando(true);
  }

  async function guardar() {
    setGuardando(true);
    try {
      await onGuardar(proveedor.id, form);
      setEditando(false);
    } catch (err) {
      alert('Error al guardar: ' + err.message);
    } finally {
      setGuardando(false);
    }
  }

  if (editando) {
    return (
      <li className="py-3 space-y-2">
        <input
          type="text"
          value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          placeholder="Nombre o Razón Social"
          className="w-full border rounded-lg p-2 text-sm"
        />
        <input
          type="email"
          value={form.mail}
          onChange={(e) => setForm({ ...form, mail: e.target.value })}
          placeholder="Email de facturación"
          className="w-full border rounded-lg p-2 text-sm"
        />
        <textarea
          rows={2}
          value={form.nota}
          onChange={(e) => setForm({ ...form, nota: e.target.value })}
          placeholder="CBU, Alias, CUIT, contacto..."
          className="w-full border rounded-lg p-2 text-sm"
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setEditando(false)}
            className="text-xs px-3 py-1.5 rounded-md text-slate-600 hover:bg-slate-100"
          >
            Cancelar
          </button>
          <button
            onClick={guardar}
            disabled={guardando}
            className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-md disabled:opacity-50"
          >
            {guardando ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="py-3 flex justify-between items-center text-sm">
      <div>
        <p className="font-bold text-slate-800">{proveedor.nombre}</p>
        <p className="text-xs text-slate-500">
          <i className="fa-regular fa-envelope mr-1"></i>
          {proveedor.mail}
        </p>
        {proveedor.nota && (
          <p className="text-[11px] text-amber-700 bg-amber-50 rounded px-1.5 py-0.5 mt-1 inline-block">
            {proveedor.nota}
          </p>
        )}
      </div>
      <div className="flex gap-1">
        <button onClick={iniciarEdicion} className="text-slate-500 hover:text-slate-700 text-xs px-2 py-1">
          <i className="fa-solid fa-pen"></i>
        </button>
        <button onClick={() => onEliminar(proveedor.id)} className="text-red-500 hover:text-red-700 text-xs px-2 py-1">
          <i className="fa-solid fa-trash"></i>
        </button>
      </div>
    </li>
  );
}

export default function CatalogosView({
  servicios,
  proveedores,
  onAddServicio,
  onDeleteServicio,
  onUpdateServicio,
  onAddProveedor,
  onDeleteProveedor,
  onUpdateProveedor,
}) {
  async function nuevoServicio() {
    const nombre = prompt('Nombre del servicio (ej: AySA, Telecentro):');
    if (!nombre) return;
    const link = prompt('URL o web de consulta/pago:', 'https://');
    try {
      await onAddServicio(nombre, link || '#');
    } catch (err) {
      alert('Error al crear el servicio: ' + err.message);
    }
  }

  async function eliminarServicio(id) {
    if (!confirm('¿Eliminar este servicio del catálogo general?')) return;
    try {
      await onDeleteServicio(id);
    } catch (err) {
      alert('Error al eliminar: ' + err.message);
    }
  }

  async function nuevoProveedor() {
    const nombre = prompt('Nombre o Razón Social del proveedor:');
    if (!nombre) return;
    const mail = prompt('Email desde donde envía facturas (para búsqueda en Gmail):');
    const nota = prompt('Notas operativas por defecto (CBU, Alias, CUIT):');
    try {
      await onAddProveedor(nombre, mail || '', nota || '');
    } catch (err) {
      alert('Error al crear el proveedor: ' + err.message);
    }
  }

  async function eliminarProveedor(id) {
    if (!confirm('¿Eliminar este proveedor del catálogo general?')) return;
    try {
      await onDeleteProveedor(id);
    } catch (err) {
      alert('Error al eliminar: ' + err.message);
    }
  }

  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-900">Catálogos Generales</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4">
          <div className="flex justify-between items-center border-b pb-3">
            <h3 className="font-bold text-slate-800 text-lg">Servicios</h3>
            <button onClick={nuevoServicio} className="text-xs bg-slate-800 text-white px-3 py-1.5 rounded-md">
              <i className="fa-solid fa-plus mr-1"></i> Agregar
            </button>
          </div>
          <ul className="divide-y divide-slate-100">
            {servicios.map((s) => (
              <ServicioItem
                key={s.id}
                servicio={s}
                onGuardar={onUpdateServicio}
                onEliminar={eliminarServicio}
              />
            ))}
          </ul>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4">
          <div className="flex justify-between items-center border-b pb-3">
            <h3 className="font-bold text-slate-800 text-lg">Proveedores</h3>
            <button onClick={nuevoProveedor} className="text-xs bg-slate-800 text-white px-3 py-1.5 rounded-md">
              <i className="fa-solid fa-plus mr-1"></i> Agregar
            </button>
          </div>
          <ul className="divide-y divide-slate-100">
            {proveedores.map((p) => (
              <ProveedorItem
                key={p.id}
                proveedor={p}
                onGuardar={onUpdateProveedor}
                onEliminar={eliminarProveedor}
              />
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

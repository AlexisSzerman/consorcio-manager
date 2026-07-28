import { useState } from 'react';
import ConsorcioList from './ConsorcioList';
import ConsorcioEditor from './ConsorcioEditor';
import NuevoConsorcioModal from './NuevoConsorcioModal';

export default function ConsorciosView({
  consorcios,
  servicios,
  proveedores,
  onAddConsorcio,
  onUpdateConsorcio,
  onAddCuentaServicio,
  onDeleteCuentaServicio,
  onAddCuentaProveedor,
  onDeleteCuentaProveedor,
}) {
  const [selectedId, setSelectedId] = useState(null);
  const [mostrarModalNuevo, setMostrarModalNuevo] = useState(false);

  async function crearConsorcio(nombre) {
    const creado = await onAddConsorcio(nombre);
    setSelectedId(creado.id);
  }

  const selectedConsorcio = consorcios.find((c) => c.id === selectedId) || null;

  return (
    <section className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Gestión de Consorcios</h2>
        <button
          onClick={() => setMostrarModalNuevo(true)}
          className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700"
        >
          <i className="fa-solid fa-plus mr-1"></i> Nuevo Consorcio
        </button>
      </div>

      {mostrarModalNuevo && (
        <NuevoConsorcioModal onCrear={crearConsorcio} onClose={() => setMostrarModalNuevo(false)} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ConsorcioList consorcios={consorcios} selectedId={selectedId} onSelect={setSelectedId} />
        <ConsorcioEditor
          consorcio={selectedConsorcio}
          servicios={servicios}
          proveedores={proveedores}
          onGuardar={onUpdateConsorcio}
          onAddCuentaServicio={onAddCuentaServicio}
          onDeleteCuentaServicio={onDeleteCuentaServicio}
          onAddCuentaProveedor={onAddCuentaProveedor}
          onDeleteCuentaProveedor={onDeleteCuentaProveedor}
        />
      </div>
    </section>
  );
}

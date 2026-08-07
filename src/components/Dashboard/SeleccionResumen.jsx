import { formatMonto } from '../../utils/dateHelpers';

export default function SeleccionResumen({ cantidad, total, onLimpiar }) {
  if (cantidad === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
      <div className="bg-slate-900 text-white rounded-xl shadow-xl px-5 py-3 flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm">
          <i className="fa-solid fa-calculator text-indigo-400"></i>
          <span className="text-slate-300">
            {cantidad} {cantidad === 1 ? 'factura seleccionada' : 'facturas seleccionadas'}
          </span>
        </div>
        <div className="text-lg font-bold whitespace-nowrap">{formatMonto(total)}</div>
        <button
          onClick={onLimpiar}
          title="Limpiar selección"
          className="text-slate-400 hover:text-white w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-800"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>
      </div>
    </div>
  );
}
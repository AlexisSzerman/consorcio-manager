import { formatFechaHora } from '../../utils/dateHelpers';

export default function UltimaActualizacionBadge({ isoString }) {
  return (
    <div className="inline-flex items-center gap-2 bg-slate-100 border border-slate-200 text-slate-600 text-xs font-medium px-3 py-1.5 rounded-lg">
      <i className="fa-regular fa-clock text-indigo-500"></i>
      <span>
        Actualizado al{' '}
        <span className="font-bold text-slate-800">
          {isoString ? formatFechaHora(isoString) : '—'}
        </span>
      </span>
    </div>
  );
}

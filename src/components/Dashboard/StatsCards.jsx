export default function StatsCards({ stats, onFiltrarRango }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4">
      <div
        onClick={() => onFiltrarRango('VENCIDO')}
        className="bg-red-100 hover:bg-red-200 border border-red-300 p-4 rounded-xl shadow-sm cursor-pointer transition"
      >
        <div className="flex justify-between items-center">
          <p className="text-xs font-bold text-red-800 uppercase">Vencidos</p>
          <i className="fa-solid fa-triangle-exclamation text-red-700"></i>
        </div>
        <h3 className="text-2xl font-extrabold text-red-900 mt-1">{stats.cntVencidos}</h3>
        <p className="text-[10px] text-red-700 mt-1">No pagados, fecha pasada</p>
      </div>

      <div
        onClick={() => onFiltrarRango('HOY')}
        className="bg-red-50 hover:bg-red-100 border border-red-200 p-4 rounded-xl shadow-sm cursor-pointer transition"
      >
        <div className="flex justify-between items-center">
          <p className="text-xs font-bold text-red-600 uppercase">Vencen Hoy</p>
          <i className="fa-solid fa-circle-exclamation text-red-500"></i>
        </div>
        <h3 className="text-2xl font-extrabold text-red-700 mt-1">{stats.cntHoy}</h3>
        <p className="text-[10px] text-red-500 mt-1">Clic para filtrar urgentes</p>
      </div>

      <div
        onClick={() => onFiltrarRango('SEMANA')}
        className="bg-amber-50 hover:bg-amber-100 border border-amber-200 p-4 rounded-xl shadow-sm cursor-pointer transition"
      >
        <div className="flex justify-between items-center">
          <p className="text-xs font-bold text-amber-700 uppercase">Esta Semana</p>
          <i className="fa-solid fa-clock text-amber-500"></i>
        </div>
        <h3 className="text-2xl font-extrabold text-amber-800 mt-1">{stats.cntSemana}</h3>
        <p className="text-[10px] text-amber-600 mt-1">Próximos 7 días</p>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <p className="text-xs font-semibold text-slate-400 uppercase">Pendientes</p>
        <h3 className="text-2xl font-bold text-amber-600 mt-1">{stats.pendientes}</h3>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <p className="text-xs font-semibold text-blue-500 uppercase">Cargadas / Revisar</p>
        <h3 className="text-2xl font-bold text-blue-600 mt-1">{stats.cargadas}</h3>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <p className="text-xs font-semibold text-emerald-500 uppercase">Pagadas</p>
        <h3 className="text-2xl font-bold text-emerald-600 mt-1">{stats.pagadas}</h3>
      </div>
    </div>
  );
}

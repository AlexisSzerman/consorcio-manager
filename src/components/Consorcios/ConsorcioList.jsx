export default function ConsorcioList({ consorcios, selectedId, onSelect }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
      <h3 className="font-bold text-slate-700 mb-3 border-b pb-2">Seleccionar Consorcio</h3>
      <ul className="space-y-2">
        {consorcios.map((c) => (
          <li
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={`p-3 rounded-lg cursor-pointer flex justify-between items-center transition ${
              selectedId === c.id
                ? 'bg-indigo-50 border-indigo-500 border-l-4 font-bold text-indigo-900'
                : 'hover:bg-slate-50 text-slate-700'
            }`}
          >
            <span>{c.nombre}</span>
            <i className="fa-solid fa-chevron-right text-xs text-slate-400"></i>
          </li>
        ))}
      </ul>
    </div>
  );
}

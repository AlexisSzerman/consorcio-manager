export default function NotaIconButton({ tieneNota, onClick }) {
  return (
    <button
      onClick={onClick}
      title={tieneNota ? 'Ver / editar nota' : 'Agregar nota'}
      className={`w-8 h-8 flex items-center justify-center rounded-lg border transition ${
        tieneNota
          ? 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100'
          : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-600'
      }`}
    >
      <i className={tieneNota ? 'fa-solid fa-note-sticky' : 'fa-regular fa-note-sticky'}></i>
    </button>
  );
}

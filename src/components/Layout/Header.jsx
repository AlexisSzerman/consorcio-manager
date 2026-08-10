export default function Header({ activeTab, onSwitchTab, userEmail, onLogout }) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-line' },
    { id: 'consorcios', label: 'Consorcios', icon: 'fa-building' },
    { id: 'catalogos', label: 'Catálogos', icon: 'fa-list-check' },
    { id: 'libro-diario', label: 'Libro Diario', icon: 'fa-book' },
  ];

  return (
    <header className="bg-slate-900 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <i className="fa-solid fa-building-user text-indigo-400 text-xl"></i>
          <h1 className="text-xl font-bold tracking-wide">ConsorcioManager</h1>
        </div>
        <div className="flex items-center gap-3">
          <nav className="flex space-x-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onSwitchTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <i className={`fa-solid ${tab.icon} mr-2`}></i>
                {tab.label}
              </button>
            ))}
          </nav>
          {userEmail && (
            <div className="flex items-center gap-2 pl-3 border-l border-slate-700">
              <span className="text-xs text-slate-400 hidden sm:inline">{userEmail}</span>
              <button
                onClick={onLogout}
                title="Cerrar sesión"
                className="text-slate-300 hover:text-white hover:bg-slate-800 w-8 h-8 rounded-lg flex items-center justify-center"
              >
                <i className="fa-solid fa-right-from-bracket"></i>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
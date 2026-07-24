import { useState } from 'react';

export default function Login({ onLogin, authError }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setEnviando(true);
    try {
      await onLogin(email, password);
    } catch {
      // el error ya queda reflejado en authError
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <i className="fa-solid fa-building-user text-indigo-600 text-3xl"></i>
          <h1 className="text-xl font-bold text-slate-900">ConsorcioManager</h1>
          <p className="text-sm text-slate-500">Iniciá sesión para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded-lg p-2 text-sm"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-lg p-2 text-sm"
            />
          </div>

          {authError && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">
              {authError}
            </p>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2 rounded-lg disabled:opacity-50"
          >
            {enviando ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}

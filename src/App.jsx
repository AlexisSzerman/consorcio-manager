import { useState } from 'react';
import Header from './components/Layout/Header';
import Login from './components/Auth/Login';
import Dashboard from './components/Dashboard/Dashboard';
import ConsorciosView from './components/Consorcios/ConsorciosView';
import CatalogosView from './components/Catalogos/CatalogosView';
import LibroDiarioView from './components/LibroDiario/LibroDiarioView';
import LoadingBuilding from './components/LoadingBuilding';
import { useAppData } from './hooks/useAppData';
import { useAuth } from './hooks/useAuth';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { session, user, loadingAuth, authError, login, logout } = useAuth();

  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <LoadingBuilding text="Verificando sesión..." />
      </div>
    );
  }

  if (!session) {
    return <Login onLogin={login} authError={authError} />;
  }

  return (
    <AppContent
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      userEmail={user?.email}
      onLogout={logout}
    />
  );
}

function AppContent({ activeTab, setActiveTab, userEmail, onLogout }) {
  const {
    loading,
    error,
    servicios,
    proveedores,
    consorcios,
    movimientos,
    pagosParciales,
    unidades,
    libroDiarioPeriodos,
    libroDiarioMovimientosPorPeriodo,
    ultimaActualizacionGlobal,
    libroDiarioParaReconciliar,
    addServicio,
    deleteServicio,
    updateServicio,
    addProveedor,
    deleteProveedor,
    updateProveedor,
    addConsorcio,
    updateConsorcio,
    addUnidad,
    updateUnidad,
    deleteUnidad,
    addPeriodoLibroDiario,
    updatePeriodoLibroDiario,
    deletePeriodoLibroDiario,
    cargarMovimientosLibroDiario,
    addMovimientoLibroDiario,
    addMovimientosLibroDiarioBulk,
    updateMovimientoLibroDiario,
    deleteMovimientoLibroDiario,
    addCuentaServicio,
    deleteCuentaServicio,
    addCuentaProveedor,
    deleteCuentaProveedor,
    updateMovimiento,
    addMovimientoManual,
    addPagoParcial,
    deletePagoParcial,
    updateNotaMovimiento,
    deleteMovimiento,
    generarMes,
  } = useAppData();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <LoadingBuilding text="Cargando consorcio..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-xl max-w-md text-center">
          <i className="fa-solid fa-triangle-exclamation text-2xl mb-2"></i>
          <p className="font-bold">No se pudieron cargar los datos</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-100 text-slate-800 font-sans min-h-screen flex flex-col">
      <Header
        activeTab={activeTab}
        onSwitchTab={setActiveTab}
        userEmail={userEmail}
        onLogout={onLogout}
      />

      <main className="max-w-7xl mx-auto w-full p-6 flex-1">
        {activeTab === 'dashboard' && (
  <Dashboard
    movimientos={movimientos}
    consorcios={consorcios}
    servicios={servicios}
    proveedores={proveedores}
    pagosParciales={pagosParciales}
    ultimaActualizacionGlobal={ultimaActualizacionGlobal}
    libroDiarioParaReconciliar={libroDiarioParaReconciliar}
    libroDiarioPeriodos={libroDiarioPeriodos}
    onGuardarMovimiento={updateMovimiento}
    onEliminarMovimiento={async (id) => {
      if (confirm('¿Seguro que quieres eliminar este vencimiento del tablero?')) {
        await deleteMovimiento(id);
      }
    }}
    onGuardarNota={updateNotaMovimiento}
    onGenerarMes={generarMes}
    onCrearMovimientoManual={addMovimientoManual}
    onAgregarPagoParcial={addPagoParcial}
    onEliminarPagoParcial={deletePagoParcial}
  />
)}

        {activeTab === 'consorcios' && (
          <ConsorciosView
            consorcios={consorcios}
            servicios={servicios}
            proveedores={proveedores}
            onAddConsorcio={addConsorcio}
            onUpdateConsorcio={updateConsorcio}
            onAddCuentaServicio={addCuentaServicio}
            onDeleteCuentaServicio={deleteCuentaServicio}
            onAddCuentaProveedor={addCuentaProveedor}
            onDeleteCuentaProveedor={deleteCuentaProveedor}
            onAddUnidad={addUnidad}
            onUpdateUnidad={updateUnidad}
            onDeleteUnidad={deleteUnidad}
          />
        )}

        {activeTab === 'libro-diario' && (

    <LibroDiarioView
      consorcios={consorcios}
      periodos={libroDiarioPeriodos}
      movimientosPorPeriodo={libroDiarioMovimientosPorPeriodo}
      proveedores={proveedores}
      servicios={servicios}
      unidades={unidades}
      onCargarMovimientos={cargarMovimientosLibroDiario}
      onAddPeriodo={addPeriodoLibroDiario}
      onUpdatePeriodo={updatePeriodoLibroDiario}
      onDeletePeriodo={deletePeriodoLibroDiario}
      onAddMovimiento={addMovimientoLibroDiario}
      onAddMovimientosBulk={addMovimientosLibroDiarioBulk}
      onUpdateMovimiento={updateMovimientoLibroDiario}
      onDeleteMovimiento={deleteMovimientoLibroDiario}
    />
  
)}

        {activeTab === 'catalogos' && (
          <CatalogosView
            servicios={servicios}
            proveedores={proveedores}
            onAddServicio={addServicio}
            onDeleteServicio={deleteServicio}
            onUpdateServicio={updateServicio}
            onAddProveedor={addProveedor}
            onDeleteProveedor={deleteProveedor}
            onUpdateProveedor={updateProveedor}
          />
        )}
      </main>
    </div>
  );
}
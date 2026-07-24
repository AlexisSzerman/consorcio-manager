# ConsorcioManager — React + Tailwind + Supabase

Conversión a componentes React del gestor de vencimientos de consorcios, con:

- **Ícono de nota por fila**: en vez de romper el layout con texto largo, cada fila tiene un ícono
  de nota (gris/vacío → **verde** cuando tiene contenido). Al tocarlo abre un modal para escribir
  o editar la aclaración.
- **Badge global "Actualizado al..."**: muestra la fecha/hora de la última vez que cambió el
  **estado** de cualquier factura (PENDIENTE/CARGADA/REVISAR/PAGADO), calculado automáticamente
  con un trigger de Postgres — no depende de que el frontend lo actualice a mano.

## 1. Setup de Supabase

1. Creá un proyecto en [supabase.com](https://supabase.com) (o usá uno existente).
2. Andá a **SQL Editor** y ejecutá el contenido de `supabase/schema.sql`. Esto crea las tablas,
   los índices, el trigger de `estado_actualizado_en` y las políticas de RLS (exigen usuario
   `authenticated`).
3. Copiá la **URL del proyecto** y la **anon/publishable key** desde *Project Settings → API*.
4. Andá a **Authentication → Users → Add user** y create tu usuario a mano (email + password).
   No hay registro público desde la app: el login solo sirve para entrar con un usuario que vos
   ya creaste en el dashboard. Esto evita que cualquiera con la URL del proyecto pueda darse de
   alta solo.

> Si en algún momento corriste `fix_permissions_anon.sql` (versión sin login), ejecutá después
> `restore_auth_policies.sql` para volver a exigir autenticación.

## 2. Setup del proyecto

```bash
npm install
cp .env.example .env
# completá .env con tu VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
npm run dev
```

## 3. Estructura

```
src/
  lib/supabaseClient.js        Cliente de Supabase
  hooks/
    useAppData.js               Toda la lógica de datos (fetch + CRUD)
    useAuth.js                  Sesión, login y logout con Supabase Auth
  utils/dateHelpers.js         esHoy, esEstaSemana, formatMonto, formatFechaHora
  components/
    Auth/Login.jsx              Pantalla de login (email/password)
    Layout/Header.jsx          Navegación superior + usuario + logout
    Dashboard/
      Dashboard.jsx            Orquesta filtros, stats, badge y tabla
      StatsCards.jsx           Tarjetas de resumen (hoy / semana / etc.)
      UltimaActualizacionBadge.jsx   Badge global "Actualizado al..."
      MovimientosTable.jsx     Tabla + modal de nota
      MovimientoRow.jsx        Fila individual (vista y edición)
      NotaIconButton.jsx       Ícono de nota (gris / verde)
      NotaModal.jsx            Modal para escribir la nota
    Consorcios/
      ConsorciosView.jsx
      ConsorcioList.jsx
      ConsorcioEditor.jsx
    Catalogos/
      CatalogosView.jsx
supabase/
  schema.sql                   Schema completo + trigger + RLS
```

## 4. Notas sobre el trigger de "Actualizado al..."

El campo `estado_actualizado_en` de `movimientos` se actualiza **solo en el servidor** vía un
trigger (`fn_movimiento_estado_actualizado`) cada vez que el campo `estado` cambia. Esto significa:

- Editar solo la **nota** de una factura **no** mueve el badge global (como pediste).
- El badge global es simplemente el `MAX(estado_actualizado_en)` de todos los movimientos,
  calculado en el frontend con `useMemo` en `useAppData.js`.

## 5. Autenticación

La app exige login (`useAuth.js` + `Login.jsx`) antes de mostrar cualquier dato. No hay pantalla
de registro: los usuarios se crean manualmente desde el dashboard de Supabase
(*Authentication → Users → Add user*). Mientras no haya sesión, `App.jsx` muestra el login;
apenas hay sesión válida, renderiza el resto de la app y habilita el botón de logout en el header.

Si más adelante vas a tener varios administradores con roles distintos (por ejemplo, que solo
uno pueda borrar movimientos), se puede extender agregando una tabla `perfiles` con un campo
`rol` y ajustando las políticas de RLS para chequear ese rol además de `auth.role() = 'authenticated'`.

## 6. Próximos pasos sugeridos

- Recuperación de contraseña ("¿Olvidaste tu contraseña?") vía `supabase.auth.resetPasswordForEmail`.
- Si vas a tener varios usuarios con permisos distintos, ajustá las políticas de RLS.

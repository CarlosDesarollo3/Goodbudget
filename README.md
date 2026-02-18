# Manejo de Sobres (React Native + Expo + TypeScript)

Aplicación **offline-first** para administrar dinero por sobres (cuentas) organizados en grupos jerárquicos.

## Decisiones técnicas
- **Expo + React Native + TypeScript estricto** para velocidad de entrega y estabilidad móvil.
- **React Navigation** para navegación por stack.
- **react-native-paper** para UI moderna, consistente y accesible.
- **Zustand** para estado global simple y mantenible (menos boilerplate que Redux Toolkit en este alcance).
- **expo-sqlite** para persistencia local robusta sin conexión.
- **Zod + react-hook-form** para validaciones tipadas en formularios.
- **date-fns** para cálculo de fechas de reglas recurrentes.

## Arquitectura
```txt
/src
  /Dominio      -> entidades, enums, esquemas Zod
  /Datos        -> conexión SQLite, migraciones, repositorios
  /Servicios    -> motor de balances y motor de recurrencias
  /Interfaz     -> pantallas y componentes reutilizables
  /Navegacion   -> configuración de React Navigation
  /Estado       -> store de aplicación (Zustand)
  /Utilidades   -> errores tipados, formatos
  /Pruebas      -> pruebas unitarias
```

## Persistencia offline
- Se crea una base local `manejo_sobres.db` con tablas para grupos, cuentas, categorías, transacciones, reglas y configuración.
- Las migraciones se ejecutan al inicializar la app.
- Toda la lógica de lectura/escritura pasa por `RepositorioSqlite`.

## Lógica de balances
Se usa enfoque **event sourcing** desde transacciones:
- `AJUSTE`: establece saldo exacto de una cuenta destino.
- `TRANSFERENCIA`: resta a origen y suma a destino.
- `GASTO`: resta de cuenta origen.
- `INGRESO`: suma a cuenta destino.

Los totales de grupo se calculan de forma recursiva sumando cuentas hijas y subgrupos.

## Reglas recurrentes mensuales
- Al abrir inicio se ejecuta `MotorRecurrencias`.
- Revisa reglas habilitadas con fecha pendiente.
- Genera transacción automática y avanza `proximaEjecucionEn`.
- Evita duplicados con `referenciaIdempotencia` única por regla+fecha.

## Cómo ejecutar
1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Correr app:
   ```bash
   npm run start
   ```
3. Pruebas:
   ```bash
   npm run test
   ```

## Extensión futura a web/sincronización
- Mantener contratos de repositorio (`RepositorioTipos`) y crear implementación API (`RepositorioRemoto`).
- Sincronización incremental: cola local de eventos + estrategia de resolución de conflictos por timestamp/versionado.
- React Native Web puede reutilizar gran parte de UI y lógica, intercambiando solo adaptadores de almacenamiento.

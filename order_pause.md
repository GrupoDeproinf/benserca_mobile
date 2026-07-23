# Pausa de pedidos (`lo_orders`) — contrato App ↔ Web

**Proyecto:** Benserca
**Colección:** `lo_orders`
**Fecha:** Julio 2026
**Audiencia:** app móvil (picker/jefe/auditor/supervisor) + web dashboard

La **pausa no es un paso obligatorio** del flujo. Puede ocurrir 0 o muchas veces. Sirve para
detener temporalmente el trabajo operativo sin anular el pedido ni perder el avance.

> **Cambio respecto a la versión anterior de este doc:** ya **no** se usa el array `paused[]`
> ni `status = "Pausa"`. La pausa ahora se representa con un **booleano `is_paused`** +
> **entradas en el `timeline`**, y **el `status` operativo NO cambia**. Este documento es el
> contrato que la app ya implementa; la web debe alinearse a él.

---

## 1. Modelo (resumen)

| Campo | Tipo | Rol |
|-------|------|-----|
| `is_paused` | `boolean` | **Fuente de verdad.** `true` = pausado ahora. Consultable (`where`). |
| `status` | `string` | **No cambia** por la pausa. Si estaba `"En proceso"`, queda `"En proceso"`. |
| `timeline[]` | `array<map>` | Histórico append-only. Cada pausa/despausa hace push de una entrada. |

### ¿Está pausado ahora?

**Solo mirar `is_paused === true`.** No hace falta escanear el timeline ni el status.

### Al crear el pedido (web → almacén)

```json
{ "is_paused": false }
```

Documentos viejos sin el campo: tratar como `is_paused = false`.

---

## 2. Por qué `is_paused` booleano (y no `status="Pausa"` ni `paused[]`)

1. **Consultas:** la app lista los pedidos pausados con
   `collection('lo_orders').where('is_paused','==',true)`. Firestore **no** puede consultar
   "la última entrada de un array" ni "el último timeline es Pausa". Se necesita un campo plano.
2. **No romper el flujo:** cambiar `status` a `"Pausa"` rompería toda la lógica que depende del
   estatus (colas, auditoría, reconstrucción de bultos, edición). Manteniéndolo operativo, la
   pausa es un flag **ortogonal**.
3. **Historial:** ya existe el `timeline`; ahí viven quién/cuándo/nota + el detalle de la pausa.

---

## 3. Entrada de `timeline` para pausa / despausa

El `timeline` ya se usa para todas las transiciones del pedido. La pausa reutiliza esa
estructura, agregando campos extra **solo en la entrada de pausa**.

### Entrada al **pausar**

```json
{
  "status": "Pausa",
  "timestamp": "2026-07-22T18:05:00.000Z",
  "user_uid": "LygwO9qn5KfPqO295bWI04qTkn93",
  "user_name": "Manuel picker",
  "user_role": "picker",
  "note": "Pedido pausado desde estatus «En proceso».",
  "reason": "falta_articulo",
  "missing_skus": ["SKU-001", "SKU-045"]
}
```

### Entrada al **quitar la pausa**

```json
{
  "status": "En proceso",
  "timestamp": "2026-07-22T19:10:00.000Z",
  "user_uid": "ZwzLSHiulAaYsDy1Z3Vsb6NXmDw2",
  "user_name": "Ana supervisor",
  "user_role": "supervisor_almacen",
  "note": "Pausa quitada. Vuelve a estatus «En proceso»."
}
```

> El `status` **dentro de la entrada de timeline** es solo una etiqueta del evento
> (`"Pausa"` / el operativo). El campo `status` **del documento** no se toca en ningún momento.

### Campos de la entrada

| Campo | Tipo | Pausa | Despausa | Descripción |
|-------|------|:----:|:-------:|-------------|
| `status` | `string` | `"Pausa"` | estatus operativo actual | Etiqueta del evento |
| `timestamp` | `timestamp`/ISO | ✔ | ✔ | Fecha/hora de la acción |
| `user_uid` | `string` | ✔ | ✔ | Quién hizo la acción |
| `user_name` | `string` | ✔ | ✔ | Nombre visible |
| `user_role` | `string` | ✔ | ✔ | Rol (`picker`/`warehouse_lead`/`auditor`/`supervisor_almacen`) |
| `note` | `string` | ✔ | ✔ | Texto legible |
| `reason` | `"falta_articulo"` \| `"cambio_prioridad"` | ✔ | — | **Extra.** Motivo de la pausa |
| `missing_skus` | `string[]` | ✔ (si `falta_articulo`) | — | **Extra.** SKUs marcados faltantes |

> `timestamp` puede escribirse como Firestore Timestamp o ISO string; la app normaliza ambos.

---

## 4. Operaciones (lo que escribe cada lado)

### Pausar

```
update({
  is_paused: true,
  updated_at: <now>,
  timeline: arrayUnion({ status:"Pausa", timestamp, user_uid, user_name, user_role, note, reason, missing_skus })
})
```
- **No** se toca `status`.
- **No** se quita la asignación (`assigned_to` / `team` se mantienen).
- Se conserva `progress_percentage`.
- Notificación `order_paused` al picker/asignado.

### Quitar la pausa

```
update({
  is_paused: false,
  updated_at: <now>,
  timeline: arrayUnion({ status:<operativo>, timestamp, user_uid, user_name, user_role, note })
})
```
- El `<operativo>` es el `status` actual del documento (nunca fue "Pausa", así que se toma tal cual).
- Notificación `order_unpaused` al picker/asignado.

### Quién puede pausar / despausar (política de la app)

| Rol | Pausar | Despausar |
|-----|:-----:|:--------:|
| picker (asignado) | ✔ (desde "En proceso") | ✔ |
| jefe de almacén (`warehouse_lead`) | ✔ | ✔ |
| auditor | — (solo ve) | ✔ |
| supervisor_almacen | — (solo ve) | ✔ |

> En la web hoy pausan/​despausan roles de oficina/admin; eso sigue válido. La regla de arriba
> es la de la app. Cualquier rol que **ve** el pedido pausado puede quitar la pausa salvo donde
> se indique lo contrario.

---

## 5. Reglas de negocio adicionales

- **Mientras `is_paused === true` no se avanza el estatus operativo** (la app oculta todas las
  acciones y solo deja "Reanudar").
- **Un picker no puede tener 2 pedidos activos a la vez**, PERO si el pedido en curso está
  **pausado**, sí puede iniciar otro pedido asignado. (Un pedido `in_progress` pausado no cuenta
  como "activo".)
- La pausa es visible para todos los roles que ya ven el pedido (picker/equipo, jefe, auditor) y
  para supervisor_almacen (que tiene una card de "Pausados").

---

## 6. Notificaciones (Web ↔ App)

| `type` | Cuándo | Mensaje ejemplo |
|--------|--------|-----------------|
| `order_paused` | Al pausar | `El pedido #82341 fue pausado` |
| `order_unpaused` | Al quitar la pausa | `Se quitó la pausa del pedido #82341` |

`channel: "app"`, `recipients` = picker/jefe asignado. Detalle en `notifications.md`.

---

## 7. Referencia rápida para la web

**Leer:**
- ¿Pausado? → `doc.is_paused === true`.
- Detalle de la pausa actual → última entrada de `timeline` con `status === "Pausa"`
  (campos `reason`, `missing_skus`, `user_name`, `timestamp`, `note`).

**Escribir (pausar):** setear `is_paused: true` + `arrayUnion` de la entrada de timeline
(`status:"Pausa"` + extras). **No** tocar `status`.

**Escribir (despausar):** setear `is_paused: false` + `arrayUnion` de la entrada de timeline con
el `status` operativo actual. **No** tocar `status`.

**Campos nuevos que la web debe soportar (no estaban en la versión anterior):**
`is_paused` (boolean top-level) y, en la entrada de timeline de pausa: `reason`, `missing_skus`,
`user_role`.

---

## 8. TypeScript de referencia (así lo tipa la app)

```ts
export type PauseReason = 'falta_articulo' | 'cambio_prioridad'

// Entrada del timeline (los campos reason/missingSkus solo en la de pausa)
export interface TimelineEntry {
  status: string            // "Pausa" en pausa; estatus operativo en despausa
  timestamp: string
  userUid: string
  userName: string
  userRole?: string
  note?: string | null
  reason?: PauseReason
  missingSkus?: string[]    // Firestore: missing_skus
}

// En lo_orders:
is_paused: boolean          // [false] al crear
// status: NO cambia por la pausa
```

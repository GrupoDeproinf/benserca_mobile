# Benserca — Notificaciones (Firestore)

**Proyecto:** Benserca  
**Colección:** `notifications`  
**Fecha:** Julio 2026 (actualizado)  
**Alcance:** Inbox en Firestore (no push al teléfono). App y web leen la misma colección.

**Audiencia de este doc:** web + app (móvil). Convención crítica para **App → Web**.

---

## 0. Regla clave: App → Web = `recipients` vacío

En la web **no resolvemos destinatarios por UID de admin**. El acceso a la campana es por sesión / preferencias del usuario en el dashboard.

Por eso, cuando la **app** (o una función que avisa a la web) crea una notificación para la web:

| Campo | Valor |
|--------|--------|
| `channel` | `"web"` |
| `recipients` | **`[]`** (array vacío = broadcast a la web) |
| `read` | **`[]`** (nadie la ha leído aún) |

### Dos arrays con la misma forma: `recipients` y `read`

Ambos son **array de maps**. Cada map tiene:

| Campo | Tipo | Descripción |
|--------|------|-------------|
| `uid` | `string` | UID del usuario |
| `name` | `string` | Nombre visible |
| `created` | `timestamp` | Momento (asignación o lectura) |

| Array | Significado |
|--------|-------------|
| **`recipients`** | A quiénes **les llega** / deben verla |
| **`read`** | Quiénes **ya la leyeron** |

#### `recipients` — App dirigida (ejemplo con datos ficticios)

```
recipients (array)
  ├── 0 (map)
  │     ├── uid: "LygwO9qn5KfPqO295bWI04qTkn93"     (string)
  │     ├── name: "Manuel picker"                   (string)
  │     └── created: 16 de julio de 2026, 2:10:00 p.m. UTC-4  (timestamp)
  └── 1 (map)
        ├── uid: "uid_jefe_almacen_001"               (string)
        ├── name: "Carlos jefe"                       (string)
        └── created: 16 de julio de 2026, 2:10:00 p.m. UTC-4  (timestamp)
```

```json
"recipients": [
  {
    "uid": "LygwO9qn5KfPqO295bWI04qTkn93",
    "name": "Manuel picker",
    "created": "2026-07-16T18:10:00.000Z"
  },
  {
    "uid": "uid_jefe_almacen_001",
    "name": "Carlos jefe",
    "created": "2026-07-16T18:10:00.000Z"
  }
]
```

#### `recipients` — App → Web (broadcast)

```
recipients (array)  →  []
```

#### `read` — después de lecturas (ejemplo)

```
read (array)
  ├── 0 (map)
  │     ├── uid: "ZwzLSHiulAaYsDy1Z3Vsb6NXmDw2"          (string)
  │     ├── name: "Ana administrador"                    (string)
  │     └── created: 16 de julio de 2026, 11:42:18 a.m. UTC-4  (timestamp)
  └── 1 (map)
        ├── uid: "kP9mX2nQ7vR4sT6uW8yZ0aB1cD3e"          (string)
        ├── name: "Carlos oficina"                       (string)
        └── created: 16 de julio de 2026, 11:55:03 a.m. UTC-4  (timestamp)
```

```json
"read": [
  {
    "uid": "ZwzLSHiulAaYsDy1Z3Vsb6NXmDw2",
    "name": "Ana administrador",
    "created": "2026-07-16T15:42:18.000Z"
  },
  {
    "uid": "kP9mX2nQ7vR4sT6uW8yZ0aB1cD3e",
    "name": "Carlos oficina",
    "created": "2026-07-16T15:55:03.000Z"
  }
]
```

Al marcar como leída: `arrayUnion` de `{ uid, name, created }` en **`read`**.

### Cómo filtra la web

Se muestra en la campana si `channel` ∈ `["web", "both"]` **y**:

- `recipients` está **vacío** → broadcast, **o**
- `recipients` **contiene** un map cuyo `uid` es el del usuario logueado
- el `uid` del usuario **no** aparece en `read[].uid`

### Cómo filtra la app

- `channel` ∈ `["app", "both"]` **y** `recipients` contiene un map con su `uid`
- Si su `uid` está en `read`, ya la leyó

---

## 1. Modelo del documento

| Campo | Tipo | Obligatorio | Descripción |
|--------|------|-------------|-------------|
| `message` | `string` | sí | Texto que ve el usuario |
| `type` | `string` | sí | Tipo de notificación (ver §3) |
| `recipients` | `array<{ uid, name, created }>` | sí | Quiénes deben verla. **App→Web: `[]`**. App dirigida: uno o más maps |
| `read` | `array<{ uid, name, created }>` | sí | Quiénes ya la leyeron (inicia `[]`) |
| `channel` | `"web"` \| `"app"` \| `"both"` | sí | Dónde se lee |
| `created_at` | `timestamp` | sí | Momento de creación del doc |
| `order_number` | `number` | cuando aplique | Pedido relacionado |
| `created_by` | `string` | opcional | UID de quien originó |
| `created_by_name` | `string` | opcional | Nombre de quien originó |
| `motivo` | `string` | opcional | Motivo (rechazo, SKU, anulación, etc.) |

### Documento completo — App → Web (ya leída por 2 personas)

```json
{
  "message": "Manuel picker aceptó el pedido #82341",
  "type": "order_accepted",
  "recipients": [],
  "read": [
    {
      "uid": "ZwzLSHiulAaYsDy1Z3Vsb6NXmDw2",
      "name": "Ana administrador",
      "created": "2026-07-16T15:42:18.000Z"
    },
    {
      "uid": "kP9mX2nQ7vR4sT6uW8yZ0aB1cD3e",
      "name": "Carlos oficina",
      "created": "2026-07-16T15:55:03.000Z"
    }
  ],
  "channel": "web",
  "order_number": 82341,
  "created_at": "2026-07-16T15:30:00.000Z",
  "created_by": "LygwO9qn5KfPqO295bWI04qTkn93",
  "created_by_name": "Manuel picker"
}
```

### Documento completo — Web → App (sin leer aún)

```json
{
  "message": "Se te asignó un nuevo pedido #82341",
  "type": "order_assigned",
  "recipients": [
    {
      "uid": "LygwO9qn5KfPqO295bWI04qTkn93",
      "name": "Manuel picker",
      "created": "2026-07-16T14:10:00.000Z"
    }
  ],
  "read": [],
  "channel": "app",
  "order_number": 82341,
  "created_at": "2026-07-16T14:10:00.000Z",
  "created_by": "ZwzLSHiulAaYsDy1Z3Vsb6NXmDw2",
  "created_by_name": "Ana administrador"
}
```

---

## 2. Catálogo de notificaciones

### 2.1 Pedido asignado

| | |
|--|--|
| **Type** | `order_assigned` |
| **Origen → destino** | Web → App |
| **Channel** | `app` |
| **Destinatarios (`recipients`)** | Map(s) del picker **o** del jefe |
| **Cuándo** | Al confirmar asignación / “Pasar a despacho” |

```json
{
  "message": "Se te asignó un nuevo pedido #82341",
  "type": "order_assigned",
  "recipients": [
    {
      "uid": "LygwO9qn5KfPqO295bWI04qTkn93",
      "name": "Manuel picker",
      "created": "2026-07-16T14:10:00.000Z"
    }
  ],
  "read": [],
  "channel": "app",
  "order_number": 82341,
  "created_at": "2026-07-16T14:10:00.000Z",
  "created_by": "ZwzLSHiulAaYsDy1Z3Vsb6NXmDw2",
  "created_by_name": "administrador"
}
```

---

### 2.2 Pedido aprobado (aceptado por el picker)

| | |
|--|--|
| **Type** | `order_accepted` |
| **Origen → destino** | App → Web |
| **Channel** | `web` |
| **Destinatarios (`recipients`)** | **`[]`** — broadcast web |
| **Cuándo** | El picker acepta el pedido |

```json
{
  "message": "Manuel picker aceptó el pedido #82341",
  "type": "order_accepted",
  "recipients": [],
  "read": [
    {
      "uid": "ZwzLSHiulAaYsDy1Z3Vsb6NXmDw2",
      "name": "Ana administrador",
      "created": "2026-07-16T15:42:18.000Z"
    }
  ],
  "channel": "web",
  "order_number": 82341,
  "created_at": "2026-07-16T15:30:00.000Z",
  "created_by": "LygwO9qn5KfPqO295bWI04qTkn93",
  "created_by_name": "Manuel picker"
}
```

> `read` con datos simulados. **Al crear** desde la app: `"read": []`.

---

### 2.3 Pedido rechazado (avisar a la web)

| | |
|--|--|
| **Type** | `order_rejected` |
| **Origen → destino** | App → Web |
| **Channel** | `web` |
| **Destinatarios (`recipients`)** | **`[]`** |
| **Cuándo** | El picker rechaza el pedido |
| **Campo extra** | `motivo` |

```json
{
  "message": "Manuel picker rechazó el pedido #82341",
  "type": "order_rejected",
  "recipients": [],
  "read": [],
  "channel": "web",
  "order_number": 82341,
  "motivo": "No hay stock suficiente en almacén para completar el pedido",
  "created_at": "2026-07-16T16:05:00.000Z",
  "created_by": "LygwO9qn5KfPqO295bWI04qTkn93",
  "created_by_name": "Manuel picker"
}
```

---

### 2.4 Pedido rechazado → jefe de almacén

| | |
|--|--|
| **Type** | `order_rejected_to_chief` |
| **Origen → destino** | App → App |
| **Channel** | `app` |
| **Destinatarios (`recipients`)** | Map del jefe |
| **Cuándo** | Pedido asignado a jefe y un picker del equipo lo rechaza |
| **Campo extra** | `motivo` |

> Si también debe enterarse la web, crear **además** un `order_rejected` con `recipients: []` y `channel: "web"`.

```json
{
  "message": "Manuel picker rechazó el pedido #82341 asignado a tu equipo",
  "type": "order_rejected_to_chief",
  "recipients": [
    {
      "uid": "uid_jefe_almacen_001",
      "name": "Carlos jefe",
      "created": "2026-07-16T16:06:00.000Z"
    }
  ],
  "read": [
    {
      "uid": "uid_jefe_almacen_001",
      "name": "Carlos jefe",
      "created": "2026-07-16T16:20:44.000Z"
    }
  ],
  "channel": "app",
  "order_number": 82341,
  "motivo": "SKU 45012 no disponible en rack",
  "created_at": "2026-07-16T16:06:00.000Z",
  "created_by": "LygwO9qn5KfPqO295bWI04qTkn93",
  "created_by_name": "Manuel picker"
}
```

---

### 2.5 Pedido actualizado (sincronización Profit / función)

Avisar a **web** y a **app (asignados)** → **dos documentos**.

#### 2.5.a Web (broadcast)

```json
{
  "message": "El pedido #82341 fue actualizado desde Profit (cambios en SKUs o cantidades)",
  "type": "order_updated",
  "recipients": [],
  "read": [],
  "channel": "web",
  "order_number": 82341,
  "created_at": "2026-07-16T17:00:00.000Z",
  "created_by": "sistema",
  "created_by_name": "Sincronización Profit"
}
```

#### 2.5.b App (asignados)

```json
{
  "message": "El pedido #82341 fue actualizado desde Profit (cambios en SKUs o cantidades)",
  "type": "order_updated",
  "recipients": [
    {
      "uid": "uid_jefe_almacen_001",
      "name": "Carlos jefe",
      "created": "2026-07-16T17:00:00.000Z"
    },
    {
      "uid": "LygwO9qn5KfPqO295bWI04qTkn93",
      "name": "Manuel picker",
      "created": "2026-07-16T17:00:00.000Z"
    }
  ],
  "read": [],
  "channel": "app",
  "order_number": 82341,
  "created_at": "2026-07-16T17:00:00.000Z",
  "created_by": "sistema",
  "created_by_name": "Sincronización Profit"
}
```

---

### 2.6 SKU diferente / incompleto (dos variantes)

Ambas: **App → Web**, `recipients: []`.

#### 2.6.1 Finalizar picking incompleto

```json
{
  "message": "Picking finalizado con SKUs incompletos en el pedido #82341",
  "type": "picking_finished_incomplete",
  "recipients": [],
  "read": [],
  "channel": "web",
  "order_number": 82341,
  "motivo": "Falta SKU 45012 (Casco azul) — cantidad pedida 10, encontrada 0",
  "created_at": "2026-07-16T18:00:00.000Z",
  "created_by": "LygwO9qn5KfPqO295bWI04qTkn93",
  "created_by_name": "Manuel picker"
}
```

#### 2.6.2 Continuar pese a SKU diferente

```json
{
  "message": "Se continuó el picking del pedido #82341 aunque hay SKUs diferentes",
  "type": "picking_continued_with_mismatch",
  "recipients": [],
  "read": [],
  "channel": "web",
  "order_number": 82341,
  "motivo": "Se continuó con el picking de #82341 aunque el SKU 45012 difiere (pedido: Casco azul / físico: Casco negro)",
  "created_at": "2026-07-16T18:05:00.000Z",
  "created_by": "LygwO9qn5KfPqO295bWI04qTkn93",
  "created_by_name": "Manuel picker"
}
```

---

### 2.7 Pedido recuperado

```json
{
  "message": "El pedido #82341 fue recuperado y ya no está en tu cola",
  "type": "order_recovered",
  "recipients": [
    {
      "uid": "LygwO9qn5KfPqO295bWI04qTkn93",
      "name": "Manuel picker",
      "created": "2026-07-16T19:00:00.000Z"
    }
  ],
  "read": [],
  "channel": "app",
  "order_number": 82341,
  "motivo": "Reasignación urgente por prioridad de cliente",
  "created_at": "2026-07-16T19:00:00.000Z",
  "created_by": "ZwzLSHiulAaYsDy1Z3Vsb6NXmDw2",
  "created_by_name": "administrador"
}
```

---

### 2.8 Pedido anulado

```json
{
  "message": "El pedido #82341 fue anulado",
  "type": "order_annulled",
  "recipients": [
    {
      "uid": "LygwO9qn5KfPqO295bWI04qTkn93",
      "name": "Manuel picker",
      "created": "2026-07-16T19:30:00.000Z"
    }
  ],
  "read": [],
  "channel": "app",
  "order_number": 82341,
  "motivo": "Pedido duplicado en Profit",
  "created_at": "2026-07-16T19:30:00.000Z",
  "created_by": "ZwzLSHiulAaYsDy1Z3Vsb6NXmDw2",
  "created_by_name": "administrador"
}
```

---

## 3. Tipos de notificación (`type`)

| `type` | Nombre corto | Dirección | `channel` | `recipients` |
|--------|--------------|-----------|-----------|--------------|
| `order_assigned` | Pedido asignado | Web → App | `app` | maps concretos |
| `order_accepted` | Pedido aceptado | App → Web | `web` | **`[]`** |
| `order_rejected` | Pedido rechazado (web) | App → Web | `web` | **`[]`** |
| `order_rejected_to_chief` | Rechazo al jefe | App → App | `app` | map del jefe |
| `order_updated` | Pedido actualizado | Backend → Web **y** App | `web` + `app` (2 docs) | Web: **`[]`** / App: asignados |
| `picking_finished_incomplete` | Picking incompleto | App → Web | `web` | **`[]`** |
| `picking_continued_with_mismatch` | Picking con SKU diferente | App → Web | `web` | **`[]`** |
| `order_recovered` | Pedido recuperado | Web → App | `app` | maps concretos |
| `order_annulled` | Pedido anulado | Web → App | `app` | maps concretos |

### Constante sugerida (TypeScript)

```ts
export const NOTIFICATION_TYPES = {
  ORDER_ASSIGNED: 'order_assigned',
  ORDER_ACCEPTED: 'order_accepted',
  ORDER_REJECTED: 'order_rejected',
  ORDER_REJECTED_TO_CHIEF: 'order_rejected_to_chief',
  ORDER_UPDATED: 'order_updated',
  PICKING_FINISHED_INCOMPLETE: 'picking_finished_incomplete',
  PICKING_CONTINUED_WITH_MISMATCH: 'picking_continued_with_mismatch',
  ORDER_RECOVERED: 'order_recovered',
  ORDER_ANNULLED: 'order_annulled',
} as const
```

---

## 4. Resumen rápido para la app (crear docs)

| Si creas desde la app… | `channel` | `recipients` | `read` |
|------------------------|-----------|--------------|--------|
| Aviso a la **web** | `"web"` | `[]` | `[]` |
| Aviso a **jefe / picker** | `"app"` | `[{ uid, name, created }, …]` | `[]` |
| Actualización Profit | **2 docs** | web `[]` / app con asignados | `[]` en ambos |

---

## 5. Notas de implementación

1. **No inventar UIDs de admins web.** App → Web = `recipients: []`.
2. **`recipients` = a quién le llega; `read` = quién ya la vio.** Misma forma de map.
3. **Leído es por persona:** `arrayUnion` en `read` con `{ uid, name, created }`.
4. **`order_rejected` + `order_rejected_to_chief`:** pueden coexistir.
5. **`order_updated`:** dos documentos (web broadcast + app dirigida).
6. **Colección:** `notifications`.

---

## 6. Checklist al crear (app / función)

- [ ] `type` de la tabla §3  
- [ ] Si es App → Web: `channel: "web"`, `recipients: []`  
- [ ] Si es para app: `channel: "app"` y `recipients` con al menos un `{ uid, name, created }`  
- [ ] `read: []` al crear  
- [ ] `order_number` si aplica  
- [ ] `motivo` si es rechazo / picking / anulación / recuperación  
- [ ] `created_by` / `created_by_name` del actor  

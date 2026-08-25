# Artículos faltantes (`missing_items`) — contrato App ↔ Web

**Proyecto:** Benserca
**Colección:** `lo_orders`
**Fecha:** Agosto 2026
**Audiencia:** app móvil (picker) + web dashboard
**Relacionado:** [`order_pause.md`](order_pause.md) (pausa), [`notifications.md`](notifications.md)

Un picker está armando un pedido y descubre que **no hay suficiente stock** de un renglón:
el pedido pide 40 unidades y en almacén hay 15. Hoy la única salida es pausar el pedido y
quedarse esperando. Este documento define el flujo nuevo: **reportar el faltante y seguir
trabajando** mientras la oficina resuelve desde la web.

---

## 1. Resumen del flujo

```
Picker en "En proceso"
  │
  ├─ Toca "Reportar faltante" en un renglón de la lista de artículos
  │     → se abre el modal de pausa, motivo fijo "falta de artículo"
  │     → marca el renglón e ingresa CUÁNTO HAY (ej. 15 de 40)
  │
  ├─ Elige una de dos salidas:
  │
  │   (A) "Pausar"            → is_paused = true, status NO cambia
  │                             entrada de timeline (flujo de order_pause.md)
  │                             el picker se libera y puede tomar otro pedido
  │
  │   (B) "Continuar picking" → has_missing_items = true, status NO cambia
  │                             SIN timeline, SIN is_paused
  │                             el picker sigue ocupado y sigue armando
  │                             ← este es el estado "POR PAUSAR"
  │
  └─ La web ve el faltante en su dashboard y ACTUALIZA EL PEDIDO
        → cambia cantidad y/o SKU en original_skus
        → limpia el faltante (has_missing_items = false)
        → notificación order_updated al picker
        → el picker entra, ve la versión nueva y ajusta lo que ya tenía armado
```

> **El `status` NUNCA cambia en todo este flujo.** Ni al reportar, ni al pausar, ni al
> resolver. Sigue siendo el operativo (`"En proceso"`). Ver §4.

---

## 2. Modelo

### Campos nuevos en `lo_orders`

| Campo | Tipo | Rol |
|-------|------|-----|
| `missing_items` | `array<map>` | Faltantes reportados. `[]` si no hay. |
| `has_missing_items` | `boolean` | **Fuente de verdad.** `true` si hay al menos uno sin resolver. Consultable (`where`). |
| `status` | `string` | **No cambia.** Sigue siendo el operativo. |

### ¿Por qué `has_missing_items` si ya está el array?

Misma razón que existe `is_paused`: **Firestore no puede filtrar dentro de un array de maps.**
Sin la bandera plana, la web no puede hacer
`where('has_missing_items','==',true)` para listar los pedidos que necesitan atención.

### Al crear el pedido (web → almacén)

```json
{ "missing_items": [], "has_missing_items": false }
```

Documentos viejos sin los campos: tratar como `[]` / `false`.

---

## 3. Estructura de `missing_items[]`

```json
{
  "status": "En proceso",
  "has_missing_items": true,
  "missing_items": [
    {
      "line_index": 3,
      "sku": "CH-180414350003",
      "description": "CASCO FRANKIE SOLIDO, INTEGRAL, TALLA: XL",

      "required_qty": 40,
      "available_qty": 15,
      "missing_qty": 25,

      "marked_by_uid": "3yqJoLHFwOSQePWzY9CfLSo3typ2",
      "marked_by_name": "Cesar Picker",
      "marked_at": "2026-08-25T18:05:00.000Z",

      "resolution": "pending",
      "resolved_by_uid": null,
      "resolved_by_name": null,
      "resolved_at": null,
      "resolution_note": null
    }
  ]
}
```

### Campos

| Campo | Tipo | Escribe | Descripción |
|-------|------|---------|-------------|
| `line_index` | `number` | App | **Identidad del renglón.** Posición en `original_skus`. |
| `sku` | `string` | App | SKU del renglón (redundante, para que la web muestre sin cruzar arrays). |
| `description` | `string` | App | Descripción del artículo (ídem). |
| `required_qty` | `number` | App | Lo que pide el pedido (40). |
| `available_qty` | `number` | App | **Lo que hay en almacén** (15). Lo ingresa el picker. |
| `missing_qty` | `number` | App | La resta: `required_qty - available_qty` (25). Se calcula **una vez**, al marcar. |
| `marked_by_uid` / `marked_by_name` | `string` | App | Quién reportó. |
| `marked_at` | `string` (ISO) | App | Cuándo. |
| `resolution` | `"pending" \| "approved" \| "rejected"` | Web | Estado. Nace en `pending`. |
| `resolved_by_uid` / `resolved_by_name` | `string \| null` | Web | Quién resolvió. |
| `resolved_at` | `string` (ISO) `\| null` | Web | Cuándo. |
| `resolution_note` | `string \| null` | Web | Nota libre de la oficina. |

### ⚠️ Por qué `line_index` y NO solo `sku`

**Profit repite el mismo SKU en varios renglones y no manda ningún id propio: la posición
es la identidad.** La app ya lo resuelve así en el mapper
([`orders.mapper.ts:170`](src/features/picking/services/orders.mapper.ts:170)) y `final_skus`
ya usa `line_index`.

Esto no es teórico: en el pedido real **84369** el SKU `CH-180414350003` fue marcado como
faltante **3 veces** con el campo viejo `missing_skus` (que solo guarda strings), y hoy **no
hay forma de saber a qué renglón se refería cada una**.

### `has_missing_items` se deriva así

```
has_missing_items = missing_items.some(i => i.resolution === 'pending')
```

Los items ya resueltos **se conservan** en el array como histórico (no se borran). Como el
flujo de "Continuar picking" no escribe timeline, este array es el **único registro** de que
hubo un faltante — borrarlo dejaría el pedido sin rastro alguno.

---

## 4. El estado «Por pausar» — por qué NO es un `status`

El estado *«reportó un faltante pero sigue trabajando»* se representa con **la combinación de
dos booleanos**, no con un valor nuevo de `status`.

| `has_missing_items` | `is_paused` | Situación | Etiqueta a mostrar |
|:---:|:---:|---|---|
| `false` | `false` | Trabajando normal | *(el status operativo)* |
| **`true`** | **`false`** | **Reportó faltante y sigue armando** | **Por pausar** |
| `true` | `true` | Reportó faltante y pausó | Pausado |
| `false` | `true` | Pausó por otro motivo | Pausado |

**El `status` no se toca nunca.** Sigue en `"En proceso"` (o el operativo que sea) durante
todo el flujo.

### Por qué

Es el mismo razonamiento que ya está escrito en [`order_pause.md`](order_pause.md) §2 para
justificar que la pausa sea `is_paused` y no `status = "Pausa"`:

> cambiar `status` a `"Pausa"` rompería toda la lógica que depende del estatus (colas,
> auditoría, reconstrucción de bultos, edición). Manteniéndolo operativo, la pausa es un flag
> **ortogonal**.

En el código hay **27 chequeos sobre `status === 'in_progress'` repartidos en 15 archivos**.
Con un status nuevo, todos responderían "no" y la feature se rompería a sí misma. El más
grave, [`picking-detail.screen.tsx:130`](src/features/picking/screens/picking-detail.screen.tsx:130):

```ts
const isEditable = order.status === 'in_progress' || order.status === 'rejected_review';
```

Con un status `por_pausar`, `isEditable` da `false` y **el botón "Continuar picking" no
dejaría continuar el picking**. Con el booleano, los 27 chequeos siguen viendo `in_progress`
y todo sigue funcionando sin tocar una línea.

> **Para la web:** si necesitás mostrar "Por pausar" en una columna o filtrar por ese estado,
> se deriva de los dos booleanos según la tabla de arriba. La información es idéntica; solo
> cambia de qué campo se lee.

### Los dos booleanos conviven

Este es el caso central que motivó la feature:

```
1. Picker reporta faltante y elige "Continuar picking"
      → has_missing_items: true, is_paused: false, status: "En proceso"
      → sigue armando el pedido                        ← estado "POR PAUSAR"

2. Termina de armar todo y la web todavía no resolvió
      → NO puede finalizar (§6.4). Solo le queda "Pausar"

3. Pausa
      → has_missing_items: true, is_paused: true, status: "En proceso"
      → el picker se libera y toma otro pedido

4. La web resuelve
      → has_missing_items: false
        is_paused: SIGUE EN true  ← la web no lo toca

5. El picker vuelve al pedido y lo reanuda a mano
      → is_paused: false
```

### Diferencia entre los dos flags

| | `has_missing_items` | `is_paused` |
|---|---|---|
| Cambia `status` | No | No |
| Escribe timeline | **No** | Sí |
| El picker sigue armando | **Sí** | No |
| El picker queda libre para otro pedido | **No** | Sí |
| Puede finalizar el pedido | **No** | No |
| Quién lo quita | La web, al actualizar | Cualquier rol que ve el pedido |

### Impacto en el código: cero status nuevos

No hay que tocar `OrderStatus`, ni `STATUS_TO_FIRESTORE`
([`orders.service.ts:8`](src/features/picking/services/orders.service.ts:8)), ni `mapStatus`
([`orders.mapper.ts:61`](src/features/picking/services/orders.mapper.ts:61)), ni
`ACTIVE_ORDER_STATUSES`
([`derive-picker-activity.ts:27`](src/features/warehouse/utils/derive-picker-activity.ts:27)).
El picker sigue contando como ocupado porque su pedido sigue en `in_progress`.

---

## 5. Operaciones

### A) Reportar faltante + "Continuar picking" (app)

```
update({
  has_missing_items: true,
  missing_items: arrayUnion({ line_index, sku, description,
                              required_qty, available_qty, missing_qty,
                              marked_by_uid, marked_by_name, marked_at,
                              resolution: "pending",
                              resolved_by_uid: null, resolved_by_name: null,
                              resolved_at: null, resolution_note: null }),
  updated_at: now()
})
```
- **No** escribe timeline.
- **No** toca `status` ni `is_paused`.
- **No** libera al picker (su pedido sigue en `in_progress` = ocupado).

### B) Reportar faltante + "Pausar" (app)

Hace **las dos cosas**: el faltante nuevo **y** la pausa del flujo existente.

```
update({
  is_paused: true,
  has_missing_items: true,
  missing_items: arrayUnion({ ...igual que arriba... }),
  timeline: arrayUnion({ status: "Pausa", reason: "falta_articulo",
                         missing_skus: [...],   // ← DEPRECADO, ver §7
                         user_uid, user_name, user_role, note, timestamp }),
  updated_at: now()
})
```
- `status` **no cambia** (sigue "En proceso"), según [`order_pause.md`](order_pause.md).
- El picker se libera y puede tomar otro pedido.

### C) Resolver el faltante (web)

La web hace **un solo update** que deja el pedido listo para seguir:

```
update({
  original_skus: [...],          // cantidad y/o SKU corregidos del renglón
  has_missing_items: false,      // ← saca el estado "Por pausar"
  missing_items: [ ...con resolution: "approved"/"rejected" y resolved_* llenos... ],
  updated_at: now()
})
```
- **No** toca `status` (nunca cambió).
- **No** toca `is_paused` (si el picker había pausado, lo reanuda él).
Y emite la notificación **`order_updated`** (ya existe, ver
[`notifications.md:471`](notifications.md:471) — la app ya la escucha, no hay tipo nuevo).

> Si el pedido estaba **pausado** (caso B), la web **no** toca `is_paused`: el picker lo
> reanuda a mano cuando vuelva al pedido.

---

## 6. Reglas de negocio

1. **El input de "cuánto hay" acepta de `0` a `required_qty - 1`.**
   `0` = no hay nada de ese SKU. El tope es `required-1` porque si hay 40 de 40 no es faltante.

2. **Un faltante por renglón.** No se puede reportar dos veces el mismo `line_index` mientras
   uno esté `pending`.

3. **Una vez reportado, el picker NO puede editarlo ni quitarlo.** Solo la web lo resuelve.
   → La UI debe pedir confirmación clara antes de enviar, porque no hay vuelta atrás.

4. **Con un faltante `pending`, el pedido NO se puede finalizar.**
   El botón "Empaquetado" queda bloqueado. La única salida es **Pausar**
   (→ `is_paused: true`, se libera para otro pedido).
   Por eso, cuando el pedido ya tiene un faltante pendiente, la hoja habilita
   "Pausar pedido" **sin necesidad de marcar nada nuevo**: si no, el picker que
   ya reportó y terminó de armar se quedaría sin salida.

10. **Estando pausado no se puede reportar un faltante.** El botón desaparece de
    los renglones mientras `is_paused` sea true: la única acción es Reanudar.

5. **Los 2 botones ("Pausar" / "Continuar picking") solo aparecen con motivo
   `falta_articulo`.** Con `cambio_prioridad` solo sale "Pausar" (no tiene sentido seguir
   pickeando un pedido despriorizado).

6. **La app no reconcilia nada cuando la web actualiza el pedido.** Es trabajo del picker
   revisar y corregir lo que ya llevaba armado. Ver §8.

7. **Se pueden reportar varios renglones a la vez.** El modal permite marcar N renglones y
   pide un input de cantidad **por cada uno**. Se genera un item de `missing_items` por
   renglón marcado, todos en el mismo update.

8. **La web puede resolverlos de a uno.** `has_missing_items` solo pasa a `false` cuando
   **ninguno** queda en `pending`. Mientras quede uno, el pedido sigue en "Por pausar" y
   sigue sin poder finalizarse.

9. **`progress_percentage` queda viejo tras un update de la web.** El valor guardado se
   calculó contra las cantidades anteriores (40) y la app lo recalcula al abrir el pedido
   contra las nuevas (15). La web no necesita recalcularlo.

---

## 7. `missing_skus` del timeline queda DEPRECADO

El campo viejo `missing_skus` (dentro de la entrada de timeline de la pausa) es un
`string[]` sin cantidades y sin `line_index`. Se sigue escribiendo **solo por compatibilidad**
mientras la web migre.

| | `missing_skus` (viejo) | `missing_items` (nuevo) |
|---|---|---|
| Dónde vive | Dentro de una entrada de `timeline` | Campo top-level del documento |
| Qué guarda | Solo SKUs | SKU + renglón + cantidades + resolución |
| Editable | ❌ (`timeline` es append-only) | ✔ (la web lo actualiza) |
| Consultable | ❌ | ✔ vía `has_missing_items` |
| Sobrevive al despausar | ❌ (solo se lee si `is_paused`) | ✔ |

**La web debe migrar a `missing_items`.** Cuando lo haga, se saca `missing_skus` de la app.

---

## 8. ⚠️ Riesgo: el id de renglón depende del SKU

Este es el punto más delicado de todo el cambio.

El id de un renglón se construye así ([`order-snapshot.ts:25`](src/features/picking/utils/order-snapshot.ts:25)):

```ts
export function makeLineId(sku: string, index: number): string {
  return `${sku}#${index}`;
}
```

Los items dentro de los bultos apuntan al renglón por ese `lineId`.

**Si la web cambia el SKU del renglón 3**, el id pasa de `SKU-VIEJO#3` a `SKU-NUEVO#3`, y
todo lo que el picker ya había metido en bultos queda **huérfano**:

- `getAssignedQtyForLine` devuelve **0** para el renglón nuevo → la app dice que no armó nada.
- `buildFinalSkus` recorre los renglones y **no encuentra** los items huérfanos
  ([`order-snapshot.ts:132`](src/features/picking/utils/order-snapshot.ts:132)) → **al
  empaquetar, esas unidades desaparecen de `final_skus`**. El picker las tiene físicamente en
  el bulto pero el sistema no las registra.

### Mitigación (obligatoria en la implementación)

1. **Detectar** items de bulto cuyo `lineId` no corresponde a ningún renglón actual.
2. **Mostrarlos** marcados en el bulto con un aviso ("este artículo cambió en el pedido"),
   nunca ocultarlos ni borrarlos en silencio.
3. **Bloquear "Empaquetado"** mientras queden huérfanos, para que el picker los saque o
   los vuelva a agregar contra el renglón nuevo.

También hay que revisar `snapshotOriginal`: el store prioriza la copia local
(`local.snapshotOriginal ?? firestoreOrder.snapshotOriginal`,
[`orders.store.ts:159`](src/features/picking/store/orders.store.ts:159)) y esa copia se
congela al iniciar el picking ([`order-actions.ts:42`](src/features/picking/domain/order-actions.ts:42)).
Tras un update de la web, el snapshot local queda **viejo** y hay que invalidarlo.

---

## 9. Se descarta la sustitución de artículos

La hoja de sustitución está **deshabilitada** desde hace tiempo
([`picking-detail.screen.tsx:555`](src/features/picking/screens/picking-detail.screen.tsx:555)):

```ts
// Sustitución deshabilitada temporalmente (a pedido del negocio).
const canSubstitute = false;
```

El flujo nuevo la reemplaza: el picker **no propone un sustituto**, solo reporta cuánto hay y
la web decide.

**Se borra:**
- `src/features/picking/components/substitute-item-sheet.tsx` (392 líneas)
- `src/features/picking/hooks/use-substitute-articulos.ts`
- Claves i18n `picking.substitute.*` (es/en)
- Estilos `substituteBtn` / `substituteText` y el estado `substituteLine`
- El parámetro `{ originalSku, substitutionNote }` de `commitAddItems` y `isItemSubstituted`

**NO se toca:** los campos `substituted` y `substitution_note` de `final_skus`. Se siguen
escribiendo (`false` / `null`) porque la web probablemente los lee y sacarlos podría romper
auditoría o reportes.

---

## 10. TypeScript de referencia

```ts
export type MissingItemResolution = 'pending' | 'approved' | 'rejected';

export interface MissingItem {
  /** Posición en original_skus. Es la identidad del renglón (Profit no manda id). */
  lineIndex: number;
  sku: string;
  description: string;
  requiredQty: number;
  /** Cuánto hay realmente en almacén. Lo ingresa el picker (0 … requiredQty - 1). */
  availableQty: number;
  /** requiredQty - availableQty. Se calcula al marcar y no se recalcula. */
  missingQty: number;
  markedByUid: string;
  markedByName: string;
  markedAt: string;
  /** Lo maneja la web. */
  resolution: MissingItemResolution;
  resolvedByUid: string | null;
  resolvedByName: string | null;
  resolvedAt: string | null;
  resolutionNote: string | null;
}

// En Order:
missingItems: MissingItem[];    // [] si no hay
hasMissingItems: boolean;

// OrderStatus NO cambia: no se agrega ningún valor nuevo.
```

---

## 11. Referencia rápida para la web

**Leer:**
- ¿Tiene faltantes sin resolver? → `doc.has_missing_items === true`
- Detalle → `doc.missing_items.filter(i => i.resolution === 'pending')`
- ¿Está en "Por pausar"? → `has_missing_items === true && is_paused === false`
- ¿Está pausado de verdad? → `doc.is_paused === true` (ver [`order_pause.md`](order_pause.md))

**Escribir al resolver:** un solo update con `original_skus` corregido +
`has_missing_items: false` + `missing_items` con `resolution` y `resolved_*` llenos.
**Sin tocar `status` ni `is_paused`.** Emitir `order_updated`.

**Campos nuevos que la web debe soportar:** `missing_items` (array top-level),
`has_missing_items` (boolean). **`status` no suma valores nuevos.**

---

## 12. Decisiones tomadas

| # | Decisión |
|---|----------|
| 1 | Con un faltante `pending` **no se puede finalizar** el pedido; solo pausarlo. |
| 2 | Al resolver, **la web reescribe el pedido**; la app no calcula requeridos efectivos. |
| 3 | **La web** limpia el faltante (`has_missing_items: false`) al resolver. |
| 4 | En "Por pausar" el picker **sigue ocupado**. |
| 5 | "Por pausar" **no escribe timeline**. |
| 6 | El input acepta **0 … required-1**. |
| 7 | El faltante reportado **no se puede editar ni desmarcar** desde la app. |
| 8 | Se escriben **los dos**: `missing_items` (nuevo) y `missing_skus` (viejo, deprecado). |
| 9 | Los 2 botones solo con motivo **`falta_articulo`**. |
| 10 | **Sin notificación nueva**: alcanza con `order_updated`, que ya existe. |
| 11 | `substituted` / `substitution_note` **se quedan** en el schema de `final_skus`. |
| 12 | "Por pausar" es **`has_missing_items` + `is_paused`**, NO un `status` nuevo (§4). |

# Benserca — Schema del documento Pedido (Firestore)
**Colección:** `pedidos`  
**Última actualización:** Junio 2026

---

## Documento vacío (estructura base)

```json
{
  "id": "",
  "order_number": "",
  "profit_order_id": "",

  "client_id": "",
  "client_name": "",
  "client_address": "",
  "client_zone": "",
  "client_city": "",

  "status": "",
  "progress_percentage": 0,
  "queue_position": 0,

  "created_at": null,
  "updated_at": null,
  "assigned_at": null,
  "picking_started_at": null,
  "picking_finished_at": null,
  "packed_at": null,
  "wrapped_at": null,
  "audited_at": null,
  "dispatched_at": null,

  "assigned_to": {
    "type": "",
    "uid": "",
    "name": ""
  },

  "team": {
    "chief_uid": "",
    "chief_name": "",
    "pickers": []
  },

  "bundles_defined": 0,
  "bundles_created": 0,
  "extra_bundles_flag": false,

  "original_skus": [],

  "final_skus": [],

  "linked_ids": {
    "delivery_note_number": null,
    "delivery_note_id": null,
    "invoice_number": null,
    "invoice_id": null,
    "guide_number": null,
    "guide_id": null
  },

  "audit": {
    "audited_by_uid": null,
    "audited_by_name": null,
    "result": null,
    "observation": null,
    "audited_at": null
  },

  "timeline": []
}
```

---

## Estructura de `final_skus`

Se va armando **durante el picking** en la app (estado local). En Firestore solo se persisten los bultos **cerrados** en cada guardado parcial (25/50/75/100%) y en el guardado final al **Finalizar picking**.

Un registro por `original_sku`. Si el mismo SKU está en varios bultos, usa el array `bundles`:

```json
{
  "original_sku": "0201010020007",
  "original_quantity": 10,
  "packed_sku": "0201010020007",
  "packed_quantity": 9,
  "difference": 1,
  "substituted": false,
  "substitution_note": null,
  "bundles": [
    { "bundle_num": 1, "quantity": 5 },
    { "bundle_num": 2, "quantity": 4 }
  ]
}
```

### Reglas de `difference`

| Situación | Cálculo |
|---|---|
| Mismo SKU, cantidad incompleta | `original_quantity - packed_quantity` |
| Mismo SKU, cantidad completa | `0` |
| SKU sustituido | `original_quantity` (siempre el total pedido del SKU original) |

Ejemplo sustitución: pidieron 10 cascos rojos, enviaron 10 cascos azules → `substituted: true`, `difference: 10`.

---

## Documento de ejemplo (datos reales)

```json
{
  "id": "pedido_20260609_001",
  "order_number": "240136",
  "profit_order_id": "PF-2026-04424",

  "client_id": "CLI-001",
  "client_name": "Distribuidora Los Andes C.A.",
  "client_address": "Av. Principal, Local 4, Edificio Centro",
  "client_zone": "Capital",
  "client_city": "Caracas",

  "status": "En proceso",
  "progress_percentage": 60,
  "queue_position": 1,

  "created_at": "2026-06-09T08:00:00Z",
  "updated_at": "2026-06-09T09:30:00Z",
  "assigned_at": "2026-06-09T08:15:00Z",
  "picking_started_at": "2026-06-09T09:00:00Z",
  "picking_finished_at": null,
  "packed_at": null,
  "wrapped_at": null,
  "audited_at": null,
  "dispatched_at": null,

  "assigned_to": {
    "type": "picker",
    "uid": "usr_carlos_mendez",
    "name": "Carlos Méndez"
  },

  "team": {
    "chief_uid": null,
    "chief_name": null,
    "pickers": []
  },

  "bundles_defined": 5,
  "bundles_created": 3,
  "extra_bundles_flag": false,

  "original_skus": [
    {
      "sku": "0101010040015",
      "description": "Aceite de Motor 1L",
      "quantity": 12,
      "unit": "UN",
      "weight": 1.0,
      "volume": 0.001,
      "category": "Lubricantes",
      "brand": "Castrol"
    },
    {
      "sku": "0201010020007",
      "description": "Casco Azul Talla M",
      "quantity": 9,
      "talla": "M",
      "unit": "UN",
      "weight": 0.35,
      "volume": 0.008,
      "category": "Seguridad",
      "brand": "3M"
    },
    {
      "sku": "0201010020008",
      "description": "Casco Verde Talla S",
      "quantity": 12,
      "talla": "S",
      "unit": "UN",
      "weight": 0.35,
      "volume": 0.008,
      "category": "Seguridad",
      "brand": "3M"
    },
    {
      "sku": "0201010020009",
      "description": "Guantes de Trabajo",
      "quantity": 10,
      "unit": "PAR",
      "weight": 0.05,
      "volume": 0.0002,
      "category": "Seguridad",
      "brand": "Honeywell"
    }
  ],

  "final_skus": [
    {
      "original_sku": "0101010040015",
      "original_quantity": 12,
      "packed_sku": "0101010040015",
      "packed_quantity": 12,
      "difference": 0,
      "substituted": false,
      "substitution_note": null,
      "bundles": [
        { "bundle_num": 1, "quantity": 12 }
      ]
    },
    {
      "original_sku": "0201010020007",
      "original_quantity": 9,
      "packed_sku": "0201010020010",
      "packed_quantity": 9,
      "difference": 9,
      "substituted": true,
      "substitution_note": "No había existencia de Casco Azul M, se sustituyó por Casco Azul L (mismo modelo)",
      "bundles": [
        { "bundle_num": 2, "quantity": 9 }
      ]
    },
    {
      "original_sku": "0201010020008",
      "original_quantity": 12,
      "packed_sku": "0201010020008",
      "packed_quantity": 10,
      "difference": 2,
      "substituted": false,
      "substitution_note": null,
      "bundles": [
        { "bundle_num": 2, "quantity": 6 },
        { "bundle_num": 3, "quantity": 4 }
      ]
    },
    {
      "original_sku": "0201010020009",
      "original_quantity": 10,
      "packed_sku": "0201010020009",
      "packed_quantity": 10,
      "difference": 0,
      "substituted": false,
      "substitution_note": null,
      "bundles": [
        { "bundle_num": 3, "quantity": 10 }
      ]
    }
  ],

  "linked_ids": {
    "delivery_note_number": null,
    "delivery_note_id": null,
    "invoice_number": null,
    "invoice_id": null,
    "guide_number": null,
    "guide_id": null
  },

  "audit": {
    "audited_by_uid": null,
    "audited_by_name": null,
    "result": null,
    "observation": null,
    "audited_at": null
  },

  "timeline": [
    {
      "status": "Nuevo",
      "timestamp": "2026-06-09T08:00:00Z",
      "user_uid": "system",
      "user_name": "Sistema",
      "note": "Pedido recibido desde Profit"
    },
    {
      "status": "Asignado",
      "timestamp": "2026-06-09T08:15:00Z",
      "user_uid": "usr_gerente_almacen",
      "user_name": "Pedro Gómez",
      "note": "Asignado a Carlos Méndez. Bultos definidos: 5"
    },
    {
      "status": "En proceso",
      "timestamp": "2026-06-09T09:00:00Z",
      "user_uid": "usr_carlos_mendez",
      "user_name": "Carlos Méndez",
      "note": null
    }
  ]
}
```

---

## Referencia rápida de estatus

| Estatus | Descripción |
|---|---|
| Nuevo | Llegó de Profit, sin asignar |
| Asignado | Asignado a picker o jefe de almacén |
| En proceso | Picker armando bultos activamente |
| Empaquetado | Picker finalizó el picking (botón "Finalizar picking") |
| Auditado | Chequeador aprobó (obligatorio, antes del embalaje) |
| Embalado | Picker confirmó embalaje físico (solo tras la aprobación del chequeador) |
| Rechazado | Chequeador rechazó, vuelve a Empaquetado |
| Despachado | Salió en una guía |

---

## Progreso y guardados parciales

### Cálculo de `progress_percentage`

```
progress_percentage = (bultos_cerrados / bundles_defined) × 100
```

- Solo cuentan bultos **cerrados** (con al menos un SKU).
- Tope máximo: **100%** (aunque haya bultos extra).
- Reabrir un bulto cerrado **baja** el porcentaje.

### Hitos de guardado

| Progreso alcanzado | Acción |
|---|---|
| 25% | Guardado parcial a Firestore |
| 50% | Guardado parcial a Firestore |
| 75% | Guardado parcial a Firestore |
| 100% | Guardado parcial a Firestore (**no cierra el pedido**) |
| Finalizar picking | Guardado final + `status: Empaquetado` |

- En cada guardado se envía `final_skus` con **solo bultos cerrados**, `progress_percentage` y `bundles_created`.
- Si no hay internet en un hito, se guarda en el siguiente hito alcanzado o al finalizar.
- Tras llegar al 100%, si se abren bultos extra el próximo guardado es al **Finalizar picking**.
- Al **Finalizar picking** se reenumera `bundle_num` sin huecos y se corrige `final_skus`.

### Estado local vs Firestore

| Dato | Local (app) | Firestore |
|---|---|---|
| Bultos abiertos/cerrados | Sí | No |
| SKUs en bultos abiertos | Sí (en `final_skus` local) | No |
| SKUs en bultos cerrados | Sí | Sí (en guardados parciales y final) |
| `progress_percentage` | Sí | Sí (en cada guardado) |
| `bundles_created` | Sí | Sí (en cada guardado) |

---

## Notas importantes

- `original_skus` es un snapshot inmutable — nunca se modifica después de creado. **No lleva `bundle_num`.**
- **`units_per_bundle` fue eliminado** del schema. Ya no existe capacidad de bulto ni fracción; el picker decide cuánto entra en cada bulto (limitado solo por la cantidad pendiente del pedido).
- **`talla`** (opcional) es la única dimensión de sustitución: un SKU solo puede sustituirse por otro de la **misma talla**; si no tiene `talla`, no es sustituible. *(Formato exacto del campo por confirmar con Profit.)*
- `final_skus` se va armando durante el picking en local; en Firestore solo incluye bultos cerrados.
- `packed_quantity` = suma de `bundles[].quantity` del SKU.
- `difference` por SKU: si `substituted = true` → `difference = original_quantity`; si no → `original_quantity - packed_quantity`.
- `bundles_created` se actualiza en cada guardado (parcial y final) con la cantidad de bultos cerrados al momento del guardado.
- `extra_bundles_flag` se activa automáticamente si `bundles_created > bundles_defined`.
- `bundle_num` se asigna secuencialmente al abrir cada bulto; al eliminar un bulto se **renumeran** en local; la numeración definitiva se corrige al **Finalizar picking**.
- `timeline` es append-only — nunca se modifica, solo se agregan entradas.
- `queue_position` indica la posición en la cola del picker (1 = siguiente en trabajar).

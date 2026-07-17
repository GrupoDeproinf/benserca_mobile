# Benserca — Instrucciones Móvil v2
**Desarrollador:** Manuel  
**Plataforma:** Mobile  
**Stack base:** Dimassi (adaptar)  
**Base de datos:** Firestore (tiempo real)  
**Semana 1:** UI con datos mockeados, sin conexión a Firebase

---

## Contexto del proyecto

Benserca es una plataforma de gestión logística y distribución. La app móvil es exclusivamente para el personal de almacén: pickers, jefe de almacén y chequeadores. Los conductores NO tienen app móvil, las entregas se gestionan desde la web.

> **Nota de terminología:** el rol antes llamado *Auditor* ahora se llama **Chequeador** (cambio visual; internamente el rol sigue identificándose como `auditor`).

La app debe funcionar en tiempo real. Cualquier cambio de estatus debe reflejarse inmediatamente sin necesidad de refrescar.

---

## Roles con acceso móvil

| Rol | Acceso |
|---|---|
| Picker | Ver pedidos asignados, armar bultos, embalar |
| Jefe de almacén | Crear teams, supervisar pickers, ver estado del almacén en tiempo real |
| Chequeador | Revisar y aprobar/rechazar pedidos empaquetados (**obligatorio para todos los pedidos**) |

---

## Ciclo de vida del pedido

| # | Estatus | Quién lo genera | Plataforma |
|---|---|---|---|
| 1 | Nuevo | Sistema (Profit) | — |
| 2 | Asignado | Gerente de almacén | Web |
| 3 | En proceso | Picker | Móvil |
| 4 | Empaquetado | Picker (Finalizar picking) | Móvil |
| 5 | Auditado | Chequeador (**obligatorio**) | Móvil |
| 6 | Embalado | Picker (solo tras aprobación del chequeador) | Móvil |
| 7 | Rechazado | Chequeador → vuelve a Empaquetado | Móvil |
| 8 | Despachado | Por definir con cliente | — |

---

## Pantallas y flujos

### 1. Login
- Email y contraseña
- Firebase Auth
- Redirige según rol al autenticar:
  - Picker → Mis pedidos
  - Jefe de almacén → Gestión de equipos / Estado del almacén
  - Chequeador → Cola de chequeo
- **Semana 1:** usuarios mock fijos por rol, sin Firebase Auth real

---

### 2. Vista Picker — Mis pedidos

- Lista de pedidos asignados al picker autenticado ordenados por prioridad
- Card por pedido:
  - Número de pedido
  - Cliente
  - Estatus actual
  - Bultos definidos por el gerente
  - Posición en la cola (1, 2, 3...)
  - Fecha de asignación
- Solo puede iniciar el pedido en posición #1 de su cola
- Al tocar un pedido abre el detalle

**Reglas:**
- Solo ve sus propios pedidos
- Solo puede tener un pedido "En proceso" a la vez
- El pedido en proceso siempre aparece fijo en posición 1

---

### 3. Detalle del pedido

- Encabezado: # pedido, cliente, bultos definidos por gerente
- Listado de SKUs con:
  - Descripción del artículo
  - Talla (si aplica; única dimensión de sustitución)
  - Cantidad pedida
  - Cantidad ya asignada a bultos
  - Cantidad pendiente por asignar
- Sección de bultos creados con su contenido
- Barra de progreso del picking (% de bultos cerrados)
- Botones de acción según estatus:
  - **Asignado:** botón "Iniciar picking"
  - **En proceso:** botón "Abrir nuevo bulto" + "Finalizar picking"
  - **Empaquetado:** en chequeo — sin acción para el picker; espera aprobación del chequeador
  - **Auditado:** botón "Marcar como embalado"
  - **Rechazado:** muestra observación del chequeador + botón "Reabrir picking"

---

### 4. Pantalla de picking — Armado de bultos

Esta es la pantalla más importante de la app.

#### Sin límite de capacidad por bulto

> **Cambio importante:** ya **no existe** el campo `units_per_bundle` ("cantidad por bulto") ni el concepto de *fracción de bulto*. El límite de cuánto entra en un bulto **no es calculable** y queda a criterio del picker.

- El picker mete en cada bulto la cantidad que decida, sin tope de capacidad ni alertas de fracción.
- El único límite al agregar un SKU es la **cantidad pendiente del pedido** (no se puede empaquetar más de lo pedido para esa línea).
- El picker puede meter cantidades parciales de un SKU y repartirlo en varios bultos. Ejemplo: de 9 cascos azules puede meter solo 5 en un bulto.

#### Numeración de bultos (`bundle_num`)

- Cada bulto recibe un número secuencial al **abrirlo** (1, 2, 3…).
- Cada SKU pickeado se registra con el `bundle_num` del bulto donde se guardó.
- Un mismo SKU puede aparecer en varios bultos (cantidades parciales).
- Al **eliminar** un bulto, los demás se **renumeran** sin huecos en local.
- La numeración definitiva se corrige al **Finalizar picking** (guardado final).

#### Progreso del picking

```
progress_percentage = (bultos_cerrados / bundles_defined) × 100
```

- Solo cuentan bultos **cerrados** con al menos un SKU.
- Abrir un bulto **no** sube el %.
- Cerrar un bulto → recalcula el %.
- Reabrir un bulto cerrado → **baja** el %.
- Tope máximo: **100%** (aunque haya bultos extra).

#### Guardados parciales a Firestore

| Progreso alcanzado | Acción |
|---|---|
| 25% | Guardado parcial |
| 50% | Guardado parcial |
| 75% | Guardado parcial |
| 100% | Guardado parcial (**no cierra el pedido**) |
| Finalizar picking | Guardado final + cambio de status |

- En cada guardado se envía `final_skus` con **solo bultos cerrados**.
- Si no hay internet en un hito, se guarda en el siguiente hito o al finalizar.
- Tras el 100%, si se abren bultos extra, el próximo guardado es al **Finalizar picking**.

#### Flujo del picking

1. Picker presiona "Iniciar picking" → pedido pasa a "En proceso"
2. Presiona "Abrir nuevo bulto" → se crea Bulto 1 (asigna `bundle_num: 1`)
3. Dentro del bulto:
   - Selecciona un SKU del listado del pedido
   - Ingresa la cantidad a meter (puede ser parcial, hasta la cantidad pendiente del pedido)
   - El SKU se agrega a `final_skus` local con su `bundle_num`
   - Botón "Agregar ítem al bulto"
4. Puede agregar múltiples SKUs al mismo bulto (sin límite de capacidad)
5. Presiona "Cerrar bulto" → bulto queda cerrado (solo si tiene al menos un SKU) → recalcula %
6. Puede reabrir un bulto cerrado si aún tiene fracción disponible → baja el %
7. Repite abriendo más bultos hasta completar todos los SKUs del pedido
8. Presiona "Finalizar picking" → cierra bultos abiertos con ítems, renumera, guarda final y pasa a "Empaquetado"

#### Reglas de bultos vacíos

| Situación | Comportamiento |
|---|---|
| Intentar cerrar bulto sin SKUs | **Bloqueado** |
| Hay un bulto abierto vacío | **No permite** abrir otro bulto |
| Al quitar todos los SKUs y el bulto queda vacío | **Modal**: "Este bulto X quedó vacío" |
| Botones del modal | **Eliminar bulto** o **Agregar artículo** |

#### Casos especiales dentro del picking

**Bultos adicionales:**
- Si el picker crea más bultos de los definidos por el gerente → alerta: "Estás creando más bultos de los definidos (X definidos, Y creados). ¿Deseas continuar?"
- Si confirma → el pedido queda marcado con flag `extra_bundles_flag: true`
- El % se queda en 100%; no hay más guardados por hitos hasta Finalizar picking
- Este flag es visible en la web para el gerente y el auditor

**Sustitución de SKU (solo por talla):**
- Si un artículo no tiene existencia, el picker puede sustituirlo **únicamente por otro artículo de la misma talla** (ej. cascos).
- **Regla dura:** si el SKU original **no tiene campo de talla**, no es sustituible (el botón "Sustituir" no aparece).
- Los candidatos de sustitución se filtran por talla igual a la del original (ya no por familia/categoría/marca).
- Presiona "Sustituir artículo" en el SKU correspondiente
- Busca y selecciona el SKU sustituto (misma talla)
- Ingresa una nota (opcional) explicando el motivo
- El sistema registra: SKU original, SKU sustituto, cantidad, nota, picker y timestamp
- `difference` = `original_quantity` (total pedido del SKU original, porque no se envió nada del original)

> **Pendiente:** el formato exacto del campo de talla que llega desde Profit/Firestore está por definir; el parseo se ajustará cuando se especifique.

**Cierre con faltantes:**
- El picker puede finalizar el pedido aunque no haya asignado el 100% de las cantidades
- Al presionar "Finalizar picking" el sistema valida si hay SKUs con cantidad pendiente
- Si hay faltantes → alerta: "Tienes X unidades de Y artículos sin asignar. ¿Deseas finalizar el pedido con faltantes?"
- Si confirma → pedido finaliza con los faltantes registrados en `difference`

#### Estructura de `final_skus`

Se va armando en local durante el picking. Un registro por `original_sku`:

```
final_skus: [
  {
    original_sku,
    original_quantity,
    packed_sku,           // puede ser diferente si hubo sustitución
    packed_quantity,      // suma de bundles[].quantity
    difference,           // ver reglas abajo
    substituted,          // true/false
    substitution_note,    // obligatorio si substituted = true
    bundles: [
      { bundle_num: 1, quantity: 5 },
      { bundle_num: 2, quantity: 4 }
    ]
  }
]
```

**Reglas de `difference`:**

| Situación | `difference` |
|---|---|
| Mismo SKU, enviaste menos | `original_quantity - packed_quantity` |
| Mismo SKU, enviaste todo | `0` |
| SKU sustituido | `original_quantity` |

Estos dos estados (`original_skus` vs `final_skus`) se muestran en la web en el detalle del pedido para comparación.

---

### 5. Chequeo (antes del embalaje) — OBLIGATORIO

El chequeo ocurre cuando el pedido está en estatus **Empaquetado**, antes de que el picker embale físicamente. **Todos los pedidos (100%) deben pasar por el chequeador y ser aprobados para poder embalarse.** No existe la opción de omitir el chequeo.

**Cola del chequeador:**
- Pedidos en estatus **Empaquetado** disponibles para revisar
- Card: # pedido, cliente, picker, # bultos, fecha de empaquetado, flag de bultos adicionales
- Todos los pedidos empaquetados deben ser chequeados

**Detalle de chequeo:**
- Pedido completo con todos sus bultos
- Por cada bulto: SKUs y cantidades declaradas
- Visible: comparativo original vs final (sustituciones y faltantes)
- Visible: flag de bultos adicionales si aplica
- Al terminar:
  - **Aprobar** → pedido pasa a **Auditado** → picker puede embalar
  - **Rechazar** → observación obligatoria → pedido vuelve a **Empaquetado** → picker notificado

**Picker mientras espera chequeo (Empaquetado):**
- El picker **no** tiene acción en este estatus; el pedido queda "en chequeo".
- Si el chequeador **aprueba** → status **Auditado** → picker presiona "Marcar como embalado"
- Si el chequeador **rechaza** → picker corrige y vuelve a finalizar picking

---

### 6. Embalaje

- El embalaje ocurre **siempre después** de la aprobación del chequeador (estatus **Auditado**)
- El picker ve resumen de bultos armados
- Presiona "Marcar como embalado" → pedido pasa a **Embalado**
- Botón disponible **solo** en estatus **Auditado**
- Es el mismo picker quien embala
- **Mejora futura:** traspasar embalaje a otro picker

---

### 7. Pedido rechazado — Revisión

- El picker ve el pedido con estatus "Rechazado" en su lista
- Al abrir ve la observación que dejó el chequeador (destacada visualmente)
- Puede reabrir los bultos y hacer correcciones
- Al terminar presiona "Finalizar picking" → vuelve a "Empaquetado"

---

### 8. Vista Chequeador — Cola de chequeo

*(Ver sección 5. Chequeo para el flujo completo.)*

---

### 9. Vista Jefe de almacén

**Gestión de equipos:**
- Lista de pedidos grandes asignados desde la web
- Crear team: selecciona pickers disponibles y los asocia al pedido
- Los pickers del team siguen disponibles para recibir otros pedidos en su cola propia
- Estado de cada picker en tiempo real
- Botón "Liberar picker" individual
- Botón "Liberar team completo"

**Estado del almacén (tiempo real):**
- Lista de todos los pickers con estado en tiempo real
- Por picker: nombre, estatus, pedido activo, bultos hoy, tiempo en estatus actual
- Actualización en tiempo real vía Firestore listeners

---

### 10. Notificaciones in-app

| Rol | Evento |
|---|---|
| Picker | **Pedido nuevo** asignado |
| Picker | **Pedido rechazado** por el chequeador (con observación) |
| Picker | **Pedido aprobado** por el chequeador |
| Picker | **Actualización de pedido** (cambio hecho en un pedido asignado a ese picker) |
| Picker | Liberado de un team |
| Chequeador | Nuevo pedido empaquetado disponible para chequear |
| Jefe | Picker completó su parte en el pedido del team |
| Jefe | Picker sin actividad (umbral por definir) |

**Arquitectura:** las notificaciones son **in-app** (pantalla de notificaciones dentro de la app; no son push del sistema operativo). Se derivan del listener en tiempo real de Firestore, comparando el snapshot anterior con el nuevo **en el dispositivo del receptor** (ver `use-session-orders-listener` / `order-notifications`). Costo prácticamente nulo: reutilizan el realtime que ya existe, sin backend adicional.

---

## Casos posibles del pedido

### Por estatus

| Estatus | Caso | Qué puede hacer el picker |
|---|---|---|
| Nuevo | Pedido recién llegado de Profit | Nada (no visible para picker) |
| Asignado | Pedido en cola, posición #1 | Iniciar picking |
| Asignado | Pedido en cola, posición > 1 | Solo ver detalle, no iniciar |
| En proceso | Picking activo, armando bultos | Abrir/cerrar bultos, agregar SKUs, sustituir, finalizar |
| En proceso | Guardado parcial (25/50/75/100%) | Continúa trabajando normalmente |
| En proceso | Sin internet en hito de guardado | Se guarda en el siguiente hito o al finalizar |
| Empaquetado | Picking finalizado | Nada — en chequeo, espera aprobación del chequeador |
| Auditado | Chequeador aprobó | Marcar como embalado |
| Embalado | Embalaje confirmado | Flujo posterior en web |
| Rechazado | Chequeador rechazó con observación | Reabrir picking, corregir, finalizar de nuevo |
| Despachado | Salió en guía | Solo consulta |

### Casos de picking (durante "En proceso")

| # | Caso | Comportamiento |
|---|---|---|
| 1 | Flujo normal | Abre bultos, mete SKUs, cierra bultos, finaliza |
| 2 | Cantidad parcial de SKU | Mismo SKU repartido en varios bultos con distintas cantidades |
| 3 | Cantidad máxima por SKU | Limitada solo por la cantidad pendiente del pedido (sin tope de capacidad) |
| 4 | Bultos adicionales | Alerta + `extra_bundles_flag: true`, % se queda en 100% |
| 5 | Sustitución de SKU (por talla) | Solo misma talla; nota opcional; `difference = original_quantity` |
| 6 | Finalizar con faltantes | Alerta + `difference` por SKU incompleto |
| 7 | Bulto vacío al editar | Modal: eliminar bulto o agregar artículo |
| 8 | Bulto abierto vacío existente | Bloquea abrir otro bulto |
| 9 | Reabrir bulto cerrado | Permitido, baja el % |
| 10 | Eliminar bulto | Renumera `bundle_num` en local; corrección definitiva al finalizar |
| 11 | Finalizar con bultos abiertos con ítems | Cierra automáticamente todos los bultos abiertos |
| 12 | Guardado al 100% sin finalizar | Guarda parcial pero status sigue "En proceso" |
| 13 | Edición post-guardado parcial | Cambios locales; se corrigen al finalizar |

### Casos de chequeo

| # | Caso | Resultado |
|---|---|---|
| 1 | Chequeador aprueba | Status → Auditado |
| 2 | Chequeador rechaza | Observación obligatoria → Status → Empaquetado → picker notificado |
| 3 | Pedido con bultos extra | Visible `extra_bundles_flag` en detalle de chequeo |
| 4 | Pedido con sustituciones | Visible comparativo original vs final |
| 5 | Pedido con faltantes | Visible `difference` por SKU |
| 6 | Chequeo obligatorio | Todos los pedidos deben ser aprobados; no se puede embalar sin aprobación |

---

## Reglas de negocio — resumen completo

### Cola y asignación
1. Solo un pedido "En proceso" a la vez por picker
2. Solo puede iniciar el pedido en posición #1 de su cola
3. El pedido en proceso siempre aparece fijo en posición 1
4. Pickers en team siguen disponibles para su cola individual

### Bultos
5. `bundle_num` se asigna secuencialmente al abrir (1, 2, 3…)
6. No se puede cerrar un bulto vacío
7. No se puede abrir otro bulto si hay uno abierto vacío
8. Bulto vacío al editar → modal obligatorio (eliminar o agregar artículo)
9. Bulto cerrado se puede reabrir
10. Al eliminar bulto → renumera en local; corrección definitiva al finalizar
11. Al finalizar picking → cierra automáticamente bultos abiertos con ítems
12. Bultos adicionales → alerta + `extra_bundles_flag: true`

### Cantidades
13. **No hay capacidad de bulto** (se eliminó `units_per_bundle`/fracción). El único límite al agregar un SKU es la cantidad pendiente del pedido; el resto queda a criterio del picker
14. El picker puede meter cantidades parciales de cualquier SKU
15. Un mismo SKU puede estar en varios bultos (array `bundles[]` en `final_skus`)

### Progreso y guardados
16. `progress_percentage = (bultos_cerrados / bundles_defined) × 100`, tope 100%
17. Guardados parciales en hitos 25/50/75/100%
18. 100% guarda pero **no cierra** el pedido
19. Solo se envían a Firestore bultos **cerrados** en cada guardado
20. Sin internet → se guarda en el siguiente hito o al finalizar
21. Tras 100%, bultos extra → próximo guardado al Finalizar picking

### Sustitución y faltantes
22. Sustitución de SKU **solo por talla** (misma talla que el original); si el SKU no tiene talla, no es sustituible. Registro completo con nota opcional
23. `difference` sustituido = `original_quantity`
24. `difference` incompleto = `original_quantity - packed_quantity`
25. Finalizar con faltantes → alerta + registro en `difference`

### Finalización
26. "Finalizar picking" cambia status a Empaquetado (no el 100% de progreso)
27. Al finalizar: renumera bultos, corrige `final_skus`, guarda definitivo

### Chequeo (obligatorio)
28. El chequeo es **obligatorio para el 100% de los pedidos** — ocurre en estatus **Empaquetado**, **antes** del embalaje
29. El chequeador revisa pedidos en cola **Empaquetado** (no Embalado)
30. Si el chequeador aprueba → **Auditado** → picker puede embalar
31. El picker **no** puede embalar sin la aprobación del chequeador (no existe omisión)
32. Observación de rechazo en el chequeo es obligatoria
33. Rechazo → picker corrige y vuelve a **Empaquetado**

---

## Semana 1 — UI mockeada

- Usuarios mock por rol (picker, chequeador, jefe de almacén)
- Pedido mock #4424 con los 4 SKUs del ejemplo (aceite, cascos, guantes)
- Flujo completo de picking navegable: abrir bulto → agregar SKU → cerrar bulto → finalizar picking
- Simular alerta de bultos adicionales
- Simular sustitución de SKU por talla
- Simular finalizar con faltantes
- Simular modal de bulto vacío
- Simular guardados parciales por progreso
- Flujo de chequeo navegable: aprobar y rechazar con observación

---

## Pendientes a confirmar con el cliente

- En qué estatus el pedido se puede convertir a Nota de Entrega
- En qué momento la NE se convierte a Factura
- Quién cambia el estatus a Despachado
- Umbral de tiempo para alertas de inactividad de picker
- Si el traspaso de embalaje a otro picker entra en el alcance

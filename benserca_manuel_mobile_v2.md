# Benserca — Instrucciones Móvil v2
**Desarrollador:** Manuel  
**Plataforma:** Mobile  
**Stack base:** Dimassi (adaptar)  
**Base de datos:** Firestore (tiempo real)  
**Semana 1:** UI con datos mockeados, sin conexión a Firebase

---

## Contexto del proyecto

Benserca es una plataforma de gestión logística y distribución. La app móvil es exclusivamente para el personal de almacén: pickers, jefe de almacén y auditores. Los conductores NO tienen app móvil, las entregas se gestionan desde la web.

La app debe funcionar en tiempo real. Cualquier cambio de estatus debe reflejarse inmediatamente sin necesidad de refrescar.

---

## Roles con acceso móvil

| Rol | Acceso |
|---|---|
| Picker | Ver pedidos asignados, armar bultos, embalar |
| Jefe de almacén | Crear teams, supervisar pickers, ver estado del almacén en tiempo real |
| Auditor | Revisar y aprobar/rechazar pedidos empaquetados |

---

## Ciclo de vida del pedido

| # | Estatus | Quién lo genera | Plataforma |
|---|---|---|---|
| 1 | Nuevo | Sistema (Profit) | — |
| 2 | Asignado | Gerente de almacén | Web |
| 3 | En proceso | Picker | Móvil |
| 4 | Empaquetado | Picker (Finalizar picking) | Móvil |
| 5 | Auditado | Auditor (opcional) | Móvil |
| 6 | Embalado | Picker | Móvil |
| 7 | Rechazado | Auditor → vuelve a Empaquetado | Móvil |
| 8 | Despachado | Por definir con cliente | — |

---

## Pantallas y flujos

### 1. Login
- Email y contraseña
- Firebase Auth
- Redirige según rol al autenticar:
  - Picker → Mis pedidos
  - Jefe de almacén → Gestión de equipos / Estado del almacén
  - Auditor → Cola de auditoría
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
  - Cantidad pedida
  - Cantidad por bulto (viene de Profit)
  - Fracción de bulto calculada (cantidad pedida / cantidad por bulto)
  - Cantidad ya asignada a bultos
  - Cantidad pendiente por asignar
- Sección de bultos creados con su contenido y fracción usada
- Barra de progreso del picking (% de bultos cerrados)
- Botones de acción según estatus:
  - **Asignado:** botón "Iniciar picking"
  - **En proceso:** botón "Abrir nuevo bulto" + "Finalizar picking"
  - **Empaquetado:** espera auditoría (opcional) o botón "Marcar como embalado" si la auditoría fue omitida
  - **Auditado:** botón "Marcar como embalado"
  - **Rechazado:** muestra observación del auditor + botón "Reabrir picking"

---

### 4. Pantalla de picking — Armado de bultos

Esta es la pantalla más importante de la app.

#### Concepto clave: Fracción de bulto

Cada SKU ocupa una fracción del bulto:

```
Fracción = cantidad a meter en el bulto / cantidad por bulto
```

Ejemplo con el pedido #4424:

| Artículo | Cantidad pedida | Por bulto | Fracción total |
|---|---|---|---|
| Aceite de motor | 12 | 12 | 12/12 = 1.0 |
| Casco Azul M | 9 | 18 | 9/18 = 0.5 |
| Casco Verde S | 12 | 18 | 12/18 = 0.67 |
| Guantes | 10 | 120 | 10/120 = 0.08 |

**Regla:** la suma de fracciones dentro de un bulto no debe superar 1.0. Si supera, se lanza una alerta pero NO se bloquea.

**Importante:** el picker puede meter cantidades parciales de un SKU. Ejemplo: de 9 cascos azules puede meter solo 5 en un bulto, lo que daría fracción de 5/18 = 0.28.

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
   - Ingresa la cantidad a meter (puede ser parcial)
   - El SKU se agrega a `final_skus` local con su `bundle_num`
   - El sistema calcula la fracción acumulada del bulto en tiempo real
   - Muestra barra de progreso de la fracción: 0% → 100%
   - Si la fracción supera 1.0 → alerta: "Este bulto supera la capacidad estimada. ¿Deseas continuar?"
   - Botón "Agregar ítem al bulto"
4. Puede agregar múltiples SKUs al mismo bulto respetando la fracción
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

**Sustitución de SKU:**
- Si un artículo no tiene existencia, el picker puede sustituirlo por otro
- Presiona "Sustituir artículo" en el SKU correspondiente
- Busca y selecciona el SKU sustituto
- Ingresa una nota obligatoria explicando el motivo
- El sistema registra: SKU original, SKU sustituto, cantidad, nota, picker y timestamp
- `difference` = `original_quantity` (total pedido del SKU original, porque no se envió nada del original)

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

### 5. Auditoría (antes del embalaje)

La auditoría ocurre cuando el pedido está en estatus **Empaquetado**, antes de que el picker embale físicamente.

**Cola del auditor:**
- Pedidos en estatus **Empaquetado** disponibles para revisar
- Card: # pedido, cliente, picker, # bultos, fecha de empaquetado, flag de bultos adicionales
- No todos los pedidos son auditados; el auditor elige cuáles revisar

**Detalle de auditoría:**
- Pedido completo con todos sus bultos
- Por cada bulto: SKUs, cantidades declaradas y fracción usada
- Visible: comparativo original vs final (sustituciones y faltantes)
- Visible: flag de bultos adicionales si aplica
- Al terminar:
  - **Aprobar** → pedido pasa a **Auditado** → picker puede embalar
  - **Rechazar** → observación obligatoria → pedido vuelve a **Empaquetado** → picker notificado

**Picker mientras espera auditoría (Empaquetado):**
- Si el auditor **aprueba** → status **Auditado** → picker presiona "Marcar como embalado"
- Si **nadie audita** (auditoría omitida/soltada) → picker puede "Marcar como embalado" directamente desde Empaquetado
- Si el auditor **rechaza** → picker corrige y vuelve a finalizar picking

---

### 6. Embalaje

- El embalaje ocurre **después** de la auditoría (si hubo) o directamente desde Empaquetado (si la auditoría fue omitida)
- El picker ve resumen de bultos armados
- Presiona "Marcar como embalado" → pedido pasa a **Embalado**
- Botón disponible en estatus **Auditado** (si fue auditado) o **Empaquetado** (si la auditoría fue omitida)
- Es el mismo picker quien embala
- **Mejora futura:** traspasar embalaje a otro picker

---

### 7. Pedido rechazado — Revisión

- El picker ve el pedido con estatus "Rechazado" en su lista
- Al abrir ve la observación que dejó el auditor (destacada visualmente)
- Puede reabrir los bultos y hacer correcciones
- Al terminar presiona "Finalizar picking" → vuelve a "Empaquetado"

---

### 8. Vista Auditor — Cola de auditoría

*(Ver sección 5. Auditoría para el flujo completo.)*

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
| Picker | Nuevo pedido asignado |
| Picker | Pedido rechazado por auditoría (con observación) |
| Picker | Liberado de un team |
| Auditor | Nuevo pedido empaquetado disponible para auditar |
| Jefe | Picker completó su parte en el pedido del team |
| Jefe | Picker sin actividad (umbral por definir) |

Parametrizables: cada usuario puede activar/desactivar por tipo.

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
| Empaquetado | Picking finalizado | Espera auditoría (opcional) o embalar si omitieron |
| Empaquetado | Auditoría omitida/soltada | Marcar como embalado |
| Auditado | Auditor aprobó | Marcar como embalado |
| Embalado | Embalaje confirmado | Flujo posterior en web |
| Rechazado | Auditor rechazó con observación | Reabrir picking, corregir, finalizar de nuevo |
| Despachado | Salió en guía | Solo consulta |

### Casos de picking (durante "En proceso")

| # | Caso | Comportamiento |
|---|---|---|
| 1 | Flujo normal | Abre bultos, mete SKUs, cierra bultos, finaliza |
| 2 | Cantidad parcial de SKU | Mismo SKU repartido en varios bultos con distintas cantidades |
| 3 | Fracción > 1.0 en un bulto | Alerta confirmable, no bloquea |
| 4 | Bultos adicionales | Alerta + `extra_bundles_flag: true`, % se queda en 100% |
| 5 | Sustitución de SKU | Nota obligatoria, `difference = original_quantity` |
| 6 | Finalizar con faltantes | Alerta + `difference` por SKU incompleto |
| 7 | Bulto vacío al editar | Modal: eliminar bulto o agregar artículo |
| 8 | Bulto abierto vacío existente | Bloquea abrir otro bulto |
| 9 | Reabrir bulto cerrado | Permitido si tiene fracción disponible, baja el % |
| 10 | Eliminar bulto | Renumera `bundle_num` en local; corrección definitiva al finalizar |
| 11 | Finalizar con bultos abiertos con ítems | Cierra automáticamente todos los bultos abiertos |
| 12 | Guardado al 100% sin finalizar | Guarda parcial pero status sigue "En proceso" |
| 13 | Edición post-guardado parcial | Cambios locales; se corrigen al finalizar |

### Casos de auditoría

| # | Caso | Resultado |
|---|---|---|
| 1 | Auditor aprueba | Status → Auditado |
| 2 | Auditor rechaza | Observación obligatoria → Status → Empaquetado → picker notificado |
| 3 | Pedido con bultos extra | Visible `extra_bundles_flag` en detalle de auditoría |
| 4 | Pedido con sustituciones | Visible comparativo original vs final |
| 5 | Pedido con faltantes | Visible `difference` por SKU |
| 6 | Auditoría omitida/soltada | Picker embala directamente desde Empaquetado |

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
9. Bulto cerrado se puede reabrir si tiene fracción disponible
10. Al eliminar bulto → renumera en local; corrección definitiva al finalizar
11. Al finalizar picking → cierra automáticamente bultos abiertos con ítems
12. Bultos adicionales → alerta + `extra_bundles_flag: true`

### Fracción y cantidades
13. Fracción = cantidad a meter / cantidad por bulto. Suma máxima recomendada: 1.0 (no bloqueante)
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
22. Sustitución de SKU → registro completo con nota obligatoria
23. `difference` sustituido = `original_quantity`
24. `difference` incompleto = `original_quantity - packed_quantity`
25. Finalizar con faltantes → alerta + registro en `difference`

### Finalización
26. "Finalizar picking" cambia status a Empaquetado (no el 100% de progreso)
27. Al finalizar: renumera bultos, corrige `final_skus`, guarda definitivo

### Auditoría
28. Auditoría es **opcional** — ocurre en estatus **Empaquetado**, **antes** del embalaje
29. Auditor revisa pedidos en cola **Empaquetado** (no Embalado)
30. Si auditor aprueba → **Auditado** → picker puede embalar
31. Si auditoría omitida/soltada → picker embala directamente desde **Empaquetado**
32. Observación de rechazo en auditoría es obligatoria
33. Rechazo → picker corrige y vuelve a **Empaquetado**

---

## Semana 1 — UI mockeada

- Usuarios mock por rol (picker, auditor, jefe de almacén)
- Pedido mock #4424 con los 4 SKUs del ejemplo (aceite, cascos, guantes)
- Flujo completo de picking navegable: abrir bulto → agregar SKU → fracción en tiempo real → cerrar bulto → finalizar picking
- Simular alerta de fracción superada
- Simular alerta de bultos adicionales
- Simular sustitución de SKU
- Simular finalizar con faltantes
- Simular modal de bulto vacío
- Simular guardados parciales por progreso
- Flujo de auditoría navegable: aprobar y rechazar con observación

---

## Pendientes a confirmar con el cliente

- En qué estatus el pedido se puede convertir a Nota de Entrega
- En qué momento la NE se convierte a Factura
- Quién cambia el estatus a Despachado
- Umbral de tiempo para alertas de inactividad de picker
- Si el traspaso de embalaje a otro picker entra en el alcance

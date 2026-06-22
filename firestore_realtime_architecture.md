# Arquitectura Real-Time con Firestore — Benserca Mobile

**Audiencia:** Desarrolladores que quieran entender o reusar este patrón.  
**Stack:** React Native · `@react-native-firebase/firestore` · Zustand

---

## El problema que resuelve

En una app multiusuario con datos que cambian en tiempo real (pedidos, estados, asignaciones), hay dos enfoques clásicos:

| Enfoque | Cómo funciona | Problema |
|---|---|---|
| **Polling** | El cliente pregunta "¿hay cambios?" cada N segundos | Lee aunque no haya nada nuevo. Costo fijo alto. |
| **Botón "actualizar"** | El usuario decide cuándo refrescar | Datos desactualizados. El usuario impaciente presiona muchas veces. |
| **Real-time listener** | Firestore empuja cambios solo cuando ocurren | Solo lee cuando hay un cambio real. |

---

## Cómo funciona el listener de Firestore

Firestore usa una **conexión WebSocket persistente** (no HTTP polling). La app abre la conexión una vez y Firestore empuja datos cuando algo en el servidor cambia.

```
App ──── onSnapshot(query) ────► Firestore
         WebSocket abierta        │
                                  │ Solo cuando un doc cambia
                                  ◄──── push({ doc }) ──────────
```

**Lo que se cobra en Firestore:**
- ✅ Carga inicial del listener → 1 lectura por documento que devuelve la query
- ✅ Cada vez que un documento cambia → 1 lectura por documento modificado
- ❌ Mantener la conexión abierta sin cambios → **$0**
- ❌ Documentos que no cambian → **$0**

---

## El punto clave: queries scoped por usuario

Esta es la diferencia entre un patrón caro y uno eficiente.

### ❌ Patrón caro — escuchar toda la colección

```ts
firestore().collection('lo_orders').onSnapshot(callback)
```

Con 100 pickers conectados, **cualquier cambio en cualquier pedido** dispara los 100 listeners. Si en un día se modifican 200 pedidos:

```
200 cambios × 100 listeners = 20,000 lecturas
```

### ✅ Patrón eficiente — query filtrada por uid del usuario

```ts
firestore()
  .collection('lo_orders')
  .where('assigned_to.uid', '==', user.uid)   // ← cada picker filtra por sí mismo
  .onSnapshot(callback)
```

Con 100 pickers conectados, si se asigna un pedido al picker A:

```
Firestore evalúa qué listeners tienen ese documento en su resultado:
  ├─ Picker A (uid_A) → el doc SÍ coincide → recibe 1 lectura
  ├─ Picker B (uid_B) → el doc NO coincide → silencio
  ├─ Picker C (uid_C) → el doc NO coincide → silencio
  └─ ... 97 más       → el doc NO coincide → silencio

Total: 1 lectura, no 100.
```

**Firestore evalúa el filtro en el servidor.** Los clientes cuya query no incluye el documento modificado nunca son notificados.

---

## Comparación de costo real (100 pickers, jornada de 8h)

### Con botón "actualizar"

Asumiendo un picker impaciente que presiona cada 5 minutos:

```
100 pickers × 96 presiones × 5 pedidos promedio = 48,000 lecturas/día
Costo: ~$0.003/día → ~$1/año
```

Y eso si el picker es paciente. Si presiona cada 2 minutos → $2.50/año.

### Con real-time listener (este patrón)

```
100 pickers × 5 pedidos (carga inicial)       =    500 lecturas
+ 100 pickers × 3 cambios de estado promedio   =    300 lecturas
                                               = ~800 lecturas/día
Costo: ~$0.00005/día → ~$0.018/año
```

**El listener es ~150× más barato** porque solo lee cuando algo cambia.

---

## Implementación en esta app

### 1. Un solo listener por sesión

El listener **no vive en una pantalla**, vive en el layout raíz de la sección autenticada. Se activa al hacer login y se destruye al hacer logout.

```
app/(app)/_layout.tsx
└── useSessionOrdersListener()   ← único listener, toda la sesión
```

```ts
// src/features/picking/hooks/use-session-orders-listener.ts

export function useSessionOrdersListener() {
  const user = useCurrentUser();
  const hydrateOrders = useOrdersStore((s) => s.hydrateOrders);

  useEffect(() => {
    if (!user) return;

    const buildQuery = () => {
      switch (user.role) {
        case 'picker':
          return firestore()
            .collection('lo_orders')
            .where('assigned_to.uid', '==', user.uid);   // solo sus pedidos

        case 'auditor':
          return firestore()
            .collection('lo_orders')
            .where('status', '==', 'Empaquetado');        // solo los que puede auditar

        case 'warehouse_lead':
          return firestore()
            .collection('lo_orders')
            .where('team.chief_uid', '==', user.uid);    // solo su equipo
      }
    };

    const unsub = buildQuery().onSnapshot((snapshot) => {
      const orders = snapshot.docs.map((doc) =>
        firestoreDocToOrder(doc.id, doc.data())
      );
      hydrateOrders(orders);                             // alimenta el store local
    });

    return unsub;   // limpia al desmontar / cambiar usuario
  }, [user?.uid, user?.role]);
}
```

### 2. El store local como buffer de pantallas

Las pantallas **nunca hablan con Firestore directamente**. Solo leen del store (Zustand). El listener mantiene el store actualizado.

```
Firestore ──► useSessionOrdersListener ──► Zustand store ──► Pantallas
                    (1 listener)              (estado local)   (N pantallas)
```

Ventaja: navegar entre pantallas no crea ni destruye listeners. Las pantallas de detalle no necesitan su propio listener.

### 3. Escrituras optimistas

Cuando el picker hace una acción (iniciar picking, cerrar bulto, finalizar), la app:

1. **Actualiza el store local inmediatamente** → la UI responde al instante
2. **Escribe en Firestore en background** → sin bloquear la UI

```ts
startPicking: (orderId, pickerId) => {
  // 1. Actualización local (instantánea, el usuario ve el cambio de inmediato)
  set((s) => ({ orders: patchOrder(s.orders, orderId, patch) }));

  // 2. Persistencia en Firestore (async, fire-and-forget)
  firestoreStartPicking(orderId, user).catch(console.error);
},
```

Si la escritura falla (sin internet), el estado local sigue siendo consistente. El siguiente hito de guardado o el "Finalizar picking" reintentará.

### 4. Merge inteligente para picking activo

Cuando el listener recibe una actualización de Firestore para un pedido que está siendo pickeado activamente, **no sobreescribe el estado local**. Los bultos y el progreso calculado localmente son la fuente de verdad durante el picking:

```ts
hydrateOrders: (incoming) => {
  set((s) => {
    const merged = incoming.map((firestoreOrder) => {
      const local = s.orders.find((o) => o.id === firestoreOrder.id);

      if (local?.status === 'in_progress' && firestoreOrder.status === 'in_progress') {
        // Firestore puede tener datos del último guardado parcial (más viejos).
        // El estado local tiene los bultos y progreso más recientes.
        return {
          ...firestoreOrder,          // metadata del pedido actualizada
          bultos: local.bultos,       // estado local de bultos (no persiste hasta milestone)
          progressPercentage: local.progressPercentage,
          bundlesCreated: local.bundlesCreated,
          finalSkus: local.finalSkus,
          lastSavedMilestone: local.lastSavedMilestone,
        };
      }

      return firestoreOrder;          // cualquier otro estado: Firestore manda
    });

    return { orders: merged };
  });
},
```

---

## Cuándo el real-time SÍ puede ser más caro

### Query sin filtro por usuario

```ts
// ⚠️ Con 10 auditors conectados y 500 pedidos en "Empaquetado":
// Cada cambio de cualquier pedido notifica a los 10 auditores.
firestore().collection('lo_orders').where('status', '==', 'Empaquetado')
```

Este es el caso del auditor en esta app. No es problemático con 1-2 auditores, pero escalaría si hubiera muchos. Alternativa: usar Cloud Functions para notificar solo al auditor asignado.

### Documentos muy volátiles

Si un documento cambia 100 veces por minuto (ej. posición GPS en tiempo real), cada cambio genera 1 lectura por listener. En ese caso, el polling con intervalo puede ser más barato.

**Regla práctica:** Si el documento cambia más de 1 vez por segundo, considera reducir frecuencia de escrituras en el servidor (debounce antes de escribir).

---

## Patrón para reusar en otro proyecto

```
1. Identifica qué datos necesita cada rol.
2. Diseña queries filtradas por uid o por campo de rol.
3. Monta UN listener por rol en el layout raíz de la sección autenticada.
4. Alimenta un store local (Zustand, Redux, Context).
5. Las pantallas leen del store, nunca de Firestore directamente.
6. Las escrituras actualizan el store localmente primero, luego Firestore en background.
7. Para estado transiente que no persiste hasta una acción del usuario
   (ej. bultos durante el picking), mantenlo solo local y persiste en hitos.
```

---

## Resumen de reglas de oro

| Regla | Por qué |
|---|---|
| Filtra siempre por uid del usuario | Un cambio solo notifica al usuario afectado |
| Un listener por rol, en el layout raíz | Sin duplicados al navegar entre pantallas |
| Las pantallas leen del store, no de Firestore | Navegación gratuita, sin re-lecturas |
| Escrituras optimistas (local primero) | UX instantánea, la red no bloquea |
| Estado transitorio solo local | No gastes escrituras en datos intermedios |

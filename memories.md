# Bitácora de Ideas y Desarrollo Futuro (Memories)

En este documento se registran los conceptos y requerimientos de negocio para futuras iteraciones del portal de reputación de **La Crêpe Parisienne**.

---

## 1. Algoritmo de Progreso de Calificación Histórica
**Objetivo:** Mostrar al gerente de tienda cuántas opiniones perfectas (5 estrellas) consecutivas necesita recibir para elevar la calificación histórica al siguiente punto porcentual (por ejemplo, subir de `4.42` a `4.50`).

### Formulación Matemática:
Si una tienda tiene actualmente:
- $R$: Calificación promedio histórica actual (ej. `4.42`).
- $N$: Número total de reseñas históricas (ej. `120`).
- $T$: Calificación objetivo deseada (ej. `4.50`).
- $x$: Cantidad de reseñas consecutivas de 5 estrellas necesarias.

La nueva calificación promedio será:
$$\frac{(R \times N) + 5x}{N + x} \ge T$$

Resolviendo para $x$:
$$(R \times N) + 5x \ge T(N + x)$$
$$5x - Tx \ge TN - (R \times N)$$
$$x(5 - T) \ge N(T - R)$$
$$x \ge \frac{N(T - R)}{5 - T}$$

Dado que $x$ debe ser un número entero de opiniones, aplicamos la función techo ($\lceil \dots \rceil$):
$$x = \left\lceil \frac{N(T - R)}{5 - T} \right\rceil$$

### Ejemplo Práctico:
Si la sucursal tiene **4.4★ con 80 reseñas** y queremos subir a **4.5★**:
- $R = 4.4$
- $N = 80$
- $T = 4.5$
- $x = \lceil \frac{80(4.5 - 4.4)}{5 - 4.5} \rceil = \lceil \frac{80(0.1)}{0.5} \rceil = \lceil \frac{8}{0.5} \rceil = \lceil 16 \rceil = 16$ opiniones de 5 estrellas.

---

## 2. Auditoría y Consistencia de Datos Históricos
- **Pendiente:** Validar que todos los puntajes históricos mostrados en las tablas de las tiendas y sub-dashboards regionales no estén "hardcoded" (fijos en la UI o en scripts), sino que se calculen dinámicamente o se extraigan consistentemente desde el set de datos cargado por `DataLoader`.
- Asegurar consistencia de meses históricos cargados desde Supabase contra el manifiesto disponible.

---

## 3. Guía de Introducción (Walkthrough / Tutorial) por Primera Vez
- **Objetivo:** Facilitar la incorporación de nuevos usuarios gerenciales mediante un tutorial paso a paso por la interfaz.
- **Detalle de Implementación:**
  - Utilizar un overlay de introducción interactivo (tipo Shepherd.js o una solución personalizada e inyectada con CSS/JS).
  - Almacenar una bandera en el caché del navegador (`localStorage.setItem('lcp_walkthrough_seen', 'true')`) para mostrarlo una sola vez por dispositivo, con la opción de reiniciarlo desde "Acerca de".
  - Explicar las secciones del Scorecard, las quejas críticas, el cálculo del score de complejidad regional y la descarga de reportes.

---

## 4. Personalización Avanzada y Mensajes para Gerentes
- **Objetivo:** Mejorar la experiencia e identidad del portal adaptando el saludo principal al nombre del usuario en sesión.
- **Detalle de Implementación:**
  - Extraer el nombre de perfil desde la sesión de Supabase (`AppAuth.profile`).
  - Implementar placeholders dinámicos en las plantillas de bienvenida.
  - Para perfiles gerenciales, inyectar frases contextualizadas como:
    > *"Bienvenido, gerente de {tienda}. Este mes tienes {X} opiniones críticas pendientes por responder."*

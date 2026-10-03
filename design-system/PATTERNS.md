# Patrones de pantalla y componentes

Referencia obligatoria: `tokens.json`, versión 1.0.0. Todos los ejemplos visuales están en `reference.html`.

## 1. Espacio clínico

Sidebar 216–232 px, contenido continuo, header 64 px con borde inferior. Header: sección actual, clínica activa, búsqueda funcional y acción contextual. Un título principal por página. En teléfono, navegación en drawer, clínica visible y acción de sección accesible; evitar una fila de iconos sin nombres.

Agrupar navegación por trabajo real: Hoy, Agenda, Pacientes y Configuración, según permisos existentes. Recepción y doctor mantienen sus destinos propios. Reservas y portal público son accesos separados. Añadir «Cobros» solo cuando tenga una vista y permisos completos.

## 2. Inicio por rol

**Administración:** banda de indicadores con período; agenda amplia; pendientes; resumen de facturado/cobrado. **Recepción:** llegadas, esperas y cierres/cobros. **Doctor:** siguiente paciente, consulta activa y agenda personal.

No crear cuatro tarjetas idénticas para llenar espacio. No convertir página actual, número de filas cargadas o datos incompletos en métricas. Cada módulo declara fuente, período, acción y estado vacío. No llamar «cobrado» a una suma de facturas.

## 3. Agenda

Barra: fecha, Hoy, anterior/siguiente con nombres accesibles, Día/Semana y profesional cuando corresponda. Día por profesional para operación; semana para planificación. Mantener fecha y zona horaria de Costa Rica.

Eventos: fondo neutro, nombre a 12–14 px, hora/servicio, franja y etiqueta de estado del contrato. Color por profesional, si se necesita, solo en encabezado o indicador independiente. No color por hash. Bloqueos habituales en neutro con texto; conflicto en tono de atención. Los controles vacíos son botones accesibles por teclado.

Detalles en diálogo contextual compartido: paciente, servicio, profesional, fecha, duración, estado, acciones autorizadas. Reprogramar requiere mostrar resultado y conflictos. No introducir drag and drop antes de contar con validación y alternativa de teclado.

## 4. Directorio de pacientes

Título + total, búsqueda por nombre/identificación, botón Nuevo paciente. Tabla: nombre/identificación, edad si aporta, contacto y acción. En escritorio filas de 48–56 px. Nombre o enlace explícito abre expediente; historial como acción secundaria. Paginación al pie. En teléfono, filas resumidas apiladas con nombre, identificación y acción; no encoger una tabla hasta texto ilegible.

Búsqueda: label visible o nombre accesible, debounce, carga, sin resultados y limpiar. No implementar un buscador global visual sin resultados reales.

## 5. Expediente

Identidad y clínica persistentes, modo lectura/consulta explícito; historial por fechas y contenido de registro. En lectura mostrar texto con contraste completo. En consulta mostrar formulario, validación y guardado. El header informa el estado de guardado; no inventar autosave si no existe.

Estructura aplicada: espacio de expediente a pantalla completa, navegación de registros, contenido principal y acciones. Odontograma/ginecología/recetas agregan herramientas dentro de la misma gramática. Mantener permisos y consulta activa; confirmar salida con cambios pendientes. Usar diálogos pequeños para tareas cortas; el expediente ocupa la pantalla completa y conserva su contexto.

## 6. Acceso

Título «Acceso del personal», clínica/plataforma reconocible, correo y contraseña, acción Ingresar. Enlace al portal del paciente diferenciado. Errores en español sin revelar existencia de cuentas. Mostrar/ocultar contraseña con nombre accesible y `type="button"`. No mostrar alta incompleta como si estuviera operativa.

## 7. Reservas y portal

Identidad de clínica, especialidad y ubicación reales. «Reserva tu cita en [clínica]». Catálogo habilitado con precio CRC y duración reales, profesional, disponibilidad, datos y confirmación. Cada paso muestra progreso y permite corregir sin perder datos. Evitar párrafos sobre implementación interna y servicios genéricos que contradigan el catálogo.

En teléfono, primera pantalla identifica clínica y permite elegir servicio. Botones de paso a 44 px o más; inputs a 16 px. Mantener selección ante validación; gestionar cambios de disponibilidad. La referencia visual no simula conexión real.

## 8. Configuración

Grupos por decisión: datos de clínica, atención/especialidades, reservas, equipo y servicios. Ayuda por campo, permiso visible, error relacionado y confirmación de guardado. Vista previa pública compacta en lugar de tarjeta decorativa grande. No exponer dominio «sugerido para v1», TODO o aviso del backend al cliente.

## 9. Responsabilidades de la biblioteca común

| Componente | Responsabilidad | Contrato |
|---|---|---|
| PageHeader | Título/contexto/acción | 1 acción principal por región de trabajo |
| Button | Acción, secundario, ghost, destructivo | Tokens; loading con texto; foco visible |
| Field | Label/ayuda/input/error | IDs relacionados; required visible; autocomplete |
| AppointmentStatusBadge | Etiqueta y tono | `appointmentStates`, sin estilos locales |
| AppointmentRow/Event | Resumen de cita | Hora, identidad, profesional y estado |
| PatientIdentity | Identidad persistente | Sin colores aleatorios |
| DataTable/Toolbar | Datos, filtros, selección, páginas | Semántica de tabla; acciones accesibles |
| MetricStrip | Indicadores con período | Fuente definida; sin tarjetas de relleno |
| Dialog contextual | Tarea breve contextual | Foco, cierre, restauración, scroll |
| Empty/Error/LoadingState | Resultado de carga | Mensaje útil, acción real y sin datos falsos |

Button, Input, Table, Dialog y demás controles se reutilizan desde `components/ui`; estados desde `lib/design.ts` y métricas desde la clase compartida `metric-strip`. La tabla define responsabilidades: nombres como PageHeader o Field no implican que exista un archivo separado. Extraer un componente cuando haya repetición útil; evitar una segunda biblioteca visual.

## 10. Estados comunes

- Vacío: explicar por qué y cómo seguir; «No hay citas para este día. Crear cita».
- Cargando: preservar espacio, informar carga, no presentar cero como resultado final.
- Error: español claro, posibilidad real de reintento, mantener datos ingresados.
- Éxito: confirmar qué se guardó; no depender solo de un toast efímero para una operación importante.
- Deshabilitado: explicar causa cuando no sea evidente. Una vista clínica de lectura no debe parecer inaccesible.
- Foco/hover/selección: estados distintos, consistentes y sin saltos de layout.
- Movimiento: 120–180 ms para cambios de estado; respetar `prefers-reduced-motion`. No introducir revelados animados que retrasen las tareas.

## 11. Texto, iconos y gráficos

Español con tildes; términos de la clínica; acciones con verbo concreto. Lucide, 16–20 px y grosor consistente, acompañado de texto cuando el significado no sea evidente. Mantener logos e ilustraciones con función específica.

Gráficos: título, período, unidad, escala y alternativa tabular/resumen; colores semánticos o series documentadas. No usar color de error para una serie cualquiera. Definir facturado/cobrado y evitar datos inventados, tendencias sin comparación y animaciones decorativas.

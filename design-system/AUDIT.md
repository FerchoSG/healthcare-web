# Auditoría de interfaz de CitaBox y propuesta de diseño

Fecha: 2 de octubre de 2026, Costa Rica.

## Alcance y evidencia

Revisión visual del despliegue `https://agende.consultantssc.com`: panel administrativo, calendario semanal, pacientes, expediente de medicina general, configuración y landing pública de Clínica Escazú. Revisión de la landing en viewport de 390 × 844. Revisión del código de login, recepción, doctor, reservas y sistema de estilos. Las pantallas de doctor y recepción se analizaron por código; no se hicieron sesiones visuales separadas para esos roles. El portal autenticado no se auditó en esta pasada.

Las conclusiones visuales son juicios de diseño. No permiten determinar quién creó una interfaz. La expresión «parece hecho por IA» se interpreta aquí como una composición genérica, repetitiva y con poca relación entre forma y tarea. La eficacia de la propuesta debe validarse durante las entrevistas.

## 1. Diagnóstico

La aplicación ya tiene navegación por rol, tablas de pacientes, agenda y módulos por especialidad. Estos son buenos fundamentos para un producto clínico. La identidad actual pierde fuerza por tres motivos:

1. Repite el mismo contenedor visual para datos, controles, navegación y contenido clínico.
2. Usa color, sombra y tamaño para decorar información que no siempre merece atención.
3. Expone lenguaje del software y controles incompletos en la experiencia del usuario.

El plan anterior `PLAN_REDISENO_UI_CITABOX.md` ya proponía fondo azul pálido, degradados, sidebar blanco, tarjetas flotantes, coral y una sans moderna. Gran parte de esa dirección está implementada. Repetir ese mismo brief con «más limpio», «premium» o «moderno» probablemente produciría una variante de la interfaz actual. El nuevo brief debe precisar tareas, jerarquía, densidad y significado de cada color.

## 2. Hallazgos detallados

### A. Composición y superficies — prioridad alta

**Observado:** fondo con varios degradados; header flotante con radio de 22 px; contenedores de 24 px; tarjetas de 14–16 px; sombras azules incluso en elementos pequeños. Configuración añade una tarjeta azul de gran tamaño y otra tarjeta dentro del panel general.

**Evidencia:** `app/globals.css`, `components/layout/TopHeader.tsx`, `components/layout/Sidebar.tsx`, vistas y plan previo.

**Efecto:** muchas cajas compiten por atención; los bordes y sombras hacen que todo parezca igualmente importante. El fondo azul aparece entre cada módulo y enfatiza la composición de plantilla.

**Cambio propuesto:** fondo neutral continuo, navegación y header integrados a los bordes del espacio de trabajo, divisores de 1 px, tarjetas únicamente cuando exista un grupo independiente. Sombras reservadas para menús, popovers y diálogos. Radios de 6 px en controles y 8–10 px en paneles.

### B. Agenda y significado de los colores — prioridad crítica

**Confirmado por código:** `CalendarEvent.tsx` elige entre seis colores calculando un hash del ID de la cita. El color no representa estado, profesional o servicio. Además, el evento muestra nombre y motivo, pero no muestra el estado como texto.

**Efecto:** una cita completada puede verse coral, verde o azul; el usuario no puede aprender qué significa el color. La agenda tiene aspecto de mosaico. Los bloques de almuerzo se presentan con rojo rayado intenso, aunque son disponibilidad normal.

**Cambio propuesto:** superficie clara en los eventos, texto oscuro, franja lateral discreta para estado y etiqueta textual. En vista diaria, agrupar por profesional mediante columnas; si se usa color por profesional, reservarlo al encabezado y mantener los estados separados. Bloqueos habituales en gris con motivo. Rojo para cancelación o conflicto.

**Contraste calculado sobre los colores sólidos del código:** blanco sobre `#4BADEA` ≈ 2,48:1; sobre `#FF766D` ≈ 2,60:1; sobre `#18A058` ≈ 3,38:1; sobre `#2D7DD2` ≈ 4,22:1. Estos cuatro fondos no alcanzan 4,5:1 para texto pequeño. Los motivos también usan opacidad 0,8, por lo que necesitan una comprobación adicional. La paleta de estados propuesta deberá verificarse antes de implementarse.

**Legibilidad:** nombre a 10 px y motivo a 9 px con truncamiento. Proponer nombres a 12–13 px y mostrar servicio corto, hora y estado; dejar el motivo completo para un detalle lateral.

### C. Estados inconsistentes — prioridad alta

**Confirmado:** «En espera» es ámbar en administrador, recepción y doctor; violeta en historial de pacientes. «En consulta» también cambia entre familias cromáticas.

**Cambio propuesto:** un único mapa compartido de etiqueta, icono y estilo para cada estado. Emplearlo en agenda, dashboard, pacientes, recepción y doctor. El estado debe poder entenderse sin distinguir colores.

### D. Header y navegación — prioridad alta

**Observado:** el encabezado dice «Panel administrativo» también en Calendario, Pacientes y Configuración. El panel añade «Dashboard de CitaBox», generando dos títulos generales. El selector de clínica es útil y debe seguir visible.

**Confirmado:** el input «Buscar pacientes, citas o servicios» de `TopHeader.tsx` no tiene handlers ni lógica de resultados. La campana tiene una lista de notificaciones fija vacía. No se debe presentar ninguno de los dos como una capacidad completa.

**Cambio propuesto:** título de la sección actual; contexto de clínica persistente; buscador conectado a datos reales o sustituido por la búsqueda local funcional; acción contextual «Nueva cita» en agenda y «Nuevo paciente» en pacientes. Definir el comportamiento de notificaciones antes de mantener la campana.

**Lenguaje:** sustituir «Clínica SaaS» bajo el logo por el nombre de la clínica o una descripción útil. El nombre técnico del modelo comercial no aporta contexto operativo.

### E. Panel administrativo — prioridad alta

**Observado:** cuatro métricas iguales; gráfico de ingresos con más ancho que la agenda; módulos «Pacientes recientes» y «Estado operativo» debajo. El panel tiene información real, pero la composición no establece una tarea principal.

**Cambio propuesto:** agenda y asuntos pendientes arriba; métricas en una banda compacta; sección de análisis con períodos explícitos. Para administrador, mostrar cobros y pendientes de cierre; para recepción, llegadas y caja; para doctor, siguiente paciente y consulta activa.

**Semántica financiera:** `analytics.service.ts` suma `Invoice.total_amount` y la UI lo llama «Ingresos». Ese cálculo representa montos facturados, no necesariamente dinero cobrado. Antes de cambiar la gráfica, precisar «Facturado este mes» y «Cobrado este mes» con cálculos distintos. No introducir indicadores sin datos disponibles.

**Gráfico:** en la captura revisada se veía una línea plana junto a un total mensual distinto de cero. Esto requiere una comprobación de datos, períodos y renderizado; la observación por sí sola no identifica la causa. El eje de importes está oculto en el código. Mostrar escala y período; sustituir el gráfico por un estado vacío explícito si no hay datos.

### F. Pacientes — prioridad media

**Observado:** la tabla permite escanear nombre, identificación, edad y contacto. Es una de las partes más útiles de la interfaz. Encima hay tres tarjetas: pacientes registrados, página actual y nuevos en pantalla. Cada fila repite dos botones grandes.

**Cambio propuesto:** colocar el total junto al título; llevar página actual a la paginación; eliminar la métrica «Nuevos en pantalla» del encabezado. El código calcula altas de los últimos 30 días únicamente sobre la página cargada, así que no debe convertirse en un indicador global mensual.

Nombre como enlace al expediente, una acción secundaria de historial y botón principal «Nuevo paciente» en la barra de herramientas. Filas de aproximadamente 48–56 px en escritorio, ajustables cuando el contenido lo requiera. Conservar una interacción explícita y accesible; evitar hacer que toda la fila tenga acciones ambiguas.

### G. Expediente — prioridad alta

**Observado:** modal casi a pantalla completa; campos deshabilitados de bajo contraste en modo lectura; gran área vacía; botón «Guardar expediente clínico» deshabilitado aun cuando la tarea es consultar información.

**Cambio propuesto:** pantalla de expediente con identidad persistente, estado de consulta, historia por fecha y contenido del registro. En lectura, renderizar datos como texto legible, no como un formulario deshabilitado. Al iniciar consulta, activar una composición editable con guardado, validación y aviso de cambios pendientes.

Diseño sugerido: historial a la izquierda, contenido al centro, acciones de consulta arriba. Los módulos de odontología, ginecología y recetas mantienen esa estructura y agregan sus herramientas específicas. La migración requiere cuidar consulta activa, permisos y cambios sin guardar; no basta con retocar CSS.

### H. Configuración — prioridad media

**Observado:** formulario y resumen lateral, con una tarjeta azul llamativa que repite nombre y dirección. Texto visible: «El dominio sugerido para v1 es citabox.app» y soporte operativo.

**Cambio propuesto:** secciones «Datos de la clínica», «Atención y especialidades», «Reservas» y «Equipo» con ayudas relacionadas con la decisión de cada campo. El resumen lateral puede convertirse en una vista previa compacta de la página pública. Retirar el comentario sobre v1 y dominio sugerido del flujo del cliente.

### I. Login y textos — prioridad alta

**Evidencia:** captura aportada por el usuario y `AuthScreen.tsx`.

**Observado:** error en inglés («Invalid credentials»), varios textos sin tildes y acceso «Preparar alta» a un formulario cuyo submit muestra que el backend de registro está pendiente.

**Cambio propuesto:** «Acceso del personal» y enlace diferenciado «Soy paciente»; error «El correo o la contraseña no son correctos»; mantener etiquetas, autocompletado y mostrar contraseña con nombre accesible. Sustituir el alta incompleta por un contacto comercial operativo si existe un canal real.

No afirmar que un correo existe ni revelar información de la cuenta. El error puede ser claro sin divulgar ese dato.

### J. Reservas públicas — prioridad alta

**Observado:** título «Agenda tu cita con una experiencia clara, rápida y hecha para Costa Rica» ocupa numerosas líneas. Los párrafos explican que CitaBox ordena agenda, recepción y expediente. Tres servicios de portada vienen de arrays genéricos según sea dental o no dental, no del catálogo real.

**Efecto:** la página presenta el software y retrasa la elección de servicio. En 390 × 844 el título ocupa gran parte de la primera pantalla; servicios y disponibilidad quedan más abajo.

**Cambio propuesto:** encabezado «Reserva tu cita en [clínica]», especialidad, ubicación y contacto reales. Mostrar servicios habilitados con precio y duración reales, selección de profesional y disponibilidad dentro del flujo. Conservar «Reservar cita» como acción principal. «Gestionado con CitaBox» puede ir en el pie. Usar identidad de la clínica y fotografía propia únicamente cuando se disponga de ella.

### K. Tipografía y estilos — prioridad media

**Confirmado:** CSS declara Plus Jakarta Sans y Geist, pero `layout.tsx` no carga `next/font`; no se encontró importación de esas fuentes en app/components. Declarar una familia no garantiza que esté instalada o descargada. La fuente efectiva de sustitución no se midió.

**Cambio propuesto:** cargar explícitamente una sola familia o emplear de forma deliberada una pila de sistema. Definir cuerpo a 14 px en escritorio y 16 px en formularios móviles; metadata generalmente a 12 px; títulos de sección 20–24 px. Usar pesos 400, 500 y 600, reservando 700 para casos puntuales. Números tabulares para horas, importes y métricas.

También hay `styles/globals.css` con otro sistema de tokens y ningún import encontrado; parece una hoja sin uso. Confirmar referencias antes de eliminarla. `app/globals.css` conserva nombres `neon-green` que ahora apuntan a azul y múltiples parches globales para colores hardcoded en modo oscuro. Reemplazar gradualmente esos alias por tokens semánticos.

### L. Accesibilidad — prioridad alta

`<html lang="en">` no coincide con la interfaz española. Hay botones de icono sin nombre accesible en header/calendario y celdas vacías de agenda que usan un `div` clickeable. Corregir idioma, nombres, foco y funcionamiento por teclado. Los tamaños de 9–11 px son una señal de riesgo de legibilidad, no una infracción automática por sí mismos.

WCAG 2.2 AA establece 4,5:1 para texto normal y 3:1 para texto grande, con excepciones. El criterio de objetivos de puntero usa 24 × 24 CSS px o separación/excepciones previstas; proponemos 40–44 px como objetivo práctico para controles táctiles, sin atribuir ese tamaño al mínimo AA.

## 3. Dirección visual recomendada

**Personalidad:** herramienta de trabajo clínica, tranquila, precisa y reconocible. La identidad surge de la organización de agenda, pacientes e historia clínica, además del color y el logo.

### Sistema base propuesto

| Elemento | Propuesta inicial | Motivo |
|---|---|---|
| Fondo | `#F5F6F4` | Neutral, evita el baño azul permanente |
| Superficie | `#FFFFFF` | Lectura y separación simple |
| Texto | `#202925` | Oscuro, legible |
| Texto secundario | `#59635D` | Metadata sin desaparecer |
| Borde | `#DCE1DC` | Grupos separados sin sombras |
| Acción principal | `#245C4A` | Acento verde sobrio y limitado |
| Navegación activa | Fondo claro + indicador lateral | Identificación estable sin botón flotante |
| Radio | 6 px controles; 8–10 px paneles | Composición menos inflada |
| Espaciado | Escala 4/8/12/16/24/32 px | Ritmo consistente |
| Sombra | Solo capas superpuestas | Profundidad con significado |

Esta paleta es una propuesta, no una exigencia para parecer profesional. Se puede conservar el azul actual como acción principal si se retiran los excesos de composición. Cambiar únicamente la paleta no resolvería los problemas detectados.

### Estructura del inicio

```text
Navegación     Clínica activa / Hoy                Buscar paciente
              Viernes 2 de octubre                 [Nueva cita]

              8 citas · 2 en espera · 1 en consulta · 3 por cerrar

              Agenda del día                      Pendientes
              Hora / Paciente / Doctor / Estado   Confirmaciones
              Filas accionables                    Cierres y cobros

              Facturado / Cobrado                 Actividad reciente
              Período claro y escala visible      Datos relevantes
```

Los números del esquema son ilustrativos, no representan un nuevo cálculo del servidor. En el rol médico, la consulta activa ocupa el lugar principal. En recepción, la lista de llegada y caja.

## 4. Referencias investigadas

- [Cliniko: calendario y reservas](https://www.cliniko.com/features/appointments/): vistas flexibles, profesionales, tipos de cita con significado y operaciones desde la agenda. Referencia de organización de tareas; no se evaluó su producto autenticado.
- [Jane: uso de agenda](https://jane.app/guide/working-with-the-schedule): referencia de flujo de trabajo centrado en profesionales y citas. No implica copiar su identidad.
- [Nielsen Norman Group: jerarquía visual](https://www.nngroup.com/articles/visual-hierarchy-ux-definition/): tamaño, contraste y agrupación deben dirigir la atención según importancia.
- [GOV.UK: tablas](https://design-system.service.gov.uk/components/table/): estructura para comparar y escanear información. Referencia de claridad, no de apariencia institucional.
- [W3C: contraste](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) y [objetivos de puntero](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html): criterios verificables para la revisión.

## 5. Orden de implementación

### Etapa 1: base visual y credibilidad

1. Consolidar tokens de superficie, texto, acciones, bordes y estados.
2. Revisar fuente, idioma español, pesos y tamaños.
3. Integrar sidebar y header, título contextual y acciones específicas.
4. Resolver buscador, notificaciones y alta incompleta.
5. Corregir contraste y significado del color de agenda.
6. Corregir textos de acceso y diferenciar personal de pacientes.

Archivos: `app/globals.css`, `app/layout.tsx`, `app/page.tsx`, `Sidebar.tsx`, `TopHeader.tsx`, `AuthScreen.tsx`, `CalendarEvent.tsx`, `CalendarCell.tsx` y mapa compartido nuevo de estados.

### Etapa 2: pantallas de uso diario

1. Agenda con modo diario por profesional y detalle lateral.
2. Panel por rol con agenda y asuntos pendientes prioritarios.
3. Tabla de pacientes con barra compacta, búsqueda y acción principal.
4. Clarificar facturado y cobrado con datos respaldados por API.
5. Adaptaciones para teléfono y navegación con teclado.

### Etapa 3: expediente y personalización por clínica

1. Prototipar expediente como espacio de trabajo persistente y lectura clara.
2. Migrar consulta activa preservando permisos y guardado.
3. Reservas con catálogo real, identidad de clínica y textos del paciente.
4. Configuración organizada por decisiones y vista previa pública.

## 6. Validación para las cinco entrevistas

No preguntar únicamente si la interfaz es bonita. Pedir tareas y observar:

- Encontrar la siguiente cita y distinguir su estado.
- Crear una cita y detectar un horario bloqueado.
- Buscar un paciente y abrir el registro más reciente.
- Identificar una consulta pendiente de cierre.
- Entender diferencia entre montos facturados y cobrados.
- Elegir servicio y horario desde un teléfono.

Registrar tiempo, errores, ayudas necesarias y términos que no se entiendan. Como metas iniciales de producto, no como resultados ya obtenidos: siguiente cita en menos de 5 segundos; agenda y estados entendidos sin explicación; acceso a expediente en no más de dos acciones desde el resultado de búsqueda.

Antes de publicar: comprobar estos flujos con datos existentes, roles, cambio de clínica, estados vacío/cargando/error, pantalla de teléfono, teclado, foco y contraste. Comparar la composición nueva con la actual usando las mismas tareas.

## Recomendación

Comenzar con header/sidebar, agenda y pacientes, aplicando un sistema visual compartido. Estos cambios son los más visibles en las entrevistas y cubren el trabajo diario. La transición del expediente debe planearse por separado porque altera la forma de trabajar con la consulta. La coherencia y la especificidad clínica darán al producto una identidad mucho más fuerte que añadir otra capa de efectos visuales.

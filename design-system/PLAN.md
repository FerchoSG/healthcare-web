# Plan de adopción del sistema

Estado: documentación y migración completa realizadas en la misma iteración, 3 de octubre de 2026. Las etapas indican el orden de trabajo; ninguna pantalla actual queda reservada para una futura migración visual. Evidencia y alcance en `VERIFICATION.md`.

## 0. Contrato permanente — aplicado

Investigación primaria, paleta clara/oscura, tokens canónicos, patrones, referencia, AGENTS, checklist y gate automático. CSS generado compartido con la aplicación; 38 pares de contraste verificados. El gate rechaza colores, degradados, radios y pesos fuera del contrato.

## 1. Fundamentos y espacio de trabajo — aplicado

Tokens y mapeo Tailwind, idioma es-CR, tipografía de sistema, controles compartidos, navegación, header y acceso. Búsqueda global conectada a pacientes; clínica activa y acciones por sección; eliminado el control de notificaciones sin flujo. Una hoja global de estilo.

## 2. Agenda y pacientes — aplicado

Día/semana, filtro de profesionales, citas simultáneas visibles, estados compartidos y detalle contextual con Dialog. Directorio con búsqueda, paginación y filas resumidas para teléfono. Se mantienen las utilidades de fecha y la validación existente de disponibilidad/conflictos.

## 3. Paneles por rol — aplicado

Administración con períodos claros, banda de indicadores y facturación respaldada por API; agenda prioritaria y alternativa tabular del gráfico. Recepción y doctor conservan sus tareas de llegada, consulta y cierre con el mismo lenguaje visual y estados.

## 4. Expediente y especialidades — aplicado

Espacio a pantalla completa, identidad persistente, registros seleccionables por fecha, lectura clínica sin formularios atenuados, consulta activa y guardado explícito. Aviso de cambios pendientes, validación de receta y PDF del registro seleccionado. Odontograma y ginecología dentro del mismo contrato.

## 5. Público y configuración — aplicado

Catálogo real de servicios, precio CRC/duración, reserva por pasos con avance explícito y reflujo móvil. Portal del paciente con datos de API y estados legibles. Perfil de clínica, equipo, servicios y formularios migrados.

## Publicación y continuidad

Antes de publicar: TypeScript, ESLint, contrato de diseño, build de producción y comprobación visual de los flujos afectados. Capturar evidencia. Mantener `VERIFICATION.md` con resultados reales; las comprobaciones estáticas no certifican toda la accesibilidad ni sustituyen entrevistas.

El workflow `Design system` se ejecuta en push y PR. Para impedir merges fallidos, configurar su check `contract` como requerido en las reglas de la rama. No se modificó una regla remota de protección en esta entrega; el workflow por sí solo no impide publicaciones directas de Vercel.

## Validación en las primeras cinco entrevistas

Pedir cinco tareas: localizar siguiente cita, identificar su estado, crear cita, encontrar expediente y reservar desde teléfono. Medir tiempo, errores y ayudas; anotar palabras confusas. Personalizar datos de la clínica dentro del contrato. Cambiar el patrón compartido cuando se repita un problema; evitar composiciones diferentes por entrevista.

Metas iniciales: siguiente cita identificable en 5 segundos, estados comprendidos sin explicación, expediente en dos acciones desde resultados. Son objetivos por validar, no resultados medidos.

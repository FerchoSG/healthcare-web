# CitaBox: instrucciones permanentes de interfaz

Antes de modificar cualquier interfaz, leer `design-system/README.md`, `design-system/PATTERNS.md` y `design-system/PLAN.md`.

## Dirección obligatoria

- Seguir CitaBox «Clínica clara» v1.0.0. `design-system/tokens.json` es la fuente de verdad de colores, tamaños, espaciado y estados. `design-system/reference.html` muestra la composición de referencia.
- Usar superficies planas, azul petróleo para acciones, tipografía de sistema deliberada y colores de estado compartidos. La legibilidad clínica y la estabilidad de la línea visual tienen prioridad sobre recomendaciones genéricas de variar estética, tipografías, temas o animaciones en cada generación.
- No añadir otra paleta, degradados decorativos, glassmorphism, colores derivados de IDs, tarjetas para paginación, sombras de paneles, fuentes nuevas ni clases de colores directos en vistas.
- Reutilizar `components/ui` y los componentes de dominio comunes. No crear botones, inputs o badges paralelos para cada pantalla.
- Un estado mantiene etiqueta y tono en agenda, recepción, doctor, pacientes y portal. `appointmentStates` define el contrato. Mostrar texto, además del color.
- Texto en español de Costa Rica, moneda CRC y fechas con utilidades de clínica. No exponer detalles de implementación, versiones, TODOs, controles ficticios o métricas sin respaldo.
- Conservar permisos, cambio de clínica, zona horaria, consulta activa, citas, cobros y recetas al migrar UI. En lectura clínica usar contenido legible, no formularios atenuados.

## Migración y futuras entregas

- Todas las vistas actuales adoptaron el contrato en la iteración del 3 de octubre de 2026. Mantener componentes completos dentro de esta línea. El contrato documentado reemplaza el plan visual anterior.
- Nuevas vistas deben seguir el contrato desde su creación. Si falta un patrón, extender el componente compartido y documentarlo antes de utilizarlo en una vista.
- Añadir un token o excepción requiere necesidad concreta, versión de contrato, actualización de referencia y comprobación de contraste. Registrar la decisión en `design-system/DECISIONS.md`. No cambiar la línea visual espontáneamente.
- La personalización de clínica permite logo, datos, fotografía propia y un acento público validado. No cambia semántica de estados, estructura del espacio clínico, tipografía o accesibilidad.
- Ejecutar `npm run design:check` antes de entregar; en PR usar `npm run design:check -- --base <base-ref>`. El gate revisa contraste y estilos añadidos; no sustituye revisión visual o de accesibilidad.
- Completar `design-system/CHECKLIST.md`: escritorio, teléfono, teclado, vacío/carga/error, ambos temas cuando corresponda y flujo del rol afectado. Guardar evidencia visual de cambios de interfaz.
- No afirmar que está desplegado, accesible o probado si solo se modificó documentación o se generó la referencia.

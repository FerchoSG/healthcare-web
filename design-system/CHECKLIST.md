# Aceptación de cambios de interfaz

Copiar esta lista en la descripción del cambio y marcar solo lo revisado.

## Contrato

- [ ] Leí README/PATTERNS/PLAN y reutilicé componentes.
- [ ] Colores, radios y tipos proceden del contrato; no añadí otra estética.
- [ ] Estado, etiqueta y tono consistentes con todas las pantallas.
- [ ] Personalización limitada a lo permitido, con combinaciones contrastadas.
- [ ] Si extendí el sistema, documenté motivo, versión, patrón y referencia.
- [ ] `npm run design:check -- --base <ref>` pasó para el cambio completo.

## Claridad y accesibilidad

- [ ] Título/contexto de sección y acción principal correctos.
- [ ] Texto en español, sin detalles internos ni capacidades ficticias.
- [ ] Labels y errores relacionados; botones de icono con nombre.
- [ ] Teclado y foco visible, sin foco tapado; modal devuelve el foco.
- [ ] Contraste del contenido real, no solo tokens; sin dependencia exclusiva del color.
- [ ] Zoom 200%, reflow a 320 CSS px y vista móvil 390 px revisados; tablas/calendarios con solución explícita cuando requieren dos dimensiones.
- [ ] Inputs móviles 16 px y controles táctiles 44 px como objetivo del producto.
- [ ] Ambos temas revisados si la pantalla admite tema oscuro.
- [ ] Vacío, carga, error, éxito y datos extensos revisados.
- [ ] Movimiento reducido respetado; sin animaciones que retrasen tareas.

## Comportamiento

- [ ] Fuente, unidad y período de métricas claros.
- [ ] Clínica activa y permisos del rol correctos.
- [ ] Zona horaria, citas, cobros y consulta activa conservados según lo afectado.
- [ ] No perdí datos ingresados ni cambios clínicos sin aviso.
- [ ] Revisé el flujo afectado completo y el build cuando cambió código de aplicación.
- [ ] Capturas antes/después adjuntas; distingo referencia local de producción.

La comprobación automática no certifica conformidad WCAG ni sustituye esta lista. Las reglas de rama, revisión visual y biblioteca común completan la protección contra desviaciones.

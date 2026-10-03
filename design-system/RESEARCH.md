# Investigación aplicada al diseño

Fuentes primarias consultadas el 2 de octubre de 2026. Las conclusiones para CitaBox son decisiones propias basadas en estos principios; no existe un color universal que garantice confianza o atractivo para toda clínica.

| Fuente | Principio utilizado | Decisión en CitaBox |
|---|---|---|
| [NHS: color](https://service-manual.nhs.uk/design-system/styles/colour) | Color según función, variables compartidas y combinaciones contrastadas | Tokens semánticos, estados fijos y comprobación de pares |
| [NHS: tipografía](https://service-manual.nhs.uk/design-system/styles/typography) | Jerarquía de headings y aplicación consistente | Escala definida y una familia cargada o pila explícita |
| [NHS: botones](https://service-manual.nhs.uk/design-system/components/buttons) | Acciones claras, prioridad y tamaño usable | Acción contextual, variantes limitadas, controles táctiles |
| [NHS: iconos](https://service-manual.nhs.uk/design-system/styles/icons) | Iconos según necesidades, con alternativa comprensible | Texto acompañante y nombres accesibles |
| [NHS: contenido](https://service-manual.nhs.uk/content/how-we-write) | Contenido claro y orientado al usuario | Español directo, terminología clínica, sin jerga de implementación |
| [NHS: errores](https://service-manual.nhs.uk/design-system/components/error-message) | Ayudar a corregir información | Errores por campo, conservar datos y guía accionable |
| [NN/g: jerarquía visual](https://www.nngroup.com/articles/visual-hierarchy-ux-definition/) | Prioridad por tamaño, contraste y agrupación | Agenda/tareas principales y métricas compactas |
| [GOV.UK: tablas](https://design-system.service.gov.uk/components/table/) | Comparación y lectura por filas/columnas | Directorio y agenda listada con semántica de tabla |
| [Cliniko: agenda](https://www.cliniko.com/features/appointments/) | Vistas operativas y códigos con significado | Día/semana, profesional y estado distinguibles |
| [Jane: agenda](https://jane.app/guide/working-with-the-schedule) | Trabajo centrado en citas y profesionales | Flujo de agenda contextual por rol |

Se estudiaron documentación y páginas públicas de Cliniko/Jane; no se hizo una evaluación de sus aplicaciones autenticadas ni de su eficacia con los usuarios de CitaBox. La identidad del NHS y su tipografía/licencias no se adoptan.

## Criterios verificables

- [WCAG 2.2, 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html): texto normal 4,5:1; texto grande 3:1, con excepciones del criterio. El script compara valores sin redondear para decidir aprobación.
- [WCAG 2.2, 1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html): información visual necesaria en controles/gráficos a 3:1. Bordes decorativos no cumplen la misma función que límites de inputs.
- [WCAG 2.2, 1.4.1](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html): el color no es el único medio de comunicar estado. Añadir etiqueta/icono/contexto.
- [WCAG 2.2, 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html): mínimo de 24 × 24 CSS px o separación y excepciones previstas. CitaBox elige 44 px como objetivo táctil, no como afirmación del mínimo AA.
- [WCAG 2.2, 2.4.11](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html): el foco no queda completamente oculto. Revisar encabezados fijos, paneles y diálogos.

## Qué validar con clientes

El atractivo y la preferencia por azul petróleo/neutros son hipótesis de marca. Validar reconocimiento de clínica, lectura de agenda, comprensión de estados y percepción de claridad durante entrevistas. Cambiar un token compartido si la evidencia lo requiere; conservar composición y comportamiento coherentes.

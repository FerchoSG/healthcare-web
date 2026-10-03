# Verificación de la iteración visual

Fecha: 3 de octubre de 2026. Contrato: Clínica clara 1.0.0.

## Alcance implementado

Todas las vistas actuales: acceso y selección de clínica; shell/navegación/header; administración, doctor y recepción; calendario; pacientes; expediente, odontograma, ginecología y recetas; configuración/equipo/servicios; catálogo público, reserva y portal. Se reutilizan componentes y tokens compartidos. La edición del expediente se ofrece al rol doctor, según el requisito existente de la API de guardar con un profesional de la clínica.

No se añadieron dependencias de diseño. Se retiraron gradientes decorativos, colores por ID, fuentes sin carga, controles ficticios y una hoja global duplicada. Se corrigieron las etiquetas de formularios y el comportamiento del aviso de cambios pendientes.

## Comprobaciones realizadas

| Comprobación | Resultado y alcance |
|---|---|
| TypeScript | Sin errores en aplicación y pruebas existentes |
| ESLint | Sin errores ni advertencias en app, components, lib, services, scripts y tests |
| Contrato | 38 pares de contraste, estados equivalentes al enum API y CSS generado consistente |
| Prueba negativa del gate | Un archivo temporal con color directo, hex, gradiente, radio y peso no permitidos fue rechazado; archivo eliminado |
| Build Next.js | Compilación y generación de las seis rutas actuales correctas |
| Acceso | Admin, doctor, recepción y paciente autenticados contra API desplegada; selección de clínica administrativa comprobada |
| Administración | Indicadores y gráfico con datos reales de demo; importes CRC y períodos claros |
| Agenda | Día/semana y filtro por Carlos Méndez; citas simultáneas visibles; lista sin recorte a ocho resultados |
| Pacientes | Búsqueda por identificación y búsqueda global por Rafael; expedientes vacíos y con historial |
| Expediente | Selección de registro por fecha cambia contenido; odontograma y lectura ginecológica con fechas almacenadas; aviso de salida conserva o descarta borrador; finalizar con cambios pendientes pide guardar |
| PDF | API y proxy devuelven HTTP 200/application/pdf, firma %PDF y 36 929 bytes; archivo de Rafael descargado por Chrome. Sesión vencida tiene mensaje específico |
| Reserva | Catálogo de cinco servicios, selección, fecha disponible, horario, datos y revisión final conservados. Se llegó hasta revisión sin crear una reserva |
| Portal | Perfil y cinco citas de María cargados, estados en español; receta vacía según sus datos |
| Configuración | Perfil, servicios y formulario de servicio revisados; etiquetas asociadas a campos |
| Temas | Aplicación clara/oscura y referencia clara/oscura revisadas |
| Teléfono | Catálogo, reserva, directorio, navegación, perfil y formulario a 390 px; reflujo adicional a 320 px sin desbordamiento de página en configuración. Tablas de servicios/agenda mantienen scroll interno cuando requieren dos dimensiones |

## Evidencia y límites

Capturas guardadas en `../../docs/ui-evidence` del workspace principal. La referencia `reference.html` se revisó en escritorio y teléfono; contiene ejemplos ficticios.

Esta revisión visual y funcional no es una certificación WCAG ni una ejecución completa de la suite E2E. No se ejercitaron escrituras de reservas, guardado clínico, cobros, bajas o eliminación contra producción durante esta iteración. Las pruebas existentes fueron adaptadas a labels y navegación nuevos, y aceptan contraseñas por variables E2E para entornos de prueba; sus valores por defecto pertenecen al seeder local.

El gate revisa combinaciones del contrato y patrones frecuentes del diff; no detecta todas las posibles desviaciones. El check `Design system / contract` debe configurarse como requerido en reglas de rama para bloquear merges fallidos. No se modificó la protección remota.

La validación de utilidad y atractivo con las primeras cinco clínicas sigue el protocolo de `PLAN.md`; todavía no hay métricas de entrevistas.

# CitaBox · Clínica clara

Contrato de diseño **1.0.0**, documentado el 2 e implementado el 3 de octubre de 2026. Todas las vistas actuales adoptan esta línea en la misma iteración. Consultar `VERIFICATION.md` para evidencia y alcance de las comprobaciones.

## Decisión visual

Diseñar para recepción, profesionales, administradores y pacientes: información clara, identidad clínica y acciones previsibles. Priorizar agenda, continuidad de atención y tareas pendientes. La apariencia surge de la proporción, alineación, contenido específico y contraste.

Se adopta una única dirección: azul petróleo, superficies neutras, bordes discretos, radio moderado y tipografía legible. Las propuestas cromáticas preliminares de la auditoría y `PLAN_REDISENO_UI_CITABOX.md` quedan como antecedentes; este contrato es la referencia vigente.

## Documentos y herramientas

- `tokens.json`: fuente canónica, temas claro/oscuro y semántica de estados.
- `tokens.css`: archivo generado; nunca editar manualmente.
- `reference.html`: referencia visual interactiva; ejemplos ficticios, sin conexión a API.
- `PATTERNS.md`: composición y comportamiento de pantallas y componentes.
- `PLAN.md`: orden, archivos afectados y criterios de entrega.
- `CHECKLIST.md`: aceptación de cada cambio.
- `VERIFICATION.md`: cambios realizados, comprobaciones y límites de esta entrega.
- `DECISIONS.md`: decisiones y evolución del contrato.
- `RESEARCH.md`: fuentes primarias y aplicación al producto.
- `../AGENTS.md`: instrucciones persistentes para asistentes y desarrolladores.

```sh
npm run design:generate
npm run design:check
npm run design:check -- --base origin/master
```

El generador produce `tokens.css` y `app/design-tokens.css` desde el mismo JSON. La aplicación importa el segundo archivo. El check exige igualdad de ambos, verifica 38 pares de contraste y examina nuevas líneas de interfaz en el diff.

## Paleta y significado

| Token claro | Valor | Uso |
|---|---|---|
| action | `#175C66` | Acciones principales, enlaces y selección |
| canvas | `#F5F7F6` | Fondo continuo del espacio de trabajo |
| surface | `#FFFFFF` | Formularios, tablas y documentos |
| surface-alt | `#ECF2F0` | Grupos secundarios y hover |
| text | `#1F2D2A` | Lectura y títulos |
| text-muted | `#55655F` | Metadata y ayudas legibles |
| info | `#245C86` | Confirmación o información |
| success | `#236548` | Acción completada |
| warning | `#885B12` | Espera o tarea que necesita atención |
| danger | `#A52B36` | Error, cancelación o acción destructiva |

Fondos suaves y equivalentes oscuros están definidos en el JSON. Verde/azul como elección de identidad es una decisión de CitaBox, no una afirmación de que un color garantice confianza médica o ventas. La recepción de esta identidad se validará con usuarios de clínicas.

El borde decorativo `border` no tiene que identificar un control: para inputs y límites necesarios usar `control-border`, contrastado a 3:1. No aplicar opacidad al texto de estado o del evento de agenda.

## Tipografía y ritmo

- Una pila de sistema explícita, de acuerdo con el dispositivo; evita descargas y fuentes declaradas sin carga. No exigir que todos los sistemas operativos rendericen exactamente la misma fuente.
- Metadata 12 px; cuerpo operativo 14 px; inputs móviles 16 px; secciones 18 px; títulos de página 24 px.
- Pesos 400/500/600; 700 solo para énfasis puntual. No usar 800/900 como estilo por defecto.
- Interlineado mínimo de diseño 1,45 en lectura; números tabulares para hora, importe y fecha.
- Espacios 4/8/12/16/24/32/48 px. Evitar medidas particulares repetidas por vista.
- Radios: controles 6 px; paneles 10 px; diálogos 12 px. Círculos solo en avatares/indicadores y badges de estado.
- Controles 40 px en escritorio y 44 px en interacción táctil. Filas 48–56 px o mayor si el contenido lo requiere.
- Sombra solo para capas superpuestas. Nada de degradados decorativos, brillos ni paneles translúcidos.

Estos tamaños son decisiones del producto; no se presentan como requisitos literales de WCAG.

## Integración técnica aplicada

1. Generar desde el JSON un `app/design-tokens.css` idéntico a `design-system/tokens.css` y cargarlo desde `app/globals.css`.
2. Mapear Tailwind: `background→canvas`, `card→surface`, `foreground→text`, `muted-foreground→text-muted`, `primary→action`, `primary-foreground→on-action`, `ring→focus`; añadir `status-*` y `control-border`.
3. Usar los componentes compartidos `Button`, `Input`, `Table`, `Dialog` y el helper `lib/design.ts`. Las vistas no duplican colores o tamaños.
4. Importar semántica de estados del contrato mediante un helper tipado; nunca derivar colores del ID.
5. Retirar la hoja duplicada `styles/globals.css` y los estilos decorativos anteriores. No mantener dos hojas de tokens en competencia.

## Cómo evitar desviaciones

La consistencia se sostiene con contrato, componentes, instrucción persistente y revisión automática/manual. El workflow local añadido ejecutará el gate en GitHub al publicar estos cambios. Para impedir merges que fallen, el administrador del repositorio debe establecer el check **Design system / contract** como requerido en las reglas de la rama; un workflow por sí solo no impide un merge manual ni controla publicaciones directas de Vercel.

El detector estático reconoce patrones comunes, no toda desviación visual posible. Nuevos archivos se revisan; CSS generado tiene una excepción estricta de igualdad con el contrato. SVGs de dominio como odontogramas pueden necesitar colores técnicos; registrarlos como tokens específicos y añadir pares de contraste cuando comuniquen información.

## Personalización para clientes

Permitido: nombre, logo, datos públicos, servicios, módulos por especialidad, fotografía propia y acento público accesible. Validar todas las combinaciones de un acento personalizado; usar el color base si falla. No oscurecer automáticamente el logo del cliente en tema oscuro.

Fijo: navegación de trabajo, tipografía, espaciado, estados, controles, accesibilidad y jerarquía. El logo se adapta dentro del espacio previsto; el layout no se rediseña por clínica.

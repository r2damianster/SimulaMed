# CLAUDE.md

Guía de contexto para Claude Code (u otro asistente) al trabajar en este repositorio.

## Qué es este proyecto

Simulador de anamnesis clínica para estudiantes de Medicina (materia Habilidades y Destrezas, FCSEE — Universidad UTE). Entrena el interrogatorio al paciente y el llenado del Formulario MSP 002. Es la versión 0-cost de la propuesta "Proyecto SimulaMed", que originalmente dependía de Character.AI + Google Pinpoint + Gemini Pro.

## El ciclo de simulación (lo esencial, no romper)

La asimetría entre entrada y salida es una decisión pedagógica deliberada:

1. El estudiante se identifica (nombre, paralelo, modalidad pares/individual).
2. Sala de espera: ficha de admisión con edad, sexo y ocupación. **El motivo de consulta NO se muestra escrito.**
3. El paciente entra y **abre la consulta hablando** (`saludo_inicial`): una molestia vaga, sin detalles.
4. El estudiante **escribe o graba** sus preguntas (modo configurable por docente). Su entrada sí la ve.
5. El paciente responde: **solo audio**. En el chat aparece una burbuja "🔊 El paciente respondió", sin el texto.
6. El estudiante anota lo que escucha en el Formulario MSP 002, que vive junto al chat.
7. Al cerrar la consulta se revela la transcripción completa, el caso real y la calificación.

**Entrada: texto o voz.** Default es escribir (obliga a precisión clínica, evita `SpeechRecognition` de Chromium). Opcionalmente, docente puede activar "Permitir entrada de voz con Whisper" en los ajustes — estudiante graba pregunta, Whisper transcribe, estudiante revisa transcripción antes de enviar.

**Por qué el paciente no muestra texto:** obliga a escuchar y retener, que es la competencia real de la anamnesis. El formulario MSP 002 en pantalla es el cuaderno donde se descarga lo escuchado; sin él el ejercicio no cierra.

Si se edita la interfaz, no reintroducir el texto del paciente durante la consulta ni mostrar el motivo de consulta por escrito antes de que lo diga. El interruptor "Mostrar por escrito lo que dice el paciente" del panel del docente existe solo como accesibilidad y como salida de emergencia si falla el audio del laboratorio.

## Arquitectura

- **Un solo archivo de interfaz** (`index.html`, HTML + CSS + JS vanilla, sin build step, sin framework, sin npm) más una función serverless (`api/groq.js`).
- **`api/groq.js`**: Vercel Edge Function que reenvía peticiones a Groq agregando `Authorization` desde `GROQ_API_KEY`. El navegador nunca ve la clave. Soporta dos modos:
  - `?mode=chat` (default): reenvía a `/openai/v1/chat/completions` para generar casos, paciente, evaluación.
  - `?mode=transcribe`: recibe `multipart/form-data` con audio, reenvía a `/openai/v1/audio/transcriptions` con modelo `whisper-large-v3-turbo` y lenguaje `es`.
- **Generación de caso**: prompt a Groq que devuelve JSON con datos demográficos, un `saludo_inicial` hablado y un `guion_clinico` oculto (antecedentes, revisión por sistemas, signos vitales, diagnóstico presuntivo + CIE-10).
- **Paciente conversacional**: cada turno se envía junto con el `guion_clinico` como contexto de sistema. El prompt limita las respuestas a 2-3 frases cortas — porque el estudiante las escucha, no las lee, y no puede retener parrafadas.
- **Entrada de voz (opcional)**: docente puede activar "Permitir entrada de voz" en ajustes. Estudiante graba pregunta con `MediaRecorder`, blob se envía a `/api/groq?mode=transcribe`, Whisper devuelve texto, se muestra en preview para revisar antes de enviar. Si docente desactiva, vuelve a input de texto.
- **Voz de salida**: solo `SpeechSynthesis` (TTS). Reproduce respuesta del paciente con voces del sistema.
- **Evaluación**: se envía la transcripción **y el formulario MSP 002 llenado por el estudiante**. La rúbrica califica dos dimensiones: calidad del interrogatorio y fidelidad del registro (qué dijo el paciente que no se anotó, y qué se anotó que el paciente nunca dijo). 5 criterios × 2 puntos = 10.
- **Persistencia**: la sesión en curso (caso, historial, formulario) se guarda en `localStorage` bajo `simulamed_sesion` en cada turno, y se ofrece retomarla si se recarga la página. Se borra al completar la evaluación. Las preferencias del docente van en claves aparte (`simulamed_revelar`, `simulamed_voz_lenta`, `simulamed_permitir_voz`, `simulamed_modelo`).

## Convenciones al modificar

- Mantener la interfaz como un único HTML autocontenido. La única pieza de servidor es `api/groq.js`.
- Nombres descriptivos en español, sin abreviaciones crípticas (`respuestaHttp`, no `res`; `criterio`, no `c`).
- Todo texto que venga del modelo o del estudiante pasa por `escaparHTML()` antes de entrar al DOM.
- Los prompts están en español y calibrados para el contexto clínico ecuatoriano (CIE-10, terminología MSP). Si se edita un prompt, probar que la salida JSON siga siendo parseable — `parseJSONLoose()` solo limpia backticks de markdown, no corrige JSON inválido.
- El modelo de Groq es seleccionable desde el panel del docente (`llama-3.3-70b-versatile` por defecto). Si se agrega un modelo, verificar que sostenga salida JSON estructurada en español antes de dejarlo como default.

## Seguridad — no romper esto

`GROQ_API_KEY` vive **únicamente** como variable de entorno del servidor (Vercel Environment Variables). No reintroducir el campo de API key en el navegador, no guardarla en `localStorage`, no escribirla como valor por defecto en el HTML, no commitearla.

`.env` y `.env.example` están en `.gitignore`: en este repositorio `.env.example` se usa como archivo local de trabajo con la clave real. La plantilla pública es `env.plantilla.txt`. GitHub tiene push protection activo y bloquea cualquier commit que contenga una clave de Groq.

## Estado

Listo para piloto de aula. El ciclo completo está verificado contra el despliegue de producción (generación de caso, saludo hablado, turnos de conversación, rúbrica sobre transcripción + formulario).

La interfaz en navegador no ha sido probada con interacción real: falta correr una consulta completa en el equipo del laboratorio, sobre todo para confirmar que haya una voz en español instalada — sin ella `SpeechSynthesis` lee con acento en inglés.

Tres cosas a tener presentes al modificar:

- **El puntaje total se calcula en el cliente** sumando los criterios, no se toma el `puntaje_total` que devuelve el modelo. En pruebas devolvió 6/10 con criterios que sumaban 5. No revertir a confiar en ese campo.
- **La clave del servidor es compartida por toda la clase.** Cualquier cambio que aumente el número de llamadas por consulta (más turnos automáticos, reintentos, precarga de casos) consume el límite común del nivel gratuito de Groq. **Con Whisper activo, el consumo se duplica** (1 llamada a chat + 1 a audio por pregunta). Medir cupo antes de usar en clase; Groq factura audio en mínimo de 10 segundos por petición.
- **Si se modifica Whisper:** verificar que `MediaRecorder` siga siendo compatible con Firefox + Safari + Chrome (mejor que `SpeechRecognition`). Si se cambia modelo de audio, probar transcripción en acento ecuatoriano. El preview es no-editable (solo lectura) — si necesita edición, habilitar un campo de texto después del preview.

## Entrada de voz con Whisper (v1.1)

**Default:** estudiante escribe preguntas. **Opcional:** docente activa "Permitir entrada de voz" en ajustes (panel docente).

### Flujo con voz activada
1. En consulta, el input de texto se reemplaza con botón "🎤 Grabar pregunta".
2. Estudiante presiona, se activa `MediaRecorder` (requiere permiso `audio` del navegador).
3. Botón cambia a "⏹ Detener grabación". Hay botón "✕ Descartar" para abortar.
4. Estudiante presiona ⏹, blob de audio se envía a `/api/groq?mode=transcribe`.
5. Whisper responde con texto transcrito. Se muestra en preview (fondo teal, texto no editable).
6. Estudiante revisa transcripción. Botones: "Re-grabar" (vuelve a paso 2) o "Enviar pregunta →" (flujo normal).
7. Texto transcrito entra al historial y se procesa como pregunta normal.

### Consideraciones
- **Permiso del navegador:** primer intento pide permiso "permitir micrófono" del navegador. Si rechaza, muestra error.
- **Compatibilidad:** `MediaRecorder` funciona en Chrome, Firefox, Safari (a diferencia de `SpeechRecognition` que es solo Chromium).
- **Consumo de cupo:** cada grabación = 1 llamada a Whisper. Audio se factura en mínimo 10 segundos en Groq. 30 estudiantes × 15 preguntas = 450 llamadas. Verificar cupo gratuito **antes de usar en aula**.
- **Calidad de transcripción:** acento ecuatoriano soportado por `whisper-large-v3-turbo`. Ruido ambiental (múltiples micrófonos en laboratorio) degrada resultado.
- **Preview no editable:** el estudiante ve transcripción pero no puede modificarla manualmente. Si Whisper oyó mal, debe re-grabar. Esto es deliberado para no permitir cambios secretos entre lo grabado y lo registrado.
- **Modelo fijo:** `whisper-large-v3-turbo` (turbo=más rápido, suficiente para español). No exponer selector de modelo en UI.

### Troubleshooting
- "No se puede acceder al micrófono" → navegador bloqueó permiso. Revisar configuración del sitio (candado 🔒 en barra de direcciones).
- "Error al transcribir: 503" → servidor de Groq sobrecargado, reintentar.
- Transcripción con muletillas ("eeh", "eeeh") → normal, Whisper transcribe lo que oyó. Estudiante debe re-grabar si son problemáticas.

## Backlog (ver también README → Backlog)

### Completado (v1.1 — entrada de voz opcional)
- ✅ Whisper de Groq (`whisper-large-v3-turbo`) para entrada de voz con transcripción. Toggle en panel docente. Preview antes de enviar.

### Archivado hasta contar con los documentos institucionales
- Banco de casos curado por docentes en vez de generación libre (hoy el modelo elige la patología y puede salirse del sílabo — la limitación más relevante para uso formal).
- Rúbrica exacta de la facultad en vez de los 5 criterios genéricos actuales.
- Registro de resultados en Google Sheets vía Apps Script (hoy: botón Imprimir / Guardar PDF).

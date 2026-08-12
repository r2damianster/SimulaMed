# CLAUDE.md

Guía de contexto para Claude Code (u otro asistente) al trabajar en este repositorio.

## Qué es este proyecto

Simulador de anamnesis clínica para estudiantes de Medicina (materia Habilidades y Destrezas, FCSEE — Universidad UTE). Entrena el interrogatorio al paciente y el llenado del Formulario MSP 002. Es la versión 0-cost de la propuesta "Proyecto SimulaMed", que originalmente dependía de Character.AI + Google Pinpoint + Gemini Pro.

## El ciclo de simulación (lo esencial, no romper)

La asimetría entre entrada y salida es una decisión pedagógica deliberada:

1. El estudiante se identifica (nombre, paralelo, modalidad pares/individual).
2. Sala de espera: ficha de admisión con edad, sexo y ocupación. **El motivo de consulta NO se muestra escrito.**
3. El paciente entra y **abre la consulta hablando** (`saludo_inicial`): una molestia vaga, sin detalles.
4. El estudiante **escribe** sus preguntas. Su propio texto sí lo ve.
5. El paciente responde: **solo audio**. En el chat aparece una burbuja "🔊 El paciente respondió", sin el texto.
6. El estudiante anota lo que escucha en el Formulario MSP 002, que vive junto al chat.
7. Al cerrar la consulta se revela la transcripción completa, el caso real y la calificación.

**Por qué el estudiante escribe en vez de hablar:** escribir obliga a formular la pregunta con precisión clínica en vez de divagar. Además elimina `SpeechRecognition`, que es exclusivo de Chromium — así el simulador corre en cualquier navegador.

**Por qué el paciente no muestra texto:** obliga a escuchar y retener, que es la competencia real de la anamnesis. El formulario MSP 002 en pantalla es el cuaderno donde se descarga lo escuchado; sin él el ejercicio no cierra.

Si se edita la interfaz, no reintroducir el texto del paciente durante la consulta ni mostrar el motivo de consulta por escrito antes de que lo diga. El interruptor "Mostrar por escrito lo que dice el paciente" del panel del docente existe solo como accesibilidad y como salida de emergencia si falla el audio del laboratorio.

## Arquitectura

- **Un solo archivo de interfaz** (`index.html`, HTML + CSS + JS vanilla, sin build step, sin framework, sin npm) más una función serverless (`api/groq.js`).
- **`api/groq.js`**: Vercel Edge Function que reenvía la petición a Groq agregando `Authorization` desde la variable de entorno `GROQ_API_KEY`. El navegador nunca ve la clave. Todo `callGroq()` del cliente apunta a `/api/groq`.
- **Generación de caso**: prompt a Groq que devuelve JSON con datos demográficos, un `saludo_inicial` hablado y un `guion_clinico` oculto (antecedentes, revisión por sistemas, signos vitales, diagnóstico presuntivo + CIE-10).
- **Paciente conversacional**: cada turno se envía junto con el `guion_clinico` como contexto de sistema. El prompt limita las respuestas a 2-3 frases cortas — porque el estudiante las escucha, no las lee, y no puede retener parrafadas.
- **Voz**: solo `SpeechSynthesis` (TTS). `SpeechRecognition` fue eliminado a propósito.
- **Evaluación**: se envía la transcripción **y el formulario MSP 002 llenado por el estudiante**. La rúbrica califica dos dimensiones: calidad del interrogatorio y fidelidad del registro (qué dijo el paciente que no se anotó, y qué se anotó que el paciente nunca dijo). 5 criterios × 2 puntos = 10.
- **Persistencia**: la sesión en curso (caso, historial, formulario) se guarda en `localStorage` bajo `simulamed_sesion` en cada turno, y se ofrece retomarla si se recarga la página. Se borra al completar la evaluación. Las preferencias del docente van en claves aparte.

## Convenciones al modificar

- Mantener la interfaz como un único HTML autocontenido. La única pieza de servidor es `api/groq.js`.
- Nombres descriptivos en español, sin abreviaciones crípticas (`respuestaHttp`, no `res`; `criterio`, no `c`).
- Todo texto que venga del modelo o del estudiante pasa por `escaparHTML()` antes de entrar al DOM.
- Los prompts están en español y calibrados para el contexto clínico ecuatoriano (CIE-10, terminología MSP). Si se edita un prompt, probar que la salida JSON siga siendo parseable — `parseJSONLoose()` solo limpia backticks de markdown, no corrige JSON inválido.
- El modelo de Groq es seleccionable desde el panel del docente (`llama-3.3-70b-versatile` por defecto). Si se agrega un modelo, verificar que sostenga salida JSON estructurada en español antes de dejarlo como default.

## Seguridad — no romper esto

`GROQ_API_KEY` vive **únicamente** como variable de entorno del servidor (Vercel Environment Variables). No reintroducir el campo de API key en el navegador, no guardarla en `localStorage`, no escribirla como valor por defecto en el HTML, no commitearla.

`.env` y `.env.example` están en `.gitignore`: en este repositorio `.env.example` se usa como archivo local de trabajo con la clave real. La plantilla pública es `env.plantilla.txt`. GitHub tiene push protection activo y bloquea cualquier commit que contenga una clave de Groq.

## Pendientes conocidos (ver también README → Roadmap)

- Banco de casos curado por docentes en vez de generación libre (hoy el modelo elige la patología y puede salirse del sílabo).
- Rúbrica exacta de la facultad en vez de los 5 criterios genéricos actuales.
- Registro de resultados en Google Sheets vía Apps Script.
- Whisper de Groq (`whisper-large-v3`) para reactivar la voz de entrada con precisión en acento ecuatoriano.

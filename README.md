# SimulaMed — simulador de anamnesis clínica

Simulador de consulta médica para la práctica de anamnesis y llenado del Formulario MSP 002, derivado de la propuesta "Proyecto SimulaMed" (FCSEE, Universidad UTE). Reemplaza el stack propuesto originalmente (Character.AI + Google Pinpoint + Gemini Pro) por herramientas de costo cero o marginal:

| Función | Herramienta original | Herramienta en este proyecto |
|---|---|---|
| Paciente sintético conversacional | Character.AI | Groq API (modelos open-source, nivel gratuito) |
| Voz del paciente | — | SpeechSynthesis API del navegador |
| Evaluación con rúbrica | Gemini Pro | Groq API, mismo prompt estructurado |
| Protección de la clave | — | Vercel Edge Function (`api/groq.js`) |
| Registro de resultados | — | Pendiente (ver Roadmap) |

## Cómo funciona la práctica

1. **Ingreso.** El estudiante registra su nombre, paralelo y modalidad: en pares (recomendado para la primera práctica, baja la ansiedad inicial) o individual.
2. **Sala de espera.** Ficha de admisión con edad, sexo y ocupación. El motivo de consulta no aparece escrito.
3. **El paciente entra hablando.** Se presenta y dice su molestia principal de forma vaga, como un paciente real: *"Buenos días doctor, vengo porque me ha estado doliendo aquí…"*
4. **El estudiante escribe sus preguntas.** El paciente responde **por voz, sin texto en pantalla** — hay que escucharlo. El botón 🔊 repite la última respuesta las veces que haga falta.
5. **Formulario MSP 002 en pantalla**, junto al chat. Ahí se anota lo que se va averiguando, mientras dura la consulta.
6. **Reporte final.** Al cerrar la consulta se revela la transcripción completa, el caso clínico real del paciente, el formulario tal como quedó llenado y la calificación sobre 10.

### Por qué el estudiante escribe y el paciente habla

No es una limitación técnica, es el diseño de la práctica:

- **Escribir la pregunta** obliga a formularla con precisión clínica. Al hablar se improvisa y se divaga.
- **Escuchar la respuesta** obliga a retener, que es la competencia real de la anamnesis: en consulta no se puede releer al paciente.
- Como efecto secundario, al no usar `SpeechRecognition` (exclusivo de Chrome) el simulador **funciona en cualquier navegador**: Chrome, Firefox, Safari, Edge y móvil.

Si el audio del laboratorio falla, o hay un estudiante con dificultad auditiva, el panel **Ajustes del docente** (pie de página) permite mostrar por escrito lo que dice el paciente y bajar la velocidad de la voz.

## Despliegue

### Vercel (recomendado)

El proyecto usa una función serverless para que la clave de Groq nunca llegue al navegador.

1. Importar el repositorio en [vercel.com](https://vercel.com).
2. **Settings → Environment Variables** → agregar `GROQ_API_KEY` con una clave de [console.groq.com/keys](https://console.groq.com/keys) (gratuita, sin tarjeta).
3. Desplegar. `api/groq.js` se detecta automáticamente.

Opcionalmente `GROQ_MODEL` para cambiar el modelo por defecto.

### Local

```bash
# Crear .env en la raíz (está en .gitignore, nunca se sube)
echo "GROQ_API_KEY=gsk_tu_clave_aqui" > .env

npx vercel dev
```

Abrir `index.html` como archivo suelto **no funciona**: sin servidor no existe `/api/groq` y el paciente no puede responder.

Ver `env.plantilla.txt` para el detalle de las variables.

## Seguridad

La clave de Groq vive únicamente como variable de entorno del servidor. El navegador llama a `/api/groq`, que agrega la cabecera `Authorization` del lado del servidor y reenvía a Groq. En ningún momento la clave se expone en el código del cliente, ni se guarda en `localStorage`, ni viaja al navegador.

**No escribir nunca la clave real dentro de `index.html` ni en ningún archivo versionado.** GitHub tiene push protection activo y rechaza el commit; y una clave que llegó a publicarse queda comprometida aunque se borre después — hay que revocarla en la consola de Groq y generar una nueva.

`.env` y `.env.example` están en `.gitignore`. La plantilla pública es `env.plantilla.txt`.

## Privacidad

La sesión en curso (caso, transcripción, formulario) se guarda en el `localStorage` del navegador para poder retomarla si la página se recarga por accidente. Se borra al terminar la evaluación. No se envía nada a ningún servidor salvo las llamadas a Groq necesarias para que el paciente responda y para calificar.

## Roadmap

- [ ] Banco de casos clínicos curado por los docentes SME en vez de generación libre, para alinear estrictamente con el sílabo.
- [ ] Rúbrica exacta de la facultad en lugar de los cinco criterios genéricos actuales.
- [ ] Registro automático de cada evaluación en Google Sheets vía Apps Script.
- [ ] Transcripción con Whisper de Groq (`whisper-large-v3`, ~$0.04/hora de audio) para reactivar la voz de entrada con buena precisión en acento ecuatoriano.

## Origen

Este proyecto nace del análisis de la propuesta "Proyecto SimulaMed" (Facultad de Ciencias de la Salud Eugenio Espejo, Universidad UTE) como prueba de concepto de una arquitectura de costo cero para la misma práctica pedagógica.

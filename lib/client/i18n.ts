"use client"

import { useCallback, useEffect, useState } from "react"
import type { QuestionType } from "@/lib/types"

export type UiLang = "en" | "es"

// Text for buttons and labels. Feedback itself always arrives in both languages from the server.
const STRINGS = {
  brand: { en: "Shift Up", es: "Shift Up" },
  navProgress: { en: "My progress", es: "Mi progreso" },
  navHome: { en: "Home", es: "Inicio" },

  heroTitle: { en: "Practice the interview in English. Get help in your language.", es: "Practique la entrevista en inglés. Reciba ayuda en su idioma." },
  heroLead: {
    en: "Hear real interview questions for hourly jobs, answer out loud, and get coaching in Spanish on what you said and how you said it. It remembers what was hard last time.",
    es: "Escuche preguntas reales de entrevistas para trabajos por hora, responda en voz alta y reciba orientación en español sobre lo que dijo y cómo lo dijo. Recuerda lo que le costó la última vez.",
  },
  heroCta: { en: "Start practicing", es: "Empezar a practicar" },
  heroHow: { en: "How it works", es: "Cómo funciona" },
  bubbleQ: { en: "Tell me about a time a client was upset.", es: "Tell me about a time a client was upset." },
  bubbleC: { en: "Le pregunta por una vez que un cliente se molestó.", es: "Le pregunta por una vez que un cliente se molestó." },

  howTitle: { en: "How it works", es: "Cómo funciona" },
  how1t: { en: "Listen", es: "Escuche" },
  how1: { en: "The interviewer asks in English, like a real one. Read along in English or Spanish, and slow it down.", es: "La entrevistadora pregunta en inglés, como una de verdad. Lea en inglés o en español y ponga la voz más lenta." },
  how2t: { en: "Answer out loud", es: "Responda en voz alta" },
  how2: { en: "Answer in English, or in Spanish first to get your ideas down.", es: "Responda en inglés, o primero en español para ordenar sus ideas." },
  how3t: { en: "Get coached", es: "Reciba orientación" },
  how3: { en: "One thing you did well, one thing to fix, and a stronger answer built from your own words.", es: "Una cosa que hizo bien, una para mejorar y una respuesta más fuerte hecha con sus propias palabras." },
  how4t: { en: "It remembers you", es: "Se acuerda de usted" },
  how4: { en: "Your stories and what was hard come back next time, so practice builds up.", es: "Sus historias y lo que le costó vuelven la próxima vez, para que la práctica avance." },
  promiseTitle: { en: "We never grade your accent.", es: "Nunca calificamos su acento." },
  promise: {
    en: "You get feedback on being clear, sounding sure and sounding natural. There is no pronunciation score, and your progress is compared only with your own earlier sessions.",
    es: "Recibe comentarios sobre hablar con claridad, con seguridad y con naturalidad. No hay puntaje de pronunciación, y su progreso solo se compara con sus sesiones anteriores.",
  },

  setupTitle: { en: "Set up your practice", es: "Prepare su práctica" },
  roleLabel: { en: "Job you are interviewing for", es: "Trabajo para el que se entrevista" },
  roleHha: { en: "Home health aide", es: "Asistente de salud en el hogar" },
  roleSoon: { en: "Retail and warehouse: coming soon", es: "Tienda y almacén: próximamente" },
  postingLabel: { en: "Job posting (optional)", es: "Anuncio del trabajo (opcional)" },
  postingHint: { en: "Paste the posting and the questions will ask about what it lists.", es: "Pegue el anuncio y las preguntas tratarán de lo que pide." },
  postingSample: { en: "Use the sample posting", es: "Usar el anuncio de ejemplo" },
  resumeLabel: { en: "Resume (optional)", es: "Currículum (opcional)" },
  resumeHint: {
    en: "Paste the text of your resume, or upload the file, and the stronger answers will use your real experience. Leave out your address and phone number.",
    es: "Pegue el texto de su currículum, o suba el archivo, y las respuestas más fuertes usarán su experiencia real. No incluya su dirección ni su teléfono.",
  },
  resumeSample: { en: "Use the sample resume", es: "Usar el currículum de ejemplo" },
  resumeUpload: { en: "Upload a file", es: "Subir un archivo" },
  resumeUploadError: {
    en: "We could not read that file. Try a PDF, a Word (.docx) file or a text file, or paste the text.",
    es: "No pudimos leer ese archivo. Pruebe con un PDF, un archivo de Word (.docx) o de texto, o pegue el texto.",
  },
  spanishFirst: { en: "Answer in Spanish first", es: "Responder primero en español" },
  spanishFirstHint: { en: "Practice the content in Spanish, then see how to say it in English.", es: "Practique el contenido en español y luego vea cómo decirlo en inglés." },
  nameLabel: { en: "Your name", es: "Su nombre" },
  nameHint: { en: "We use it to remember your practice next time.", es: "Lo usamos para recordar su práctica la próxima vez." },
  demoTitle: { en: "Demo history", es: "Historial de demostración" },
  demoLoad: { en: "Load two earlier sessions for {name}", es: "Cargar dos sesiones anteriores para {name}" },
  demoLoading: { en: "Loading the memories. This takes about half a minute.", es: "Cargando los recuerdos. Tarda como medio minuto." },
  demoLoaded: { en: "Two earlier sessions are loaded for {name}.", es: "Se cargaron dos sesiones anteriores para {name}." },
  welcomeBack: { en: "Welcome back, {name}.", es: "Qué gusto verle de nuevo, {name}." },
  welcomeNew: { en: "Welcome, {name}.", es: "Le damos la bienvenida, {name}." },
  start: { en: "Start the interview", es: "Empezar la entrevista" },

  begin: { en: "Begin", es: "Comenzar" },
  beginTitle: { en: "Ready when you are, {name}", es: "Cuando usted quiera, {name}" },
  beginBody: {
    en: "The interviewer will ask a question in English. When she finishes, answer out loud. You can ask the coach in Spanish at any time.",
    es: "La entrevistadora hará una pregunta en inglés. Cuando termine, responda en voz alta. Puede preguntarle al coach en español en cualquier momento.",
  },
  micNote: { en: "Your browser will ask to use the microphone.", es: "Su navegador le pedirá permiso para usar el micrófono." },
  interviewer: { en: "Ms. Rivera · Interviewer", es: "Sra. Rivera · Entrevistadora" },
  speaking: { en: "Speaking", es: "Hablando" },
  questionN: { en: "Question {n}", es: "Pregunta {n}" },
  followUp: { en: "Follow-up", es: "Pregunta de seguimiento" },
  coach: { en: "Coach · Español", es: "Coach · español" },
  example: { en: "Example answer", es: "Respuesta de ejemplo" },
  captions: { en: "Captions", es: "Subtítulos" },
  speed: { en: "Speed", es: "Velocidad" },
  speedNormal: { en: "Normal", es: "Normal" },
  speedSlow: { en: "Slow", es: "Lenta" },
  repeat: { en: "Repeat the question", es: "Repetir la pregunta" },
  repeatShort: { en: "Repeat", es: "Repetir" },
  askCoach: { en: "Ask the coach in Spanish", es: "Preguntar al coach" },
  loading: { en: "Getting your interview ready", es: "Preparando su entrevista" },
  asking: { en: "Listen to the question", es: "Escuche la pregunta" },
  repeating: { en: "Good, you asked. Here it is again, more slowly.", es: "Hizo bien en preguntar. Aquí va otra vez, más despacio." },
  rescueHint: { en: "Did not understand? You can say:", es: "¿No entendió? Puede decir:" },
  whatAsking: { en: "What are they asking?", es: "¿Qué me están preguntando?" },
  listening: { en: "Listening. Answer when you are ready.", es: "Escuchando. Responda cuando quiera." },
  done: { en: "I'm done", es: "Ya terminé" },
  answerNow: { en: "Answer now", es: "Responder ahora" },
  answerAgain: { en: "Answer again", es: "Responder otra vez" },
  typeInstead: { en: "Type my answer instead", es: "Prefiero escribir mi respuesta" },
  typeShort: { en: "Type instead", es: "Mejor escribir" },
  typePlaceholder: { en: "Type your answer here", es: "Escriba su respuesta aquí" },
  send: { en: "Send", es: "Enviar" },
  thinking: { en: "Listening to your answer", es: "Escuchando su respuesta" },
  micBlocked: { en: "The microphone is not available. You can type your answer.", es: "El micrófono no está disponible. Puede escribir su respuesta." },

  heard: { en: "What we heard", es: "Lo que escuchamos" },
  feedbackTitle: { en: "Your feedback", es: "Sus comentarios" },
  good: { en: "What you did well", es: "Lo que hizo bien" },
  fix: { en: "One thing to fix", es: "Una cosa para mejorar" },
  wrongWay: { en: "Do not answer this way", es: "No responda así" },
  stronger: { en: "A stronger answer, in your words", es: "Una respuesta más fuerte, con sus palabras" },
  hear: { en: "Hear it", es: "Escucharla" },
  soundsLike: { en: "Sounds like", es: "Suena como" },
  hearWord: { en: "Hear it", es: "Escuchar" },
  slowly: { en: "Slowly", es: "Despacio" },
  tapWord: { en: "Point at or tap any word to hear how it is said.", es: "Señale o toque cualquier palabra para oír cómo se dice." },
  deliveryTitle: { en: "How you said it", es: "Cómo lo dijo" },
  clarity: { en: "Clarity", es: "Claridad" },
  confidence: { en: "Confidence", es: "Seguridad" },
  naturalness: { en: "Naturalness", es: "Naturalidad" },
  practise: { en: "Practise this next", es: "Practique esto ahora" },
  watchSlow: { en: "Watch and listen slowly", es: "Mirar y escuchar despacio" },
  listenedBy: { en: "Timing measured from your recording. Tone listened to by Gemini.", es: "Tiempos medidos en su grabación. Tono escuchado por Gemini." },
  readAloud: { en: "Read my feedback aloud", es: "Leer en voz alta" },
  listenFeedback: { en: "Listen", es: "Escuchar" },
  stopReading: { en: "Stop", es: "Parar" },
  coachPlain: { en: "Coach", es: "Coach" },
  noDelivery: { en: "Delivery feedback is given on answers spoken in English.", es: "Los comentarios sobre cómo lo dijo se dan en respuestas habladas en inglés." },
  next: { en: "Next question", es: "Siguiente pregunta" },
  retry: { en: "Try this question again", es: "Intentar esta pregunta otra vez" },
  fakeNote: {
    en: "Stand-in data: speech-to-text or the feedback service is not connected yet, so this is a sample answer and sample feedback.",
    es: "Datos de ejemplo: el reconocimiento de voz o el servicio de comentarios aún no está conectado, así que esta es una respuesta y comentarios de muestra.",
  },
  errorTitle: { en: "Something went wrong", es: "Algo salió mal" },
  tryAgain: { en: "Try again", es: "Intentar de nuevo" },

  memoryNote: { en: "Last time, questions about {type} were hard for you. Let's start there.", es: "La última vez le costaron las preguntas sobre {type}. Empecemos por ahí." },
  remembers: { en: "What I remember about you", es: "Lo que recuerdo de usted" },

  coachTitle: { en: "Coach", es: "Coach" },
  coachIntro: { en: "Ask anything in Spanish, out loud or typed: what the question means, or how to say something.", es: "Pregunte lo que quiera en español, hablando o escribiendo: qué significa la pregunta o cómo decir algo." },
  coachPlaceholder: { en: "Escriba su pregunta en español", es: "Escriba su pregunta en español" },
  coachSpeak: { en: "Ask out loud in Spanish", es: "Preguntar en voz alta" },
  coachStop: { en: "Done speaking", es: "Ya terminé" },
  coachBack: { en: "Back to the interview", es: "Volver a la entrevista" },
  coachSuggest1: { en: "¿Qué me está preguntando?", es: "¿Qué me está preguntando?" },
  coachSuggest2: { en: "¿Cómo empiezo mi respuesta?", es: "¿Cómo empiezo mi respuesta?" },
  close: { en: "Close", es: "Cerrar" },

  progressTitle: { en: "Your progress", es: "Su progreso" },
  progressLead: { en: "Compared only with your own earlier sessions.", es: "Comparado solo con sus sesiones anteriores." },
  colDate: { en: "Session", es: "Sesión" },
  colAnswers: { en: "Answers", es: "Respuestas" },
  colStart: { en: "Time before starting", es: "Tiempo antes de empezar" },
  colPauses: { en: "Long pauses per answer", es: "Pausas largas por respuesta" },
  colPace: { en: "Words per minute", es: "Palabras por minuto" },
  colHard: { en: "What was hard", es: "Lo que le costó" },
  progressEmpty: { en: "No sessions yet. Answer a question out loud and it will show up here.", es: "Aún no hay sesiones. Responda una pregunta en voz alta y aparecerá aquí." },
  progressBetter: { en: "You now start answering {n} seconds sooner than in your first session.", es: "Ahora empieza a responder {n} segundos antes que en su primera sesión." },
  seconds: { en: "s", es: "s" },
  footer: { en: "Built at sunhacks 2026 with Amazon Polly, Amazon Transcribe, Grok and Supermemory.", es: "Hecho en sunhacks 2026 con Amazon Polly, Amazon Transcribe, Grok y Supermemory." },
} as const

export type StringKey = keyof typeof STRINGS

const TYPE_LABELS: Record<QuestionType, { en: string; es: string }> = {
  conflict: { en: "disagreements at work", es: "desacuerdos en el trabajo" },
  reliability: { en: "being reliable", es: "ser responsable y puntual" },
  client_care: { en: "caring for clients", es: "el cuidado de los clientes" },
  safety_physical: { en: "safety and physical tasks", es: "la seguridad y las tareas físicas" },
  why_this_job: { en: "why you want this job", es: "por qué quiere este trabajo" },
  availability: { en: "your schedule", es: "su horario" },
}

const KEY = "ipl.lang"

/** The language of buttons and labels, remembered between visits. */
export function useUiLang() {
  const [lang, setLangState] = useState<UiLang>("en")
  useEffect(() => {
    const saved = localStorage.getItem(KEY)
    if (saved === "en" || saved === "es") setLangState(saved)
  }, [])
  const setLang = useCallback((next: UiLang) => {
    setLangState(next)
    localStorage.setItem(KEY, next)
    document.documentElement.lang = next
  }, [])
  const t = useCallback((key: StringKey, vars?: Record<string, string | number>) => {
    let text: string = STRINGS[key][lang]
    for (const [name, value] of Object.entries(vars ?? {})) text = text.replace(`{${name}}`, String(value))
    return text
  }, [lang])
  /** The same text in the other language, for labels shown in both. */
  const other = useCallback((key: StringKey): string => STRINGS[key][lang === "en" ? "es" : "en"], [lang])
  const typeLabel = useCallback((type: string) => (type in TYPE_LABELS ? TYPE_LABELS[type as QuestionType][lang] : type), [lang])
  return { lang, setLang, t, other, typeLabel }
}

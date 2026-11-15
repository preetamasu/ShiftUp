# Architecture

Interview Practice in Your Language, sunhacks 2026. This is the build reference for three builders: Preetam (voice), Teammate 1 (interview logic and data), and Teammate 2 (app and screens). The teammate labels are placeholders until their names are added. The product brief, demo script and task split are in `TEAM_BRIEF.md`.

## The design in one line

ElevenLabs speaks, Transcribe listens for the words, plain code measures the delivery, Gemini listens for behaviour, Claude writes the feedback, and Supermemory remembers.

## Final flow

What Maria does on the left, what the system does on the right.

| # | What Maria does | What the system does |
|---|---|---|
| 1 | Picks a role or pastes a job posting; chooses whether to answer in Spanish first | Loads her profile from Supermemory and picks the first question, starting with a past weak spot |
| 2 | Watches the face ask the question in English; can switch captions, slow it down or repeat it | ElevenLabs supplies audio and character timings; the browser highlights words and animates a simple mouth |
| 3 | Taps and answers out loud | The browser records the answer and sends it to the server |
| 4 | Waits a few seconds, seeing her transcript first | Transcribe returns words with timings; code measures pace, pauses and start delay; Gemini adds behaviour notes if it is quick enough; Claude writes the feedback |
| 5 | Reads feedback in Spanish with English alongside: one good thing, one fix, a stronger answer from her own details, and a line each on clarity, confidence and naturalness | Nothing shown is a pronunciation score or a comment on accent |
| 6 | Replays the one word to practise, slowly | Cached word audio plays at half speed; any mouth movement is approximate |
| 7 | Retries the answer or moves on | Her story, weak spot and numbers are saved to Supermemory and the session log |
| 8 | Hears the next question | It is picked from her weak spots, the job posting, or as a follow-up to what she just said |
| 9 | Opens the progress view at the end | It compares her only with her own earlier sessions |

At steps 2 and 5 she can tap "Preguntar al coach," ask anything in Spanish by voice or text, hear the answer in Spanish, and return to exactly where she left off. Asking never counts against her.

```
Setup -> Question -> Answer -> Feedback -> Practise word -> Next question -> ... -> Progress
            |                     |                              ^
            +---> Coach (Spanish) +                              |
                      returns to where she left          weak spots from memory
```

The next time she starts a session, step 1 opens with what she struggled with last time.

## Services

| Job | Service | Notes |
|---|---|---|
| Voice out (text to speech) and character timing | ElevenLabs | Character timestamps support captions; real visemes need a separate stage |
| Voice in (speech to text) | Amazon Transcribe, streaming | Returns each word with start time, end time and a confidence from 0 to 1. Uses AWS credentials; ElevenLabs has its own key |
| Delivery numbers | Our own code | Pace, start delay, pauses, unclear words. No model involved |
| Behaviour observations from the recording | Gemini API (audio input) | Optional layer. Never blocks the answer. Enters the MLH Gemini prize |
| Question picking and all learner-facing feedback | Claude Opus 5.5 (`claude-opus-5-5`), low effort, structured output | One model writes everything she reads, so the tone and the Spanish stay consistent |
| Learner memory across sessions | Supermemory v5 | One namespace per learner |
| Session numbers for the progress view | Local JSON file | MongoDB Atlas instead if we want that prize |
| App | Next.js with TypeScript, one repo | Screen and API routes together |
| Hosting | Local laptop for the demo; Vercel for the Devpost link | |

How to reach Claude: use an Anthropic API key if we have one. If we only have AWS credentials, Claude is also offered through Amazon Bedrock, provided model access is enabled in our AWS account. If neither works within 20 minutes, use Gemini for the written feedback too; the route contract below does not change.

## Diagram

```
Browser (Chrome)
  Setup screen      role, pasted job posting, "answer in Spanish first"
  Interview screen  face, captions, mic, feedback panel
  Progress screen
  Records the answer as 16 kHz mono PCM
        |
        v
Next.js API routes (all keys stay on the server)
  /api/session/start   Supermemory profile -> first question
  /api/question/next   bank / posting / follow-up -> question
  /api/speak           ElevenLabs audio + character/word timing
  /api/answer          Transcribe  ---+
                       Gemini (opt) --+--> delivery code --> Claude --> response
                       then, after responding: Supermemory + session log
  /api/progress        session log
  /api/coach           Spanish side conversation: Transcribe -> Claude -> ElevenLabs
  /api/demo/seed, /api/demo/reset
        |
        v
ElevenLabs   Transcribe   Gemini   Claude   Supermemory   sessions.json
```

## One turn, step by step

1. The server reads her profile and picks a question.
2. The screen plays the question audio and highlights words using ElevenLabs alignment. Captions show English or Spanish.
3. Recording starts the moment the question audio ends, and stops when she taps the button.
4. The recording goes to `/api/answer`. Transcribe and Gemini run at the same time on it.
5. The delivery code turns Transcribe's word timings into numbers.
6. Claude gets the question, transcript, numbers, Gemini's observations (if they arrived) and her profile, and returns the feedback in both languages.
7. The screen shows the feedback. Only then does the server save to Supermemory and the session log.

Target: under 8 seconds from the end of her answer to feedback on screen. Show the transcript as soon as Transcribe returns, so the wait feels shorter. This target is not measured yet.

## API contract

Teammate 2 can build against these shapes with example data from the first hour. Preetam owns `/api/speak`; Teammate 1 owns the other route files and calls Preetam's voice helpers where needed. See "Build plan" for the handoffs.

### `POST /api/session/start`

```json
// request
{ "learnerId": "maria", "role": "home_health_aide", "jobPosting": "optional pasted text" }

// response
{
  "sessionId": "s_2026-11-14_01",
  "profile": { "stories": ["Calmed a client who refused her medication"], "weakSpots": ["conflict"] },
  "question": { "id": "hha_conflict_01", "type": "conflict", "source": "bank",
                "textEn": "Tell me about a time you disagreed with a coworker.",
                "textEs": "Cuénteme de una vez que no estuvo de acuerdo con un compañero de trabajo." }
}
```

### `POST /api/question/next`

```json
// request
{ "sessionId": "s_2026-11-14_01" }

// response: the same "question" object as above
```

`source` is `bank`, `posting` or `followup`. `type` is always one of the fixed list under "Questions."

### `POST /api/speak`

```json
// request
{ "text": "Tell me about a time you disagreed with a coworker.", "speed": "normal" }

// response
{
  "audioBase64": "<mp3>",
  "visemes": [],
  "mouthTimingSource": "none",
  "words":   [{ "timeMs": 0, "endMs": 200, "value": "Tell" }, { "timeMs": 210, "endMs": 300, "value": "me" }]
}
```

`speed` is `slow`, `normal`, or `x-slow` (used for the single-word replay).

### `POST /api/answer`

Multipart form: `audio` (16 kHz, mono, signed 16-bit PCM), `sessionId`, `questionId`, `language` (`en-US` or `es-US`).

```json
// response
{
  "transcript": "I talk with her and we make a schedule for the medication.",
  "words": [{ "text": "medication", "startMs": 5120, "endMs": 5810, "confidence": 0.41 }],
  "delivery": { "paceWpm": 132, "startDelayMs": 6100, "longPauses": 2,
                "speakingMs": 21400, "unclearWords": ["medication", "schedule"] },
  "feedback": {
    "content": {
      "good": { "es": "...", "en": "..." },
      "fix":  { "es": "...", "en": "..." },
      "sampleAnswerEn": "...",
      "usedDetails": ["talked with her", "made a schedule"]
    },
    "delivery": {
      "clarity":     { "es": "...", "en": "..." },
      "confidence":  { "es": "...", "en": "..." },
      "naturalness": { "es": "...", "en": "..." },
      "practiseNext": { "kind": "word", "word": "medication", "es": "...", "en": "..." }
    }
  },
  "weakSpot": "conflict"
}
```

`practiseNext.kind` is `word`, `start`, `pace` or `phrase`. When `language` is `es-US`, the `delivery` feedback is omitted, because delivery is only assessed on English answers.

### `GET /api/progress?learnerId=maria`

```json
{ "sessions": [{ "sessionId": "s_2026-11-10_01", "date": "2026-11-10", "answers": 4,
                 "avgStartDelayMs": 7200, "longPausesPerAnswer": 3.5, "paceWpm": 118,
                 "weakSpots": ["conflict"] }] }
```

### `POST /api/demo/seed` and `POST /api/demo/reset`

Load or clear Maria: two earlier sessions, her stories and weak spots, and the agency job posting.

## Voice out: ElevenLabs

Preetam owns this layer. Use the official ElevenLabs client and its `text_to_speech.convert_with_timestamps(...)` method in the Python sample; let the SDK handle authentication and HTTP requests. One response contains MP3 audio as base64 plus character alignment. Start with `eleven_flash_v2_5` and a voice available to our account; test English questions and Spanish coach replies with our teammate.

The sample is `elevenlabs/sample.py`. It uses the ElevenLabs Python client and python-dotenv. Run `python -m pip install -r elevenlabs/requirements.txt`, then `python elevenlabs/sample.py` from the repository root. Set `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID` in the root `.env`. It saves an MP3 and character-timing JSON in `elevenlabs/output/`. The installed Python SDK exposes the audio as `result.audio_base_64`. This sample is a standalone service check; the Next.js app adapter remains to be built using the official JavaScript SDK. Keep the Python sample simple; no extra Python web service is required by this plan.

- Keep the key on the server. ElevenLabs uses its own API key; AWS credentials still belong to Transcribe.
- Group normalized character alignment into word start/end times for caption highlighting. Fall back to the original alignment if normalized alignment is absent.
- ElevenLabs character timestamps are not phonemes or Polly-style visemes. Return `visemes: []` and `mouthTimingSource: "none"` until a separate mouth-timing stage exists. Never fabricate mouth shapes from spelling.
- Generate the question bank ahead of time and cache audio with its alignment. Cache by text, voice, model and all synthesis settings.
- The sample waits for the complete response. Streaming can be added later if measured latency requires it.

## Talking face: approximate animation first

The initial browser implementation can open the mouth during timed words and close it during gaps and pauses. The Python sample only generates audio and character timestamps. This is decorative animation, not pronunciation guidance. It cannot reliably show lip closure on m, b or p, or tongue placement.

For actual mouth shapes, add a separate lip-sync stage to pre-generated bank audio, such as Rhubarb Lip Sync. That stage must produce the `visemes` events and matching mouth-image map before the original mouth-teaching feature can be claimed. A browser Web Audio analyser can alternatively drive a simple loudness animation; it also provides no phonetic guidance.

### Speed control and slow replay

Follow `audio.currentTime` on every animation frame so captions and any available mouth events follow seeks, pauses and speed changes. Set `playbackRate` to 0.75 for slow questions or 0.5 for word replay. Generate a practice word once and replay the cached audio. The `speed` request field is retained as an optional playback hint, not a synthesis setting in this sample.

### Cost

Generation uses ElevenLabs credits according to the account's plan, selected model and text length. Confirm current pricing and available credits in the account before pre-generating the bank. Replaying saved audio makes no API calls. There is no longer a separate Polly speech-marks request or a Polly free-tier assumption.

## Coach side conversation in Spanish

The interviewer speaks only English, like a real one. At two points she can step out of the interview and talk to a coach in Spanish, then step back in exactly where she left off.

| Where | Why she would use it | Example |
|---|---|---|
| After the question, before answering | She did not understand the question | "¿Qué me está preguntando?" The coach explains the question and what a good answer covers |
| On the feedback screen | She wants to ask about the feedback or how to say something | "¿Cómo digo 'yo me encargaba de los medicamentos'?" The coach gives the English phrase and why |

### How it works

1. She taps "Preguntar al coach" and speaks or types in Spanish.
2. The recording goes to `/api/coach`. Transcribe runs with Spanish as the language.
3. Claude answers in Spanish as the coach. It is given the current question, her last answer, the feedback she received, her profile and the side conversation so far.
4. The reply is shown as text and spoken with an ElevenLabs voice tested with Spanish. The same face can speak it; the label changes from "Interviewer" to "Coach" so the two roles stay distinct.
5. She can keep asking. "Volver a la entrevista" returns her to the question or the feedback she left.

### Rules

- **The side conversation is a separate thread.** It never changes the question order or counts as an answer. The browser holds the thread and sends it with each request, so the server keeps no extra state.
- **No penalty for asking.** If she talks to the coach before answering, the start-delay clock restarts when she returns and taps to answer.
- **English to practise comes back marked.** The reply lists any English phrases separately, so the screen can show them with a "hear it" button that uses `speak`.
- **It feeds memory.** When she leaves the side conversation, a one-line note goes to Supermemory, for example "asked what 'go above and beyond' means." A later session can open with it.
- **This replaces the separate "understanding check."** She asks when she needs to, which is closer to how people learn.

### Turn states

```
ASKING -> LISTENING -> FEEDBACK -> NEXT or RETRY
   |                       |
   +-----> COACH <---------+      COACH returns to where it was opened
```

### `POST /api/coach`

Multipart form: `audio` (PCM, optional), `text` (optional, used when she types), `sessionId`, `questionId`, `stage` (`question` or `feedback`), `thread` (JSON array of earlier side-conversation turns).

```json
// response
{
  "heard": "¿Qué significa 'go above and beyond'?",
  "reply": {
    "es": "Significa hacer más de lo que le piden. Le están preguntando por una vez que usted hizo algo extra por un cliente.",
    "phrasesEn": [{ "en": "go above and beyond", "es": "hacer más de lo esperado" }]
  },
  "audioBase64": "<mp3>",
  "words": [{ "timeMs": 0, "endMs": 300, "value": "Significa" }],
  "visemes": [],
  "mouthTimingSource": "none"
}
```

Spanish speech uses the same character-alignment response shape. No real visemes are returned by ElevenLabs; the coach uses the same approximate mouth animation.

## Voice in: Transcribe

Preetam owns browser capture, audio format conversion and the Transcribe helper. Teammate 1 calls that helper from `/api/answer` and `/api/coach`. ElevenLabs replaces Polly for voice output; speech recognition remains Amazon Transcribe in this plan.

- Use the streaming interface. It accepts PCM, Ogg Opus or FLAC. Chrome's default recorder produces WebM, which streaming does not accept, so the browser captures raw samples and sends 16 kHz mono 16-bit PCM.
- The server feeds the PCM into one streaming request in small chunks and collects the final results. Each word arrives with a start time, an end time and a confidence.
- Set the language per answer: English normally, Spanish when she chose "answer in Spanish first."
- The batch interface would accept WebM, but it reads files from S3 and runs as a job. We have not found figures for how long a short clip takes, so we avoid it.

## Delivery numbers: our own code (`lib/delivery.ts`)

Preetam owns these calculations; Teammate 1 turns their output into bilingual feedback through Claude.

| Number | How it is computed | When it is mentioned (starting points, untested) |
|---|---|---|
| Start delay | Start time of her first word (recording begins when the question ends) | More than 4 seconds |
| Pace | Words divided by speaking time, per minute | Above about 170 words per minute. Slow speech is never flagged |
| Long pauses | Gaps between consecutive words longer than 1.5 seconds | Three or more in one answer |
| Speaking time | Last word end minus first word start | Under 8 seconds: the answer is too short |
| Unclear words | Words with confidence under 0.6, excluding short function words | Passed to Claude, which keeps at most two that matter to the answer |

Set these generously. Pausing to find a word in a second language is normal.

## Behaviour observations: Gemini (optional layer)

- The server wraps the same PCM as a WAV file and sends it to a Gemini model that accepts audio, with a prompt asking for short observations on how sure and how natural she sounded: hesitation, trailing off, rushing, reading from memory.
- Its output is a few short English notes in JSON. Claude turns them into learner-facing feedback; Gemini's text is never shown directly.
- The prompt forbids any comment on accent, origin or "sounding native."
- Give it a 4-second limit. If it is late or fails, Claude writes the feedback from the numbers alone.
- Gemini's documentation covers transcribing, summarising and answering questions about audio. It does not document judging delivery. Test it on our Spanish speaker's voice first, and drop it if the notes are vague or wrong.

## Written feedback: Claude

One call per answer. Inputs: the question and its type, the transcript, the delivery numbers, Gemini's notes if present, her profile, and the job posting if there is one. Output: the `feedback` object in the contract, enforced with structured output so the screen never has to parse free text.

Rules in the prompt:

- The sample answer may only use details from `usedDetails`, which must be things she said (or that are on her resume). Keep it at her English level.
- One good thing, one fix. One `practiseNext` for delivery.
- Never comment on accent or origin. No pronunciation score. Say "the software didn't catch this word," not "you said it wrong."
- Feedback in Spanish first, with English alongside.

The same model picks the next question (see below). Use low effort for both calls to keep the wait short.

## Questions

- **Bank:** `data/questions.hha.json`, 8–10 hand-written questions for home health aide, in English and Spanish, reviewed by our Spanish speaker.
- **From a posting:** when she pastes a job posting, Claude writes one or two questions from what it asks for.
- **Follow-ups:** Claude may ask one follow-up built on her last answer.
- **Fixed types**, used by every question whatever its source: `conflict`, `reliability`, `client_care`, `safety_physical`, `why_this_job`, `availability`. Weak-spot memory and the progress view depend on these.
- **Picking order:** a question of a type listed in her weak spots first, then a posting question, then the rest of the bank.

## Memory: Supermemory v5

- **Namespace:** one per learner, for example `learner_maria`. It is the first argument to every call.
- **Buckets, set once per learner:** `stories` (real work stories she has told) and `weak_spots` (question types and habits she struggles with), using `client.profiles.setBuckets`.
- **After each answer:** `client.add(namespace, { content, id: sessionId, metadata, date, dreaming: "instant" })`. The content is a short text record of the turn: question type, what she said, the story details, any weak spot. Reusing the session id keeps one session as one growing document.
- **At session start:** `client.profile(namespace, { buckets: ["stories", "weak_spots"] })`.
- **Why `dreaming: "instant"`:** by default, memories can take several minutes to form, and a new namespace can show an empty profile in that time. Instant mode makes them readable right away, at one extra billed operation per document.
- **Local fallback:** also write weak spots to `data/local/<learner>.json`. If the profile comes back empty or slow, the memory beat in the demo uses the local copy.
- **Seed early:** run the seed script well before judging, not minutes before.
- **Resume, if built:** `client.documents.uploadFile` into the same namespace.
- This project is on v5. Do not use `containerTag`, `customId`, or any path containing `/v3/` or `/v4/`.

## Files

```
app/                       setup, interview and progress pages
app/api/                   the routes above
lib/elevenlabs.ts          speech + character/word timings
lib/transcribe.ts          streaming speech to text
lib/delivery.ts            delivery numbers
lib/gemini.ts              behaviour notes (optional)
lib/claude.ts              question picking + feedback
lib/memory.ts              Supermemory + local fallback
lib/sessionLog.ts          sessions.json
data/questions.hha.json    question bank
data/visemeMap.json        optional external lip-sync symbol -> mouth image
data/seed/maria.json       demo persona
public/mouths/             mouth images
public/audio/              pre-generated question audio + timings
scripts/seed.ts            load Maria
scripts/pregenerate.ts     build public/audio
```

## Keys and permissions

The Python sample reads the root `.env`; the planned Next.js app uses `.env.local`. Both are git-ignored. Each builder sets the keys needed for their work locally; never put service keys in browser code or `NEXT_PUBLIC_` variables:

- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`
- `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`, optional `ELEVENLABS_MODEL_ID`
- `GEMINI_API_KEY`
- `SUPERMEMORY_API_KEY`
- `ANTHROPIC_API_KEY` (not needed if we reach Claude through Bedrock)

The AWS user needs permission for Transcribe streaming. The ElevenLabs key needs text-to-speech access and access to the selected voice and model.

## When a service fails

| Service | What the user sees | What we do |
|---|---|---|
| ElevenLabs | The question as a caption, no voice | Bank questions use the pre-generated audio, so this only affects new questions |
| Transcribe | "I didn't catch that. Try again." | No second speech-to-text service |
| Gemini | Nothing different | Skipped after 4 seconds; Claude uses the numbers |
| Claude | Her transcript and delivery numbers, with a retry button | |
| Supermemory | Nothing different | Local fallback copy of stories and weak spots |
| Coach side conversation | "El coach no está disponible ahora." | She can still type her question; the interview itself is unaffected |

## Prizes this architecture supports

- Best Use of AWS: Transcribe (and Bedrock if used).
- MLH Best Use of Gemini API: behaviour notes from the recording.
- JFFVentures, Best Overall, Best Diversity/Equality: see `TEAM_BRIEF.md`.
- Optional: MLH Best Use of MongoDB Atlas, by moving the session log there.

## Build plan

Three builders work in parallel. Preetam owns voice end to end. Teammate 1 owns interview logic, feedback and persistence. Teammate 2 owns the Next.js scaffold, screens and app integration. These are planned assignments, not claims that the features are implemented. The current Python voice sample lives in `elevenlabs/`; the `app/`, `lib/` and component paths below are the proposed app structure.

### Ownership at a glance

| Owner | Main responsibility | Files they own |
|---|---|---|
| **Preetam** | All voice input/output, audio processing, delivery metrics and reusable voice UI | `elevenlabs/`, `lib/elevenlabs.ts`, `lib/transcribe.ts`, `lib/delivery.ts`, optional `lib/gemini.ts`, `app/api/speak/route.ts`, `components/voice/`, `hooks/useRecorder.ts`, `scripts/pregenerate.ts`, generated bank audio |
| **Teammate 1** | Question selection, Claude feedback and coach logic, Supermemory, session state and progress data | All other `app/api/` route files, `lib/claude.ts`, `lib/memory.ts`, `lib/sessionLog.ts`, `lib/session.ts`, `data/questions.hha.json`, `data/seed/`, `scripts/seed.ts` |
| **Teammate 2** | App setup, shared types and example responses, screen layouts, navigation, integration and demo presentation | Next.js configuration, `app/` pages and layouts, global styles, components outside `components/voice/`, `types/contracts.ts`, `data/fake/`, progress and coach panels, hosting configuration |

Preetam owns the reusable recorder/player components even though they run in the browser. Teammate 2 places and styles their containers on the screens. Teammate 1 owns `/api/answer` and `/api/coach` as the coordinator; Preetam supplies their speech helpers. This keeps each route file under one owner.

### Preetam: voice and audio

| Task | Deliverable | Ready when |
|---|---|---|
| P1 | Keep `elevenlabs/sample.py` as the simple Python SDK example; choose English and Spanish-capable voice settings | A teammate can generate and listen to an MP3 using the root `.env` |
| P2 | Official SDK adapter in `lib/elevenlabs.ts` and `POST /api/speak`; convert character timestamps to word timings | Returns the documented `audioBase64`, `words`, empty `visemes` and `mouthTimingSource: "none"` |
| P3 | Reusable microphone capture hook and recorder control; 16 kHz mono signed 16-bit PCM | Produces PCM bytes, recording state and stop/cancel controls; handles denied microphone permission and releases the mic |
| P4 | `lib/transcribe.ts`: English/Spanish transcription with word start/end times and confidence | Teammate 1 can pass recorded PCM and receive the transcription shape below |
| P5 | `lib/delivery.ts`: start delay, pace, speaking time, pauses and candidate unclear words | Returns the documented delivery object from transcription timings; no accent or pronunciation score |
| P6 | Reusable question/coach audio player with timing-based caption highlighting, repeat and 0.75 speed | Playback follows `audio.currentTime`, including pause, seek, repeat and speed changes; audio stops before recording |
| P7 | Cached single-word speech at 0.5 speed; optional approximate mouth animation | The selected word can be replayed without regenerating it; mouth movement is never described as phonetic teaching |
| P8 | Pre-generate bank question audio and timing JSON; cache by text, voice, model and synthesis settings | Bank questions still play when new speech generation is unavailable |
| P9, optional | Gemini audio observations, bounded to 4 seconds; external lip sync only if time remains | Notes can be skipped without blocking feedback; real visemes are a separate stretch feature |

Start now: P1, then P2 and P3. Use the existing Python client sample as the reference for the ElevenLabs response. Keep server credentials out of player and recorder components.

### Teammate 1: interview intelligence and data

| Task | Deliverable | Ready when |
|---|---|---|
| T1 | Bilingual home-health-aide question bank, fixed question types, seeded Maria and job posting | The question picker can return a complete question without a live model call |
| T2 | Claude adapter for question selection, content and delivery feedback, and Spanish coach replies | Structured output matches the contracts; sample answers use only learner-provided details and never judge accent |
| T3 | `/api/session/start`, `/api/question/next`, session state and optional job-posting questions | A session retains its role, posting, current question and answer history |
| T4 | `/api/answer` coordinator | Calls Preetam's transcription and delivery helpers, gets optional audio notes, calls Claude, then saves the turn |
| T5 | Supermemory profile load/save plus local fallback; session log and `/api/progress` | A new session can target a prior weak spot and return progress rows |
| T6 | `/api/coach` coordinator | Accepts typed Spanish or calls Preetam's transcription helper; gets Claude's reply and calls Preetam's speech helper |
| T7 | `/api/demo/seed`, `/api/demo/reset`, and seed script | Resets Maria's memory fallback, session state and session log consistently |
| T8, optional | Resume ingestion | Adds learner-provided history only after the core demo works |

Start now: T1 and T2 with typed answers. Build T3 and the memory fallback while Preetam builds speech. Use example transcription objects to develop T4 before real recordings are ready. Keep speech synthesis/transcription implementation in Preetam's helpers, rather than duplicating it inside routes.

### Teammate 2: application and screens

| Task | Deliverable | Ready when |
|---|---|---|
| U1 | Next.js/TypeScript scaffold, shared contracts and example route responses | All three can run the same app; screens can be built from local example data |
| U2 | Setup screen: role, pasted posting and Spanish-first option | Starts a session and navigates to its first question |
| U3 | Interview screen and turn state machine | Setup -> question -> answer -> feedback -> retry/next works with example data; recording/thinking/error states are clear |
| U4 | Bilingual feedback panel and word-practice action | Displays good/fix/sample answer plus delivery feedback; hides delivery feedback for Spanish answers |
| U5 | Integrate Preetam's player, recorder, caption and replay components | Passes text/audio/word timings and receives recorded PCM without owning the audio internals |
| U6 | Spanish coach panel and return-to-interview behavior | Preserves the question or feedback state, holds the coach thread and restarts the answer delay clock after returning |
| U7 | Progress screen, reset control, empty/loading/error states | Shows only the learner's own session comparisons and supports demo reset |
| U8 | Local demo integration, optional Vercel setup, README presentation and demo recording | The complete flow runs from the app; public deployment happens only when the team authorizes it |

Start now: U1, then U2 through U4 against example data. Create empty slots for the voice components. Preetam supplies their internals; Teammate 2 connects them to navigation and API calls.

### Handoffs: agree these before coding against each other

Teammate 2 records these shapes in `types/contracts.ts`; each owner supplies one example result. The API contracts earlier in this file remain the browser-facing source of truth.

| Producer -> consumer | Handoff | Integration rule |
|---|---|---|
| Teammate 1 -> Preetam/Teammate 2 | Question `{ id, type, source, textEn, textEs }` | English is spoken for interviews; translated captions are selectable |
| Preetam -> Teammate 2 | Speech `{ audioBase64, words: [{ value, timeMs, endMs }], visemes: [], mouthTimingSource: "none" }` | JSON audio is raw MP3 base64; the player adds the data URL prefix. Timings are milliseconds |
| Preetam -> Teammate 2 -> Teammate 1 | Recorder returns `{ audio: Blob, durationMs }`; the screen submits multipart `audio`, `sessionId`, `questionId`, `language` | The blob contains raw 16 kHz mono signed 16-bit PCM, not WebM. Capture begins when question playback ends; after a coach interruption, it restarts when the learner returns and starts answering |
| Preetam -> Teammate 1 | `transcribe(pcm, language)` -> `{ transcript, words: [{ text, startMs, endMs, confidence }] }` | `language` is `en-US` or `es-US`; Preetam converts service seconds to app milliseconds |
| Preetam -> Teammate 1 | `analyzeDelivery(words)` -> the `delivery` object in `/api/answer` | Relative times start at recording start; retain initial silence so start delay remains meaningful |
| Preetam -> Teammate 1 | Optional `observeAudio(pcm)` -> short notes or `null` | A timeout or failed optional call must not prevent a response |
| Teammate 1 -> Teammate 2 | Complete `/api/answer`, session, coach and progress responses | Teammate 1 owns assembling responses and persistence; Teammate 2 owns rendering and navigation |
| Teammate 2 -> Preetam | Component props for recorder/player and callbacks for ready/stopped/error | Agree once in shared types; changes are coordinated before either side relies on them |

For Spanish coach speech, Teammate 1 calls Preetam's shared speech helper directly on the server; it does not make an HTTP call back into its own `/api/speak` route. Return the same word-timing fields with coach audio so Preetam's player can be reused. The existing coach contract's audio fields are extended with `words`, matching `/api/speak`.

### Parallel build order and checkpoints

Times below are the team's existing planning targets, not verified event requirements. Submission target remains Sunday 10:30am MST, ahead of the 11:00am deadline in the brief.

| Target | Preetam | Teammate 1 | Teammate 2 | Team checkpoint |
|---|---|---|---|---|
| First 30 minutes | Voice sample and helper shapes | Question bank and feedback shape | Scaffold, shared types and example responses | Agree payloads, file ownership and local configuration |
| Sat 7:30pm | Speech adapter and recorder in progress | Typed feedback and first question | Setup/interview/feedback screens on example data | Text loop works on screen |
| Sat 10:00pm | Speech, PCM recording, transcription and player | `/api/answer` calls voice helpers and Claude | Connect real voice components and answer route | Hear a question, answer aloud, see bilingual feedback |
| Sun 12:30am | Delivery metrics, slow replay, cached bank audio | Memory, session state and delivery feedback | Feedback actions and loading/error states | Next session targets an earlier weak spot |
| Sun 2:30am | Spanish voice input/output helpers | Coach logic and route | Coach panel and return behavior | Spanish side conversation returns to the same interview state |
| Sun 4:00am | Finish audio integration; optional Gemini kept or dropped | Seed/reset, session log and posting questions | Progress view and demo reset | Seeded demo runs end to end |
| Sun 7:00am | Fix voice issues only | Fix service/data issues only | Fix integration/UI issues only | Feature freeze |
| Sun 9:00am | Headset/audio rehearsal | Review feedback and memory beat | Capture demo video and screen recording | Two clean rehearsals |
| Sun 10:30am | All three finish submission together | All three | All three | Submit with buffer |

### Shared work and scope cuts

All three validate the problem with two non-native English speakers, ask the Spanish-speaking teammate to review wording, rehearse with the headset and finish the Devpost write-up and credits. These are manual integration checkpoints; this plan does not add a test suite.

If time slips, cut resume upload, extra roles, optional Gemini, external lip sync, job-posting generation, coach side conversation, then moving-mouth animation. Keep the spoken turn, bilingual feedback and memory beat. Preetam's first priority is usable speech input/output, not avatar polish.

## Not verified yet

Check each of these in the first hours, before building on it:

1. Our AWS credentials can call Transcribe streaming in the chosen region, and our ElevenLabs key can generate speech.
2. The ElevenLabs voice/model we pick returns audio and character alignment; any external lip-sync stage is tested separately.
3. Transcribe streaming handles Spanish (`es-US`) as well as English.
4. Whether Transcribe keeps "um" and "uh" in its output. If it drops them, fillers leave the confidence signal.
5. Gemini gives useful notes on delivery from a recording of our Spanish speaker.
6. The end-to-end wait is under 8 seconds.
7. Claude access: Anthropic key, or Bedrock model access on our AWS account.
8. The delivery thresholds, tried on real answers.
9. Our chosen ElevenLabs voice speaks Spanish clearly and returns character alignment for the coach.
10. Slowed playback (`playbackRate` 0.5) still sounds clear enough for the word replay.

## Sources

- ElevenLabs speech with character timing: https://elevenlabs.io/docs/api-reference/text-to-speech/convert-with-timestamps
- Amazon Transcribe streaming: https://docs.aws.amazon.com/transcribe/latest/dg/streaming.html
- Amazon Transcribe input formats: https://docs.aws.amazon.com/transcribe/latest/dg/input.html
- Amazon Transcribe word-level confidence: https://aws.amazon.com/about-aws/whats-new/2021/03/amazon-transcribe-supports-word-level-confidence-scores-for-streaming-transcription
- Gemini API audio guide: https://ai.google.dev/gemini-api/docs/audio
- Supermemory docs: https://supermemory.ai/docs

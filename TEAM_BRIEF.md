# Interview Practice in Your Language: Team Brief

sunhacks 2026 project overview for the team. Submission is due **Sunday Nov 15, 11:00am MST**.

## The idea in one line

Practice the interview you'll face for an hourly job, get coached in your own language on what you say and how you say it, and work with an AI that remembers what you struggled with last time.

## The problem

Many non-native English speakers know their job well but freeze when they have to describe it in English in an interview. They usually have nobody to practice with. Hourly-role interviews are also predictable ("Tell me about a time a customer was upset," "Can you lift 50 lbs?"), which makes them ideal to practice.

What we can back up today:

- Nearly one in ten working-age US adults (about 19.2 million people) has limited English proficiency, and they earn 25–40% less than English-proficient workers. Source: Brookings, 2014, using 2012 data. Say the year if we quote it.

What we cannot back up yet:

- That they "freeze in interviews" and "have nobody to practice with." A mentor has already told us the pain point must be clear, so we validate this tonight (see "Validate tonight" below).

## Who it's for

- **The user:** someone like Maria, 34, a Spanish-speaking home health aide applying for a better-paying agency job. She has the skills but struggles to explain them in English. Maria is invented; after tonight's conversations, replace her with a real person's situation and words.
- **Who would pay:** workforce boards, community college adult-ed programs, and staffing agencies that run job-readiness classes but can't give every learner one-on-one practice. Pace (a JFFVentures portfolio company) already sells to adult schools and workforce programs, which shows these buyers exist.

## Why this fits the JFF track

- The prize prompt: "Any project that makes work more accessible, rewarding, or productive for real people is fair game, whatever your tech stack."
- JFFVentures' thesis: "tech-enabled solutions that drive economic advancement for workers in middle to low-wage jobs." A better-paying job is the advancement, so we pitch the step-up interview, not a first job.
- We pitch one named worker, one clear barrier (language), and who pays.


## What makes ours different

Originality is one of the four judging criteria, and mock-interview apps are common, so we say these out loud:

1. **Her own stories become her answers.** She tells a real work story once, in her language; we turn it into an English answer. The sample answer uses only details she actually said.
2. **Answers at her English level.** A sample answer she can't say out loud is useless, so we keep to words she already uses.
3. **Coaching in her language.** The practice is in English; the explanation is in Spanish. She can also step out of the interview at any point, ask the coach a question in Spanish, and step back in.
4. **Memory across sessions.** It remembers her stories and her weak spots and comes back to them.
5. **A face with slow audio replay.** She can replay a word slowly with timed captions and approximate mouth movement. Real mouth shapes require a separate lip-sync stage and are a stretch feature, not a current ElevenLabs capability.
6. **Questions from the real job posting, and no resume needed.** She can paste the posting for the job she wants, and the interviewer asks about what it lists. Many of the workers we're building for have no resume, so voice comes first and documents are optional.
7. **Feedback on delivery as well as content, without judging accent.** A chatbot only sees the words. We also tell her how clear, confident and natural she sounded, and we never mark her down for her accent.

## How it works (the demo flow)

Our Spanish-speaking teammate plays Maria from a seeded profile. The judge watches, then can try one question.

1. Pick a role, or paste the posting for the job she wants. Version one ships one role (home health aide); retail and warehouse come later if there is time. Maria's seeded posting is for the agency job, so a question can quote it ("This job asks for dementia-care experience. Tell me about a time…"). A resume upload is optional and never required.
2. The interviewer face asks a question in English. Captions switch between English and Spanish, and there is a speed control.
3. Maria answers out loud, in English, or in Spanish first to practice.
4. Feedback appears in Spanish with English alongside. Content: one thing that was good, one thing to fix, and a stronger sample answer built only from details she said. Delivery: one line each on clarity, confidence and naturalness, and one thing to practise next.
5. She replays the word the delivery check picked, slowly, with captions; mouth movement is approximate.
6. She taps "Preguntar al coach," asks in Spanish how to say something, hears the answer in Spanish, and returns to the interview where she left off.
7. **The memory beat:** the next question returns to a weak spot from an earlier session ("Last time you struggled to describe a conflict with a coworker, so let's try that again").
8. A progress view shows improvement across sessions.

## How feedback works

Each answer gets two kinds of feedback, both in her language with English alongside.

**Content (what she said):** one thing that was good, one thing to fix, and a stronger sample answer built only from her own details, at her English level.

**Delivery (how she said it):** one line on each of the three dimensions below, and one thing to practise next. Delivery feedback applies to answers given in English.

| Dimension | What it means | What we look at | Example of what she sees |
|---|---|---|---|
| Clarity | Could the listener catch her words? | Pace; up to two key words the speech recogniser was unsure of | "Two words were hard to catch: 'medication' and 'schedule.' Listen slowly and try them again." |
| Confidence | Did she sound sure of her answer? | Time before she starts; long pauses; restarts; filler sounds, if the service keeps them; apologising or hedging phrases | "You waited six seconds before starting. Begin with 'In my last job…' while you think." |
| Naturalness | Did it sound like talking, not reciting? | Sentence length; word-for-word translated phrasing; rushed or memorised pacing | "'I am agree with the family' sounds more natural as 'I agree with the family.'" |

### We do not penalise accent

1. No pronunciation score, accent label or "native-like" rating appears anywhere.
2. Progress is measured against her own earlier sessions, never against a native speaker.
3. The recogniser's uncertainty is used only to choose words to practise. We say "the software didn't catch this word," not "you said it wrong."
4. A word is flagged only if it matters to the answer, and never more than two per answer.
5. The feedback prompt tells the model never to comment on accent or origin, and never to suggest she reduce her accent.
6. Our Spanish-speaking teammate reviews the feedback wording before the demo.

### What to know before building it

- Speech recognition is less accurate on non-native speakers (a 2025 study of ten systems found higher error rates for them in every model). Recogniser confidence is therefore a biased signal, which is why it never becomes a score.
- The thresholds for pace and pauses are our own judgment and untested. Set them generously: pausing to find a word in a second language is normal.
- If we use a pronunciation-scoring service, its stress and rhythm scores compare her with native-like speech, so we don't display them. At most they help choose the word for the slow replay.

## Three-minute demo script

| Time | What happens |
|---|---|
| 0:00–0:20 | The problem and Maria, in two sentences |
| 0:20–1:30 | One question live, drawn from the job posting: face asks, Maria answers, bilingual feedback on content and delivery, slow word replay |
| 1:30–2:10 | The memory beat, then the progress view |
| 2:10–2:40 | What makes it different, and who pays |
| 2:40–3:00 | Judge tries a question or asks theirs |

Rehearse it twice end to end. Use a headset microphone because the hall is noisy. Keep a screen recording as a fallback if the wifi fails.

## What we build

| # | Component | What it does | Built with | Priority |
|---|---|---|---|---|
| 1 | Question bank | 8–10 hand-written questions per role, tagged by type | Static JSON | Must |
| 2 | Interviewer brain | Picks the next question using her weak spots and, if given, the job posting | Claude | Must |
| 3 | Voice out | Question audio plus character timing | ElevenLabs | Must |
| 4 | Voice in | Records her answer in the browser; the server returns the transcript with word timings and per-word confidence | Amazon Transcribe streaming | Must |
| 5 | Feedback engine | Content: good point, one fix, stronger answer. Delivery: one line each on clarity, confidence and naturalness, and one thing to practise. Both languages | Claude, structured output | Must |
| 6 | Learner memory | Stores stories and weak spots; returns her profile | Supermemory | Must |
| 7 | Interview screen | Face, captions, microphone button, feedback panel | Next.js | Must |
| 8 | Talking face | Approximate 2D mouth following word timings; real visemes need separate lip sync; speed control; slow word replay | Mouth images in the browser | Should |
| 9 | Session log and progress view | Her own numbers per session (start delay, pauses, pace, content fixes), compared only with her earlier sessions | Local file or MongoDB Atlas | Should |
| 10 | Demo seed and reset | Loads Maria with two earlier sessions | Script | Must |
| 11 | Coach side conversation in Spanish | At the question or on the feedback screen she can step out, ask the coach in Spanish by voice or text, and step back in where she left off | Transcribe, Claude, an ElevenLabs voice tested with Spanish | Should |
| 12 | Job posting input | She pastes the posting text; questions and key vocabulary come from it. Falls back to the question bank | Text box, Claude | Should |
| 13 | Resume upload | Optional. Adds her work history to memory so questions and sample answers can draw on it | File upload, Supermemory | Could |
| 14 | Delivery analyser | Turns word timings and confidence into pace, pauses, start delay and a short list of words the recogniser missed, then passes them to the feedback engine | Plain code | Must |

### Build order, with a check for each step

1. **Text-only loop (1, 2, 5, 7):** three typed answers get sensible feedback in Spanish.
2. **Voice (3, 4):** our teammate completes one question hands-free.
3. **Delivery (14):** our teammate gives one answer fast and one with long pauses; the feedback names the difference, and neither mentions accent.
4. **Memory (6, 10):** after a restart, the first question refers to last session's weak spot.
5. **Job posting (12):** paste a real home health aide posting; at least one question names a requirement from it.
6. **Face (8):** optional approximate mouth movement follows audio playback. Real phonetic mouth shapes require separate lip sync. Cap animation work at two hours.
7. **Progress view (9):** the full demo runs twice without touching code.
8. **Resume (13), only if everything above works:** upload a one-page resume; the next question refers to a job listed on it.
9. **Submission:** see the checklist below.

### Who does what (three builders)

Preetam owns all voice-related implementation. The other two builders are labeled Teammate 1 and Teammate 2 until their names are added. The detailed task list, file ownership, handoff shapes and checkpoints are in `ARCHITECTURE.md` under "Build plan."

| Owner | Scope | Start with |
|---|---|---|
| **Preetam: voice and audio** | ElevenLabs official SDK for questions, Spanish coach speech and word replay; browser microphone capture; PCM conversion; Transcribe; delivery calculations; reusable audio player/recorder, caption timing, speed/repeat; cached bank audio; optional Gemini audio observations and approximate mouth animation | Existing `elevenlabs/sample.py`, then `/api/speak`, microphone capture and transcription helpers |
| **Teammate 1: interview logic and data** | Question bank and selection, Claude bilingual feedback, Spanish coach reasoning, Supermemory and local fallback, session state/logs, progress API, demo seed/reset, optional posting questions | Question bank and typed feedback, then session routes and memory |
| **Teammate 2: app and screens** | Next.js scaffold, shared types/example data, setup/interview/feedback screens, coach panel, progress view, navigation, integration of Preetam's voice components, loading/error states and demo presentation | Scaffold and example responses, then setup/interview/feedback screens |

#### First 30 minutes

- [ ] Teammate 2 creates the Next.js scaffold, `types/contracts.ts` and example response JSON under `data/fake/`.
- [ ] Teammate 1 supplies a bank question and example feedback, session and progress objects.
- [ ] Preetam supplies the speech/transcription/delivery helper shapes and keeps the Python sample runnable from the root `.env`.
- [ ] All three agree the contracts and owned files before integrating. Keep keys in local env files and out of browser code.

#### Route ownership

| Route | Owner | Handoff |
|---|---|---|
| `POST /api/speak` | Preetam | Text in; MP3 base64 and word timings out; no native visemes |
| `POST /api/session/start` | Teammate 1 | Learner/role/posting in; session, profile and first question out |
| `POST /api/question/next` | Teammate 1 | Session in; next bilingual question out |
| `POST /api/answer` | Teammate 1 | Calls Preetam's transcription/delivery helpers, then Claude and persistence |
| `POST /api/coach` | Teammate 1 | Calls Preetam's Spanish speech helpers around Claude's coach reply |
| `GET /api/progress` | Teammate 1 | Returns session comparisons for Teammate 2's progress screen |
| `POST /api/demo/seed`, `POST /api/demo/reset` | Teammate 1 | Restores/clears Maria's session and memory state |

Preetam owns reusable components in `components/voice/`; Teammate 2 owns the surrounding screen layouts and calls their callbacks. Teammate 1 owns the answer and coach route files, so Preetam provides reusable helpers instead of editing the same coordinator routes.

#### Each person's delivery checklist

**Preetam**

- [ ] Generate English and Spanish audio with the ElevenLabs client; save or return character alignment.
- [ ] Implement `/api/speak` and group character timings into word start/end times in milliseconds.
- [ ] Capture 16 kHz mono signed 16-bit PCM and provide transcription with word timings/confidence.
- [ ] Calculate pace, start delay, pauses and candidate unclear words without scoring accent.
- [ ] Provide player/recorder components, timed captions, repeat, slow question playback and single-word replay.
- [ ] Cache bank audio; add optional Gemini/audio animation only after the spoken loop works.

**Teammate 1**

- [ ] Write bilingual bank questions and structured feedback/coach prompts grounded in learner details.
- [ ] Build session start, next question and session state.
- [ ] Assemble `/api/answer` from Preetam's helpers, Claude feedback and turn persistence.
- [ ] Load/save learner memory with a local fallback; build progress data and demo seed/reset.
- [ ] Build the Spanish coach coordinator; add posting questions and optional resume ingestion only if time permits.

**Teammate 2**

- [ ] Set up the app, shared types and example responses so UI work can start immediately.
- [ ] Build setup, interview and bilingual feedback screens and turn navigation.
- [ ] Embed Preetam's voice components and submit recordings to Teammate 1's routes.
- [ ] Build the coach panel, preserving the screen state on return, plus progress and reset controls.
- [ ] Finish loading/error states, local demo integration, presentation and recording; configure hosting if the team chooses it.

#### Checkpoints

| Target | Shared result |
|---|---|
| First 30 minutes | Owners, shared contracts, scaffold and example responses agreed |
| Sat 7:30pm | Typed answer produces bilingual feedback on screen |
| Sat 10:00pm | Hear a question, answer aloud, receive feedback |
| Sun 12:30am | Delivery numbers, slow replay and memory beat work |
| Sun 2:30am | Spanish coach conversation returns to the same interview state |
| Sun 4:00am | Seed/reset, progress, cached audio and full demo integration work |
| Sun 7:00am | Feature freeze |
| Sun 9:00am | Two clean rehearsals and recorded fallback |
| Sun 10:30am | Submit together, ahead of the brief's 11:00am deadline |

All three handle user conversations, Spanish wording review with the Spanish speaker, headset rehearsal and submission. These are planning targets and manual checkpoints, not a new test suite. If time slips, cut resume upload, extra roles, optional Gemini, external lip sync, posting generation, coach conversation and finally mouth animation. Keep the spoken turn, bilingual feedback and memory beat.

### Open decisions

- **Speech-to-text service: decided.** Amazon Transcribe streaming, since we have AWS credentials and it returns word timings and per-word confidence. ElevenLabs handles voice output with its own API key. Details are in `ARCHITECTURE.md`.
- **Gemini for behaviour:** an optional layer that listens to the recording and notes hesitation, rushing and trailing off. Test it on our teammate's voice first; drop it if the notes are vague.
- **Session log:** a local file is fastest; MongoDB Atlas adds a prize entry for about an hour of work.

## Questions judges will ask

- **"Why not just use ChatGPT's voice mode?"** Maria would have to write the prompt, in English. Ours has the role's real questions, coaches in Spanish, writes answers at her level from her own stories, and remembers her weak spots next week.
- **"How is this different from Pace?"** Pace teaches English courses. We are interview practice for the step up to a better-paying job.
- **"How do you know the problem is real?"** Answer with the people we spoke to tonight, then the Brookings figure.
- **"Who pays?"** Workforce boards, adult-ed programs and staffing agencies that run job-readiness classes.
- **"What stops it inventing things about her?"** The sample answer may only use details she said, or that are on her resume if she uploaded one; we show the phrases it drew on.
- **"Other tools take a resume and a job description. Why is the resume optional here?"** Many of the workers we're building for have no resume, or one that undersells them. She tells her work history by voice in her own language; a posting or resume only adds detail.
- **"Does it mark people down for their accent?"** No. There is no pronunciation score. We measure pace, pauses and hesitation, compare her only with her own earlier sessions, and use the recogniser's uncertainty just to pick up to two words to practise.
- **"What was hard to build?"** Bilingual voice in and out, mouth timing synced to speech, delivery analysis from word timings, structured feedback, and memory that changes the next session.

## Prizes we're entering

Judging criteria for all of them: Originality, Complexity, Functionality, Design.

- [JFFVentures] Best Hack for the Future of Work
- Best Overall
- Best Diversity/Equality
- Best Use of AWS (Transcribe for speech to text; Bedrock if used)
- MLH Best Use of Gemini API (behaviour notes from the recording), if that layer survives testing
- Audience Vote
- Rookie, if we qualify
- Optional: MLH Best Use of MongoDB Atlas, Best Domain Name from GoDaddy Registry

## Risks

- **The pain point is still an assumption.** Fix with tonight's conversations.
- **Hall noise breaks speech recognition.** Headset microphone; test the speech-to-text service in the hall before judging.
- **Delivery feedback that quietly punishes accent.** Follow the six rules under "We do not penalise accent," and have our teammate try to make it say something unfair before the demo.
- **The face eats the night.** Two-hour cap; the demo must work without it.
- **Bad Spanish in the feedback.** Our Spanish-speaking teammate reviews the feedback wording before the demo.
- **Personal data.** Use the seeded persona; don't store real names or recordings. A resume carries a name, address and phone number, so the demo uses only the seeded one.
- **Looking like every other mock-interview tool.** "Upload resume and job description" is the standard pattern. Keep voice as the first screen and the uploads as optional extras.

## Validate tonight

Ask two non-native English speakers (international students here count) about real events, not opinions:

1. Tell me about your last job interview in English. What was the hardest moment?
2. How did you prepare, and who did you practice with?
3. Was the hard part understanding the question, finding the words, or being understood?

Put one real quote in the pitch. If the answers don't match our problem statement, change the statement before we build further.

## Before we submit

- [ ] GitHub repo is public and shows our work (required)
- [ ] README credits the tutorials and AI tools we used (required by the rules)
- [ ] Devpost write-up, with every team member listed
- [ ] Write-up says whether we agree to our video appearing in the end-of-event playlist
- [ ] Demo video, two minutes maximum, on YouTube (optional but worth doing)
- [ ] Each sponsor prize selected on Devpost, with a line on how we used that sponsor's tech

## Sources

- sunhacks 2026 on Devpost: https://sunhacks-2026.devpost.com/
- JFFVentures: https://www.jffventures.vc/
- Pace AI: https://www.paceapp.ai/
- Brookings, "Investing in English Skills" (2014): https://www.brookings.edu/articles/investing-in-english-skills-the-limited-english-proficient-workforce-in-u-s-metropolitan-areas/
- ElevenLabs speech with character timing: https://elevenlabs.io/docs/api-reference/text-to-speech/convert-with-timestamps
- Azure pronunciation assessment: https://learn.microsoft.com/en-ca/azure/ai-services/speech-service/how-to-pronunciation-assessment
- Amazon Transcribe word-level confidence: https://docs.aws.amazon.com/transcribe/latest/dg/how-it-works.html
- Speech recognition on non-native speakers (SLaTE 2025): https://www.isca-archive.org/slate_2025/roll25_slate.pdf

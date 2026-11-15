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
3. Transcription uncertainty is never used as an ability score; Gemini checks the original audio before suggesting words to practise. We say "the software didn't catch this word," not "you said it wrong."
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
| 2 | Interviewer brain | Picks the next question using her weak spots and, if given, the job posting | Gemini | Must |
| 3 | Voice out | Question audio plus character timing | ElevenLabs | Must |
| 4 | Voice in | Records her answer in the browser; ElevenLabs returns the answer transcript and word timestamps | ElevenLabs Speech to Text | Must |
| 5 | Feedback engine | Content: good point, one fix, stronger answer. Delivery: one line each on clarity, confidence and naturalness, and one thing to practise. Both languages | Gemini, structured output | Must |
| 6 | Learner memory | Stores stories and weak spots; returns her profile | Supermemory | Must |
| 7 | Interview screen | Face, captions, microphone button, feedback panel | Next.js | Must |
| 8 | Talking face | Approximate 2D mouth following word timings; real visemes need separate lip sync; speed control; slow word replay | Mouth images in the browser | Should |
| 9 | Session log and progress view | Her own numbers per session (start delay, pauses, pace, content fixes), compared only with her earlier sessions | Local file or MongoDB Atlas | Should |
| 10 | Demo seed and reset | Loads Maria with two earlier sessions | Script | Must |
| 11 | Coach side conversation in Spanish | At the question or on the feedback screen she can step out, ask the coach in Spanish by voice or text, and step back in where she left off | ElevenLabs STT, Gemini, ElevenLabs TTS | Should |
| 12 | Job posting input | She pastes the posting text; questions and key vocabulary come from it. Falls back to the question bank | Text box, Gemini | Should |
| 13 | Resume upload | Optional. Adds her work history to memory so questions and sample answers can draw on it | File upload, Supermemory | Could |
| 14 | Delivery analyser | Assesses the recorded answer audio plus its STT transcript/timestamp JSON for observable delivery patterns | Gemini audio input and structured output | Must |

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

The current flow is **ElevenLabs TTS -> recorded learner answer -> ElevenLabs STT -> Gemini assessment and next action -> Supermemory -> next spoken prompt**. Gemini receives the original answer audio and its transcript/timestamp JSON together. The old Amazon Transcribe/Claude split is superseded.

| Owner | Scope | Start now |
|---|---|---|
| **Preetam: voice backend** | Implemented Python TTS/STT, Gemini audio/JSON assessment handoff, initial Supermemory integration, FastAPI `/speak` and `/answer`, and usage docs | Verify both endpoints with real credentials/audio and hand off `elevenlabs/USAGE.md` |
| **Teammate 1: intelligence and memory** | Gemini prompts/schema, content/delivery feedback, next-action decisions, question bank, Supermemory, session routes, Spanish coach, progress data and seed/reset | Review the sample's `Assessment` schema, write bank questions, integrate profile/history and session coordination |
| **Teammate 2: app and screens** | Next.js scaffold/shared types, browser microphone recording/upload, audio playback, language/repeat/slow controls, screens, navigation, coach/progress panels and endpoint integration | Build browser recorder/player and connect to Preetam's endpoints using `elevenlabs/USAGE.md` |

Detailed handoffs and file ownership are in `ARCHITECTURE.md` under Build plan. Preetam owns the Python `/speak` and `/answer` endpoints. Teammate 2 owns browser recorder/player components and their integration. Teammate 1 owns the planned session/question/progress/coach routes and shared Gemini/memory logic. Teammate 2 owns layouts, navigation and rendering.

#### Local pipeline to start with

```bash
python -m pip install -r elevenlabs/requirements.txt
python elevenlabs/assess_answer.py elevenlabs/recordings/answer.wav --question "Tell me about a time you helped someone who was upset." --learner maria
```

Record your own answer first and supply that file. Setup and env keys are in `elevenlabs/USAGE.md`. `answer_timestamps.json` belongs to the learner recording; the existing TTS `timestamps.json` belongs to generated question audio and must not be used as answer evidence.

The sample returns transcript/timings and Gemini's bilingual content/delivery feedback, weak spots and next action. It loads/saves Supermemory when configured and clearly reports local fallback otherwise. The voice pipeline is exposed through FastAPI `/speak` and `/answer`; startup and frontend examples are in `elevenlabs/USAGE.md`. The app loop and live account verification remain.

#### Checkpoints

1. Preetam runs the recorded-answer pipeline and shares the JSON shapes with the other two.
2. Teammate 1 integrates Gemini and memory; Teammate 2 builds the app against example responses in parallel.
3. Complete a spoken turn on the real screen, then demonstrate a follow-up and a remembered weak spot.
4. Add Spanish coach, slow word replay, progress and demo seed/reset.
5. Rehearse twice with the headset. Target submission at Sunday 10:30am MST, ahead of the 11:00am deadline listed above.

Cut resume upload, extra roles, external lip sync, posting generation, coach panel and mouth animation first. Keep Gemini's assessment, spoken turns, bilingual feedback and memory. All three handle user conversations, Spanish review with the Spanish speaker and submission. No test suite is requested.

### Decisions

- **Speech output and answer STT:** ElevenLabs; official SDK clients.
- **Assessment and next-step decisions:** Gemini receives the recorded answer audio, answer transcript/timestamps, question and learner history. It assesses content and delivery together.
- **Memory:** Supermemory per learner, supplemented by recent local turns. Save learner statements and model coaching as distinguishable fields.
- **Session progress:** show the learner's own earlier feedback/weak spots. Numerical delivery charts require actual measured data; do not invent them from qualitative notes.

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
- MLH Best Use of Gemini API (audio-based content/delivery assessment, coaching and next-action decisions)
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
- ElevenLabs speech to text: https://elevenlabs.io/docs/api-reference/speech-to-text/convert
- Gemini audio input: https://ai.google.dev/gemini-api/docs/audio
- Speech recognition on non-native speakers (SLaTE 2025): https://www.isca-archive.org/slate_2025/roll25_slate.pdf

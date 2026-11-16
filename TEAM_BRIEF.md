# Shift Up: Project Brief

Shift Up is interview practice in your language. "Shift" is how hourly work is counted; "up" is the better-paying job.

A sunhacks 2026 project.

## The idea in one line

Practice the interview you'll face for an hourly job, get coached in your own language on what you say and how you say it, and work with an AI that remembers what you struggled with last time.

## The problem

Many non-native English speakers know their job well but freeze when they have to describe it in English in an interview. They usually have nobody to practice with. Hourly-role interviews are also predictable ("Tell me about a time a customer was upset," "Can you lift 50 lbs?"), which makes them ideal to practice.

Most of what goes wrong in that interview is not English. It is not knowing what a question is really asking, not saying "I did this" and how it ended, and not knowing what to do after missing a question. Nerves make all of it worse.

What supports this:

- Nearly one in ten working-age US adults (about 19.2 million people) has limited English proficiency, and they earn 25–40% less than English-proficient workers (Brookings, 2014, using 2012 data).
- Studies of interviews for low-paid work in Britain found that migrant candidates did much worse, and traced it to the unstated expectations of "tell me about a time" questions (Roberts).
- A review of 22 studies found that speakers with an accent were rated less hirable at the same level of competence (Schulte and others, 2024). That bias belongs to the listener, which is why we do not train accent.
- Guides for immigrants tell job seekers to ask the interviewer to repeat a question they did not understand, but give no way to practise it (USAHello).

What we have not done yet: test it with real learners. The need is argued from the research above.

## Who it's for

- **The user:** someone like Jaciel, a Spanish-speaking home caregiver applying for a better-paying agency job. He has the skills but struggles to explain them in English. Jaciel is the invented learner in our demo.
- **Who would pay:** workforce boards, community college adult-ed programs, and staffing agencies that run job-readiness classes but can't give every learner one-on-one practice. Pace (a JFFVentures portfolio company) already sells to adult schools and workforce programs, which shows these buyers exist.

## Why this fits the JFF track

- The prize prompt: "Any project that makes work more accessible, rewarding, or productive for real people is fair game, whatever your tech stack."
- JFFVentures' thesis: "tech-enabled solutions that drive economic advancement for workers in middle to low-wage jobs." A better-paying job is the advancement, so this is practice for the step-up interview, not a first job.
- The project is built around one worker, one clear barrier (language), and a buyer.

## What makes it different

Mock-interview apps are common. These are the differences.

1. **The learner's own stories become their answers.** They tell a real work story once, in their language; we turn it into an English answer. The stronger answer uses only details they gave, and leaves a blank where a fact is missing.
2. **Answers at their English level.** A sample answer they can't say out loud is useless, so we keep to words they already use.
3. **Coaching in their language.** The practice is in English; the explanation is in Spanish. They can step out of the interview at any point, ask the coach a question in Spanish, and step back in.
4. **The unwritten rules, said out loud.** Each question comes with one line on what the interviewer wants to hear. The feedback checks that they say "I" for what they did and say how it ended, and it says plainly when an answer would count against them.
5. **Practice for the moment they get lost.** Saying "Could you say that again more slowly?" makes the interviewer repeat the question slowly, and it is never counted against them.
6. **An interviewer who listens.** She follows up on what was just said, using the learner's own words, and words her questions around the job posting or resume if one is given.
7. **Memory across sessions.** It remembers their stories and their weak spots and comes back to them.
8. **A face that teaches.** The interviewer's mouth follows the real mouth shapes of the words, and any word can be replayed slowly.
9. **Voice first, documents optional.** Many of the workers we're building for have no resume. A job posting or a resume only adds detail, and neither is required.
10. **Feedback on delivery as well as content, without judging accent.** A chatbot only sees the words. We also say how clear, confident and natural the answer sounded, and we never mark anyone down for their accent.

## How it works

1. The learner types a name and, if they want, pastes the posting for the job they are going for and a resume. Version one covers one role, home health aide.
2. The interviewer asks a question in English, out loud. Captions switch between English and Spanish, and there is a slower voice.
3. The learner answers out loud, in English, or in Spanish first to work out the content.
4. Feedback appears in both languages. Content: one thing that was good, one thing to fix, and a stronger answer built only from their own details. Delivery: one line each on clarity, confidence and naturalness, and one thing to practise next.
5. They can point at any English word to hear it, at normal speed or slowly, and see how it sounds.
6. They can ask the coach in Spanish how to say something, hear the answer in Spanish, and return to the interview where they left off.
7. The next question may follow up on their answer, or move on.
8. Next time, the first question returns to what was hard: "Last time, questions about disagreements at work were hard for you. Let's start there."
9. A progress view sets each session beside their own earlier ones.

The live demo is described step by step in [`DEMO_SCRIPT.md`](DEMO_SCRIPT.md).

## How feedback works

Each answer gets two kinds of feedback, both in Spanish and English together.

**Content (what was said):** one thing that was good, one thing to fix, and a stronger answer built only from the learner's own details, at their English level.

**Delivery (how it was said):** one line on each of the three dimensions below, and one thing to practise next. Delivery feedback applies to answers spoken in English.

| Dimension | What it means | What we look at | Example of what the learner sees |
|---|---|---|---|
| Clarity | Could the listener catch the words? | Pace; up to two key words the speech recogniser was unsure of | "The software did not catch the word 'medication'." |
| Confidence | Did they sound sure of the answer? | Time before starting; long pauses; filler sounds; apologising or hedging | "You waited about six seconds before starting. There is no need to apologise for your English." |
| Naturalness | Did it sound like talking, not reciting? | Verb tenses; word-for-word translated phrasing | "Tell the story in the past: say 'was angry' instead of 'is angry'." |

### We do not penalise accent

1. No pronunciation score, accent label or "native-like" rating appears anywhere.
2. Progress is measured against the learner's own earlier sessions, never against a native speaker.
3. The recogniser's uncertainty is used only to choose words to practise. We say "the software didn't catch this word," not "you said it wrong."
4. A word is flagged only if it matters to the answer, and never more than two per answer.
5. The feedback prompt tells the model never to comment on accent or origin, and never to suggest reducing an accent.

### Limits we know about

- Speech recognition is less accurate on non-native speakers (a 2025 study of ten systems found higher error rates for them in every model). Recogniser confidence is therefore a biased signal, which is why it never becomes a score.
- The thresholds for a late start, pauses and fillers are our own judgment and untested. They are set generously: pausing to find a word in a second language is normal.

## What it is made of

| Part | What it does | Built with |
|---|---|---|
| Question bank | Ten hand-written questions for home health aide, tagged by type, each with a line on what the interviewer wants to hear | Static JSON |
| Interviewer | Picks the next question from the learner's weak spots, follows up on answers, and words questions around the posting or resume | Grok (Claude as the alternative) |
| Voice out | Question audio plus mouth-shape timing | Amazon Polly |
| Voice in | Records the answer in the browser; returns the transcript with word timings and per-word confidence | Amazon Transcribe streaming |
| Delivery analyser | Turns word timings into the wait before starting, pauses, pace, fillers and the words the recogniser missed | Plain code |
| Second listener | Listens to the recording for hesitation and tone | Gemini |
| Feedback engine | Content and delivery feedback in both languages, under rules against judging accent or inventing facts | Grok, structured output |
| Asking to repeat | Recognises a request to say the question again, and has the interviewer repeat it slowly | Plain code |
| Learner memory | Stores stories and weak spots; returns the learner's profile | Supermemory |
| Talking face | A mouth drawn in the browser that follows Polly's timing; speed control; slow word replay | SVG in the browser |
| Word help | How an English word sounds, written the way a Spanish speaker would read it, with audio | CMU Pronouncing Dictionary, Amazon Polly |
| Coach side conversation in Spanish | The learner steps out, asks in Spanish by voice or text, and steps back in | Transcribe, Grok, a Spanish Polly voice |
| Job posting and resume | Pasted text, or a PDF or Word file read into text. Not stored | Text box, file reader |
| Session log and progress view | The learner's own numbers per session, compared only with their earlier sessions | Local file |
| Interview screen | Face, captions, microphone, feedback, coach panel, progress | Next.js |

How these fit together is in [`ARCHITECTURE.md`](ARCHITECTURE.md).

## Common questions

- **"Why not just use ChatGPT's voice mode?"** The learner would have to write the prompt, in English. Ours has the role's real questions, coaches in Spanish, writes answers at their level from their own stories, and remembers their weak spots next week.
- **"How is this different from Pace?"** Pace teaches English courses. We are interview practice for the step up to a better-paying job.
- **"How do you know the problem is real?"** From research on interviews for low-paid work, on accent bias in hiring and on speech recognition, listed under Sources. We have not yet tested it with learners.
- **"Who pays?"** Workforce boards, adult-ed programs and staffing agencies that run job-readiness classes.
- **"What stops it inventing things about the learner?"** The stronger answer may only use what they said, their remembered stories or their resume. Where a fact is missing it leaves a blank for them to fill in.
- **"Other tools take a resume and a job description. Why is the resume optional here?"** Many of the workers we're building for have no resume, or one that undersells them. They tell their work history by voice in their own language; a posting or resume only adds detail.
- **"Does it mark people down for their accent?"** No. There is no pronunciation score. We measure the wait before starting, pauses and fillers, compare the learner only with their own earlier sessions, and use the recogniser's uncertainty just to pick up to two words to practise.
- **"What was hard to build?"** Bilingual voice in and out, mouth timing synced to speech, delivery analysis from word timings, structured feedback that does not invent, and memory that changes the next session.

## Risks we designed against

- **Delivery feedback that quietly punishes accent.** The five rules under "We do not penalise accent."
- **Feedback that invents facts about the learner.** Blanks instead of guesses, and a check on every request that facts come only from what they said, their stories or their resume.
- **Personal data.** A resume carries a name, address and phone number, so it is kept for the session only and never stored. Recordings are not kept. The demo uses an invented learner.
- **Looking like every other mock-interview tool.** "Upload resume and job description" is the standard pattern. Voice is the first screen and the uploads are optional extras.

## What comes next

- Test it with real learners. Three questions to ask them about their last interview in English: what was the hardest moment, how did they prepare and with whom, and was the hard part understanding the question, finding the words, or being understood?
- Have a Spanish speaker review all the Spanish, including what the model writes.
- Add more jobs: retail and warehouse first.

## Sources

- sunhacks 2026 on Devpost: https://sunhacks-2026.devpost.com/
- JFFVentures: https://www.jffventures.vc/
- Pace AI: https://www.paceapp.ai/
- Brookings, "Investing in English Skills" (2014): https://www.brookings.edu/articles/investing-in-english-skills-the-limited-english-proficient-workforce-in-u-s-metropolitan-areas/
- Roberts, linguistic inequalities in the job interview (2012): https://newdiversities.mmg.mpg.de/?p=1997
- Meta-analysis on dialects and accents in recruitment (FU Berlin, 2024): https://fu-berlin.de/en/presse/informationen/fup/2024/fup_24_084-metastudie-dialekte-akzente-bewerbungsverfahren/index.html
- EEOC, national origin discrimination, in Spanish: https://www.eeoc.gov/es/laws/guidance/hoja-informativa-discriminacion-por-nacionalidad
- USAHello, preparing for a job interview, in Spanish: https://usahello.org/es/trabajo/encontrar-trabajo/entrevista-trabajo/
- Amazon Polly speech marks: https://docs.aws.amazon.com/polly/latest/dg/speechmarks.html
- Amazon Transcribe word-level confidence: https://docs.aws.amazon.com/transcribe/latest/dg/how-it-works.html
- Speech recognition on non-native speakers (SLaTE 2025): https://www.isca-archive.org/slate_2025/roll25_slate.pdf

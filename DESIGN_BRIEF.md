# Shift Up: design brief

A brief to hand to a designer or a design tool. It describes what exists today and what a better design must keep.

## Project

Shift Up is a web app where Spanish-speaking adults practise English job interviews for hourly work (first role: home health aide). An on-screen interviewer asks a question aloud in English. The learner answers out loud. They get coaching in Spanish and English on what they said and how they said it, and the app remembers them next time.

The name: "shift" is how hourly work is counted, and "up" is the better-paying job.

## Who uses it

- Learners: adults in low- and middle-wage jobs, on a phone, often nervous about their English and not confident with apps. Spanish first.
- Judges at a hackathon, watching on a laptop for three minutes.

## How it should feel

Warm, calm, respectful, adult. Like a patient teacher, not a test. Not childish, not corporate, and not the usual purple "AI" look. One thing to do at a time.

## The promise to keep visible

"We never grade your accent." No scores, grades, streaks or red marks anywhere. Progress is only compared with the learner's own earlier sessions.

## Pages and states to design

Phone at 375px first, then laptop at 1280px.

1. **Landing and setup.** Headline, how it works in four steps, the accent promise, then a setup card: name, job, optional job posting, "answer in Spanish first" switch, load demo history, start.
2. **Interview**, in these states:
   - Ready: greeting by name and a Begin button.
   - Interviewer speaking: portrait, caption with the current word highlighted, caption language switch (English / Español), speed switch, repeat button, "Ask the coach in Spanish" button.
   - Listening: large microphone button with a ring that reacts to the voice, a timer, "I'm done", "type instead".
   - Thinking: a brief waiting state.
   - Feedback: a "read my feedback aloud" switch; what we heard; one thing done well; one thing to fix; a stronger sample answer with a "hear it" button; three delivery lines (clarity, confidence, naturalness); a "practise this next" card with a slow-replay button.
   - Error: no speech heard, or a service failed, with a retry.
3. **Coach panel.** Slides over the interview. A Spanish chat with typed and spoken questions, English phrases to practise with a "hear it" button, and "back to the interview".
4. **Progress.** The learner's sessions over time. No leaderboard.

## Rules for content

- Every piece of feedback appears in two languages together: one large, the other smaller beneath it. A language switch (EN / ES) decides which leads.
- A "welcome back" note recalls what was hard last time.
- Feedback is short: one or two sentences per item.

## The interviewer

A lifelike illustrated portrait (not a photo, not a cartoon mascot) in a frame like a video call, with a name tag and a "speaking" indicator. The coach is the same person in a different colour.

Constraint: the mouth is drawn by code from nine poses, so the mouth must stay a separate layer that code can redraw, and the portrait needs a zoomed-in view of the mouth for the slow replay.

## Technical constraints

- Next.js with plain CSS and CSS variables for colours, type, spacing and radii. No component library. Inline SVG icons, no emoji.
- Theme in use: "Kitchen table" (reference shots in `public/theme/`). Cream background `#FBF6EF`, ink `#1E2A32`, teal `#0F5E5A` (interviewer), coral `#C8432A` (microphone and main action), blue `#2C4A8A` (coach). Fonts: Newsreader for headings, questions and quotes; Figtree for text. All tokens are CSS variables at the top of `app/globals.css`.
- Logo: the wordmark sets "Up" in coral one step higher than "Shift", standing on an underline (`components/Logo.tsx`, `app/icon.svg`, `public/brand/shift-up-logo.svg`).

## Accessibility

Text contrast at least 4.5:1. Touch targets at least 44px. Visible keyboard focus. Body text 16px or larger. Works without motion for people who turn motion off. Nothing conveyed by colour alone.

## What to deliver

- Two or three visual directions shown on the interview "speaking" and "feedback" states, phone and laptop.
- For the chosen direction: all pages and states above, a token sheet (colours, type scale, spacing, radii, shadows), and each component in its states.

## Avoid

Changing the flow or adding steps. Stock photos of people. Gamification. Anything that reads as a score for how someone speaks.

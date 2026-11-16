# Shift Up: demo run-through

A scripted scenario for the live demo. Jaciel speaks to the app; the other person presents. The centre of it is one question answered twice: first with mistakes planted on purpose, so the judges watch the app catch each one, then cleanly, so they see the difference.

What was checked on 15 Nov: the flow, with typed answers against the running app; and both takes below, as generated speech sent through the whole app. On take 1 it heard all four "um"s, timed the wait at 6.1 seconds, and the feedback named the wait, the ums, the apology, the tense and the "we". Not checked: a real voice through a real microphone in a noisy room. Rehearse the two takes aloud at least twice.

## The story in one line

Jaciel already does the job. What stands between him and the better-paid agency job is an interview in English, and most of what goes wrong in that interview is not his English: it is the unwritten rules, and nerves.

## Who Jaciel plays

A caregiver, invented to match the demo history, the sample resume and the sample posting.

- Speaks Spanish; his English is conversational.
- Five years as a home caregiver in Phoenix, three of them with a client who has dementia.
- Applying to Desert Bloom Home Care (sample posting, $19.50 an hour).
- From two earlier practice sessions the app remembers three of his stories and two things that were hard: questions about disagreements, and long pauses before he starts.

## Before you go on

Do this at least two minutes before, in this order.

1. Start the app (`npm run dev`) and open `http://localhost:3000` in Chrome on the laptop. Plug in the headset microphone.
2. Clear Jaciel's memory, so earlier rehearsals do not change the first question. In PowerShell:
   ```
   Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/demo/reset -ContentType "application/json" -Body '{"learnerId":"jaciel"}'
   ```
3. Settle the microphone permission: click **Start the interview**, then **Begin**, and allow the microphone when the browser asks. Then click the Shift Up logo to go back to the home page. Nothing is saved by this.
4. On the setup card: check the name is **Jaciel**, then click **Load two earlier sessions for Jaciel**. Wait for the green confirmation (about 30 seconds).
5. Click **Use the sample posting** and **Use the sample resume**. Do this last: leaving the home page empties both boxes.
6. Leave "Answer in Spanish first" off, the page language on **EN**, and "Read my feedback aloud" off.
7. Repeat steps 2, 4 and 5 after every rehearsal. Each rehearsal is remembered.

## The planted mistakes

Five mistakes go into the first take. Each one lands on a different card, so the presenter can point at them one by one.

| Mistake, on purpose | How Jaciel does it | What the app shows | What to tell the judges |
|---|---|---|---|
| A long wait before starting | When the interviewer stops, stay completely silent and count to six. Any sound, even "um", ends the wait. The app notices a wait of more than four seconds. | **Confidence:** "You waited about six seconds before starting…" and **Practise this next:** begin as soon as you hear the question | "Silence reads as not knowing the job. He composes in Spanish and translates. We time it from the recording." |
| Filler sounds | Say a clear, separate "um" four times. The app counts from three; the fourth is a spare in case one is not heard. | **Confidence:** "…and used 'um' three times" | "Measured, not guessed." |
| Apologising for his English | Open with "Sorry for my English." | **Confidence:** "There is no need to apologise for your English; you can simply begin with the answer." | "Nervous speakers apologise before they start. No interviewer asked for that." |
| The wrong tense | Tell the story in the present: "is angry", "we talk", "we change". | **Naturalness:** say "was angry", not "is angry"; "we talked", not "we talk" | "It quotes his own words back with the fix. It only corrects what he really said." |
| "We", and no ending | Say "we talk with her and we change the schedule", and stop there. | **One thing to fix:** either "say I for what you did" or "say how it ended". It picks one. | "This is not grammar. US interviewers expect 'I did' and a result, and modest people leave both out." |

One thing is planted by doing nothing: **Clarity** will say every word was understood. Point at it and say: "He has an accent. Clarity says he was understood, and that is all we measure. There is no accent score anywhere."

### Should he pronounce a word wrong?

No, for two reasons.

- The app does not judge pronunciation, by design. "We never grade your accent" is the promise the judges should hear, and a planted mispronunciation argues against it.
- It cannot be planted reliably. The only thing the app can flag is a word the speech software was unsure of, and that never happened once in our testing. A mispronounced word usually just comes back as a different word in "What we heard".

Show the pronunciation help instead: point at a word in the stronger answer, and the card shows how it sounds in Spanish spelling with **Hear it** and **Slowly**. If the software does miss a word on stage, Clarity will say "The software did not catch the word …". Read it out as a bonus: the blame is on the software, not on him.

## Jaciel's two takes

**Take 1, with the mistakes.** Silent count to six, then:

> "Um, sorry for my English. Um, one time the daughter of my client is angry about the medication schedule. Um, we talk with her, um, and we change the schedule."

Then click **I'm done**.

**Take 2, clean.** Click **Try this question again**, click the microphone, and start within two seconds:

> "One time the daughter of my client was angry about the medication schedule. I talked with her and we changed the schedule. After that she was happy, and now she trusts me."

Say take 2 with some life in it, as if telling a friend. When the numbers alone were given to the feedback writer, take 2 came back as "You sounded sure." and "Your answer sounds natural." When it was sent as a flat generated voice, the second listener heard the flatness, and the feedback said "a bit unsure" and "a little like you are reading". A monotone take 2 will weaken the before-and-after.

## The three-minute run

Times are a guide. The presenter talks while the app is working.

| Time | Jaciel does | The screen shows | The presenter says |
|---|---|---|---|
| 0:00 | Nothing yet | The home page | "Jaciel has cared for people at home for five years. The better job is at an agency, and the interview is in English. Most of what goes wrong for him there is not his English." |
| 0:15 | Clicks **Start the interview**, then **Begin** | "Welcome back, Jaciel. Last time, questions about disagreements at work were hard for you. Let's start there." The interviewer speaks, and her mouth follows the words. | "It remembers him, and it starts with what was hard last time. The question quotes the posting he pasted. Last week his other weak spot was starting late. Watch." |
| 0:40 | Take 1: silent count to six, then the line. Clicks **I'm done**. | A few seconds of waiting, then the feedback | During the silence: "This is what happens in the real interview." |
| 1:10 | Nothing | The feedback cards | Walk the cards in this order: **Confidence** (the wait, the ums, the apology), **Naturalness** (the tense), **One thing to fix**, then **Clarity** and the accent point. |
| 1:50 | Take 2: **Try this question again**, the microphone, the clean line, **I'm done** | New feedback: sounded sure, sounds natural | "Same question, thirty seconds later." |
| 2:20 | Clicks **Next question** | The next question, which opens with a fact from his resume or follows up on what he just said | "The interviewer uses his resume and listens to his answers, like a real one." |
| 2:30 | Clicks **My progress** (top right) | The table and the line "You now start answering … seconds sooner than in your first session" | "Measured against himself only. No leaderboard, no score." |
| 2:45 | Nothing | The progress page | Close: who it is for, who pays, what is next. Offer the judge a turn. |

## If you have two more minutes

Each of these is a separate point. Pick by what the judge asked about.

| Step | Jaciel does | The screen shows | The point |
|---|---|---|---|
| Asking her to repeat | While being listened to, says: "Sorry, could you say that again more slowly?" | "Good, you asked. Here it is again, more slowly." The interviewer repeats the question slowly. | "When people do not understand, they nod. Here he practises asking, and it works the way it would with a real person. Nothing is graded." Checked with a typed request only, so rehearse it aloud first. |
| What the question wants | Clicks **What are they asking?** | One line in Spanish and English | "The expected answer that nobody states." |
| A wrong answer | On "Why do you want to work … with our agency?" says: "I need the money and this job is close to my house." | A coral card: "Do not answer this way", saying why and what the interviewer wants instead | "An honest answer can still cost him the job. It says so plainly." |
| Trying again | **Try this question again**, then: "I want this job because I like to help older people. I have five years of experience, and I cared for a client with dementia for three years." | Normal feedback | "Until it comes out right." |
| The Spanish coach | Clicks **Ask the coach in Spanish**, then the first suggestion | The coach answers in Spanish, out loud, with an English phrase he can tap to hear | "Help in his language, on the side. The interview stays in English, like the real one." |
| One word | Points at a word in the stronger answer | The word, how it sounds in Spanish spelling, **Hear it** and **Slowly** | "Help with pronunciation, without judging it." |
| Uploading a resume | On the home page, **Upload a file**, choose `public/sample-resume.pdf` | The text appears in the resume box | "A PDF or Word file works. It is read and not stored." |

## What changes from run to run

The model writes the feedback and the questions, so the words differ each time. Read from the screen; do not promise exact text.

- **One thing to fix** on take 1 is either "say I" or "say how it ended". Both are the same point.
- **Confidence** on take 1 named the wait, the ums and the apology in both test runs. If it leaves one out, name the ones it shows.
- **Confidence** and **Naturalness** on take 2 depend on how he sounds, not only on the timing. If they are not clean, point at what did change: the wait, the ums and the apology are gone.
- After take 2, **Next question** gives either a follow-up on his answer or the next question worded around his resume. Both make the same point.
- On a follow-up, do not read out the stronger-answer card. In rehearsal it filled in a sentence he had not said. This is a known gap.

## If something breaks

| What happens | What to do |
|---|---|
| The microphone is not heard | Click **Type instead** and type the line. The content cards still work; the "How you said it" card needs a spoken answer. |
| Confidence does not mention the wait | The software heard a sound early, often room noise. Say "it times how long he takes to start" and move to the next card. |
| The ums are not mentioned | The software dropped them. Skip that point. |
| His request to repeat gets feedback instead | Click **Try this question again** and carry on. Mention the **Repeat** and **Slow** buttons instead. |
| A long wait after an answer | Keep talking. If an error card appears, click **Try again**. |
| The interviewer's voice is silent | The question is still on screen as a caption. Carry on. |
| "Welcome back" does not appear | The demo history was not loaded. Go home, do steps 4 and 5 of the setup, and start again. |
| The wifi is down | Play the screen recording. |

## What we took care of

Use these when a judge asks "what about…". The right-hand column says where to point.

| Problem for the learner | What we did | Where it shows |
|---|---|---|
| He does not know what is coming | Real questions for this job, worded around his own posting and resume | The first question quotes the posting |
| The question has an expected answer nobody states | One line on what the interviewer wants to hear, in Spanish | **What are they asking?** |
| When he does not understand, he nods | The phrase is on screen while he answers; saying it makes the interviewer repeat slowly | "Could you say that again more slowly?" |
| He is modest: "we" did it, and no ending | The feedback checks first that he says "I" and says how it ended | **One thing to fix** |
| An honest answer can count against him | The feedback says so plainly, and what to say instead | "Do not answer this way" |
| He translates from Spanish under pressure | He can answer in Spanish first and get it back in English at his level; he repeats the same question | "Answer in Spanish first"; **Try this question again** |
| Nerves: waiting, fillers, apologising | Measured from the recording and named kindly, with one thing to practise | **Confidence** |
| He is judged on his accent | No pronunciation score. Clarity only, and a missed word is blamed on the software | **Clarity** |
| A coach that makes things up about him | The stronger answer may use only what he said, his remembered stories or his resume; anything else is a blank in brackets | Blanks such as "In the end, [what happened]" |
| A script, not a conversation | The interviewer follows up on what he said, never twice in a row, and never on an answer the software heard badly | "Follow-up" beside the question number |
| Practice that starts from zero each time | It remembers his stories and what was hard, and starts there | "Welcome back"; **My progress** |
| His personal details | A pasted or uploaded resume lasts for the session and is never stored; recordings are not kept | The hint under the resume box |
| Questions an interviewer may not ask | The interviewer is told never to ask about age, origin, immigration status, religion, family plans or health | Not visible; say it if asked |
| A demo that dies on stage | A slow or failed question writer falls back to the written question; a failed microphone falls back to typing | **Type instead** |

## What not to claim

- It has not been tested with real learners yet. The caregiver Jaciel plays is invented.
- The limits for a late start, pauses and fillers are our own judgment.
- The Spanish for model-written questions has not been reviewed by a Spanish speaker. The ten bank questions and their hints should be.
- It covers one job, home health aide.
- Any statistic you quote, such as the share of home care workers who are immigrants, should be checked against its source first. The ones we found came from search summaries.

## One line each, if asked

- **Why not ChatGPT voice mode?** He would have to write the prompt, in English. Ours has this job's questions, coaches in Spanish, builds answers from his own stories, and remembers what was hard.
- **Why no accent score?** Accent bias belongs to the listener. The legal test for an employer is whether he is understood, so that is what we coach.
- **What stops it inventing things about him?** The stronger answer may only use what he said, his remembered stories or his resume. Everything else is a blank he fills in.
- **Who pays?** Workforce boards, adult-education programs and staffing agencies that run job-readiness classes.

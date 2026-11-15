# Voice pipeline

Run from the repo root with your virtual environment active:

```bash
python -m pip install -r elevenlabs/requirements.txt
```

Add these to the existing root `.env`:

```dotenv
ELEVENLABS_API_KEY=your_key_with_speech_to_text_and_text_to_speech_access
GEMINI_API_KEY=your_gemini_key
SUPERMEMORY_API_KEY=your_supermemory_key
```

Optional model overrides: `ELEVENLABS_STT_MODEL_ID` (default `scribe_v2`), `GEMINI_MODEL` (default `gemini-3.8-flash`), and `ELEVENLABS_MODEL_ID` for speech output. Choose models available to your accounts.

## API for the frontend

Start the local FastAPI server from the repo root:

```bash
python -m uvicorn api:app --app-dir elevenlabs --host 127.0.0.1 --port 8000
```

Open `http://127.0.0.1:8000/docs` for the interactive endpoint reference. Run one worker for this local demo; learner history uses an in-process lock and local files. This server is for local integration and has no authentication. CORS permits frontend origins on localhost/127.0.0.1 ports 3000 and 5173.

| Endpoint | Request | Response |
|---|---|---|
| `POST /speak` | JSON `{ "text": "Tell me about yourself.", "language": "en" }` | Binary MP3 (`audio/mpeg`); language selects the demo voice |
| `POST /answer` | Multipart `audio` file, `question` text, `learner_id` text (default `maria`) | JSON: `transcript`, detected `language`, `words`, `timeUnit`, `feedback`, `memory`, `turnId` |

The answer upload must have a supported file extension and be non-empty, up to 10 MB. Use `answer.webm` as the upload filename for a WebM browser recording. `question` must be the actual prompt the user answered; `learner_id` must be stable per person (letters/numbers/underscore/hyphen, up to 64 characters). Audio language is detected by STT. Speech selection for English or Spanish does not translate the input text.

Frontend examples:

```javascript
const speech = await fetch("http://127.0.0.1:8000/speak", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ text: "Tell me about yourself.", language: "en" }),
});
if (!speech.ok) throw new Error(await speech.text());
const audioUrl = URL.createObjectURL(await speech.blob());
const player = new Audio(audioUrl);
player.onended = () => URL.revokeObjectURL(audioUrl);
await player.play();

// recordedBlob comes from your frontend's completed microphone recording.
const form = new FormData();
form.append("audio", recordedBlob, "answer.webm");
form.append("question", "Tell me about yourself.");
form.append("learner_id", "preetam");
const answer = await fetch("http://127.0.0.1:8000/answer", {
  method: "POST", body: form,
}); // Let the browser set the multipart Content-Type and boundary.
if (!answer.ok) throw new Error(await answer.text());
const result = await answer.json();
console.log(result.transcript, result.feedback, result.memory);
// result.feedback.nextAction.textEn/textEs can be sent to /speak on Continue.
```

The API returns no automatic next-question audio; the UI chooses when to call `/speak`. For `finish`, show completion and stop. For other actions, use the selected language's prompt. Browser autoplay rules may require a user click before playback.

API artifacts are saved per request under `output/requests/<id>/`, avoiding shared MP3/timestamp filenames between requests. Learner history remains in `output/history_<learner_id>.json`. `memory.read` reports `loaded`, `unavailable` or `local_only`; `memory.write` reports the remote processing status or `unavailable`/`local_only`. Remote failure does not discard the local result. CLI commands below retain their existing output paths.

Missing service keys return 503; invalid JSON/form inputs return 422; unsupported upload extensions return 415; oversized files return 413; upstream processing failures return 502. The server does not expose service keys or upstream error bodies in API responses.

Backend implementation is ready for frontend integration. Remaining work for the full voice feature: microphone capture, playback/Continue controls, and a real end-to-end recording through both services with memory confirmed. These endpoints have not yet been verified against live account credentials.

## 1. Generate a question

```bash
python elevenlabs/sample.py "Tell me about a time you helped someone who was upset."
```

Listen to `elevenlabs/output/sample.mp3`. Its `timestamps.json` describes the generated question, not your answer.

`sample.py` uses a hardcoded demo voice per language in `VOICE_IDS`. English uses `JBFqnCBsd6RMkjVDRZzb`; Spanish uses `EXAVITQu4vr4xnSDxMaL`. These are demo speaker choices, not a claim of a native Spanish accent. Listen to the Spanish output with your teammate and replace that mapping with your preferred voice ID if needed. `--voice-id YOUR_ID` overrides the mapping for one run. The old `ELEVENLABS_VOICE_ID` env variable is no longer used by this script.

```bash
python elevenlabs/sample.py "Tell me about yourself." --language en
python elevenlabs/sample.py "Cuéntame sobre ti." --language es
```

Supply text in the selected language; choosing a voice does not translate text. Each run replaces the saved speech files. App code can call `text_to_speech(content, language="es")` and use the returned MP3 path.

## 2. Record your own answer

Use your computer's audio recorder to save a short answer as WAV, MP3, M4A, FLAC, OGG or WebM. Put it in `elevenlabs/recordings/answer.wav`, for example. Create the recordings folder if needed. Browser recording is a later integration step.

## 3. Assess the answer

```bash
python elevenlabs/assess_answer.py elevenlabs/recordings/answer.wav --question "Tell me about a time you helped someone who was upset." --learner preetam
```

The script uses official SDK clients to:

1. Load the learner's Supermemory profile and recent local turns.
2. Send the answer recording to ElevenLabs Speech to Text for a transcript and word timestamps. No character-to-word conversion is needed here.
3. Send the same answer audio, transcript/timing JSON, question and learner context to Gemini.
4. Save bilingual content/delivery feedback and one next action: retry, practise, followup, next_question or finish.
5. Save the turn to local history and submit it to Supermemory if configured.

Output is under `elevenlabs/output/`:

- `answer_timestamps.json`: the learner's transcript and word/event timestamps in **seconds**, directly from ElevenLabs. `type` distinguishes words, spacing and audio events; missing timing values remain null. Recognition log probabilities are not learner ability scores.
- `feedback.json`: Gemini's feedback, weak spots and next action.
- `history_preetam.json`: recent turn history used on later runs for that learner. Each run adds a new turn. Use the same learner ID to retain context; use a different ID for a different person.

Each run replaces the timestamp/feedback files. The recording is sent to both ElevenLabs and Gemini; transcript and assessment are sent to Supermemory. Keys and local output are git-ignored. Raw audio is not saved to Supermemory.

Without `SUPERMEMORY_API_KEY`, the script clearly reports local-only history. `--no-memory` also skips Supermemory reads and writes. Local history still applies. A remote-memory failure leaves the local result available; the script does not silently claim a remote save. Newly accepted memories may still be processing, so the local turns supplement the profile.

The script prints the next action but does not automatically record another answer or speak the next question. Send Gemini's next prompt to the TTS script:

```bash
python elevenlabs/sample.py --feedback elevenlabs/output/feedback.json --language en
python elevenlabs/sample.py --feedback elevenlabs/output/feedback.json --language es
```

This selects `nextAction.textEn` or `nextAction.textEs` and the corresponding demo voice, then saves `output/sample.mp3`. A `finish` action generates no new audio. The full UI/session loop belongs to app integration.

No automated tests or live service calls were added to the build workflow.

References: [ElevenLabs STT](https://elevenlabs.io/docs/api-reference/speech-to-text/convert), [Google Gen AI Python SDK](https://github.com/googleapis/python-genai).

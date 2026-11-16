"""Local voice API. Run: python -m uvicorn api:app --app-dir elevenlabs"""

import logging
import os
from pathlib import Path
from typing import Annotated, Literal
from uuid import uuid4

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel, StringConstraints

from assess_answer import AUDIO_TYPES, HERE, MAX_AUDIO_BYTES, Assessment, assess_answer
from sample import text_to_speech

app = FastAPI(title="Interview Voice API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000",
                   "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["POST"],
    allow_headers=["Content-Type"],
)
logger = logging.getLogger(__name__)
Text = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=5000)]
LearnerId = Annotated[str, StringConstraints(pattern=r"^[A-Za-z0-9_-]{1,64}$")]


class SpeakRequest(BaseModel):
    text: Text
    language: Literal["en", "es"] = "en"


class AnswerResponse(BaseModel):
    transcript: str
    language: str
    words: list[dict]
    timeUnit: Literal["seconds"]
    feedback: Assessment
    memory: dict[str, str]
    turnId: str


def require_keys(*names):
    missing = [name for name in names if not os.getenv(name)]
    if missing:
        raise HTTPException(503, f"Configure {', '.join(missing)} in the server's root .env.")


@app.post("/speak", response_class=Response,
          responses={200: {"content": {"audio/mpeg": {}}, "description": "Generated MP3"}})
def speak(request: SpeakRequest):
    require_keys("ELEVENLABS_API_KEY")
    output = HERE / "output" / "requests" / uuid4().hex
    try:
        audio_path = text_to_speech(request.text, language=request.language, output_dir=output)
        return Response(content=audio_path.read_bytes(), media_type="audio/mpeg",
                        headers={"Content-Disposition": 'inline; filename="interviewer.mp3"'})
    except Exception as error:
        logger.error("Speech generation failed (%s)", type(error).__name__)
        raise HTTPException(502, "Speech generation failed. Check ElevenLabs access and credits.") from None


@app.post("/answer", response_model=AnswerResponse)
def answer(
    audio: Annotated[UploadFile, File(description="Recorded learner answer; up to 10 MB")],
    question: Annotated[Text, Form()],
    learner_id: Annotated[LearnerId, Form()] = "maria",
):
    require_keys("ELEVENLABS_API_KEY", "GEMINI_API_KEY")
    filename = audio.filename or ""
    if Path(filename).suffix.lower() not in AUDIO_TYPES:
        raise HTTPException(415, "Upload WAV, MP3, M4A, FLAC, OGG or WebM audio with its file extension.")
    try:
        audio_bytes = audio.file.read(MAX_AUDIO_BYTES + 1)
    finally:
        audio.file.close()
    if not audio_bytes:
        raise HTTPException(400, "The audio file is empty.")
    if len(audio_bytes) > MAX_AUDIO_BYTES:
        raise HTTPException(413, "The audio file must be at most 10 MB.")
    output = HERE / "output" / "requests" / uuid4().hex
    try:
        return assess_answer(audio_bytes, filename, question, learner=learner_id, output_dir=output)
    except Exception as error:
        logger.error("Answer processing failed (%s)", type(error).__name__)
        raise HTTPException(502, "Answer processing failed. Check service access, audio format and server configuration.") from None

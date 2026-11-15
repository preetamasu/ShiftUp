
"""Turn interview content into speech using a demo voice for each language."""

import argparse
import base64
import json
import os
from pathlib import Path
import sys

from dotenv import load_dotenv
from elevenlabs.client import ElevenLabs



load_dotenv(Path(__file__).resolve().parents[1] / ".env")

# Demo defaults. Replace these with the team's selected voice IDs if desired.
VOICE_IDS = {
    "en": "JBFqnCBsd6RMkjVDRZzb",
    "es": "EXAVITQu4vr4xnSDxMaL",
}


def character_to_word_timings(alignment):
    """Group characters into words, keeping punctuation and using milliseconds."""
    if alignment is None:
        return []

    words = []
    word = None
    for character, start, end in zip(
        alignment.characters,
        alignment.character_start_times_seconds,
        alignment.character_end_times_seconds,
        strict=True,
    ):
        if character.isspace():
            if word is not None:
                words.append(word)
                word = None
            continue

        if word is None:
            word = {"value": "", "timeMs": round(start * 1000), "endMs": 0}
        word["value"] += character
        word["endMs"] = round(end * 1000)

    if word is not None:
        words.append(word)
    return words


def text_to_speech(content, language="en", voice_id=None, output_dir=None):
    """Generate speech, save MP3/timing files, and return the saved MP3 path."""
    if language not in VOICE_IDS:
        raise ValueError("Choose en or es for the speech language.")
    text = content.strip()
    if not text:
        raise ValueError("Provide non-empty text to speak.")
    api_key = os.getenv("ELEVENLABS_API_KEY")
    if not api_key:
        raise RuntimeError("Add ELEVENLABS_API_KEY to the root .env file.")
    voice_id = voice_id or VOICE_IDS[language]
    client = ElevenLabs(api_key=api_key)
    result = client.text_to_speech.convert_with_timestamps(
        text=text,
        voice_id=voice_id,
        model_id=os.getenv("ELEVENLABS_MODEL_ID") or "eleven_flash_v2_5",
        language_code=language,
        output_format="mp3_44100_128",
    )

    output = Path(output_dir) if output_dir else Path(__file__).resolve().parent / "output"
    output.mkdir(parents=True, exist_ok=True)
    (output / "sample.mp3").write_bytes(base64.b64decode(result.audio_base_64))
    alignment = result.normalized_alignment or result.alignment
    words = character_to_word_timings(alignment)
    (output / "timestamps.json").write_text(
        json.dumps({
            "text": text,
            "alignment": alignment.model_dump() if alignment else None,
            "words": words,
        }, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    (output / "response.json").write_text(
        json.dumps({
            "text": text,
            "language": language,
            "voiceId": voice_id,
            "audioBase64": result.audio_base_64,
            "words": words,
            "visemes": [],
            "mouthTimingSource": "none",
        }, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    print(f"Saved audio: {output / 'sample.mp3'}")
    print(f"Saved character and word timings: {output / 'timestamps.json'}")
    print(f"Saved audio and word timings together: {output / 'response.json'}")
    return output / "sample.mp3"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("content", nargs="*", help="Text the AI interviewer should speak")
    parser.add_argument("--language", choices=VOICE_IDS, default="en")
    parser.add_argument("--voice-id", help="Override the hardcoded demo voice ID")
    parser.add_argument("--feedback", type=Path, help="Read the next prompt from Gemini's feedback.json")
    args = parser.parse_args()
    if args.feedback and args.content:
        parser.error("Provide text or --feedback, not both.")
    if args.feedback:
        feedback = json.loads(args.feedback.read_text(encoding="utf-8"))
        action = feedback["nextAction"]
        if action["kind"] == "finish":
            print("The interview is finished; there is no next prompt to speak.")
            return
        content = action["textEs" if args.language == "es" else "textEn"]
    else:
        content = " ".join(args.content)
    if not content.strip():
        parser.error("Provide text to speak or --feedback with a non-empty next prompt.")
    text_to_speech(content, language=args.language, voice_id=args.voice_id)


if __name__ == "__main__":
    main()

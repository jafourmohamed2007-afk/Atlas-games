#!/bin/bash
# Generates Ink Heroes music + SFX with ElevenLabs (key is injected by the session proxy).
cd "$(dirname "$0")/audio-raw"
sfx() { # name duration prompt
  [ -s "$1.mp3" ] && return
  curl -s -o "$1.mp3" -w "$1 %{http_code}\n" -X POST "https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_64" -H "Content-Type: application/json" \
    -d "$(python3 -c 'import json,sys;print(json.dumps({"text":sys.argv[2],"duration_seconds":float(sys.argv[1]),"prompt_influence":0.6}))' "$2" "$3")"
}
mus() { # name ms prompt
  [ -s "m_$1.mp3" ] && return
  curl -s -o "m_$1.mp3" -w "m_$1 %{http_code}\n" -X POST "https://api.elevenlabs.io/v1/music?output_format=mp3_44100_64" -H "Content-Type: application/json" \
    -d "$(python3 -c 'import json,sys;print(json.dumps({"prompt":sys.argv[2],"music_length_ms":int(sys.argv[1])}))' "$2" "$3")"
}
mus menu 40000 "Instrumental only, no vocals. Main menu theme for a stylish stickman zombie night action game: dark cinematic synth pads, slow heartbeat percussion, mysterious ink-noir mood with a catchy heroic melody, D minor, seamless loop."
mus explore 40000 "Instrumental only, no vocals. Tense stealth exploration loop for a zombie game: quiet ticking percussion, low pulsing bass, eerie plucked synth, creeping suspense, 96 bpm, D minor, seamless loop."
mus fight 40000 "Instrumental only, no vocals. Driving action battle loop for a stickman zombie brawler: punchy drums at 128 bpm, gritty distorted bass, dark synth stabs, urgent heroic and fun, D minor, seamless loop."
mus boss 40000 "Instrumental only, no vocals. Epic boss battle loop for a zombie action game: fast heavy drums at 142 bpm, distorted bass, aggressive synth lead, choir-like pads, intense and huge, D minor, seamless loop."
wait
sfx hit 0.5 "Punchy cartoon fist punch impact on a zombie body, meaty thud, game sound effect"
sfx punch 0.5 "Quick whoosh then sharp punch hit, martial arts game sound effect"
sfx heavy 0.8 "Heavy crushing body slam impact with bone crunch, powerful game hit sound effect"
sfx whoosh 0.5 "Fast air whoosh swing of a kick, swoosh sound effect"
sfx groan 1.2 "Single zombie groan, guttural and creepy, short"
sfx boom 1.2 "Punchy cartoon explosion with debris, game sound effect"
sfx land 0.5 "Feet landing hard on concrete after a jump, dull thump"
wait
sfx jump 0.5 "Quick cartoon jump swoosh upwards, game sound effect"
sfx boss 2.5 "Giant monster zombie roar, deep and terrifying, boss entrance"
sfx reload 0.8 "Pistol magazine reload with metallic click clack"
sfx shot 0.5 "Single punchy pistol gunshot, game sound effect, short tail"
sfx block 0.5 "Metal shield block clang, short impact"
sfx pop 0.8 "Gooey zombie splat burst, wet ink splash, game sound effect"
sfx combo 0.8 "Bright rising arcade combo chime with whoosh, rewarding"
wait
sfx reward 1.2 "Triumphant short game reward jingle with sparkles"
sfx star 1.0 "Magical star earned sound, bright shimmering ding"
sfx coin 0.5 "Collecting a coin, bright arcade pickup ding"
sfx over 2.0 "Sad short game over sting, descending dark synth"
sfx click 0.5 "Soft clean UI button click, mobile game"
sfx flip 0.6 "Comic book page turn with ink splash, short"
sfx win 2.5 "Victory fanfare jingle for completing a level in an action game, heroic brass and drums, short"
wait

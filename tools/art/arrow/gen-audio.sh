#!/bin/bash
# Arrow Rampart music + SFX (ElevenLabs; the key is injected by the session proxy). Raw files in audio-raw/.
cd "$(dirname "$0")/audio-raw"
sfx() { [ -s "$1.mp3" ] && return
  for try in 1 2 3; do curl -s -o "$1.mp3" -w "$1 %{http_code}\n" -X POST "https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_64" -H "Content-Type: application/json" \
    -d "$(python3 -c 'import json,sys;print(json.dumps({"text":sys.argv[2],"duration_seconds":float(sys.argv[1]),"prompt_influence":0.6}))' "$2" "$3")"
    file "$1.mp3" | grep -q Audio && return; rm -f "$1.mp3"; sleep 5; done; }
mus() { [ -s "m_$1.mp3" ] && return
  for try in 1 2 3; do curl -s -o "m_$1.mp3" -w "m_$1 %{http_code}\n" -X POST "https://api.elevenlabs.io/v1/music?output_format=mp3_44100_64" -H "Content-Type: application/json" \
    -d "$(python3 -c 'import json,sys;print(json.dumps({"prompt":sys.argv[2],"music_length_ms":int(sys.argv[1])}))' "$2" "$3")"
    file "m_$1.mp3" | grep -q Audio && return; rm -f "m_$1.mp3"; sleep 8; done; }
N="Instrumental only, no vocals, seamless loop."
mus menu 40000 "$N Cheerful medieval castle theme for a cartoon archery defense game: lute, recorder flute, light hand drums, heroic and warm, G major."
mus fight 40000 "$N Upbeat medieval battle loop for a cartoon wall-defense archery game: marching snare drums, brass fanfare riffs, fiddle, energetic, 126 bpm, D minor."
mus boss 40000 "$N Epic medieval boss battle loop, a giant raider chief attacks the castle: war drums, low brass, choir pads, intense, 138 bpm, C minor."
mus night 40000 "$N Mysterious night siege at a castle: soft war drums, harp, low strings, owl-like flute, tense but cozy, 100 bpm, A minor."
mus time 40000 "$N Fast arcade medieval time-attack loop: galloping drums at 150 bpm, bright brass, plucked strings, urgent and fun, E minor."
sfx draw 0.6 "Wooden bow string being pulled back, creaking tension, short"
sfx shoot 0.5 "Arrow released from a bow, sharp twang and whoosh"
sfx thunk 0.5 "Arrow hitting a wooden shield and body, solid thunk impact"
sfx headshot 0.6 "Satisfying arcade headshot ding with a thunk, bright"
sfx ground 0.5 "Arrow sticking into dirt ground, soft thud"
sfx wall 0.6 "Wooden club hitting a stone castle wall, heavy thump with stone crumble"
sfx horn 1.5 "Medieval war horn blast announcing a new wave of enemies"
sfx chief 1.5 "Big cartoon barbarian chief battle roar, deep and funny"
sfx boom 1.2 "Cartoon explosion of a bomb arrow, punchy boom with debris"
sfx ice 0.8 "Magic ice freezing crackle burst, crystalline"
sfx zap 0.8 "Lightning bolt zap and crackle, magical electric strike"
sfx coin 0.5 "Gold coin pickup jingle, bright arcade"
sfx reward 1.2 "Short triumphant medieval fanfare jingle for a reward"
sfx card 0.6 "Magical card flip with sparkle shimmer"
sfx click 0.5 "Soft wooden UI button click"
sfx over 2.0 "Sad short medieval game over sting, descending lute and trombone"
sfx tier 1.2 "Level up chime for unlocking a battle pass tier, rising sparkle fanfare"
for i in 1 2 3; do sfx die$i 0.8 "Cartoon goblin raider getting hit and defeated, funny short yelp and grunt, variation $i"; sfx grunt$i 0.6 "Cartoon goblin raider battle grunt while smashing, short, variation $i"; done
echo GEN DONE

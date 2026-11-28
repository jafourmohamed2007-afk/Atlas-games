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
N="Instrumental only, no vocals, seamless loop."
mus menu 40000 "$N Epic but warm strategy game main theme for a stickman army war game: taiko drums, low strings, heroic brass melody, hand-drawn ink world, D minor."
mus fight 40000 "$N Stickman army battle loop: driving war drums at 130 bpm, staccato strings, heroic brass stabs, clashing energy, D minor."
mus boss 40000 "$N Final battle against a giant warlord: thunderous drums at 140 bpm, choir pads, distorted low brass, epic and dark, C minor."
mus calm 40000 "$N Calm army camp planning music for a strategy game: soft hand drums, plucked strings, flute, hopeful, 90 bpm, F major."
sfx slash 0.5 "Sword slash whoosh and cut hitting a body, short punchy game sound"
sfx clash 0.5 "Two swords clashing, bright metal clang, short"
sfx pick 0.5 "Pickaxe striking gold ore rock, metallic clink with small rocks"
sfx gold 0.7 "Gold coins poured into a chest, bright jingle"
sfx sling 0.5 "Sling whirl and stone throw whoosh"
sfx stone 0.5 "Stone hitting a body and a shield, dull thud"
sfx spear 0.5 "Spear thrust stab, quick whoosh and impact"
sfx slam 1.0 "Giant club slamming the ground, heavy boom with rumble"
sfx hex 0.9 "Dark magic ink spell cast, swirling whoosh and splash"
sfx horn 1.5 "Army war horn signal for attack, heroic"
sfx retreat 1.2 "Short drum roll and bugle signal to fall back"
sfx crack 1.2 "Big stone statue cracking and crumbling"
sfx train 0.6 "Soldier ready shout, short hup, stylized game cue"
sfx punch 0.5 "Punchy fist hit, cartoon fighting game impact"
sfx kick 0.5 "Strong kick impact with whoosh, fighting game"
sfx win 3.0 "Victory fanfare for winning a battle, triumphant brass and drums"
sfx lose 2.5 "Defeat sting, sad low brass and slow drum"
sfx click 0.5 "Soft wooden UI button click"
for i in 1 2 3; do sfx die$i 0.8 "Stickman soldier defeated cry, short grunt and gasp, variation $i"; sfx hit$i 0.5 "Short pained grunt of a soldier being hit, variation $i"; done
echo GEN DONE

#!/bin/bash
# Second batch: per-world music + zombie / civilian voice variants (ElevenLabs; key injected by the session proxy).
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
mus explore_metro 40000 "$N Tense underground subway exploration for a zombie game: echoing metallic percussion, distant train rumble, low drones, 96 bpm, E minor."
mus fight_metro 40000 "$N Industrial action battle in a subway for a stickman zombie brawler: mechanical drums like a speeding train at 132 bpm, gritty bass, metallic stabs."
mus explore_neon 40000 "$N Neon cyberpunk city at night, creepy and glowing: retro synthwave arpeggios, soft beat, eerie pads, 100 bpm, F minor."
mus fight_neon 40000 "$N Synthwave cyberpunk battle loop for a zombie brawler: driving 136 bpm drums, pulsing neon bass, aggressive retro lead, F minor."
mus explore_desert 40000 "$N Haunted desert of crossed-out ink: slow tribal hand drums, dusty plucked strings, wind textures, ominous, 90 bpm, D phrygian."
mus fight_desert 40000 "$N Desert battle loop for a zombie action game: fast tribal percussion at 130 bpm, middle-eastern scale plucked lead, heavy bass hits, D phrygian."
mus explore_margin 40000 "$N Blank white paper void, surreal and lonely: sparse piano notes, glitchy pencil-scratch textures, airy pads, 80 bpm, C minor."
mus fight_margin 40000 "$N Glitchy surreal battle on a blank page: broken beat electronic drums at 134 bpm, distorted piano stabs, glitch effects, C minor."
mus infinity 40000 "$N Endless survival arcade mode against zombie waves: relentless 140 bpm drum and bass, heroic synth riff, rising energy, A minor."
mus final 40000 "$N Final boss battle against a dark sketched god: epic choir-like pads, orchestral hits, pounding 150 bpm drums, dramatic and huge, C minor."
for i in 1 2 3; do
  sfx z_attack$i 0.8 "Zombie snarling lunge attack, aggressive guttural growl, short, variation $i"
  sfx z_bite$i 0.8 "Zombie biting flesh, wet chomp with a growl, short horror sound, variation $i"
  sfx z_die$i 1.2 "Zombie death gurgle and collapse groan, short, variation $i"
  sfx c_help$i 1.2 "Frightened civilian person crying out in fear for help, scared gasp and whimper, no words, variation $i"
done
for i in 2 3; do sfx groan$i 1.2 "Single zombie moan, hungry and creepy, short, variation $i"; done
for i in 1 2; do sfx c_scream$i 1.0 "Civilian person screaming in terror while being attacked by a zombie, short, no words, variation $i"; sfx c_thanks$i 1.0 "Relieved person sighing with joy after being rescued, happy short gasp, no words, variation $i"; done
echo GEN2 DONE

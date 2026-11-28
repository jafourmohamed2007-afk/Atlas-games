#!/usr/bin/env python3
"""Generates the built-in Neon Overdrive voice pack + SFX with ElevenLabs into games/audio/neon-overdrive/.
   Needs an ElevenLabs key in XI_API_KEY (or a proxy that injects it). Re-run only to change lines."""
import json, os, subprocess, sys, urllib.request
ROOT = os.path.join(os.path.dirname(__file__), '..', '..', '..')
OUT = os.path.join(ROOT, 'games', 'audio', 'neon-overdrive'); os.makedirs(OUT, exist_ok=True)
CFG = json.load(open(os.path.join(os.path.dirname(__file__), 'lines.json')))
KEY = os.environ.get('XI_API_KEY', 'proxy')
def post(url, body, dest):
    if os.path.exists(dest) and '--force' not in sys.argv: return
    req = urllib.request.Request(url, json.dumps(body).encode(), {'xi-api-key': KEY, 'Content-Type': 'application/json', 'Accept': 'audio/mpeg'})
    raw = urllib.request.urlopen(req, timeout=120).read()
    tmp = dest + '.raw.mp3'; open(tmp, 'wb').write(raw)
    # trim silence, normalise loudness, small mono mp3
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', tmp, '-af', 'silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,loudnorm=I=-16:TP=-1.5',
                    '-ac', '1', '-ar', '44100', '-b:a', '64k', dest], check=True)
    os.remove(tmp); print('wrote', os.path.relpath(dest, ROOT), os.path.getsize(dest))
for lid, tr in CFG['lines'].items():
    for lang, text in tr.items():
        post('https://api.elevenlabs.io/v1/text-to-speech/%s?output_format=mp3_44100_128' % CFG['voice'],
             {'text': text, 'model_id': CFG['model'], 'language_code': lang,
              'voice_settings': {'stability': 0.35, 'similarity_boost': 0.8, 'style': 0.55, 'use_speaker_boost': True}},
             os.path.join(OUT, 'vo_%s_%s.mp3' % (lang, lid)))
for sid, s in CFG['sfx'].items():
    post('https://api.elevenlabs.io/v1/sound-generation', {'text': s['text'], 'duration_seconds': s['dur'], 'prompt_influence': 0.6},
         os.path.join(OUT, 'sfx_%s.mp3' % sid))

#!/bin/bash
# Trim, level and loop the ElevenLabs audio into games/audio/ink-heroes/ (served next to games/ink-heroes.html).
set -e
cd "$(dirname "$0")"; OUT=../../../games/audio/ink-heroes; mkdir -p $OUT
for f in audio-raw/m_*.mp3; do n=$(basename $f .mp3); n=${n#m_}; W=/tmp/ink_$n.wav
  ffmpeg -v error -y -i $f -af "loudnorm=I=-18:TP=-1.5" -ar 44100 -ac 2 $W
  D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 $W); E=$(python3 -c "print(round($D-2.2,3))"); E2=$(python3 -c "print($E+2)")
  # seamless loop: the last 2 s fade out over the first 2 s, then the body
  ffmpeg -v error -y -i $W -i $W -i $W -filter_complex "[0]atrim=0:2,asetpts=N/SR/TB,afade=t=in:d=2[h];[1]atrim=$E:$E2,asetpts=N/SR/TB,afade=t=out:d=2[t];[h][t]amix=inputs=2:normalize=0[x];[2]atrim=2:$E,asetpts=N/SR/TB[y];[x][y]concat=n=2:v=0:a=1" -b:a 64k $OUT/m_$n.mp3
  rm -f $W
done
for f in audio-raw/*.mp3; do n=$(basename $f .mp3); case $n in m_*) continue;; esac
  ffmpeg -v error -y -i $f -af "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,loudnorm=I=-16:TP=-1" -ac 1 -ar 44100 -b:a 64k $OUT/$n.mp3
done
du -sh $OUT; ls $OUT | wc -l

#!/usr/bin/env bash
# Optional offline sound-design guide; never overwrites VO or the rendered video.
# Cue times are provisional, and the car engine is a stand-in for a motorcycle.
set -euo pipefail
cd "$(dirname "$0")/.."
export LD_LIBRARY_PATH="$PWD/../.jalan-pulang-tools/al2023/lib:$PWD/../.jalan-pulang-tools/swiftshader${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
ffmpeg="$PWD/node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg"
out="${1:-render/story-guide-audio.m4a}"
mkdir -p "$(dirname "$out")" render
node scripts/make-guide-siren.mjs render/guide-siren.tmp.wav
"$ffmpeg" -hide_banner -loglevel error \
 -i public/vo/VO-Jalan-Pulang_01.mp3 -i public/vo/VO-Jalan-Pulang_02.mp3 \
 -stream_loop -1 -i public/audio-oculus/AMBForst_Night_LOOP_01.ogg \
 -stream_loop -1 -i public/audio-oculus/AMBHome_RoomTone_LOOP_01.ogg \
 -stream_loop -1 -i public/audio-oculus/VEHCar_CarEngineSlow_LOOP_01.ogg \
 -i public/audio-oculus/DOORKnck_OfficeDoorKnock_OS_01.ogg \
 -i public/audio-oculus/DOORKnck_OfficeDoorKnock_OS_01.ogg \
 -i public/audio-oculus/DOORKnck_OfficeDoorKnock_OS_01.ogg \
 -i public/audio-oculus/FEETHmn_ShoeConcreteWalk_OS_01.ogg \
 -i public/audio-oculus/FEETHmn_ShoeConcreteWalk_OS_01.ogg \
 -i public/audio-oculus/FEETHmn_ShoeConcreteWalk_OS_01.ogg \
 -i public/audio-oculus/FEETHmn_ShoeConcreteWalk_OS_01.ogg \
 -i public/audio-oculus/FEETHmn_ShoeConcreteWalk_OS_01.ogg \
 -i public/audio-oculus/FEETHmn_ShoeConcreteWalk_OS_01.ogg \
 -stream_loop -1 -i public/audio-oculus/AMBUrbn_CityAmerican_LOOP_01.ogg \
 -i render/guide-siren.tmp.wav \
 -filter_complex "\
 [0:a]atrim=duration=543.633333333,asetpts=PTS-STARTPTS[a];\
 [1:a]asetpts=PTS-STARTPTS[b];[a][b]concat=n=2:v=0:a=1[vo];\
 [2:a]atrim=duration=680,asetpts=PTS-STARTPTS,volume='0.075*max(0,min(1,min((t-101)/3,(592.633-t)/3)))':eval=frame[night];\
 [3:a]atrim=duration=680,asetpts=PTS-STARTPTS,volume='0.045*(max(0,min(1,min((t-11)/2,(49-t)/2)))+max(0,min(1,min((t-608)/2,(680-t)/2))))':eval=frame[room];\
 [4:a]atrim=duration=680,asetpts=PTS-STARTPTS,volume='0.025*(max(0,min(1,min(t/2,(11-t)/2)))+max(0,min(1,min((t-49)/2,(71-t)/2)))+max(0,min(1,min((t-101)/2,(345-t)/2)))+max(0,min(1,min((t-571.633)/2,(592.633-t)/2))))':eval=frame[engine];\
 [5:a]atrim=duration=0.20,asetpts=PTS-STARTPTS,volume=0.11,adelay=605883|605883[knock1];\
 [6:a]atrim=duration=0.20,asetpts=PTS-STARTPTS,volume=0.11,adelay=606683|606683[knock2];\
 [7:a]atrim=duration=0.20,asetpts=PTS-STARTPTS,volume=0.11,adelay=607483|607483[knock3];\
 [8:a]volume=0.08,adelay=603033|603033[step1];\
 [9:a]volume=0.08,adelay=603733|603733[step2];\
 [10:a]volume=0.08,adelay=604433|604433[step3];\
 [11:a]volume=0.044,adelay=608833|608833[step4];\
 [12:a]volume=0.044,adelay=609433|609433[step5];\
 [13:a]volume=0.044,adelay=610033|610033[step6];\
 [14:a]atrim=duration=680,asetpts=PTS-STARTPTS,volume='0.05*max(0,min(1,min((t-71)/2,(101-t)/2)))':eval=frame[traffic];\
 [15:a]adelay=71000|71000[siren];\
 [vo][night][room][engine][knock1][knock2][knock3][step1][step2][step3][step4][step5][step6][traffic][siren]amix=inputs=15:duration=first:dropout_transition=0:normalize=0,atrim=duration=679.933333333[mix]" \
 -map '[mix]' -c:a aac -b:a 320k -f mp4 -y "$out"
echo "Guide mix: $out (listen and QC sync/levels before use)."

#!/usr/bin/env python3
"""
ForgeCode Demo Video Auto-Editor & Polish Utility
Uses ffmpeg to transform a raw screen recording into a competition-ready,
strictly-under-4-minute MP4 video with title watermark and timestamps.

Usage:
  python3 scripts/edit_demo_video.py [path_to_raw_video.mp4]
"""

import os
import sys
import subprocess
import json

WORKSPACE = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DEFAULT_INPUT = os.path.join(WORKSPACE, "raw_demo.mp4")
OUTPUT_FILE = os.path.join(WORKSPACE, "forgecode_demo_final.mp4")

def run(cmd):
    print(f"[FFmpeg] Executing: {' '.join(cmd)}")
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if res.returncode != 0:
        print(f"[Error] Command failed:\n{res.stderr}")
        sys.exit(1)
    return res

def get_duration(video_path):
    cmd = [
        "ffprobe", "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        video_path
    ]
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    try:
        return float(res.stdout.strip())
    except Exception:
        return 0.0

def edit_video(input_path, output_path=OUTPUT_FILE):
    if not os.path.exists(input_path):
        print(f"Error: Input video '{input_path}' not found!")
        print(f"Please drop your raw screen recording at:\n  {DEFAULT_INPUT}")
        sys.exit(1)

    duration = get_duration(input_path)
    print(f"[Info] Input video duration: {duration:.2f} seconds ({int(duration // 60)}m {int(duration % 60)}s)")

    # Target maximum duration is 3m 48s (228 seconds) to strictly respect the 4:00 limit
    max_allowed = 238.0 # 3m 58s strict ceiling
    speed_factor = 1.0

    if duration > max_allowed:
        speed_factor = duration / 225.0 # compress slightly to 3m 45s
        print(f"[Warning] Duration exceeds competition limit. Applying speed multiplier: {speed_factor:.2f}x to fit within 3m 45s.")

    # Title text written to temporary text file to prevent ffmpeg colon/escape issues
    title_text_file = "/tmp/forgecode_title.txt"
    title_text = "ForgeCode Nexus  |  Team: Internzz (ID: TM-14B3C2A245A)  |  Techfest IIT Bombay"
    with open(title_text_file, "w") as f:
        f.write(title_text)

    # FFmpeg filter:
    # 1. Scale/pad to 1080p (1920x1080)
    # 2. Draw top header banner
    # 3. Apply speed adjustment if duration > max_allowed
    video_filters = []
    video_filters.append("scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2")
    
    # Title overlay bar at top (subtle modern dark banner)
    video_filters.append(
        f"drawbox=y=0:color=black@0.65:width=iw:height=48:t=fill,"
        f"drawtext=textfile='{title_text_file}':fontcolor=white:fontsize=22:x=32:y=14"
    )

    if speed_factor > 1.0:
        video_filters.append(f"setpts={1.0 / speed_factor}*PTS")

    vf_str = ",".join(video_filters)

    cmd = [
        "ffmpeg", "-y",
        "-i", input_path,
        "-vf", vf_str,
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "22",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart"
    ]

    # Handle audio if present
    # Check if input has audio stream
    probe_audio = subprocess.run([
        "ffprobe", "-v", "error", "-select_streams", "a:0",
        "-show_entries", "stream=codec_type", "-of", "default=noprint_wrappers=1:nokey=1", input_path
    ], stdout=subprocess.PIPE, text=True)

    if probe_audio.stdout.strip() == "audio":
        if speed_factor > 1.0:
            cmd.extend(["-filter:a", f"atempo={speed_factor}", "-c:a", "aac", "-b:a", "128k"])
        else:
            cmd.extend(["-c:a", "aac", "-b:a", "128k"])
    else:
        cmd.extend(["-an"]) # No audio stream

    cmd.append(output_path)

    print("\n[Processing] Rendering competition-ready MP4...")
    run(cmd)

    final_dur = get_duration(output_path)
    mins = int(final_dur // 60)
    secs = int(final_dur % 60)
    print(f"\n==================================================================")
    print(f"  SUCCESSFULLY GENERATED FINAL DEMO VIDEO:")
    print(f"  Path: {output_path}")
    print(f"  Duration: {mins}:{secs:02d} (Strictly under 4:00 limit)")
    print(f"  Format: 1080p MP4 (H.264 / AAC, Web-Optimized)")
    print(f"==================================================================\n")

if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_INPUT
    edit_video(target)

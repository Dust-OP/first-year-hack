#!/usr/bin/env python3
"""Build evolution clips from an ordered set of images, using only ffmpeg.

Usage:
  python3 make_clips.py <set_dir> --mode icon|photo [--bg 0xF5F5F7]

<set_dir>/manifest.json is a chronological array whose items have "file"
(a path relative to <set_dir>). The script writes:
  <set_dir>/stills/NN.png       each image normalised to a 1080x1080 canvas
  <set_dir>/clips/NN-MM.mp4     one swap clip per step: hold, swap, hold
  <set_dir>/<name>-evolution.mp4  every step in one continuous video

The swap: the old image shrinks to 80% and fades out while the new one
shrinks from 120% to 100% and fades in, with smoothstep easing.
"""
import argparse, json, os, shutil, subprocess, sys, tempfile

FF = shutil.which("ffmpeg") or "/opt/homebrew/bin/ffmpeg"
SIZE, FPS = 1080, 30
HOLD, SWAP = 0.9, 0.7  # seconds


def run(args):
    r = subprocess.run([FF, "-hide_banner", "-loglevel", "error", "-y", *args])
    if r.returncode:
        sys.exit(f"ffmpeg failed: {' '.join(args)}")


def svg_to_png(src, tmp):
    # ffmpeg here has no SVG decoder; Quick Look renders SVG on macOS.
    subprocess.run(["qlmanage", "-t", "-s", "1024", "-o", tmp, src],
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    return os.path.join(tmp, os.path.basename(src) + ".png")


def normalise(src, dst, mode, crop=None):
    tmp = tempfile.mkdtemp()
    if src.lower().endswith(".svg"):
        src = svg_to_png(src, tmp)
    if mode == "icon":
        vf = ("format=rgba,scale=760:760:force_original_aspect_ratio=decrease:flags=lanczos,"
              f"pad={SIZE}:{SIZE}:(ow-iw)/2:(oh-ih)/2:color=0x00000000")
    else:
        # Whole photo, fitted inside 900x900, so tall objects are not cut off.
        vf = ("format=rgba,scale=900:900:force_original_aspect_ratio=decrease:flags=lanczos,"
              f"pad={SIZE}:{SIZE}:(ow-iw)/2:(oh-ih)/2:color=0x00000000")
    if crop:  # optional ffmpeg crop (w:h:x:y) from the manifest, applied first
        vf = f"crop={crop}," + vf
    run(["-i", src, "-vf", vf, "-frames:v", "1", "-update", "1", dst])
    shutil.rmtree(tmp, ignore_errors=True)


def swap(a, b, out, bg, lead, tail):
    """lead: seconds holding a before the swap; tail: seconds holding b after."""
    dur = lead + SWAP + tail
    p = f"min(max((t-{lead})/{SWAP},0),1)"
    e = f"({p}*{p}*(3-2*{p}))"  # smoothstep
    sa = f"(1-0.2*{e})"
    sb = f"(1.2-0.2*{e})"
    size = lambda s: f"w='2*trunc({SIZE}*{s}/2)':h='2*trunc({SIZE}*{s}/2)':eval=frame"
    fc = (
        f"[1:v]format=rgba,scale={size(sa)},fade=t=out:st={lead}:d={SWAP}:alpha=1[a];"
        f"[2:v]format=rgba,scale={size(sb)},fade=t=in:st={lead}:d={SWAP}:alpha=1[b];"
        f"[0:v][a]overlay=x=(W-w)/2:y=(H-h)/2:eval=frame[m];"
        f"[m][b]overlay=x=(W-w)/2:y=(H-h)/2:eval=frame,format=yuv420p[v]"
    )
    run(["-f", "lavfi", "-i", f"color=c={bg}:s={SIZE}x{SIZE}:r={FPS}:d={dur}",
         "-loop", "1", "-framerate", str(FPS), "-t", str(dur), "-i", a,
         "-loop", "1", "-framerate", str(FPS), "-t", str(dur), "-i", b,
         "-filter_complex", fc, "-map", "[v]", "-t", str(dur),
         "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-movflags", "+faststart", out])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("set_dir")
    ap.add_argument("--mode", choices=["icon", "photo"], required=True)
    ap.add_argument("--bg", default="0xF5F5F7")
    ap.add_argument("--name", default=None)
    o = ap.parse_args()
    d = os.path.abspath(o.set_dir)
    name = o.name or os.path.basename(d)
    items = json.load(open(os.path.join(d, "manifest.json")))
    stills, clips = os.path.join(d, "stills"), os.path.join(d, "clips")
    for p in (stills, clips):
        shutil.rmtree(p, ignore_errors=True)
        os.makedirs(p)
    paths = []
    for i, it in enumerate(items, 1):
        dst = os.path.join(stills, f"{i:02d}.png")
        normalise(os.path.join(d, it["file"]), dst, o.mode, it.get("crop"))
        paths.append(dst)
    tmp = tempfile.mkdtemp()
    segs = []
    for i in range(len(paths) - 1):
        swap(paths[i], paths[i + 1], os.path.join(clips, f"{i+1:02d}-{i+2:02d}.mp4"), o.bg, HOLD, HOLD)
        seg = os.path.join(tmp, f"s{i:02d}.mp4")
        swap(paths[i], paths[i + 1], seg, o.bg, HOLD if i == 0 else 0, HOLD if i < len(paths) - 2 else 1.5)
        segs.append(seg)
    lst = os.path.join(tmp, "list.txt")
    with open(lst, "w") as f:
        f.writelines(f"file '{s}'\n" for s in segs)
    run(["-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", "-movflags", "+faststart",
         os.path.join(d, f"{name}-evolution.mp4")])
    shutil.rmtree(tmp, ignore_errors=True)
    print(f"{len(paths)} stills, {len(paths)-1} clips, 1 continuous video in {d}")


if __name__ == "__main__":
    main()

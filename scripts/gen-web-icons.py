#!/usr/bin/env python3
"""Cuts the website's icon set from the same master the desktop icons come from.

    python3 gen-web-icons.py /path/to/master-4096.png /path/to/TAILZU-WEB

Writes favicon.ico (16/32/48), favicon.svg (a 64 px picture inlined), 
favicon-32x32.png, apple-touch-icon.png, icon-192.png, icon-512.png and
icon-maskable-512.png. The maskable one holds the art at 80% with the ground
carried to the edges, because Android crops a maskable icon to its own shape.
"""
import base64, io, os, struct, sys
from PIL import Image

LANCZOS = Image.Resampling.LANCZOS
MASK_SAFE = 0.80  # the maskable safe zone: art inside the central 80%


def square(master, size):
    # Below 128 px Lanczos rings a light halo round the dark art; bicubic does not.
    return master.resize((size, size), LANCZOS if size >= 128 else Image.Resampling.BICUBIC)


def extend(img, left, top, right, bottom):
    """Carries the picture's outermost rows and columns out by the given margins."""
    w, h = img.size
    out = Image.new(img.mode, (w + left + right, h + top + bottom))
    out.paste(img, (left, top))
    if top:
        out.paste(img.crop((0, 0, w, 1)).resize((w, top), Image.Resampling.NEAREST), (left, 0))
    if bottom:
        out.paste(img.crop((0, h - 1, w, h)).resize((w, bottom), Image.Resampling.NEAREST), (left, top + h))
    H = out.size[1]
    if left:
        out.paste(out.crop((left, 0, left + 1, H)).resize((left, H), Image.Resampling.NEAREST), (0, 0))
    if right:
        x = left + w - 1
        out.paste(out.crop((x, 0, x + 1, H)).resize((right, H), Image.Resampling.NEAREST), (left + w, 0))
    return out


def maskable(master, size):
    art = square(master, round(size * MASK_SAFE))
    pad = size - art.size[0]
    return extend(art, pad // 2, pad // 2, pad - pad // 2, pad - pad // 2)


def ico(master, sizes):
    frames = []
    for n in sizes:
        buf = io.BytesIO()
        square(master, n).convert("RGBA").save(buf, "PNG", optimize=True)
        frames.append((n, buf.getvalue()))
    head = struct.pack("<HHH", 0, 1, len(frames))
    offset = 6 + 16 * len(frames)
    entries, blobs = b"", b""
    for n, data in frames:
        d = 0 if n >= 256 else n
        entries += struct.pack("<BBBBHHII", d, d, 0, 0, 1, 32, len(data), offset)
        offset += len(data)
        blobs += data
    return head + entries + blobs


def main():
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    master = Image.open(sys.argv[1])
    master.load()
    if master.mode != "RGB":
        master = master.convert("RGB")
    if master.size[0] != master.size[1] or master.size[0] < 1024:
        sys.exit("the master must be a square of at least 1024 px")
    root = sys.argv[2]

    def save(img, rel):
        p = os.path.join(root, rel)
        img.save(p, "PNG", optimize=True)
        print("wrote", rel, img.size, os.path.getsize(p), "bytes")

    save(square(master, 32), "favicon-32x32.png")
    save(square(master, 180), "apple-touch-icon.png")
    save(square(master, 192), "icon-192.png")
    save(square(master, 512), "icon-512.png")
    save(maskable(master, 512), "icon-maskable-512.png")

    data = ico(master, [16, 32, 48])
    with open(os.path.join(root, "favicon.ico"), "wb") as f:
        f.write(data)
    print("wrote favicon.ico [16, 32, 48]", len(data), "bytes")

    # favicon.svg keeps its shape: a 64 px picture inlined, so the one file
    # serves the vector slot without carrying a second drawing to keep in step.
    buf = io.BytesIO()
    square(master, 64).convert("RGBA").save(buf, "PNG", optimize=True)
    b64 = base64.b64encode(buf.getvalue()).decode("ascii")
    svg = (
        '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" '
        'viewBox="0 0 64 64"><!-- X0 Bot\'s app icon. A picture, not a drawing: '
        "the backend's head (src/seo/head.ts) still links favicon.svg, so it "
        "carries the same art as favicon.ico and favicon-32x32.png. -->"
        f'<image width="64" height="64" href="data:image/png;base64,{b64}"/></svg>\n'
    )
    p = os.path.join(root, "favicon.svg")
    with open(p, "w", encoding="utf-8") as f:
        f.write(svg)
    print("wrote favicon.svg", os.path.getsize(p), "bytes")


if __name__ == "__main__":
    main()

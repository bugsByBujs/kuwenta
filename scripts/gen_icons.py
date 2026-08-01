#!/usr/bin/env python3
"""Dependency-free PWA icon generator for Kuwenta.

Renders the Kuwenta "K" mark on a Starbucks-green field as PNGs, with
supersampled anti-aliasing. Uses only the Python standard library (zlib),
so it runs anywhere without Pillow / ImageMagick / rsvg.
"""
import zlib
import struct
import os

GREEN = (0, 98, 65)      # #006241
WHITE = (255, 255, 255)
SS = 4                   # supersampling factor per axis


def write_png(path, w, h, rgba):
    def chunk(typ, data):
        return (struct.pack(">I", len(data)) + typ + data +
                struct.pack(">I", zlib.crc32(typ + data) & 0xffffffff))
    raw = bytearray()
    stride = w * 4
    for y in range(h):
        raw.append(0)  # filter type 0 (None)
        raw += rgba[y * stride:(y + 1) * stride]
    comp = zlib.compress(bytes(raw), 9)
    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0)  # RGBA, 8-bit
    with open(path, "wb") as f:
        f.write(sig + chunk(b"IHDR", ihdr) + chunk(b"IDAT", comp) + chunk(b"IEND", b""))


def inside_rounded(x, y, size, r):
    cx = min(max(x, r), size - r)
    cy = min(max(y, r), size - r)
    return (x - cx) ** 2 + (y - cy) ** 2 <= r * r


def dist_seg(px, py, ax, ay, bx, by):
    dx, dy = bx - ax, by - ay
    ll = dx * dx + dy * dy
    if ll == 0:
        return ((px - ax) ** 2 + (py - ay) ** 2) ** 0.5
    t = ((px - ax) * dx + (py - ay) * dy) / ll
    t = min(1.0, max(0.0, t))
    qx, qy = ax + t * dx, ay + t * dy
    return ((px - qx) ** 2 + (py - qy) ** 2) ** 0.5


def in_glyph(x, y, size, glyph_frac):
    pad = size * (1 - glyph_frac) / 2
    gx0, gx1 = pad, size - pad
    gy0, gy1 = pad, size - pad
    sw = (gx1 - gx0) * 0.22          # stem width
    ht = sw * 0.5                    # arm half-thickness
    if gx0 <= x <= gx0 + sw and gy0 <= y <= gy1:
        return True                 # vertical stem
    cy = (gy0 + gy1) / 2
    jx, jy = gx0 + sw * 0.5, cy      # junction where arms meet stem
    if dist_seg(x, y, jx, jy, gx1, gy0) <= ht:
        return True                 # upper arm
    if dist_seg(x, y, jx, jy, gx1, gy1) <= ht:
        return True                 # lower arm
    return False


def render(size, bg_mode, glyph_frac):
    r = size * 0.22 if bg_mode == "rounded" else 0
    buf = bytearray(size * size * 4)
    step = 1.0 / SS
    inv = 1.0 / (SS * SS)
    for py in range(size):
        for px in range(size):
            cov_bg = 0
            cov_g = 0
            for sy in range(SS):
                y = py + (sy + 0.5) * step
                for sx in range(SS):
                    x = px + (sx + 0.5) * step
                    bg = True if bg_mode == "square" else inside_rounded(x, y, size, r)
                    if bg:
                        cov_bg += 1
                        if in_glyph(x, y, size, glyph_frac):
                            cov_g += 1
            a_bg = cov_bg * inv
            a_g = cov_g * inv
            out_a = a_g + a_bg * (1 - a_g)
            if out_a <= 0:
                continue
            rr = (WHITE[0] * a_g + GREEN[0] * a_bg * (1 - a_g)) / out_a
            gg = (WHITE[1] * a_g + GREEN[1] * a_bg * (1 - a_g)) / out_a
            bb = (WHITE[2] * a_g + GREEN[2] * a_bg * (1 - a_g)) / out_a
            i = (py * size + px) * 4
            buf[i] = int(rr + 0.5)
            buf[i + 1] = int(gg + 0.5)
            buf[i + 2] = int(bb + 0.5)
            buf[i + 3] = int(out_a * 255 + 0.5)
    return buf


def main():
    out = os.path.join(os.path.dirname(__file__), "..", "public", "icons")
    os.makedirs(out, exist_ok=True)
    jobs = [
        ("icon-192.png", 192, "rounded", 0.56),
        ("icon-512.png", 512, "rounded", 0.56),
        ("icon-maskable-512.png", 512, "square", 0.46),  # glyph inside 80% safe zone
        ("apple-icon-180.png", 180, "square", 0.56),      # iOS masks corners itself
    ]
    for name, size, mode, frac in jobs:
        buf = render(size, mode, frac)
        write_png(os.path.join(out, name), size, size, buf)
        print("wrote", name)


if __name__ == "__main__":
    main()

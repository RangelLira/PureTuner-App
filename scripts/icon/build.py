"""Gera os recursos finais do ícone (variante C) a partir da geometria de gen.py.

Rodar da raiz do projeto: python scripts/icon/build.py   (requer Pillow)
Sobrescreve mipmap-*/ic_launcher*.png, logo/icone-512.png, logo/icone.svg, o adaptive
icon (mipmap-anydpi-v26), os vetores ic_launcher_foreground/monochrome e a
cor de fundo (values/ic_launcher_background.xml).
"""
import math
import os
from PIL import Image, ImageDraw

import gen

C = dict(height_frac=0.58, prong=114, tail=78, white_w=40, outline_w=12)
GEO = {k: C[k] for k in ("prong", "tail")}
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..")
RES = os.path.join(ROOT, "android", "app", "src", "main", "res")


def transformed(canvas, visible, height_frac):
    """Polilinhas transformadas p/ um canvas `canvas` cuja área visível
    (centralizada) mede `visible`. Retorna (linhas, largura_branca, largura_total)."""
    lines = gen.geometry(**GEO)
    half = C["white_w"] / 2 + C["outline_w"]
    xs = [p[0] for l in lines for p in l]
    ys = [p[1] for l in lines for p in l]
    bx0, bx1 = min(xs) - half, max(xs) + half
    by0, by1 = min(ys) - half, max(ys) + half
    k = visible * height_frac / (by1 - by0)
    tot = sx = 0
    for l in lines:
        for a, b in zip(l, l[1:]):
            L = math.dist(a, b)
            tot += L
            sx += L * (a[0] + b[0]) / 2
    cx = ((bx0 + bx1) / 2 + sx / tot) / 2  # centro óptico
    cy = (by0 + by1) / 2
    tf = lambda p: (canvas / 2 + (p[0] - cx) * k, canvas / 2 + (p[1] - cy) * k)
    return ([[tf(p) for p in l] for l in lines],
            C["white_w"] * k, (C["white_w"] + 2 * C["outline_w"]) * k)


def png(size, shape):
    S = size * gen.SS
    lines, ww, ow = transformed(S, S, C["height_frac"])
    img = Image.new("RGBA", (S, S), gen.BG + (255,))
    d = ImageDraw.Draw(img)
    for l in lines:
        gen.polyline(d, l, ow, gen.OUTLINE)
    for l in lines:
        gen.polyline(d, l, ww, gen.WHITE)
    img = img.resize((size, size), Image.LANCZOS)
    if shape == "square":
        return img
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(img, (0, 0), gen.mask(size, "circle"))
    return out


def path_data(lines):
    f = lambda v: f"{v:.2f}".rstrip("0").rstrip(".")
    parts = []
    for l in lines:
        parts.append("M" + f(l[0][0]) + "," + f(l[0][1]) +
                     "".join(" L" + f(x) + "," + f(y) for x, y in l[1:]))
    return " ".join(parts)


def vector(with_outline):
    # canvas 108dp, área visível 72dp (o launcher mascara o centro)
    lines, ww, ow = transformed(108, 72, C["height_frac"])
    pd = path_data(lines)
    hexc = lambda c: "#FF%02X%02X%02X" % c
    paths = ""
    if with_outline:
        paths += f'''    <path
        android:pathData="{pd}"
        android:strokeColor="{hexc(gen.OUTLINE)}"
        android:strokeWidth="{ow:.2f}"
        android:strokeLineCap="round"
        android:strokeLineJoin="round" />
'''
    paths += f'''    <path
        android:pathData="{pd}"
        android:strokeColor="{hexc(gen.WHITE)}"
        android:strokeWidth="{(ww if with_outline else ow * 0.8):.2f}"
        android:strokeLineCap="round"
        android:strokeLineJoin="round" />
'''
    return f'''<?xml version="1.0" encoding="utf-8"?>
<!-- Gerado a partir da geometria do ícone (diapasão em P). Canvas 108dp,
     símbolo dentro da zona visível de 72dp, centralizado pelo centro óptico. -->
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
{paths}</vector>
'''


ADAPTIVE = '''<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background" />
    <foreground android:drawable="@drawable/ic_launcher_foreground" />
    <monochrome android:drawable="@drawable/ic_launcher_monochrome" />
</adaptive-icon>
'''

COLOR = '''<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#FF%02X%02X%02X</color>
</resources>
''' % gen.BG

DENS = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}


def svg():
    """Ícone quadrado 512 em SVG (mesma geometria do PNG da loja)."""
    lines, ww, ow = transformed(512, 512, C["height_frac"])
    d = path_data(lines)
    rgb = lambda c: "#%02X%02X%02X" % c
    stroke = 'fill="none" stroke-linecap="round" stroke-linejoin="round"'
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <!-- Gerado por scripts/icon/build.py — não editar à mão. -->
  <rect width="512" height="512" fill="{rgb(gen.BG)}"/>
  <path d="{d}" {stroke} stroke="{rgb(gen.OUTLINE)}" stroke-width="{ow:.2f}"/>
  <path d="{d}" {stroke} stroke="{rgb(gen.WHITE)}" stroke-width="{ww:.2f}"/>
</svg>
'''

if __name__ == "__main__":
    for dn, s in DENS.items():
        d = os.path.join(RES, f"mipmap-{dn}")
        png(s, "square").save(os.path.join(d, "ic_launcher.png"))
        png(s, "circle").save(os.path.join(d, "ic_launcher_round.png"))
    png(512, "square").convert("RGB").save(os.path.join(ROOT, "logo", "icone-512.png"))
    open(os.path.join(ROOT, "logo", "icone.svg"), "w", encoding="utf-8").write(svg())
    any_ = os.path.join(RES, "mipmap-anydpi-v26")
    os.makedirs(any_, exist_ok=True)
    for n in ("ic_launcher.xml", "ic_launcher_round.xml"):
        open(os.path.join(any_, n), "w", encoding="utf-8").write(ADAPTIVE)
    dr = os.path.join(RES, "drawable")
    open(os.path.join(dr, "ic_launcher_foreground.xml"), "w", encoding="utf-8").write(vector(True))
    open(os.path.join(dr, "ic_launcher_monochrome.xml"), "w", encoding="utf-8").write(vector(False))
    open(os.path.join(RES, "values", "ic_launcher_background.xml"), "w", encoding="utf-8").write(COLOR)
    print("ok")

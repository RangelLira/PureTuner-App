"""Gerador paramétrico do ícone PureTuner (diapasão em forma de P).

Rodar: python scripts/icon/gen.py -> scripts/icon/comparativo.png, folha que
compara as variantes de VARIANTS com o play-store-icon-512.png atual, em
máscara redonda, squircle e tamanho pequeno. Os recursos finais saem de
build.py.

Geometria medida do ícone original (canvas 512):
  haste esquerda x=201, de y=75 a y=437 (centros das pontas arredondadas)
  dente direito x=310, de y=75 a y=238, diagonal até (201, 325)
  branco 35 px de largura, contorno escuro 13 px de cada lado
"""
import math
import os
from PIL import Image, ImageDraw, ImageFont

BG = (255, 94, 40)
OUTLINE = (48, 63, 81)
WHITE = (255, 255, 255)
SS = 4  # supersampling


def geometry(prong=163, tail=112, gap=109, angle_deg=51.3):
    """Linha central (unidades do original). Retorna lista de polilinhas."""
    dx = gap
    dy = dx / math.tan(math.radians(angle_deg))
    bend_y = 0.0
    top = bend_y - prong
    join_y = bend_y + dy
    bottom = join_y + tail
    stem = [(0, top), (0, bottom)]
    fork = [(dx, top), (dx, bend_y), (0, join_y)]
    return [stem, fork]


def polyline(draw, pts, width, fill):
    w = int(round(width))
    r = (w - 1) / 2  # casa com a largura inteira da linha (sem degrau na junção)
    for a, b in zip(pts, pts[1:]):
        draw.line([a, b], fill=fill, width=w)
    for (x, y) in pts:
        draw.ellipse([x - r, y - r, x + r, y + r], fill=fill)


def render_symbol(size, height_frac, white_w=35, outline_w=13, center="optical",
                  **geo):
    """Desenha o símbolo num canvas transparente size×size."""
    lines = geometry(**geo)
    half = white_w / 2 + outline_w
    xs = [p[0] for l in lines for p in l]
    ys = [p[1] for l in lines for p in l]
    bx0, bx1 = min(xs) - half, max(xs) + half
    by0, by1 = min(ys) - half, max(ys) + half
    k = size * SS * height_frac / (by1 - by0)  # escala unidades→px

    # centro: caixa (bbox) ou óptico (média entre bbox e centróide da massa)
    cx_box = (bx0 + bx1) / 2
    cy_box = (by0 + by1) / 2
    if center == "box":
        cx, cy = cx_box, cy_box
    else:
        # centróide aproximado ponderado pelo comprimento dos traços
        tot = sx = sy = 0
        for l in lines:
            for a, b in zip(l, l[1:]):
                L = math.dist(a, b)
                tot += L
                sx += L * (a[0] + b[0]) / 2
                sy += L * (a[1] + b[1]) / 2
        gx, gy = sx / tot, sy / tot
        w = 0.5 if center == "optical" else 1.0
        cx = cx_box * (1 - w) + gx * w
        cy = cy_box  # vertical fica pela caixa
    S = size * SS
    tf = lambda p: (S / 2 + (p[0] - cx) * k, S / 2 + (p[1] - cy) * k)
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    for l in lines:
        polyline(d, [tf(p) for p in l], (white_w + 2 * outline_w) * k, OUTLINE)
    for l in lines:
        polyline(d, [tf(p) for p in l], white_w * k, WHITE)
    return img.resize((size, size), Image.LANCZOS)


def mask(size, shape):
    S = size * SS
    m = Image.new("L", (S, S), 0)
    d = ImageDraw.Draw(m)
    if shape == "circle":
        d.ellipse([0, 0, S - 1, S - 1], fill=255)
    elif shape == "squircle":
        d.rounded_rectangle([0, 0, S - 1, S - 1], radius=S * 0.30, fill=255)
    else:
        d.rectangle([0, 0, S, S], fill=255)
    return m.resize((size, size), Image.LANCZOS)


def icon(size, shape, **kw):
    base = Image.new("RGBA", (size, size), BG + (255,))
    base.alpha_composite(render_symbol(size, **kw))
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(base, (0, 0), mask(size, shape))
    return out


def original(size, shape):
    src = Image.open(ORIG).convert("RGBA").resize((size, size), Image.LANCZOS)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(src, (0, 0), mask(size, shape))
    return out


ORIG = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..",
                    "play-store-icon-512.png")

VARIANTS = {
    "Atual": None,
    "A - só redimensiona\n+ centro óptico": dict(height_frac=0.60),
    "B - pontas aparadas\n(-30%)": dict(height_frac=0.58, prong=114, tail=78),
    "C - B + traço\nmais encorpado": dict(height_frac=0.58, prong=114, tail=78,
                                         white_w=40, outline_w=12),
    "D - B + diagonal 45°": dict(height_frac=0.58, prong=114, tail=78,
                                angle_deg=45, white_w=40, outline_w=12),
}

if __name__ == "__main__":
    import os
    here = os.path.dirname(os.path.abspath(__file__))
    big, small = 220, 56
    colw, pad = big + 40, 20
    rows = [("circle", big), ("squircle", big), ("circle", small)]
    W = colw * len(VARIANTS) + pad
    H = 70 + sum(s + 30 for _, s in rows) + 20
    sheet = Image.new("RGBA", (W, H), (236, 238, 241, 255))
    d = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.truetype("segoeui.ttf", 15)
    except OSError:
        font = ImageFont.load_default()
    for i, (name, kw) in enumerate(VARIANTS.items()):
        x0 = pad + i * colw
        d.multiline_text((x0, 12), name, fill=(30, 30, 30), font=font)
        y = 70
        for shape, s in rows:
            ic = original(s, shape) if kw is None else icon(s, shape, **kw)
            # guia: círculo de zona segura (66/108 do adaptive icon)
            sheet.alpha_composite(ic, (x0 + (big - s) // 2, y))
            y += s + 30
    sheet.save(os.path.join(here, "comparativo.png"))
    print("ok")

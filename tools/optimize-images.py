# -*- coding: utf-8 -*-
"""LA Project — оптимизация изображений.

Из каждого исходного кадра NN.jpg делает один набор:
    NN.webp       1600w  — лайтбокс
    NN-1100.webp  1100w  — карточка на retina / планшет
    NN-640.webp    640w  — карточка 1x / мобильный
    NN.jpg        1200w  — фолбэк для браузеров без WebP
Для hero дополнительно NN-2200.webp (фон на весь экран).
Отдельные превью NN_t.* больше не нужны — их заменяет srcset.
"""
import os, io, json
from PIL import Image, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG = os.path.join(ROOT, "img")

WEBP = [(1600, 72), (1100, 71), (640, 69)]
JPEG = (1200, 76)
HERO_EXTRA = (2200, 70)
HERO_DIR = "hotel-lobby"

stats = {"in": 0, "out": 0, "files": 0, "removed": 0}


def load(path):
    with open(path, "rb") as fh:          # читаем целиком — файл будет перезаписан
        raw = fh.read()
    im = Image.open(io.BytesIO(raw))
    im.load()
    im = ImageOps.exif_transpose(im)      # применить EXIF-поворот, затем убрать метаданные
    return im.convert("RGB")


def resized(im, w):
    if im.width <= w:
        return im
    return im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)


def emit(im, w, q, out, fmt):
    r = resized(im, w)
    if fmt == "WEBP":
        r.save(out, "WEBP", quality=q, method=6)
    else:
        r.save(out, "JPEG", quality=q, optimize=True, progressive=True, subsampling=2)
    stats["out"] += os.path.getsize(out)
    stats["files"] += 1
    return r.width


def process(path, is_hero):
    base = os.path.splitext(path)[0]
    stats["in"] += os.path.getsize(path)
    im = load(path)
    src_w, src_h = im.size

    plan = list(WEBP)
    if is_hero:
        plan.insert(0, HERO_EXTRA)

    widths = []
    primary_done = False
    for w, q in plan:
        if w >= src_w and primary_done:
            continue                       # апскейл не нужен — основной уже покрывает
        if not primary_done:
            out = base + ".webp"           # основной = самый широкий доступный
            primary_done = True
        else:
            out = "%s-%d.webp" % (base, w)
        widths.append(emit(im, w, q, out, "WEBP"))

    emit(im, JPEG[0], JPEG[1], base + ".jpg", "JPEG")
    return {"w": sorted(set(widths)), "ar": round(src_w / src_h, 4), "src": [src_w, src_h]}


def main():
    manifest = {}
    targets = []
    for dirpath, _, files in os.walk(IMG):
        for f in files:
            if f.lower().endswith((".jpg", ".jpeg", ".png")):
                targets.append(os.path.join(dirpath, f))

    # 1. удаляем устаревшие превью NN_t.* — их заменяет srcset
    thumbs = [p for p in targets if os.path.splitext(os.path.basename(p))[0].endswith("_t")]
    for p in thumbs:
        os.remove(p)
        stats["removed"] += 1
    targets = [p for p in targets if p not in thumbs]

    # 2. пересобираем остальное
    for p in sorted(targets):
        rel = os.path.relpath(p, IMG).replace("\\", "/")
        folder = rel.split("/")[0] if "/" in rel else ""
        key = os.path.splitext(rel)[0]
        info = process(p, is_hero=(folder == HERO_DIR))
        if p.lower().endswith((".jpeg", ".png")):
            os.remove(p)                   # осталась только .jpg-версия
            key = key                      # ключ без расширения — уже без него
        manifest[key] = info

    with open(os.path.join(IMG, "_manifest.json"), "w", encoding="utf-8") as fh:
        json.dump(manifest, fh, ensure_ascii=False, indent=1, sort_keys=True)

    print("удалено превью _t: %d" % stats["removed"])
    print("исходники: %.1f MB" % (stats["in"] / 1048576))
    print("результат: %.1f MB в %d файлах" % (stats["out"] / 1048576, stats["files"]))


if __name__ == "__main__":
    main()

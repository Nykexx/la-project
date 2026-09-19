# -*- coding: utf-8 -*-
"""LA Project — ультра-качество оптимизации изображений.

Генерирует кристально чёткие наборы кадров:
    NN.webp       1800w / native (quality 90, method 6) — полноэкранный просмотр и лайтбокс
    NN-1100.webp  1100w (quality 88, method 6) + Smart Sharpening — retina и планшеты
    NN-640.webp    640w (quality 86, method 6) + Smart Sharpening — мобильные экраны
    NN.jpg        1600w / native (quality 90, 4:4:4 chroma subsampling=0) — фолбэк для совместимости
Для hero дополнительно NN-2200.webp (quality 92).
"""
import os, io, json
from PIL import Image, ImageOps, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG = os.path.join(ROOT, "img")

WEBP_PLAN = [(1800, 90), (1100, 88), (640, 86)]
JPEG_PLAN = (1600, 90)
HERO_EXTRA = (2200, 92)
HERO_DIR = "hotel-lobby"

stats = {"in": 0, "out": 0, "files": 0}


def load_best_source(base_no_ext):
    """Выбирает наиболее качественный и высокоразрешённый исходник (WebP или JPG)."""
    candidates = [base_no_ext + ".webp", base_no_ext + ".jpg", base_no_ext + ".png", base_no_ext + ".jpeg"]
    best_img = None
    best_pixels = 0
    best_path = None

    for c in candidates:
        if os.path.isfile(c):
            try:
                with open(c, "rb") as fh:
                    raw = fh.read()
                im = Image.open(io.BytesIO(raw))
                im.load()
                im = ImageOps.exif_transpose(im)
                im = im.convert("RGB")
                pixels = im.width * im.height
                if pixels > best_pixels:
                    best_pixels = pixels
                    best_img = im
                    best_path = c
            except Exception:
                continue

    return best_img, best_path


def smart_sharpen(im, is_downscaled):
    """Применяет деликатную микрорезкость (Unsharp Mask) для архитектурных текстур."""
    if is_downscaled:
        # При уменьшении компенсируем размытие Lanczos
        return im.filter(ImageFilter.UnsharpMask(radius=1.1, percent=55, threshold=2))
    else:
        # При нативном размере — легкое подчеркивание граней камня, света и швов
        return im.filter(ImageFilter.UnsharpMask(radius=0.9, percent=35, threshold=2))


def emit_image(im, target_w, q, out_path, fmt):
    src_w, src_h = im.size
    is_downscaled = src_w > target_w

    if is_downscaled:
        target_h = round(src_h * target_w / src_w)
        resized_im = im.resize((target_w, target_h), Image.LANCZOS)
    else:
        resized_im = im.copy()

    sharpened_im = smart_sharpen(resized_im, is_downscaled)

    if fmt == "WEBP":
        sharpened_im.save(out_path, "WEBP", quality=q, method=6)
    else:
        # JPEG 4:4:4 (subsampling=0) исключает хроматическое размытие линий
        sharpened_im.save(out_path, "JPEG", quality=q, optimize=True, progressive=True, subsampling=0)

    stats["out"] += os.path.getsize(out_path)
    stats["files"] += 1
    return sharpened_im.width


def process_item(base_no_ext, is_hero):
    im, src_path = load_best_source(base_no_ext)
    if im is None:
        return None

    src_w, src_h = im.size
    stats["in"] += os.path.getsize(src_path)

    plan = list(WEBP_PLAN)
    if is_hero:
        plan.insert(0, HERO_EXTRA)

    widths = []
    primary_done = False

    for w, q in plan:
        if w >= src_w and primary_done:
            continue
        if not primary_done:
            out_file = base_no_ext + ".webp"
            primary_done = True
        else:
            out_file = f"{base_no_ext}-{w}.webp"

        actual_w = emit_image(im, w, q, out_file, "WEBP")
        widths.append(actual_w)

    # Сохраняем кристальный fallback JPEG
    jpg_w = min(src_w, JPEG_PLAN[0])
    emit_image(im, jpg_w, JPEG_PLAN[1], base_no_ext + ".jpg", "JPEG")

    return {
        "w": sorted(set(widths)),
        "ar": round(src_w / src_h, 4),
        "src": [src_w, src_h]
    }


def main():
    manifest = {}
    items_to_process = set()

    for dirpath, _, files in os.walk(IMG):
        for f in files:
            if f.startswith("_"):
                continue
            base, ext = os.path.splitext(f)
            if ext.lower() in [".jpg", ".jpeg", ".png", ".webp"]:
                # Игнорируем промежуточные сгенерированные файлы вида 00-640.webp
                if "-" in base and base.split("-")[-1].isdigit():
                    continue
                full_base = os.path.join(dirpath, base)
                items_to_process.add(full_base)

    print(f"Всего объектов для пересборки в ультра-качестве: {len(items_to_process)}")

    for full_base in sorted(items_to_process):
        rel = os.path.relpath(full_base, IMG).replace("\\", "/")
        folder = rel.split("/")[0] if "/" in rel else ""
        info = process_item(full_base, is_hero=(folder == HERO_DIR))
        if info:
            manifest[rel] = info

    manifest_path = os.path.join(IMG, "_manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as fh:
        json.dump(manifest, fh, ensure_ascii=False, indent=1, sort_keys=True)

    print(f"Исходники: {stats['in'] / 1048576:.1f} MB")
    print(f"Результат ультра-качества: {stats['out'] / 1048576:.1f} MB в {stats['files']} файлах")


if __name__ == "__main__":
    main()


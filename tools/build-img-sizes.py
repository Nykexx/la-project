# -*- coding: utf-8 -*-
"""Собирает img-sizes.js из img/_manifest.json.

IMG_SIZES["slug/NN"] = [ширина_исходника, высота_исходника, [доступные_ширины]]
Используется в app.js для srcset и для width/height (защита от скачков вёрстки).
"""
import json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
m = json.load(open(os.path.join(ROOT, "img", "_manifest.json"), encoding="utf-8"))

out = {k: [v["src"][0], v["src"][1], v["w"]] for k, v in sorted(m.items())}

body = json.dumps(out, ensure_ascii=False, separators=(",", ":"))
js = (
    "/* LA Project — карта размеров изображений. Генерируется автоматически, не править вручную. */\n"
    "/* IMG_SIZES[\"<папка>/<кадр>\"] = [ширина, высота, [доступные ширины webp]] */\n"
    "const IMG_SIZES = " + body + ";\n"
)
p = os.path.join(ROOT, "img-sizes.js")
open(p, "w", encoding="utf-8").write(js)
print("img-sizes.js: %d кадров, %.1f KB" % (len(out), os.path.getsize(p) / 1024))

# -*- coding: utf-8 -*-
"""
LA Project — Генератор PDF-презентации / Lookbook 2026
Создаёт многостраничный PDF в высоком разрешении (A4 Landscape 1920x1080)
со всеми 19 проектами, описаниями, фактами и фотографиями.
"""

import json
import os
import re
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
OUTPUT_PDF = os.path.join(ROOT, 'LA_Project_Portfolio_2026.pdf')
IMG_DIR = os.path.join(ROOT, 'img')

PAGE_W, PAGE_H = 1920, 1080

# Цветовая палитра
BG_COLOR = (7, 8, 10)           # #07080a
SURFACE_COLOR = (14, 16, 20)    # #0e1014
CARD_BG = (20, 23, 29)          # #14171d
GOLD_ACCENT = (212, 182, 142)   # #d4b68e
GOLD_LIGHT = (241, 223, 197)    # #f1dfc5
GOLD_BORDER = (212, 182, 142, 60)
TEXT_WHITE = (240, 242, 245)    # #f0f2f5
TEXT_MUTED = (143, 150, 163)    # #8f96a3
TEXT_DIM = (92, 98, 112)        # #5c6270

# Шрифты Windows
def get_font(name, size):
    paths = [
        f"C:/Windows/Fonts/{name}.ttf",
        f"C:/Windows/Fonts/{name}.TTF",
        f"C:/Windows/Fonts/{name.lower()}.ttf"
    ]
    for p in paths:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                pass
    return ImageFont.load_default()

FONT_TITLE = get_font('georgia', 44)
FONT_TITLE_BD = get_font('georgiab', 44)
FONT_SUBTITLE = get_font('georgia', 22)
FONT_HEAD_LG = get_font('georgiab', 32)
FONT_HEAD_MD = get_font('georgiab', 26)
FONT_HEAD_SM = get_font('georgiab', 20)
FONT_BODY = get_font('arial', 16)
FONT_BODY_BD = get_font('arialbd', 16)
FONT_BODY_SM = get_font('arial', 14)
FONT_BODY_XS = get_font('arial', 12)
FONT_TAG = get_font('arialbd', 13)
FONT_COVER_MAIN = get_font('georgiab', 54)
FONT_COVER_ACCENT = get_font('georgia', 32)

def parse_data_js():
    data_path = os.path.join(ROOT, 'data.js')
    with open(data_path, 'r', encoding='utf-8') as f:
        content = f.read()
    m = re.search(r'const\s+OBJECTS\s*=\s*(\[[\s\S]*?\]);', content)
    if not m:
        raise ValueError("Cannot parse OBJECTS from data.js")
    return json.loads(m.group(1))

def draw_header_footer(draw, page_num, total_pages, tag="LA PROJECT"):
    # Верхняя тонкая полоса
    draw.line([(80, 60), (PAGE_W - 80, 60)], fill=(50, 55, 65), width=1)
    draw.text((80, 35), "LA PROJECT", fill=GOLD_ACCENT, font=FONT_TAG)
    draw.text((PAGE_W - 80, 35), "LOOKBOOK & PORTFOLIO 2026", fill=TEXT_MUTED, font=FONT_TAG, anchor="ra")

    # Нижний футер
    draw.line([(80, PAGE_H - 60), (PAGE_W - 80, PAGE_H - 60)], fill=(50, 55, 65), width=1)
    draw.text((80, PAGE_H - 45), f"LA PROJECT · {tag.upper()}", fill=TEXT_MUTED, font=FONT_BODY_XS)
    draw.text((PAGE_W - 80, PAGE_H - 45), f"{page_num:02d} / {total_pages:02d}", fill=GOLD_ACCENT, font=FONT_BODY_XS, anchor="ra")

def wrap_text(text, font, max_width, draw):
    words = text.split()
    lines = []
    current_line = []
    for word in words:
        test_line = ' '.join(current_line + [word])
        bbox = draw.textbbox((0, 0), test_line, font=font)
        w = bbox[2] - bbox[0]
        if w <= max_width:
            current_line.append(word)
        else:
            if current_line:
                lines.append(' '.join(current_line))
            current_line = [word]
    if current_line:
        lines.append(' '.join(current_line))
    return lines

def create_cover():
    im = Image.new('RGB', (PAGE_W, PAGE_H), BG_COLOR)
    
    # Фоновое изображение с затемнением
    bg_img_path = os.path.join(IMG_DIR, 'og-cover.jpg')
    if os.path.exists(bg_img_path):
        try:
            bg_im = Image.open(bg_img_path).convert('RGB')
            bg_im = bg_im.resize((PAGE_W, PAGE_H), Image.Resampling.LANCZOS)
            # Затемняем на 60%
            darkness = Image.new('RGB', (PAGE_W, PAGE_H), BG_COLOR)
            im = Image.blend(bg_im, darkness, 0.60)
        except Exception as e:
            print("Cover bg error:", e)

    draw = ImageDraw.Draw(im, 'RGBA')

    # Золотая рамка
    draw.rectangle([(50, 50), (PAGE_W - 50, PAGE_H - 50)], outline=(212, 182, 142, 90), width=1)
    draw.rectangle([(56, 56), (PAGE_W - 56, PAGE_H - 56)], outline=(212, 182, 142, 40), width=1)

    # Логотип вверху
    draw.text((100, 100), "LA PROJECT", fill=GOLD_ACCENT, font=FONT_HEAD_LG)
    
    # Бейдж
    badge_text = "LOOKBOOK & PORTFOLIO 2026"
    draw.rectangle([(PAGE_W - 380, 100), (PAGE_W - 100, 140)], fill=(7, 8, 10, 200), outline=GOLD_ACCENT, width=1)
    draw.text((PAGE_W - 240, 120), badge_text, fill=GOLD_LIGHT, font=FONT_TAG, anchor="mm")

    # Главный заголовок
    draw.text((100, 400), "АРХИТЕКТУРНОЕ БЮРО ЛЕЙЛЫ АРИФОВОЙ", fill=GOLD_ACCENT, font=FONT_TAG)
    draw.text((100, 440), "ГЕНЕРАЛЬНЫЙ КАТАЛОГ", fill=TEXT_WHITE, font=FONT_COVER_MAIN)
    draw.text((100, 515), "ПОРТФОЛИО И LOOKBOOK ПРОЕКТОВ 2026", fill=GOLD_ACCENT, font=FONT_COVER_ACCENT)
    
    sub_text = "Авторская архитектура частных резиденций, общественных пространств и эксклюзивных интерьеров."
    draw.text((100, 580), sub_text, fill=TEXT_MUTED, font=FONT_SUBTITLE)

    # Нижняя плашка с реквизитами
    draw.line([(100, PAGE_H - 150), (PAGE_W - 100, PAGE_H - 150)], fill=(212, 182, 142, 80), width=1)
    
    draw.text((100, PAGE_H - 120), "ГОСУДАРСТВЕННАЯ ЛИЦЕНЗИЯ", fill=GOLD_ACCENT, font=FONT_BODY_XS)
    draw.text((100, PAGE_H - 95), "ГАСК № 19011889 (III категория)", fill=TEXT_WHITE, font=FONT_BODY)

    draw.text((PAGE_W // 2 - 100, PAGE_H - 120), "АРХИТЕКТУРНЫЙ ОПЫТ", fill=GOLD_ACCENT, font=FONT_BODY_XS)
    draw.text((PAGE_W // 2 - 100, PAGE_H - 95), "Непрерывная практика с 1996 года", fill=TEXT_WHITE, font=FONT_BODY)

    draw.text((PAGE_W - 100, PAGE_H - 120), "ЛОКАЦИЯ БЮРО", fill=GOLD_ACCENT, font=FONT_BODY_XS, anchor="ra")
    draw.text((PAGE_W - 100, PAGE_H - 95), "Алматы · Казахстан", fill=TEXT_WHITE, font=FONT_BODY, anchor="ra")

    return im

def create_about(page_num, total_pages):
    im = Image.new('RGB', (PAGE_W, PAGE_H), BG_COLOR)
    draw = ImageDraw.Draw(im)
    draw_header_footer(draw, page_num, total_pages, "О БЮРО")

    # Фото основателя
    photo_path = os.path.join(IMG_DIR, 'leyla.webp')
    if not os.path.exists(photo_path):
        photo_path = os.path.join(IMG_DIR, 'leyla.jpg')
    
    if os.path.exists(photo_path):
        try:
            p_img = Image.open(photo_path).convert('RGB')
            p_img = p_img.resize((360, 480), Image.Resampling.LANCZOS)
            im.paste(p_img, (80, 140))
            draw.rectangle([(79, 139), (441, 621)], outline=GOLD_ACCENT, width=1)
        except Exception as e:
            print("Photo error:", e)

    draw.text((80, 640), "Лейла Арифова", fill=GOLD_ACCENT, font=FONT_HEAD_MD)
    draw.text((80, 680), "Основатель LA Project · Ведущий архитектор", fill=TEXT_MUTED, font=FONT_TAG)
    draw.text((80, 710), "Практика с 1996 года (28+ лет опыта)", fill=TEXT_DIM, font=FONT_BODY_XS)

    # Правая колонка
    right_x = 490
    right_w = PAGE_W - right_x - 80

    # Цитата
    quote = "«Создание пространства — это сотворение персонального мира для человека. Мы создаём атмосферу безупречного комфорта, в которую хочется возвращаться.»"
    draw.line([(right_x, 140), (right_x, 230)], fill=GOLD_ACCENT, width=4)
    q_lines = wrap_text(quote, FONT_SUBTITLE, right_w - 40, draw)
    qy = 140
    for line in q_lines:
        draw.text((right_x + 24, qy), line, fill=GOLD_LIGHT, font=FONT_SUBTITLE)
        qy += 34

    # Текст о студии
    p1 = "Архитектурное бюро LA Project ведёт каждый объект комплексно: от генерального плана и посадки на рельеф до текстильного оформления и авторского надзора. Мы одинаково уверенно работаем в современной классике, неоклассике, ар-деко и минимализме, подбирая архитектурный язык под личность владельца и природный ландшафт."
    p2 = "Каждая резиденция и интерьер — это штучное авторское произведение, спроектированное под сценарии жизни конкретной семьи с максимальным вниманием к инсоляции, пропорциям, сейсмостойкости, премиальным долговечным материалам и инженерии."
    
    ty = 270
    for p in [p1, p2]:
        lines = wrap_text(p, FONT_BODY, right_w, draw)
        for line in lines:
            draw.text((right_x, ty), line, fill=(210, 215, 225), font=FONT_BODY)
            ty += 26
        ty += 14

    # Сетка услуг 3 колонки
    card_w = (right_w - 30) // 3
    card_h = 170
    services = [
        ("01", "Архитектура", "Индивидуальные резиденции, виллы, АР + КР + Генплан, сейсморасчёты."),
        ("02", "Интерьеры", "Авторский дизайн-проект, планировочные решения, 3D, ведомости отделки."),
        ("03", "Строительство", "Комплектация под ключ, авторский надзор, сдача готового пространства.")
    ]

    cx = right_x
    for num, name, desc in services:
        draw.rectangle([(cx, ty), (cx + card_w, ty + card_h)], fill=CARD_BG, outline=(212, 182, 142, 70), width=1)
        draw.text((cx + 18, ty + 16), num, fill=GOLD_ACCENT, font=FONT_TAG)
        draw.text((cx + 18, ty + 42), name, fill=TEXT_WHITE, font=FONT_HEAD_SM)
        d_lines = wrap_text(desc, FONT_BODY_XS, card_w - 36, draw)
        dy = ty + 76
        for line in d_lines:
            draw.text((cx + 18, dy), line, fill=TEXT_MUTED, font=FONT_BODY_XS)
            dy += 18
        cx += card_w + 15

    # Статистика внизу
    ty += card_h + 30
    draw.line([(right_x, ty), (right_x + right_w, ty)], fill=(60, 65, 75), width=1)
    ty += 20

    stats = [
        ("50+", "РЕАЛИЗОВАННЫХ ОБЪЕКТОВ"),
        ("28+", "ЛЕТ НЕПРЕРЫВНОЙ ПРАКТИКИ"),
        ("III КАТ.", "ГОСЛИЦЕНЗИЯ ГАСК"),
        ("100%", "АВТОРСКИЙ НАДЗОР")
    ]
    sw = right_w // 4
    for i, (val, lbl) in enumerate(stats):
        sx = right_x + i * sw
        draw.text((sx, ty), val, fill=GOLD_ACCENT, font=FONT_HEAD_MD)
        draw.text((sx, ty + 36), lbl, fill=TEXT_MUTED, font=FONT_BODY_XS)

    return im

def create_divider(num_str, eyebrow, title, sub, page_num, total_pages, tag):
    im = Image.new('RGB', (PAGE_W, PAGE_H), (9, 11, 15))
    draw = ImageDraw.Draw(im)
    draw_header_footer(draw, page_num, total_pages, tag)

    # Огромная фоновая цифра
    draw.text((PAGE_W // 2, PAGE_H // 2 - 40), num_str, fill=(20, 24, 32), font=get_font('georgiab', 300), anchor="mm")

    # Центрированный текст
    draw.text((PAGE_W // 2, PAGE_H // 2 - 100), eyebrow, fill=GOLD_ACCENT, font=FONT_TAG, anchor="mm")
    draw.text((PAGE_W // 2, PAGE_H // 2 - 30), title, fill=TEXT_WHITE, font=FONT_HEAD_LG, anchor="mm")
    
    sub_lines = wrap_text(sub, FONT_SUBTITLE, 800, draw)
    sy = PAGE_H // 2 + 30
    for line in sub_lines:
        draw.text((PAGE_W // 2, sy), line, fill=TEXT_MUTED, font=FONT_SUBTITLE, anchor="mm")
        sy += 36

    draw.line([(PAGE_W // 2 - 40, sy + 20), (PAGE_W // 2 + 40, sy + 20)], fill=GOLD_ACCENT, width=2)
    return im

def create_project_page(p, page_num, total_pages):
    im = Image.new('RGB', (PAGE_W, PAGE_H), BG_COLOR)
    draw = ImageDraw.Draw(im)
    draw_header_footer(draw, page_num, total_pages, p.get('tag', 'ПРОЕКТ'))

    # Заголовок проекта
    draw.text((80, 80), f"{p.get('tag', 'ПРОЕКТ').upper()} · {p.get('status', 'ПРОЕКТ').upper()}", fill=GOLD_ACCENT, font=FONT_TAG)
    draw.text((80, 105), p.get('title', ''), fill=TEXT_WHITE, font=FONT_HEAD_MD)
    draw.text((PAGE_W - 80, 105), p.get('place', 'Алматы').upper(), fill=GOLD_ACCENT, font=FONT_TAG, anchor="ra")
    draw.line([(80, 150), (PAGE_W - 80, 150)], fill=(60, 65, 75), width=1)

    # Визуальная колонка слева
    vis_w = 980
    vis_h = 580
    
    # Главное изображение
    main_img_path = os.path.join(IMG_DIR, p['slug'], '00.webp')
    if not os.path.exists(main_img_path):
        main_img_path = os.path.join(IMG_DIR, p['slug'], '00.jpg')
    
    if os.path.exists(main_img_path):
        try:
            m_im = Image.open(main_img_path).convert('RGB')
            # Масштабируем с сохранением пропорций и обрезаем по центру
            m_im = m_im.resize((vis_w, vis_h), Image.Resampling.LANCZOS)
            im.paste(m_im, (80, 175))
            draw.rectangle([(79, 174), (80 + vis_w, 175 + vis_h)], outline=(212, 182, 142, 90), width=1)
        except Exception as e:
            print(f"Error loading main img for {p['slug']}:", e)

    # Миниатюры внизу главного фото (до 3 штук)
    shots = p.get('shots', [])[1:4]
    if shots:
        tw = (vis_w - (len(shots) - 1) * 15) // len(shots)
        th = 175
        tx = 80
        ty = 175 + vis_h + 15
        for s in shots:
            t_path = os.path.join(IMG_DIR, p['slug'], f"{s}.webp")
            if not os.path.exists(t_path):
                t_path = os.path.join(IMG_DIR, p['slug'], f"{s}.jpg")
            if os.path.exists(t_path):
                try:
                    t_im = Image.open(t_path).convert('RGB')
                    t_im = t_im.resize((tw, th), Image.Resampling.LANCZOS)
                    im.paste(t_im, (tx, ty))
                    draw.rectangle([(tx - 1, ty - 1), (tx + tw, ty + th)], outline=(212, 182, 142, 60), width=1)
                except Exception as e:
                    print(f"Thumb error {s}:", e)
            tx += tw + 15

    # Правая колонка с описанием и фактами
    rx = 80 + vis_w + 40
    rw = PAGE_W - rx - 80

    # Описание концепции
    draw.text((rx, 175), "КОНЦЕПЦИЯ И АРХИТЕКТУРНЫЕ РЕШЕНИЯ", fill=GOLD_ACCENT, font=FONT_TAG)
    
    desc = p.get('desc', '')
    d_lines = wrap_text(desc, FONT_BODY, rw, draw)
    dy = 205
    for line in d_lines:
        draw.text((rx, dy), line, fill=(215, 220, 230), font=FONT_BODY)
        dy += 26

    # Блок ключевых характеристик
    dy = max(dy + 30, 480)
    draw.text((rx, dy), "КЛЮЧЕВЫЕ ХАРАКТЕРИСТИКИ ОБЪЕКТА", fill=GOLD_ACCENT, font=FONT_TAG)
    dy += 25

    facts = p.get('facts', {})
    box_h = 380
    draw.rectangle([(rx, dy), (rx + rw, dy + box_h)], fill=CARD_BG, outline=(212, 182, 142, 70), width=1)
    
    fy = dy + 20
    for k, v in facts.items():
        draw.text((rx + 24, fy), k.upper(), fill=TEXT_MUTED, font=FONT_BODY_XS)
        draw.text((rx + 24, fy + 20), str(v), fill=TEXT_WHITE, font=FONT_BODY_BD)
        fy += 56
        draw.line([(rx + 20, fy - 6), (rx + rw - 20, fy - 6)], fill=(40, 45, 55), width=1)

    return im

def create_contacts(page_num, total_pages):
    im = Image.new('RGB', (PAGE_W, PAGE_H), BG_COLOR)
    draw = ImageDraw.Draw(im)
    draw_header_footer(draw, page_num, total_pages, "КОНТАКТЫ")

    # Левая колонка
    lx = 100
    lw = 850

    draw.text((lx, 200), "СОТРУДНИЧЕСТВО И ЗАКАЗ ПРОЕКТА", fill=GOLD_ACCENT, font=FONT_TAG)
    draw.text((lx, 240), "ВОПЛОТИМ ВАШ ПРОЕКТ В ЖИЗНЬ", fill=TEXT_WHITE, font=FONT_HEAD_LG)
    
    sub = "Свяжитесь с нами для организации первой консультации, аудита земельного участка или разработки архитектурной концепции вашего будущего объекта."
    lines = wrap_text(sub, FONT_SUBTITLE, lw, draw)
    sy = 310
    for line in lines:
        draw.text((lx, sy), line, fill=TEXT_MUTED, font=FONT_SUBTITLE)
        sy += 36

    # Контакты
    cy = 430
    contacts = [
        ("ТЕЛЕФОНЫ БЮРО", "+7 (701) 786-46-80   /   +7 (701) 786-46-88"),
        ("WHATSAPP / TELEGRAM", "+7 (701) 786-46-80 (Прямая связь с ведущим архитектором)"),
        ("ЭЛЕКТРОННАЯ ПОЧТА", "info@laproject.kz   /   akimzhanova_l@mail.ru"),
        ("ОФИС В АЛМАТЫ", "Республика Казахстан, г. Алматы, пр. Аль-Фараби, БЦ «Нурлы Тау»"),
        ("ОФИЦИАЛЬНЫЙ САЙТ", "https://la-project.kz")
    ]

    for label, val in contacts:
        draw.text((lx, cy), label, fill=GOLD_ACCENT, font=FONT_TAG)
        draw.text((lx, cy + 22), val, fill=TEXT_WHITE, font=FONT_HEAD_SM)
        cy += 70

    # Правая карточка
    rx = 1050
    rw = PAGE_W - rx - 100
    ry = 200
    rh = 680

    draw.rectangle([(rx, ry), (rx + rw, ry + rh)], fill=SURFACE_COLOR, outline=GOLD_ACCENT, width=1)
    draw.rectangle([(rx + 8, ry + 8), (rx + rw - 8, ry + rh - 8)], outline=(212, 182, 142, 60), width=1)

    draw.text((rx + rw // 2, ry + 60), "LA PROJECT STUDIO", fill=GOLD_ACCENT, font=FONT_HEAD_MD, anchor="mm")
    draw.text((rx + rw // 2, ry + 100), "Архитектура · Интерьеры · Комплектация · Подряд", fill=TEXT_MUTED, font=FONT_BODY_XS, anchor="mm")
    
    draw.line([(rx + 50, ry + 130), (rx + rw - 50, ry + 130)], fill=(60, 65, 75), width=1)

    points = [
        "✓ Полный цикл проектирования (АР + КР + Генплан + ОВиК)",
        "✓ Проектирование по государственной лицензии III категории",
        "✓ Авторский надзор и управление строительством",
        "✓ Прямые поставки мрамора, дерева, света и мебели из Европы",
        "✓ Индивидуальная сейсмостойкая адаптация конструкций"
    ]
    py = ry + 160
    for pt in points:
        draw.text((rx + 40, py), pt, fill=(220, 225, 235), font=FONT_BODY)
        py += 44

    draw.line([(rx + 50, ry + rh - 160), (rx + rw - 50, ry + rh - 160)], fill=(60, 65, 75), width=1)
    
    draw.text((rx + rw // 2, ry + rh - 120), "ГОСЛИЦЕНЗИИ ГАСК № 19011889, № 19011890", fill=GOLD_LIGHT, font=FONT_BODY_XS, anchor="mm")
    draw.text((rx + rw // 2, ry + rh - 90), "© 2026 LA Project. Все права защищены.", fill=TEXT_MUTED, font=FONT_BODY_XS, anchor="mm")

    return im

def main():
    objects = parse_data_js()
    arch_objs = [o for o in objects if o.get('cat') == 'arch']
    int_objs = [o for o in objects if o.get('cat') == 'int']

    total_pages = 1 + 1 + 1 + len(arch_objs) + 1 + len(int_objs) + 1
    print(f"Total pages to generate: {total_pages} (Arch: {len(arch_objs)}, Int: {len(int_objs)})")

    pages = []
    page_num = 1

    # 1. Обложка
    print("Generating Page 1: Cover...")
    pages.append(create_cover())
    page_num += 1

    # 2. О Бюро
    print(f"Generating Page {page_num}: About Studio...")
    pages.append(create_about(page_num, total_pages))
    page_num += 1

    # 3. Разделитель Архитектуры
    print(f"Generating Page {page_num}: Architecture Divider...")
    pages.append(create_divider(
        "01",
        "НАПРАВЛЕНИЕ 01",
        "АРХИТЕКТУРНЫЕ ПРОЕКТЫ",
        "Частные особняки, загородные резиденции, отели и многофункциональные комплексы.",
        page_num, total_pages, "АРХИТЕКТУРА"
    ))
    page_num += 1

    # Архитектурные проекты
    for p in arch_objs:
        print(f"Generating Page {page_num}: Arch - {p['title']} ({p['slug']})...")
        pages.append(create_project_page(p, page_num, total_pages))
        page_num += 1

    # Разделитель Интерьеров
    print(f"Generating Page {page_num}: Interiors Divider...")
    pages.append(create_divider(
        "02",
        "НАПРАВЛЕНИЕ 02",
        "ДИЗАЙН ИНТЕРЬЕРОВ",
        "Премиальные жилые резиденции, апартаменты, fine-dining рестораны и лобби отелей.",
        page_num, total_pages, "ИНТЕРЬЕРЫ"
    ))
    page_num += 1

    # Интерьерные проекты
    for p in int_objs:
        print(f"Generating Page {page_num}: Int - {p['title']} ({p['slug']})...")
        pages.append(create_project_page(p, page_num, total_pages))
        page_num += 1

    # Контакты
    print(f"Generating Page {page_num}: Contacts & Back Cover...")
    pages.append(create_contacts(page_num, total_pages))

    # Сохраняем PDF
    print(f"Saving {len(pages)} pages to PDF: {OUTPUT_PDF}...")
    first_page = pages[0]
    first_page.save(
        OUTPUT_PDF,
        "PDF",
        resolution=150.0,
        save_all=True,
        append_images=pages[1:]
    )

    size_mb = os.path.getsize(OUTPUT_PDF) / 1024 / 1024
    print(f"[OK] Lookbook PDF successfully generated! Size: {size_mb:.2f} MB ({len(pages)} pages)")

if __name__ == '__main__':
    main()

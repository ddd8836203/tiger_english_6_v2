#!/usr/bin/env python3
"""Phase 1 Asset Pipeline: Rotate OD3 107 photos clockwise & extract missing Week 12 PDF pages."""

import glob
import os
import re
import fitz  # PyMuPDF
from PIL import Image

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BOOK_ROOT = os.path.join(BASE_DIR, "六年級上", "課本")

OD3_SRC_DIR = os.path.join(BOOK_ROOT, "Oxford Discover_3_後半段_85 頁後照片")
OD3_OUT_DIR = os.path.join(BOOK_ROOT, "01_Oxford_Discover_3", "images")

PDF_JOBS = [
    {
        "pdf": os.path.join(BOOK_ROOT, "Reading with writing_6_unit 7_10.pdf"),
        "out_dir": os.path.join(BOOK_ROOT, "03_Reading_with_Writing_6", "images"),
        "prefix": "rww6_u710_pdf_p",
        "pad": 2,
        "pages": list(range(15, 29)),  # PDF pages 15..28 (1-indexed)
    },
    {
        "pdf": os.path.join(BOOK_ROOT, "Write right 3_05_08.pdf"),
        "out_dir": os.path.join(BOOK_ROOT, "04_Write_Right_3", "images"),
        "prefix": "wr3_u5_pdf_p",
        "pad": 2,
        "pages": list(range(13, 23)),  # PDF pages 13..22 (1-indexed)
    },
    {
        "pdf": os.path.join(BOOK_ROOT, "discover 6_Read and discover_all about space.pdf"),
        "out_dir": os.path.join(BOOK_ROOT, "05_Read_and_Discover_6_Space", "images"),
        "prefix": "space_pdf_p",
        "pad": 2,
        "pages": list(range(27, 31)),  # PDF pages 27..30 (1-indexed)
    },
    {
        "pdf": os.path.join(BOOK_ROOT, "Oxford Discover Grammar 3.pdf"),
        "out_dir": os.path.join(BOOK_ROOT, "02_Oxford_Discover_Grammar_3", "images"),
        "prefix": "odg3_pdf_p",
        "pad": 3,
        "pages": [73, 74, 75],  # Ensure U16 completion (1-indexed check)
    },
]


def rotate_od3_photos():
    os.makedirs(OD3_OUT_DIR, exist_ok=True)
    src_files = sorted(glob.glob(os.path.join(OD3_SRC_DIR, "IMG_*.JPG")))
    if not src_files:
        raise RuntimeError(f"No IMG_*.JPG files found in {OD3_SRC_DIR}")

    processed = 0
    for src_path in src_files:
        m = re.search(r"IMG_(\d+)\.JPG$", os.path.basename(src_path), re.IGNORECASE)
        if not m:
            continue
        img_num = int(m.group(1))
        page_num = img_num - 4120
        out_name = f"od3_p{page_num:03d}.jpg"
        out_path = os.path.join(OD3_OUT_DIR, out_name)

        with Image.open(src_path) as im:
            # Raw pixels are 90 deg CCW across both exif=1 and exif=6;
            # ROTATE_270 (90 deg CW) produces upright portrait and drops EXIF Orientation=6.
            rgb = im.convert("RGB")
            rotated = rgb.transpose(Image.Transpose.ROTATE_270)
            if rotated.width >= rotated.height:
                raise RuntimeError(f"Unexpected non-portrait dimensions after rotation for {out_name}: {rotated.size}")
            rotated.save(out_path, format="JPEG", quality=85, optimize=True)
            processed += 1

    print(f"[OD3] Rotated and saved {processed} upright photos -> {OD3_OUT_DIR}")


def extract_pdf_pages():
    zoom_matrix = fitz.Matrix(2.2, 2.2)
    for job in PDF_JOBS:
        pdf_path = job["pdf"]
        out_dir = job["out_dir"]
        os.makedirs(out_dir, exist_ok=True)
        doc = fitz.open(pdf_path)
        extracted = 0
        for p_num in job["pages"]:
            if p_num < 1 or p_num > len(doc):
                continue
            out_name = f"{job['prefix']}{p_num:0{job['pad']}d}.png"
            out_path = os.path.join(out_dir, out_name)
            if os.path.exists(out_path) and os.path.getsize(out_path) > 10000:
                continue
            page = doc[p_num - 1]
            pix = page.get_pixmap(matrix=zoom_matrix, alpha=False)
            pix.save(out_path)
            extracted += 1
        doc.close()
        print(f"[PDF] {os.path.basename(pdf_path)}: +{extracted} new PNGs in {out_dir}")


if __name__ == "__main__":
    rotate_od3_photos()
    extract_pdf_pages()
    print("Phase 1 asset pipeline finished.")

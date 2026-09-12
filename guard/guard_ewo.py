#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
guard_ewo.py — Guarda de Ewó (proibição) da marca IntegraSis.

Função: varrer o diretório public/ do site (integrais-site) e FALHAR (exit != 0)
se detectar DOURADO / OURO / AMARELO/ÂMBAR — os tons proibidos pela identidade.

Regras de marca (ver brand-book.md):
  - Ewó: NUNCA usar dourado/ouro/amarelo em qualquer peça.
  - Dois planos de detecção:
      1) TEXTO (semântico): hex dourados/âmbar (ex `#FFD700`, `#F7B500`, `#FFC107`),
         literais (gold, golden, yellow, amber, dourado, ouro) e gradientes âmbar.
      2) PIXELS (rígido): para imagens raster, filtro rígido:
             R > 190  AND  G > 150  AND  B < 90      -> dourado/amarelo puro
         complementado por heurística de tom âmbar/caramelo-alto (dourado "soft"):
             R > 170  AND  G > 120  AND  B < 80  AND  (R - B) > 110
         Qualquer frame que bater = falha.

Uso:
    python3 guard_ewo.py [--public PATH] [--ignore-extension EXT]
    python3 guard_ewo.py --public ~/dev/github/integrasis-site/public
    python3 guard_ewo.py --self-check      # rodar nos próprios fixtures internos

Dependências:
  - Pillow (PIL) para análise de pixels. Se não estiver instalado, o guard AINDA
    detecta por texto (hex/literais/gradientes) e emite FALHA se algo aparecer;
    imagens raster são sinalizadas como "não analisadas (PIL ausente)" e o build
    FALHA se houver imagens sem análise de pixels (fail-closed).
"""
from __future__ import annotations

import argparse
import inspect
import os
import re
import sys
import tempfile
from pathlib import Path

DEFAULT_PUBLIC = "public"
OUTPUT_DIR = Path.home() / ".hermes" / "state" / "integrasis_fleet"

# ---------------------------------------------------------------------------
# 1. TEXTO — hex, literais e gradientes proibidos
# ---------------------------------------------------------------------------

# Amarelos/dourados/âmbar que NUNCA podem aparecer.
# Nota: o site usa sálvia/terracota/creme/marrom; a paleta proibida não consta.
GOLD_HEXES = {
    "#FFD700", "#FFC107", "#FFCC00", "#FFDF00", "#F7B500", "#F7C942",
    "#FDB813", "#F5C542", "#F2C14E", "#E8B922", "#DAA520", "#D4AF37",
    "#E5C100", "#FFC94A", "#F1C40F", "#FFBF00", "#F9A825", "#E8A317",
    "#FBB040", "#F5DEB3", "#FFD966", "#FFE680", "#F7E600", "#F0E68C",
}
GOLD_NAMES = (
    "gold", "golden", "yellow", "amber", "dourado", "ouro", "aurea",
    "goldenrod", "#eab308", "#eab200", "#fbbf24", "#f59e0b", "#fbbd08",
)
# Gradientes com qualquer tom que sugira âmbar/dourado.
GOLD_GRADIENT = re.compile(
    r"linear-gradient|radial-gradient|conic-gradient", re.IGNORECASE
)
# Hex "quentes" genéricos que disparam alarme (âmbares médios).
HOT_HEX_RE = re.compile(r"#[0-9a-fA-F]{6}")

# cores da PALETA OFICIAL (permitidas) — usadas para reduzir falso positivo.
ALLOWED_HEXES = {
    "#7A8B6F",  # sálvia
    "#C67B5C",  # terracota
    "#F5F0E8",  # creme
    "#2E3B2E",  # marrom
    "#5C6B52",  # sálvia profunda
    "#A85F43",  # terracota profunda
    "#E9E2D5",  # creme suave
    "#3A3A38",  # cinza-escuro neutro
    "#6B6B66",  # cinza médio
    "#FFFFFF",  # branco
}


def _hex_is_gold(h: str) -> bool:
    """Return True se o hex (6 dígitos) é dourado/âmbar pelo filtro rígido."""
    h = h.lstrip("#").lower()
    r = int(h[0:2], 16)
    g = int(h[2:4], 16)
    b = int(h[4:6], 16)
    return rgb_is_gold(r, g, b)


def scan_text(path: Path) -> list[str]:
    """Varre arquivos de texto por hex/literais/gradientes dourados."""
    problems: list[str] = []
    try:
        data = path.read_bytes()
        # ignora binários de imagem/svg
        head = data[:512].lower()
        if head.count(b"\x00") > 0:
            return problems
        text = data.decode("utf-8", errors="replace")
    except Exception:
        return problems

    lower = text.lower()
    for kw in GOLD_NAMES:
        if kw in lower:
            problems.append(f"litera '{kw}'")
    # hexes
    for m in HOT_HEX_RE.finditer(text):
        h = m.group(0).upper()
        if h in ALLOWED_HEXES:
            continue
        if h in GOLD_HEXES or _hex_is_gold(h):
            problems.append(f"hex {h}")
    # gradientes
    if GOLD_GRADIENT.search(text):
        # só acusa gradiente se contiver um tom dourado/âmbar
        for m in HOT_HEX_RE.finditer(text):
            if m.group(0).upper() not in ALLOWED_HEXES and _hex_is_gold(m.group(0)):
                problems.append(f"gradiente c/ {m.group(0).upper()}")
                break
    return list(dict.fromkeys(problems))


RENDERABLE_IMAGES = {".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp", ".tiff"}


def rgb_is_gold(r: int, g: int, b: int) -> bool:
    """Filtro rígido de dourado/ouro + heurística de âmbar/caramelo-alto."""
    if r > 190 and g > 150 and b < 90:
        return True
    # âmbar "soft" / dourado dessaturado (pega gradientes F5C542 etc.)
    if r > 170 and g > 120 and b < 80 and (r - b) > 110:
        return True
    return False


def _samples_for(img, count: int):
    w, h = img.size
    # amostragem determinística em grade + amostras extras em bordas/esquinas
    pts = [(w // 2, h // 2)]
    pts += [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]
    steps = max(2, int(count ** 0.5))
    for i in range(steps):
        for j in range(steps):
            pts.append((int(w * (i + 0.5) / steps), int(h * (j + 0.5) / steps)))
    seen = set()
    out = []
    for p in pts:
        if p not in seen:
            seen.add(p)
            out.append(p)
    return out


def scan_image_pixels(path: Path, tolerance: int = 14) -> list[str]:
    """
    Analisa pixels reais da imagem. Retorna lista de descrições de violação.
    tolerance: quantos pixels dourados antes de declarar falha (evita noise/AA).
    """
    try:
        from PIL import Image
    except ImportError:
        return [f"PIL indisponível — imagem sem análise de pixels (fail-closed)"]

    try:
        img = Image.open(path).convert("RGB")
    except Exception as exc:  # noqa: BLE001
        return ["corrompida/ilegível " + str(exc)]

    # Se a imagem tem transparência e é maiormente vazia, amostra só opaco.
    try:
        img_rgba = Image.open(path).convert("RGBA")
        if img_rgba.mode == "RGBA":
            import collections

            pixels_rgba = img_rgba.load()
            w, h = img_rgba.size
            transparent = 0
            total = w * h
            if total > 0:
                # amostra para checar transparência dominante
                for p in _samples_for(img_rgba, 200):
                    px = pixels_rgba[p[1], p[0]] if hasattr(pixels_rgba, "__getitem__") else None
                    if px is not None:
                        try:
                            _, _, _, a = px
                        except TypeError:
                            a = 255
                        if a == 0:
                            transparent += 1
                if transparent >= 180:  # imagem quase toda transparente
                    return []
    except Exception:
        pass

    pixels = img.load()
    w, h = img.size
    if w * h == 0:
        return []
    # amostra densa mas limitada (máx ~120k pontos) p/ não travar no build
    limit = 120_000
    hits = 0
    hits_first: tuple | None = None
    covered = 0
    for p in _samples_for(img, min(limit, w * h // 2)):
        x, y = p
        if x >= w or y >= h:
            continue
        covered += 1
        try:
            r, g, b = pixels[y, x]
        except Exception:
            continue
        if rgb_is_gold(r, g, b):
            hits += 1
            if hits_first is None:
                hits_first = (r, g, b)
            if hits >= tolerance:
                break
    if hits >= tolerance:
        return [
            f"{hits} pixels dourados (ex.: rgb{hits_first}) em {covered} amostras — Ewó violada"
        ]
    return []


# ---------------------------------------------------------------------------
# 2. Varredura do diretório
# ---------------------------------------------------------------------------

TEXT_EXTS = {".html", ".htm", ".css", ".js", ".json", ".svg", ".xml",
             ".txt", ".md", ".yml", ".yaml", ".py", ".webmanifest"}


def run_scan(public_dir: Path, ignore_ext=()) -> tuple[list[str], list[str], list[str]]:
    """Returns (erros_texto, erros_pixels, warnings)."""
    errors_txt: list[str] = []
    errors_px: list[str] = []
    warnings: list[str] = []

    if not public_dir.is_dir():
        errors_txt.append(f"diretorio public/ nao encontrado: {public_dir}")
        return errors_txt, errors_px, warnings

    pil_available = False
    try:
        from PIL import Image  # noqa: F401
        pil_available = True
    except ImportError:
        pil_available = False

    for root, _dirs, files in os.walk(public_dir):
        for name in sorted(files):
            if name.startswith("."):
                continue
            p = Path(root) / name
            ext = p.suffix.lower()
            if ext in ignore_ext:
                continue
            if ext in TEXT_EXTS:
                for prob in scan_text(p):
                    errors_txt.append(f"{p} :: {prob}")
            elif ext in RENDERABLE_IMAGES:
                if not pil_available:
                    # fail-closed: sem PIL, imagem não pode ser audada por pixels
                    errors_px.append(
                        f"{p} :: PIL ausente — imagem não auditada por pixels (fail-closed)"
                    )
                else:
                    for prob in scan_image_pixels(p):
                        errors_px.append(f"{p} :: {prob}")
    if not pil_available:
        warnings.append("Pillow não instalado: pip install pillow para auditoria de pixels.")
    return errors_txt, errors_px, warnings


# ---------------------------------------------------------------------------
# 3. Self-check com fixtures internos (para validar o próprio guard em CI)
# ---------------------------------------------------------------------------

def _make_fixture(base: Path) -> None:
    """Gera fixtures: um png permitido e um png dourado."""
    try:
        from PIL import Image
    except ImportError:
        return
    # creme / sálvia: permitido
    img_ok = Image.new("RGB", (40, 40), (245, 240, 232))  # #F5F0E8
    img_ok.save(base / "permitido_creme.png")
    # dourado rígido: #FFD700
    img_gold = Image.new("RGB", (40, 40), (255, 215, 0))
    img_gold.save(base / "violacao_dourado.png")


def self_check() -> int:
    tmp = Path(tempfile.mkdtemp(prefix="guard_ewo_fixture_"))
    _make_fixture(tmp)
    err_txt, err_px, warn = run_scan(tmp)
    ok = True
    gold_found = False
    for w in warn:
        print("[warn]", w)
    for e in err_txt:
        print("[texto]", e)
    for e in err_px:
        print("[pixels]", e)
    # a violação deve existir
    gold_found = any("violacao_dourado" in e for e in err_px) or any(
        "FFD700" in e for e in err_txt
    )
    permitted_leak = any("permitido_creme" in e for e in err_px + err_txt)
    if permitted_leak:
        print("FALHA: fixture permitido foi falsamente acusado")
        ok = False
    if not gold_found:
        print("FALHA: fixture dourado NÃO foi detectado — guard quebrado")
        ok = False
    print(f"self-check: {'OK' if ok else 'FALHOU'} (dourado detectado={gold_found})")
    return 0 if (ok and gold_found) else 1


# ---------------------------------------------------------------------------

def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description="Guarda de Ewó — proíbe dourado/ouro/amarelo")
    ap.add_argument("--public", default=DEFAULT_PUBLIC, help="diretorio public/ a varrer")
    ap.add_argument("--ignore-extension", action="append", default=[],
                    help="extensão a ignorar (ex: .gif) — repetível")
    ap.add_argument("--self-check", action="store_true",
                    help="valida o próprio guard com fixtures internos")
    args = ap.parse_args(argv)

    if args.self_check:
        return self_check()

    public = Path(args.public).expanduser()
    err_txt, err_px, warn = run_scan(public, set(e.lower() for e in args.ignore_extension))

    for w in warn:
        print("[warn]", w)
    for e in err_txt:
        print(f"[Ewó-Texto] {e}")
    for e in err_px:
        print(f"[Ewó-Pixel] {e}")

    n = len(err_txt) + len(err_px)
    status = "FALHA (Ewó detectada)" if n else "PASSOU (0 dourado)"
    print(f"[guard_ewo] {status} — {n} violação(ões) em {public}")

    report = OUTPUT_DIR / "guard_ewo_report.txt"
    try:
        report.write_text(
            "# Guarda de Ewó — relatório\n"
            + f"status: {('FALHA' if n else 'OK')}\n"
            + f"violacoes: {n}\n"
            + "\ntexto:\n" + "\n".join(err_txt)
            + "\npixels:\n" + "\n".join(err_px) + "\n",
            encoding="utf-8",
        )
        print(f"[guard_ewo] relatório em {report}")
    except Exception:
        pass

    return 1 if n else 0


if __name__ == "__main__":
    sys.exit(main())

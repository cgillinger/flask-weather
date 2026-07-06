#!/usr/bin/env python3
"""
Generera statiska (icke-animerade) varianter av amCharts väder-SVG:er.

amCharts-ikonernas animationer ligger i ett <style>-block inuti varje SVG.
Eftersom ikonerna renderas som <img> är SVG:n ett isolerat dokument som
sidans CSS inte kan nå - "pausade" ikoner kräver därför separata filer.
Detta skript strippar <style>-blocket ur varje ikon och skriver resultatet
till en parallell mapp (amcharts-svg-static/) med samma filstruktur.

Ikonerna fryser i sitt grundläge (attributpositioner), vilket är visuellt
korrekt för hela paketet: droppar/flingor ritas på sina basplatser och
åskikonens blixt har fill="orange" som attribut.

Körs om ikonpaketet uppdateras:
    python3 scripts/generate_static_icons.py

Resultatet checkas in i git - skriptet behöver inte köras vid deploy.
"""

import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
SOURCE_DIR = REPO_ROOT / 'static' / 'assets' / 'icons' / 'amcharts-svg'
TARGET_DIR = REPO_ROOT / 'static' / 'assets' / 'icons' / 'amcharts-svg-static'

# Endast filer som ikonpaketet refererar (se ICON_PACKS i
# static/js/utils/icon-packs.js): day/, night/ samt animated/thunder.svg.
# Övriga filer i animated/ (sprites m.m.) används inte av dashboarden.
SOURCE_GLOBS = ['day/*.svg', 'night/*.svg', 'animated/thunder.svg']

STYLE_BLOCK = re.compile(r'\s*<style[^>]*>.*?</style>', re.DOTALL)


def make_static(svg_text: str) -> str:
    """Ta bort alla <style>-block (där animationerna bor) ur en SVG."""
    return STYLE_BLOCK.sub('', svg_text)


def main() -> int:
    if not SOURCE_DIR.is_dir():
        print(f'FEL: källmappen saknas: {SOURCE_DIR}')
        return 1

    sources = sorted(
        path for pattern in SOURCE_GLOBS for path in SOURCE_DIR.glob(pattern)
    )
    if not sources:
        print(f'FEL: inga SVG-filer hittades under {SOURCE_DIR}')
        return 1

    for source in sources:
        relative = source.relative_to(SOURCE_DIR)
        target = TARGET_DIR / relative
        target.parent.mkdir(parents=True, exist_ok=True)

        svg_text = source.read_text(encoding='utf-8')
        static_text = make_static(svg_text)
        if static_text == svg_text:
            print(f'  (oförändrad - inget <style>-block) {relative}')
        target.write_text(static_text, encoding='utf-8')
        print(f'  {relative}')

    print(f'\n{len(sources)} statiska ikoner skrivna till {TARGET_DIR}')
    return 0


if __name__ == '__main__':
    sys.exit(main())

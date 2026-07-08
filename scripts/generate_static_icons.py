#!/usr/bin/env python3
"""
Generate static (non-animated) variants of amCharts weather SVG icons.

The animations in amCharts icons are located in a <style> block within each SVG.
Since the icons are rendered as <img>, the SVG is an isolated document that
the page's CSS cannot reach - "paused" icons therefore require separate files.
This script strips the <style> block from each icon and writes the result
to a parallel folder (amcharts-svg-static/) with the same file structure.

The icons freeze in their base state (attribute positions), which is visually
correct for the entire package: drops/flakes are drawn at their base positions and
the lightning icon's bolt has fill="orange" as an attribute.

Run when the icon package is updated:
    python3 scripts/generate_static_icons.py

The result is checked in to git - the script does not need to be run at deploy time.
"""

import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
SOURCE_DIR = REPO_ROOT / 'static' / 'assets' / 'icons' / 'amcharts-svg'
TARGET_DIR = REPO_ROOT / 'static' / 'assets' / 'icons' / 'amcharts-svg-static'

# Only files that the icon package references (see ICON_PACKS in
# static/js/utils/icon-packs.js): day/, night/ and animated/thunder.svg.
# Other files in animated/ (sprites etc.) are not used by the dashboard.
SOURCE_GLOBS = ['day/*.svg', 'night/*.svg', 'animated/thunder.svg']

STYLE_BLOCK = re.compile(r'\s*<style[^>]*>.*?</style>', re.DOTALL)


def make_static(svg_text: str) -> str:
    """Remove all <style> blocks (where the animations live) from an SVG."""
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

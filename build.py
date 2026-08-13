#!/usr/bin/env python3
"""
Genera las tres versiones de la landing, una por concepto de logo.

    python3 build.py

Lee index.html (la versión de trabajo, con el panel de previsualización) y
escribe concepto-a.html, concepto-b.html y concepto-c.html: el mismo sitio
con un concepto fijo, sin el panel, y con una barrita para saltar entre los
tres. Esas son las que se le muestran al cliente.

Hay que volver a correrlo cada vez que se toque el contenido de index.html.
"""

import re
import sys
from pathlib import Path

ROOT = Path(__file__).parent

CONCEPTS = [
    ("a", "A", "Monograma",
     "La “A” facetada: sólida, premium y atemporal."),
    ("b", "B", "Orbe",
     "El mundo que orbita: alcance y solidez, con movimiento."),
    ("c", "C", "Ascenso",
     "La vela en impulso: crecimiento, fresca y dinámica."),
]


def chrome(active: str) -> str:
    """Barrita flotante para saltar entre conceptos durante la presentación."""
    ops = []
    for slug, letter, name, _ in CONCEPTS:
        on = " is-on" if letter == active else ""
        ops.append(
            f'    <a class="switch__op{on}" href="concepto-{slug}.html" '
            f'aria-label="Ver concepto {letter} · {name}"'
            f'{" aria-current=\"page\"" if on else ""}>'
            f'<svg viewBox="0 0 120 120" aria-hidden="true"><use href="#mark{letter}"/></svg>'
            f'<b>{letter}</b></a>'
        )
    return (
        '<!-- Barra de presentación · la genera build.py, no editar a mano -->\n'
        '<nav class="switch" aria-label="Cambiar de concepto de marca">\n'
        '    <a class="switch__all" href="comparar.html">Ver los 3</a>\n'
        '    <span class="switch__sep" aria-hidden="true"></span>\n'
        + "\n".join(ops) + "\n"
        '</nav>\n'
    )


def build_one(src: str, slug: str, letter: str, name: str) -> str:
    h = src

    # 1 · Fuera el panel de previsualización: estas páginas van fijas
    h = h.replace(
        '<!-- Panel de previsualización · borrar estas 2 líneas y el bloque #preview al elegir concepto -->\n'
        '<link rel="stylesheet" href="assets/css/preview.css">',
        '<link rel="stylesheet" href="assets/css/compare.css">')
    h = re.sub(r'<!-- ══════════ PANEL DE PREVISUALIZACIÓN.*?</aside>\n\n',
               '', h, flags=re.S)
    h = h.replace('<script src="assets/js/preview.js"></script>\n', '')

    # 2 · El concepto queda fijo en toda la página
    h = h.replace('<use href="#markA"/>', f'<use href="#mark{letter}"/>')
    h = h.replace('href="assets/img/logo-a.svg" type="image/svg+xml" id="favicon"',
                  f'href="assets/img/logo-{slug}.svg" type="image/svg+xml"')
    h = h.replace('<meta property="og:image" content="assets/img/logo-a.svg">',
                  f'<meta property="og:image" content="assets/img/logo-{slug}.svg">')
    h = h.replace('<title>Atlas — Compra ahora, paga después | Crédito instantáneo</title>',
                  f'<title>Atlas · Concepto {letter} — {name}</title>')

    # 3 · Barra para saltar entre los tres
    h = h.replace('</main>', '</main>\n\n' + chrome(letter), 1)

    return h


SOUL = {
    "A": "Una “A” con dos caras de luz y una contraforma que apunta hacia arriba. "
         "Es la más estable y la que mejor envejece: manda en el ícono y no se confunde con nada.",
    "B": "Una esfera con luz real y un satélite que la recorre en bucle. Habla de alcance y "
         "solidez a la vez, y es la que más lee como “casa financiera seria”.",
    "C": "Un ala en impulso, con el degradado encendiéndose hacia la punta. La más fresca y "
         "joven de las tres: movimiento y crecimiento sin perder el aire premium.",
}


def build_compare(src: str) -> str:
    """Portada con los tres conceptos, para abrir delante del cliente."""
    defs = re.search(r'<svg width="0" height="0".*?</defs></svg>', src, re.S).group(0)
    fonts = re.search(r'<link href="https://fonts\.googleapis\.com[^>]*>', src).group(0)

    cards = []
    for slug, letter, name, claim in CONCEPTS:
        cards.append(f'''      <article class="card">
        <div class="card__stage"><svg viewBox="0 0 120 120" aria-hidden="true"><use href="#mark{letter}"/></svg></div>
        <div class="card__body">
          <p class="card__tag">Concepto {letter}</p>
          <h2>{name}</h2>
          <p>{SOUL[letter]}</p>

          <div class="card__specs">
            <div class="spec">
              <span class="appicon"><svg viewBox="0 0 120 120" aria-hidden="true"><use href="#mark{letter}"/></svg></span>
              <span class="spec__lbl">Ícono</span>
            </div>
            <div class="spec">
              <span class="favs">
                <span><svg viewBox="0 0 120 120" aria-hidden="true"><use href="#mark{letter}"/></svg></span>
                <span><svg viewBox="0 0 120 120" aria-hidden="true"><use href="#mark{letter}"/></svg></span>
              </span>
              <span class="spec__lbl">Favicon</span>
            </div>
            <div class="spec">
              <span class="lockup"><svg viewBox="0 0 120 120" aria-hidden="true"><use href="#mark{letter}"/></svg><b>ATLAS</b></span>
              <span class="spec__lbl">Lockup</span>
            </div>
          </div>

          <a class="card__go" href="concepto-{slug}.html">
            <span>Ver la landing completa</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          </a>
        </div>
      </article>''')

    return f'''<!DOCTYPE html>
<html lang="es-VE">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#061426">
<title>Atlas · Los 3 conceptos de marca</title>
<meta name="description" content="Las tres rutas de identidad de Atlas, cada una aplicada a la landing completa.">
<link rel="icon" href="assets/img/logo-a.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
{fonts}
<link rel="stylesheet" href="assets/css/style.css">
<link rel="stylesheet" href="assets/css/compare.css">
</head>
<body>

<div class="aurora" aria-hidden="true">
  <span class="aurora__blob aurora__blob--1"></span>
  <span class="aurora__blob aurora__blob--2"></span>
  <span class="aurora__blob aurora__blob--3"></span>
</div>
<div class="noise" aria-hidden="true"></div>

{defs}

<main class="cmp">
  <div class="wrap">
    <header class="cmp__head">
      <span class="cmp__brand"><svg viewBox="0 0 120 120" aria-hidden="true"><use href="#markA"/></svg>Atlas</span>
      <h1>Tres rutas para la marca,<br>la misma landing</h1>
      <p>Cada concepto está aplicado al sitio completo, con la paleta Azul → Teal.
         Ábrelos y compáralos: dentro de cada uno puedes saltar a los otros dos.</p>
    </header>

    <div class="cmp__grid">
{chr(10).join(cards)}
    </div>

    <p class="cmp__note">
      Los tres usan la misma paleta y tipografía. Lo único que cambia es el símbolo, así que
      la decisión es <b>solo de concepto</b>. Textos, cifras y testimonios del sitio todavía
      son de ejemplo.
    </p>
  </div>
</main>

</body>
</html>
'''


def main() -> int:
    src_path = ROOT / "index.html"
    if not src_path.exists():
        print("No encuentro index.html", file=sys.stderr)
        return 1

    src = src_path.read_text(encoding="utf-8")

    for slug, letter, name, _ in CONCEPTS:
        out = ROOT / f"concepto-{slug}.html"
        out.write_text(build_one(src, slug, letter, name), encoding="utf-8")
        print(f"  concepto-{slug}.html  ·  {letter} — {name}")

    (ROOT / "comparar.html").write_text(build_compare(src), encoding="utf-8")
    print("  comparar.html         ·  portada con los tres")

    print("\nListo. Abre comparar.html para presentar los tres.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

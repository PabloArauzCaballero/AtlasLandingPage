#!/usr/bin/env python3
"""
Guardia de promesas: la landing no afirma lo que Atlas no hace.

    python3 check.py              # revisa las páginas publicadas y sus scripts
    python3 check.py archivo ...  # revisa sólo esos archivos (para probarla en negativo)

Sin dependencias. Sale con código 1 y dice archivo, línea, frase y MOTIVO si encuentra:

- un enlace muerto (`href="#"`), porque un botón que no lleva a ninguna parte promete algo
  que no existe (tiendas, redes, legales, recuperar clave);
- una frase de la lista prohibida: cada una salió de la auditoría del 2026-09-29 (informe 06,
  §A) y contradice el producto real (tasa por solicitud, cuotas mensuales, inicial 60 %, sin
  niveles, sin preaprobación, sin avisos de vencimiento, sin compra online...).

Si una frase vuelve a ser verdad, se quita de la lista CON el cambio de producto que la
respalda, no para que pase la comprobación.

Los comentarios HTML y JS no se revisan: ahí se puede explicar por qué algo se quitó.
"""

import re
import sys
from pathlib import Path

ROOT = Path(__file__).parent

# Lo que se publica: las páginas y los scripts que escriben texto en pantalla.
DEFAULT_FILES = [
    "index.html", "login.html", "registro.html", "comparar.html",
    "concepto-a.html", "concepto-b.html", "concepto-c.html",
    "assets/js/main.js", "assets/js/auth.js",
]

# (expresión, motivo). Se buscan sin distinguir mayúsculas, sobre el texto sin comentarios y con
# las etiquetas HTML quitadas (así «<b>0%</b><span>interés</span>» también cuenta).
FORBIDDEN = [
    (r"0\s*%\s*(de\s+)?inter[eé]s", "Atlas cobra interés: el Motor asigna la tasa por solicitud y Core responde 422 si no hay tasa (nunca 0 %)."),
    (r"sin\s+inter[eé]s", "Atlas cobra interés: la tasa la asigna el Motor por solicitud."),
    (r"quincenal", "El cronograma real es mensual (loan-schedule.ts, addMonthsClamped)."),
    (r"\b(15|30|45)\s+d[ií]as\b", "Plazos quincenales inventados: las cuotas son mensuales."),
    (r"\bnivel(es)?\s+(\d|atlas)|\bsub(e|es|ir|iste)\s+de\s+nivel|\bN[1-4]\b", "No existen niveles N1–N4: hay bandas de puntaje internas y la inicial es 60 % fija."),
    (r"\b(50|40|30)\s*%\s*(de\s+)?inicial", "La inicial es 60 % fija (assertPurchaseSplit); no hay iniciales de 50/40/30 %."),
    (r"Bs\s*(400|1\.750|4\.200)\b", "Cupos por nivel inventados: el cupo sale de la evaluación de cada solicitud."),
    (r"en\s+segundos|al\s+instante|menos\s+de\s+(1|un)\s+minuto|\b42\s*s(egundos)?\b|\b60\s*s\b", "Tiempos de aprobación sin métrica: el flujo exige revisión y aceptación del comercio."),
    (r"\b2\s*min(utos)?\b", "El alta pide contacto, documentos, datos, domicilio, perfil financiero y permisos: no son 2 minutos."),
    (r"sin\s+papeleo|s[oó]lo\s+(tu\s+)?c[eé]dula\s+y\s+(un\s+)?selfie", "El alta pide mucho más que cédula y selfie (y la selfie es en tres poses)."),
    (r"sin\s+comprobante\s+de\s+ingresos", "El alta pide perfil financiero y extracto bancario."),
    (r"compra(s|r)?\s+online|tiendas?\s+online|link\s+de\s+pago|e-?commerce", "No existe compra online, link de pago ni API de e-commerce."),
    (r"tarjeta\s+de\s+d[eé]bito|\btransferencia\b", "Cada cuota se paga al QR bancario del comercio y se sube el comprobante; no hay tarjeta."),
    (r"500\s*\+|\+\s*500|cientos\s+de\s+(tiendas|comercios)|nueve\s+departamentos", "Cifras de red no verificables."),
    (r"indicados\s+en\s+tu\s+contrato|cargos\s+por\s+mora", "No hay contrato de crédito en el código ni cálculo de mora (late_fee_amount nunca se calcula)."),
    (r"cupo\s+(ya\s+)?(reservado|aprobado)|reserva(r)?\s+(tu\s+)?cupo", "No hay preaprobación ni reserva de cupo."),
    (r"te\s+avisamos\s+antes|mover\s+una\s+fecha|recordatorios", "No hay emisor de avisos de vencimiento ni endpoint para mover fechas."),
    (r"cero\s+riesgo|100\s*%\s*de\s+la\s+venta|cobra\s+completo", "Atlas cobra al comercio una comisión (MDR) y la cobertura pasa por dos firmas y revisión manual."),
    (r"no\s+un\s+robot|personas\s+reales|con\s+humanos", "Existe un asistente de IA: no se puede prometer que siempre contesta una persona."),
    (r"Bs\s*0(?![\d.,])|costo\s+de\s+apertura", "Costo de apertura sin respaldo."),
    (r"cuenta\s+creada|te\s+enviamos\s+un\s+c[oó]digo|te\s+escribi(re)?mos|entrando\s+a\s+tu\s+cuenta|anotad[oa]", "Confirma algo que no ocurre: no hay backend."),
    (r'data-count="\d+"\s+data-suffix="(s|\+)"', "Contador animado de segundos o de «N+» comercios: cifras sin métrica."),
    (r'data-count="0"\s+data-suffix="%"', "Contador animado de «0 %» de interés: Atlas cobra interés."),
    (r"preventa", "No hay preventa abierta: nada se vende ni se reserva antes del lanzamiento."),
    (r"lo\s+que\s+dicen\s+quienes|ya\s+usan\s+atlas", "Testimonios de un producto sin lanzar."),
]

DEAD_LINK = re.compile(r'href\s*=\s*"#"')


def strip_comments(text: str, path: str) -> str:
    """Quita comentarios conservando los saltos de línea (para que las líneas cuadren)."""
    keep_lines = lambda m: "\n" * m.group(0).count("\n")
    if path.endswith(".html"):
        return re.sub(r"<!--.*?-->", keep_lines, text, flags=re.S)
    text = re.sub(r"/\*.*?\*/", keep_lines, text, flags=re.S)
    return re.sub(r"(^|\s)//[^\n]*", lambda m: m.group(1), text)


def visible(line: str) -> str:
    """Texto de la línea sin etiquetas, para que un marcado partido no esconda la frase."""
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", line))


def check(path: Path) -> list[str]:
    raw = path.read_text(encoding="utf-8")
    text = strip_comments(raw, str(path))
    problems = []
    for n, line in enumerate(text.splitlines(), 1):
        if DEAD_LINK.search(line):
            problems.append(f"{path}:{n}: enlace muerto href=\"#\" → quítalo o márcalo como no disponible.")
        for hay in (line, visible(line)):
            hit = None
            for pattern, why in FORBIDDEN:
                m = re.search(pattern, hay, flags=re.I)
                if m:
                    hit = f"{path}:{n}: «{m.group(0)}» → {why}"
                    break
            if hit:
                problems.append(hit)
                break
    return problems


def main(argv: list[str]) -> int:
    files = [Path(a) for a in argv] if argv else [ROOT / f for f in DEFAULT_FILES]
    missing = [f for f in files if not f.exists()]
    if missing:
        print("No encuentro: " + ", ".join(map(str, missing)), file=sys.stderr)
        return 2
    problems = [p for f in files for p in check(f)]
    for p in problems:
        print(p)
    if problems:
        print(f"\n{len(problems)} promesa(s) sin respaldo. Ver README, «Lo que se retiró y por qué».")
        return 1
    print(f"OK · {len(files)} archivos sin enlaces muertos ni promesas de la lista.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))

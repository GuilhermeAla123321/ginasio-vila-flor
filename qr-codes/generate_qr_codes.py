#!/usr/bin/env python3
"""Regenera os QR Codes estáticos para os equipamentos do ginásio."""
from pathlib import Path
import json
import qrcode
from qrcode.constants import ERROR_CORRECT_M

BASE_URL = "https://ginasio-vila-flor.vercel.app/"
EQUIPAMENTOS = [
    ("passadeira", "Passadeira"), ("bicicleta", "Bicicleta"), ("eliptica", "Elíptica"),
    ("maquina-de-remo", "Máquina de Remo"), ("smith-machine", "Smith Machine"),
    ("banco-de-peso", "Banco de Peso"), ("polia-multifuncional", "Polia Multifuncional"),
    ("maquina-abdutora", "Máquina Abdutora"), ("prensa-de-ombros", "Prensa de Ombros"),
    ("peck-deck", "Peck Deck"), ("peso-livre", "Peso Livre"), ("leg-press", "Leg Press"),
    ("cadeira-extensora", "Cadeira Extensora"), ("mesa-flexora", "Mesa Flexora")
]
DESTINO = Path(__file__).resolve().parent
manifesto = []
for slug, nome in EQUIPAMENTOS:
    url = f"{BASE_URL}?equipamento={slug}"
    qr = qrcode.QRCode(error_correction=ERROR_CORRECT_M, box_size=14, border=4)
    qr.add_data(url); qr.make(fit=True)
    qr.make_image(fill_color="#17141b", back_color="white").convert("RGB").save(DESTINO / f"{slug}.png", optimize=True)
    manifesto.append({"slug": slug, "label": nome, "url": url, "file": f"{slug}.png"})
(DESTINO / "manifest.json").write_text(json.dumps({"baseUrl": BASE_URL, "equipments": manifesto}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"Gerados {len(manifesto)} QR Codes em {DESTINO}")

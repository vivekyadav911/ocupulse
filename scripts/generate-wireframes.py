#!/usr/bin/env python3
"""Generate 1080px-wide placeholder wireframe PNGs for docs/sprint-2/wireframes/."""

from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    raise SystemExit("Install Pillow: pip install pillow")

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "sprint-2" / "wireframes"
W, H = 1080, 1920

SCREENS = [
    ("login.png", "Login / Quick join", "app/(auth)/login.tsx"),
    ("register.png", "Teacher register", "app/(auth)/register.tsx"),
    ("onboarding.png", "Onboarding", "app/(auth)/onboarding.tsx"),
    ("home.png", "Home dashboard", "app/(tabs)/index.tsx"),
    ("parachute.png", "Parachute Drop", "app/activity/parachute.tsx"),
    ("sound.png", "Sound Pollution Hunter", "app/activity/sound.tsx"),
    ("handfan.png", "Hand Fan", "app/activity/handfan.tsx"),
    ("earthquake.png", "Earthquake Structure", "app/activity/earthquake.tsx"),
    ("humanperf.png", "Human Performance Lab", "app/activity/humanperf.tsx"),
    ("reaction.png", "Reaction Board", "app/activity/reaction.tsx"),
    ("breathing.png", "Breathing Pace Trainer", "app/activity/breathing.tsx"),
    ("results.png", "Session results", "app/results/[sessionId].tsx"),
    ("leaderboard.png", "Leaderboard", "app/(tabs)/leaderboard.tsx"),
    ("settings.png", "Settings", "app/(tabs)/settings.tsx"),
    ("sound-map.png", "Sound samples map", "app/results/sound-map.tsx"),
]

NAVY = (11, 31, 58)
ACCENT = (255, 180, 0)
BG = (244, 246, 250)
SURFACE = (255, 255, 255)
MUTED = (107, 122, 144)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    try:
        title_font = ImageFont.truetype("arial.ttf", 52)
        body_font = ImageFont.truetype("arial.ttf", 32)
        small_font = ImageFont.truetype("arial.ttf", 26)
    except OSError:
        title_font = ImageFont.load_default()
        body_font = title_font
        small_font = title_font

    for filename, title, route in SCREENS:
        img = Image.new("RGB", (W, H), BG)
        draw = ImageDraw.Draw(img)
        draw.rectangle([0, 0, W, 120], fill=NAVY)
        draw.rectangle([48, 160, W - 48, 420], fill=SURFACE, outline=NAVY, width=3)
        draw.rectangle([48, 480, W - 48, 900], fill=SURFACE, outline=MUTED, width=2)
        draw.rectangle([48, 960, W - 48, 1100], fill=ACCENT, outline=NAVY, width=0)
        draw.rectangle([48, 1160, W - 48, 1700], fill=SURFACE, outline=MUTED, width=2)

        draw.text((60, 36), "STEMM Lab — Wireframe", fill=(255, 255, 255), font=body_font)
        draw.text((72, 200), title, fill=NAVY, font=title_font)
        draw.text((72, 300), route, fill=MUTED, font=small_font)
        draw.text((72, 520), "Primary content / sensors", fill=MUTED, font=body_font)
        draw.text((72, 1000), "Primary action", fill=NAVY, font=body_font)
        draw.text((72, 1200), "Secondary metrics / list", fill=MUTED, font=body_font)
        draw.text((72, 1780), f"{W}×{H} placeholder (A1)", fill=MUTED, font=small_font)

        out_path = OUT / filename
        img.save(out_path, "PNG")
        assert img.size[0] >= 1080, filename
        print("wrote", out_path)


if __name__ == "__main__":
    main()

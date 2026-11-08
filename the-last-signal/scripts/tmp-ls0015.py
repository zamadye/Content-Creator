#!/usr/bin/env python3
"""Susun ulang LS-0015: klimaks di depan -> potong di titik pertanyaan -> cerita."""
import json, pathlib

SLATE = pathlib.Path("stories/slate.json")
data = json.loads(SLATE.read_text(encoding="utf-8"))

LIGHT_A = "harsh_basement_fluorescent_4300k"
LIGHT_CCTV = "monochrome_cctv_6700k"
LIGHT_POST = "warm_post_lamp_3000k"

scenes = [
    dict(
        narration="Pukul empat pagi, mobil saya keluar dari basement. Tidak ada saya di dalamnya.",
        imagePrompt="cinematic 9:16 vertical film still, grainy black-and-white parking garage security camera footage, a person with long dark hair in a heavy jacket stepping out of an old hatchback, seen from behind and three-quarters, face turned away from camera, the figure fills the left two thirds of frame beside the open car door, harsh ceiling light blowing out highlights, concrete pillar and empty basement bays behind, heavy grain, high contrast, documentary CCTV realism, no timestamp, no numbers, no letters, no burned-in text anywhere, no watermark",
        camera="static", shot="medium", lighting=LIGHT_CCTV, intensity=0.6,
        effects=["film_grain", "scanlines", "vignette", "camera_shake"],
    ),
    dict(
        narration="Pengemudinya bukan saya. Rambutnya panjang.",
        imagePrompt="cinematic 9:16 vertical film still, grainy black-and-white security camera view of a dim basement ramp, a single old hatchback descending with headlights cutting through dust, empty parking bays on both sides, heavy grain, high contrast, documentary CCTV realism, no timestamp, no numbers, no burned-in text, no watermark, no visible face",
        camera="push_in", shot="wide", lighting=LIGHT_CCTV, intensity=0.55,
        effects=["film_grain", "scanlines", "vignette"],
    ),
    dict(
        narration="Saya baru sampai jam tujuh. Jadi siapa yang masuk jam empat?",
        imagePrompt="cinematic 9:16 vertical film still, extreme close-up of a hand holding a printed parking ticket inside a dim concrete basement, ticket damp and slightly crumpled, a single long strand of hair caught on its edge, harsh fluorescent light from above, faded parking lines and a concrete pillar behind, muted greenish palette, 35mm grain, documentary realism, printed digits blurred and unreadable, no readable text, no watermark, no face",
        camera="handheld", shot="closeup", lighting=LIGHT_A, intensity=0.5,
        effects=["film_grain", "vignette", "focus_rack"],
    ),
    dict(
        narration="Karcis parkir saya selalu tercetak satu jam lebih awal.",
        imagePrompt="cinematic 9:16 vertical film still, a worn leather wallet open on a car dashboard holding a damp parking ticket, a long dark strand of hair lying across the paper, dim basement light through the windshield, shallow depth of field, muted greenish palette, 35mm grain, documentary realism, digits blurred, no readable text, no watermark, no people",
        camera="push_in", shot="closeup", lighting=LIGHT_A, intensity=0.5,
        effects=["film_grain", "vignette", "focus_rack"],
    ),
    dict(
        narration="Kursi kemudi selalu mundur. Punggungnya lebih tinggi dari saya.",
        imagePrompt="cinematic 9:16 vertical film still, interior of an old Indonesian hatchback seen from the open driver door, driver seat pushed far back, worn seat cover, steering wheel with a beaded cover, dim basement light through the windshield, dust in the air, muted palette, 35mm grain, documentary realism, no faces, no text, no watermark",
        camera="handheld", shot="medium", lighting=LIGHT_A, intensity=0.45,
        effects=["film_grain", "vignette"],
    ),
    dict(
        narration="Saya kira mesinnya rusak. Satpam bilang mesinnya baru diganti bulan lalu.",
        imagePrompt="cinematic 9:16 vertical film still, an old parking ticket machine mounted on a concrete wall in a basement, freshly installed metal casing, faint receipt sticking out, dim fluorescent light, puddle reflection on the floor, muted palette, 35mm grain, documentary realism, screen and digits blurred, no readable text, no watermark, no people",
        camera="static", shot="medium", lighting=LIGHT_A, intensity=0.45,
        effects=["film_grain", "vignette", "camera_shake"],
    ),
    dict(
        narration="Bensin berkurang tiap Jumat. Ada rambut di sandaran kepala.",
        imagePrompt="cinematic 9:16 vertical extreme close-up film still, a long dark strand of hair caught on the fabric of a car headrest, shallow depth of field, dust and worn upholstery, dim basement light from the side, muted greenish palette, 35mm grain, documentary realism, no text, no watermark, no people",
        camera="push_in", shot="closeup", lighting=LIGHT_A, intensity=0.5,
        effects=["film_grain", "vignette", "focus_rack"],
    ),
    dict(
        narration="Saya minta rekaman basement. Petugasnya butuh dua hari.",
        imagePrompt="cinematic 9:16 vertical film still, a security post window at night seen from outside, a small CRT monitor glowing inside with grey static, desk cluttered with logbooks, warm desk lamp against cold corridor light, muted palette, 35mm grain, documentary realism, screen blurred, no readable text, no watermark, faces not visible",
        camera="drift", shot="medium", lighting=LIGHT_POST, intensity=0.45,
        effects=["film_grain", "vignette", "scanlines"],
    ),
    dict(
        narration="Satpam menyebut nama saya dengan santai. Katanya, pria itu berambut panjang.",
        imagePrompt="cinematic 9:16 vertical film still, an old security guard's hands holding a clipboard with a worn RFID parking card clipped to it, dim post window light, uniform sleeve, shallow depth of field, muted palette, 35mm grain, documentary realism, card photo and text blurred, no readable text, no watermark, no visible face",
        camera="push_in", shot="closeup", lighting=LIGHT_POST, intensity=0.5,
        effects=["film_grain", "vignette"],
    ),
    dict(
        narration="Rambut saya pendek. Kamu akan naik ke mobil itu? Tulis di komentar.",
        imagePrompt="cinematic 9:16 vertical film still, grainy black-and-white parking garage security camera footage, a person with long dark hair in a heavy jacket stepping out of an old hatchback, seen from behind and three-quarters, face turned away from camera, the figure fills the left two thirds of frame beside the open car door, harsh ceiling light blowing out highlights, concrete pillar and empty basement bays behind, heavy grain, high contrast, documentary CCTV realism, no timestamp, no numbers, no letters, no burned-in text anywhere, no watermark",
        camera="static", shot="medium", lighting=LIGHT_CCTV, intensity=0.6,
        effects=["film_grain", "scanlines", "vignette", "light_flicker"],
    ),
]

entry = {
    "episodeId": "LS-0015",
    "format": "short_9x16",
    "status": "naskah — versi 2 (klimaks di depan)",
    "judul": "Pukul Empat Pagi, Mobil Saya Keluar",
    "subgenre": "Institutional horror",
    "experiment": "Uji format 8 Nov: klimaks dibuka di 2 detik pertama (verbal + entitas visual di frame pertama), potong di titik pertanyaan (detik ~10), baru cerita berjalan dari awal; frame terakhir = frame pertama (loop).",
    "structure": "klimaks 04.00 + entitas → pengemudi bukan saya → POTONG: 'jadi siapa?' → karcis → kursi → mesin → bensin & rambut → minta rekaman → satpam sebut nama → rambut saya pendek (loop ke frame 1) + CTA",
    "story": {
        "title": "Pukul Empat Pagi, Mobil Saya Keluar",
        "hook": "Pukul empat pagi mobil saya keluar dari basement, dan tidak ada saya di dalamnya",
        "premise": "Rekaman kamera basement memperlihatkan mobil narator keluar pukul empat pagi dengan pengemudi berambut panjang; sepanjang sebulan sebelumnya karcis parkirnya tercetak satu jam lebih awal, kursi kemudi mundur, dan bensin berkurang.",
        "twist": "Mobil itu dipakai orang lain setiap pagi memakai identitas narator — satpam mengenali narator sebagai pria berambut panjang, padahal rambut narator pendek.",
        "ending": "Narator menyebut rambutnya pendek, lalu menanyakan ke penonton apakah ia akan naik ke mobil itu pada pagi berikutnya.",
    },
    "scenes": scenes,
    "cards": ["EMPAT PAGI, BUKAN SAYA", "JADI SIAPA YANG MASUK?", "NAIK ATAU TIDAK"],
    "thumb": {
        "headline": "MOBIL SAYA JALAN PUKUL EMPAT PAGI",
        "kicker": "pengemudinya bukan saya",
    },
    "cta": {"card": "Kamu akan naik ke mobil itu?", "holdFrames": 84},
    "youtube": {
        "title": "Pukul Empat Pagi, Mobil Saya Keluar Sendiri",
        "description": "Rekaman kamera basement menunjukkan mobil saya keluar pukul empat pagi. Saya baru sampai jam tujuh.\n\nSebelum itu, karcis parkir saya selalu tercetak satu jam lebih awal. Kursi kemudi selalu mundur, sejauh punggung yang lebih tinggi dari saya. Bensin berkurang tiap Jumat, dan ada rambut panjang di sandaran kepala, padahal rambut saya pendek.\n\nSaya kira mesin karcisnya rusak. Satpam bilang mesinnya baru diganti bulan lalu.",
        "tags": ["cerita horor", "horor indonesia", "karcis parkir", "cerita seram", "rekaman cctv"],
        "pinComment": "Kalau rekaman itu memperlihatkan mobilmu sendiri, kamu masih akan naik?",
    },
    "catatan": "Format 8 Nov: klimaks (rekaman 04.00) di depan sebagai entitas visual frame pertama, potong di titik pertanyaan detik ~10, lalu cerita dari awal; penutup mengulang arti frame pertama.",
}

eps = data["episodes"]
for i, e in enumerate(eps):
    if e.get("episodeId") == "LS-0015":
        eps[i] = entry
        break
else:
    eps.append(entry)

SLATE.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
print("slate diperbarui:", len(entry["scenes"]), "scene,", sum(len(s["narration"].split()) for s in scenes), "kata")

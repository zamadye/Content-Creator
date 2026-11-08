#!/usr/bin/env python3
"""Tambah LS-0016 & LS-0017 ke stories/slate.json dengan hukum baru 8 Nov:
klimaks di depan, 3 petunjuk (visual/audio/teks), 3 loop, 2 reda, uji dua bacaan.
"""
import json, pathlib

SLATE = pathlib.Path("stories/slate.json")
data = json.loads(SLATE.read_text(encoding="utf-8"))

A = "harsh_basement_fluorescent_4300k"
CLINIC = "clinical_fluorescent_5000k"
NIGHT = "warm_corridor_2800k"


def sc(narration, prompt, camera, shot, lighting, intensity, effects, sfx=None, amb=None):
    scene = {
        "narration": narration,
        "imagePrompt": prompt,
        "camera": camera,
        "shot": shot,
        "lighting": lighting,
        "intensity": intensity,
        "effects": effects,
    }
    if sfx:
        scene["sfx"] = sfx
    if amb is not None:
        scene["ambienceVolume"] = amb
    return scene


ls16 = {
    "episodeId": "LS-0016",
    "format": "short_9x16",
    "status": "naskah — lolos Gerbang A (14/16)",
    "judul": "Nomor Itu Dipanggil Dua Kali",
    "subgenre": "Institutional horror",
    "experiment": "Paket 1 hukum 8 Nov: 3 petunjuk (visual/audio/teks), 3 loop, 2 reda, uji dua bacaan. Klimaks di depan, potong di detik ~10.",
    "structure": "klimaks panggilan kedua dari dalam → POTONG 'siapa yang masuk?' → klinik kecil → perawat memanggil → kursi masih hangat → layar dua baris → minta rekaman → twist: yang dipanggil nama saya → CTA",
    "story": {
        "title": "Nomor Itu Dipanggil Dua Kali",
        "hook": "Nomor empat belas dipanggil dua kali, yang kedua dari dalam ruang periksa",
        "premise": "Di klinik mata kecil, nomor antrean narator dipanggil dua kali; kursi yang ia tinggalkan masih hangat dan layar antrean menampilkan nomor itu dua baris.",
        "twist": "Panggilan kedua bukan nomor antrean melainkan nama narator, padahal pendaftaran hanya memuat satu nama itu.",
        "ending": "Narator menyebut nama itu cuma satu, lalu bertanya apakah penonton tetap akan masuk kalau dipanggil kedua kali.",
    },
    "scenes": [
        sc(
            "Empat belas dipanggil dua kali. Yang kedua dari dalam ruang periksa.",
            "cinematic 9:16 vertical film still, dim small clinic waiting room, a glowing queue display panel on the wall with blurred red digits arranged in two lines, six empty plastic chairs, one chair with a folded jacket, harsh overhead fluorescent, muted green-grey palette, 35mm grain, documentary realism, all text blurred and unreadable, no readable text, no watermark, no face",
            "static", "medium", CLINIC, 0.55,
            ["film_grain", "vignette", "light_flicker"],
            sfx=[{"asset": "heartbeat.mp3", "at": 0.05, "volume": 0.25}],
        ),
        sc(
            "Saya masih di kursi tunggu, nomor itu di tangan saya.",
            "cinematic 9:16 vertical extreme close-up, a hand holding a small paper queue ticket in a clinic waiting room, blurred chairs behind, cold fluorescent light, muted palette, 35mm grain, documentary realism, digits blurred and unreadable, no readable text, no watermark",
            "push_in", "closeup", CLINIC, 0.5,
            ["film_grain", "vignette", "focus_rack"],
        ),
        sc(
            "Kalau saya di sini, siapa yang dipanggil masuk?",
            "cinematic 9:16 vertical film still, an empty plastic waiting chair with a slight impression on the seat cushion, shallow depth of field, cold fluorescent light from above, muted palette, 35mm grain, documentary realism, no people, no text, no watermark",
            "handheld", "closeup", CLINIC, 0.5,
            ["film_grain", "vignette"],
        ),
        sc(
            "Kliniknya kecil. Enam kursi, satu perawat.",
            "cinematic 9:16 vertical film still, a narrow eye clinic corridor with six waiting chairs in a row and a small nurse station, notice board with blurred papers, cold fluorescent light, muted palette, 35mm grain, documentary realism, no readable text, no watermark, no face",
            "drift", "wide", CLINIC, 0.45,
            ["film_grain", "vignette", "light_flicker"],
            # petunjuk audio #1: bisikan di bawah narasi
            sfx=[{"asset": "whisper.mp3", "at": 0.35, "volume": 0.28}],
        ),
        sc(
            "Perawat memanggil empat belas. Saya berdiri, lalu masuk.",
            "cinematic 9:16 vertical film still, a nurse in white seen from behind standing at a half-open examination room door, silhouette against cold room light, waiting chairs foreground out of focus, muted palette, 35mm grain, documentary realism, face not visible, no readable text, no watermark",
            "push_in", "medium", CLINIC, 0.5,
            ["film_grain", "vignette"],
        ),
        sc(
            "Kursi yang saya tinggalkan masih hangat, padahal saya baru berdiri.",
            "cinematic 9:16 vertical extreme close-up, an empty waiting chair seat seen from standing height, fabric still creased, a small damp patch of warmth implied, cold light, muted palette, 35mm grain, documentary realism, no people, no text, no watermark",
            "handheld", "closeup", CLINIC, 0.55,
            ["film_grain", "vignette", "focus_rack"],
        ),
        sc(
            "Layar antrean menampilkan empat belas dua kali. Dua baris.",
            "cinematic 9:16 vertical film still, close view of a clinic queue display panel, two rows of blurred glowing digits, one mirroring the other, cables and wall bracket visible, dim corridor around it, muted palette, 35mm grain, documentary realism, no readable text, no watermark",
            "push_in", "closeup", CLINIC, 0.6,
            ["film_grain", "vignette", "scanlines"],
            amb=0.12,  # reda #1
        ),
        sc(
            "Saya minta rekaman ruang tunggu. Kameranya katanya rusak.",
            "cinematic 9:16 vertical film still, a small security post window at the back of a clinic, a dark CCTV monitor inside, desk lamp, cold corridor light outside, muted palette, 35mm grain, documentary realism, screen blurred, no readable text, no watermark, no visible face",
            "static", "medium", A, 0.45,
            ["film_grain", "vignette", "scanlines"],
            amb=0.16,  # reda #2
        ),
        sc(
            "Rekaman suara perawat masih ada. Yang dipanggil bukan nomor. Nama saya.",
            "cinematic 9:16 vertical extreme close-up, a smartphone on a desk playing an audio recording, waveform visible but no text, cold light from the screen, muted palette, 35mm grain, documentary realism, no readable text, no watermark, no hands visible",
            "push_in", "closeup", A, 0.5,
            ["film_grain", "vignette", "scanlines"],
        ),
        sc(
            "Pendaftaran cuma satu nama. Kamu masih akan masuk kalau dipanggil kedua kali? Tulis di komentar.",
            "cinematic 9:16 vertical film still, dim small clinic waiting room, a glowing queue display panel on the wall with blurred red digits arranged in two lines, six empty plastic chairs, the folded jacket now gone from the chair, harsh overhead fluorescent, muted green-grey palette, 35mm grain, documentary realism, all text blurred and unreadable, no readable text, no watermark, no face",
            "static", "medium", CLINIC, 0.55,
            ["film_grain", "vignette", "light_flicker"],
        ),
    ],
    "clues": [
        {"type": "visual", "at": "0.0s", "paidAt": "~41s", "isi": "layar antrean di frame pertama sudah menampilkan angka yang sama dua baris"},
        {"type": "audio", "at": "~14s", "paidAt": "~41s", "isi": "bisikan 4,2 s di bawah narasi beat 4, volume 0,28"},
        {"type": "teks", "at": "komentar sematan", "paidAt": "-", "isi": "sebut dua baris dengan jam yang berbeda"},
    ],
    "cards": ["DUA KALI DIPANGGIL", "SIAPA YANG MASUK?", "MASIH MAU MASUK?"],
    "thumb": {"headline": "NOMOR ITU DIPANGGIL DUA KALI", "kicker": "yang kedua dari dalam ruang periksa"},
    "cta": {"card": "Kamu masih akan masuk?", "holdFrames": 84},
    "youtube": {
        "title": "Nomor Itu Dipanggil Dua Kali, Panggilan Kedua dari Dalam",
        "description": "Nomor empat belas dipanggil dua kali, dan panggilan keduanya datang dari dalam ruang periksa.\n\nKlinik matanya kecil: enam kursi, satu perawat, satu dokter. Saya mengambil nomor, duduk paling dekat pintu, lalu dipanggil. Waktu saya kembali ke kursi itu, permukaannya masih hangat, padahal saya baru berdiri.\n\nLayar antrean menampilkan nomor yang sama dua baris. Saya minta rekaman ruang tunggu; kameranya katanya rusak sejak lama. Rekaman suara perawat masih ada, dan di situ panggilan kedua bukan nomor.",
        "tags": ["cerita horor", "horor indonesia", "klinik", "cerita seram", "ruang tunggu"],
        "pinComment": "Di layar itu ada dua baris angka yang sama dengan jam berbeda. Kamu masih akan masuk kalau namamu yang dipanggil?",
    },
    "catatan": "Paket 1 gerbang: skor 14/16. Petunjuk visual di frame 1, audio di beat 4, teks di komentar. Reda di beat 7–8 (ambience turun, bukan hening).",
}

ls17 = {
    "episodeId": "LS-0017",
    "format": "short_9x16",
    "status": "naskah — revisi 1 (twist dibalik)",
    "judul": "Suara di Balik Pintu Itu",
    "subgenre": "Institutional horror",
    "experiment": "Revisi dari skor 11/16: twist diubah supaya mengubah arti kalimat pertama, petunjuk audio + teks ditambah, loop disambung kata 'mengetuk'.",
    "structure": "klimaks suara bilang masuk sebelum mengetuk → POTONG 'siapa yang menyuruh?' → kos sembilan kamar → pulang larut, lampu menyala → kardus bergeser → kunci cadangan → twist: rekaman suara saya sendiri tiga hari lalu → CTA",
    "story": {
        "title": "Suara di Balik Pintu Itu",
        "hook": "Sebelum saya mengetuk, suara dari dalam kamar bilang masuk",
        "premise": "Narator pulang ke kos sembilan kamar dan mendengar suaranya sendiri menyuruh masuk dari dalam kamar yang ia kunci.",
        "twist": "Suara itu bukan orang di dalam kamar, melainkan rekaman suara narator sendiri tiga hari sebelumnya — ia sudah menyuruh dirinya masuk sejak dulu.",
        "ending": "Narator menyadari ia sudah mengetuk pintu itu sebelum sempat mengetuk, lalu bertanya apakah penonton akan masuk.",
    },
    "scenes": [
        sc(
            "Sebelum saya mengetuk, pukul sebelas, suara itu bilang masuk. Padahal tidak ada siapa pun.",
            "cinematic 9:16 vertical film still, extreme low angle of a gap under a wooden boarding-house door at night, warm light spilling across the floor, a shadow of two feet standing inside the light, dark corridor around, muted palette, 35mm grain, documentary realism, no readable text, no watermark, no face",
            "static", "closeup", NIGHT, 0.55,
            ["film_grain", "vignette", "light_flicker"],
            sfx=[{"asset": "whisper.mp3", "at": 0.08, "volume": 0.3}],
        ),
        sc(
            "Itu kamar saya. Saya tinggal sendiri, pintunya terkunci.",
            "cinematic 9:16 vertical film still, a hand holding an old brass room key in front of a closed wooden door at night, worn paint, dim corridor light, shallow depth of field, muted palette, 35mm grain, documentary realism, no readable text, no watermark",
            "push_in", "closeup", NIGHT, 0.5,
            ["film_grain", "vignette"],
        ),
        sc(
            "Kalau bukan saya, siapa yang menyuruh saya masuk?",
            "cinematic 9:16 vertical film still, an empty narrow boarding-house corridor at night, nine doors in a row, one door slightly brighter than the rest, fluorescent tube half-lit, muted palette, 35mm grain, documentary realism, no people, no readable text, no watermark",
            "drift", "wide", NIGHT, 0.45,
            ["film_grain", "vignette", "light_flicker"],
        ),
        sc(
            "Kos di Jalan Melati, sembilan kamar. Saya di nomor enam.",
            "cinematic 9:16 vertical film still, close view of a worn door with a blank metal room plate, peeling paint, keyhole, dim warm corridor light from the side, muted palette, 35mm grain, documentary realism, plate blurred and unreadable, no readable text, no watermark",
            "static", "closeup", NIGHT, 0.5,
            ["film_grain", "vignette", "focus_rack"],
        ),
        sc(
            "Saya pulang larut, seperti biasa. Lampu kamar menyala.",
            "cinematic 9:16 vertical film still, a lit room seen from outside through a half-open door, bed and shelf visible in warm light, dark corridor foreground, muted palette, 35mm grain, documentary realism, no people, no readable text, no watermark",
            "push_in", "medium", NIGHT, 0.5,
            ["film_grain", "vignette"],
        ),
        sc(
            "Saya belum pernah menyalakan lampu sebelum keluar.",
            "cinematic 9:16 vertical film still, a bare light bulb glowing inside a small boarding-house room, dust in the beam, clothesline in background, muted palette, 35mm grain, documentary realism, no people, no readable text, no watermark",
            "handheld", "closeup", NIGHT, 0.5,
            ["film_grain", "vignette", "light_flicker"],
            amb=0.14,  # reda #1
        ),
        sc(
            "Kasur rapi. Kardus di bawahnya bergeser.",
            "cinematic 9:16 vertical film still, a neatly made single bed in a small room, a cardboard box dragged out from underneath it leaving a clean rectangle on the dusty floor, warm lamp light, muted palette, 35mm grain, documentary realism, no people, no readable text, no watermark",
            "drift", "medium", NIGHT, 0.5,
            ["film_grain", "vignette"],
            amb=0.18,  # reda #2
        ),
        sc(
            "Di dalamnya kunci cadangan yang saya simpan di kantor.",
            "cinematic 9:16 vertical extreme close-up, an open cardboard box with a spare brass key lying on folded cloth, dust and old receipts inside, warm light from above, shallow depth of field, muted palette, 35mm grain, documentary realism, no readable text, no watermark",
            "push_in", "closeup", NIGHT, 0.55,
            ["film_grain", "vignette", "focus_rack"],
        ),
        sc(
            "Saya putar ulang rekaman di ponsel, dan suara di dalamnya suara saya sendiri — bilang masuk, tiga hari lalu.",
            "cinematic 9:16 vertical extreme close-up, a smartphone on a wooden floor playing a recording, waveform on the screen without readable text, warm lamp light, dust, muted palette, 35mm grain, documentary realism, no readable text, no watermark, no hands visible",
            "push_in", "closeup", NIGHT, 0.55,
            ["film_grain", "vignette", "scanlines"],
        ),
        sc(
            "Rupanya saya sudah menyuruh diri sendiri masuk. Kamu akan mengetuk? Tulis di komentar.",
            "cinematic 9:16 vertical film still, extreme low angle of a gap under a wooden boarding-house door at night, warm light spilling across the floor, no shadow on the tiles this time, dark corridor around, muted palette, 35mm grain, documentary realism, no readable text, no watermark, no face",
            "static", "closeup", NIGHT, 0.55,
            ["film_grain", "vignette", "light_flicker"],
        ),
    ],
    "clues": [
        {"type": "visual", "at": "0.0s", "paidAt": "~50s", "isi": "bayangan dua kaki di bawah pintu pada frame pertama; di frame terakhir bayangan itu hilang"},
        {"type": "audio", "at": "~1s", "paidAt": "~45s", "isi": "bisikan 4,2 s di beat 1 (volume 0,30) — suara yang sama muncul di rekaman ponsel"},
        {"type": "teks", "at": "komentar sematan", "paidAt": "-", "isi": "sebut kunci cadangan yang seharusnya ada di kantor"},
    ],
    "cards": ["SUARA ITU BILANG MASUK", "SIAPA DI DALAM?", "KAMU AKAN MASUK?"],
    "thumb": {"headline": "SUARA ITU BILANG MASUK", "kicker": "sebelum saya mengetuk"},
    "cta": {"card": "Kamu akan mengetuk?", "holdFrames": 84},
    "youtube": {
        "title": "Suara di Balik Pintu Itu Menjawab Sebelum Saya Mengetuk",
        "description": "Suara dari dalam kamar bilang masuk, sebelum saya sempat mengetuk.\n\nKos di Jalan Melati punya sembilan kamar, dan saya tinggal sendiri di nomor enam. Malam itu saya pulang larut dan lampu kamar sudah menyala, padahal saya tidak pernah menyalakannya sebelum keluar.\n\nKasurnya rapi. Kardus di bawah kasur bergeser, dan di dalamnya ada kunci cadangan yang seharusnya masih di kantor. Rekaman di ponsel saya menjawab sisanya.",
        "tags": ["cerita horor", "horor indonesia", "kos", "cerita seram", "pintu"],
        "pinComment": "Kunci cadangan itu saya simpan di laci kantor, terkunci. Kamu akan tetap masuk kalau pintu kamarmu sudah menyala?",
    },
    "catatan": "Revisi 1 dari gerbang: twist diubah dari 'ada orang di dalam' menjadi 'suara saya sendiri yang terekam'. Perlu dinilai ulang; target skor ≥13.",
}

eps = data["episodes"]
ids = {e.get("episodeId"): i for i, e in enumerate(eps)}
for entry in (ls16, ls17):
    if entry["episodeId"] in ids:
        eps[ids[entry["episodeId"]]] = entry
    else:
        eps.append(entry)

SLATE.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
for entry in (ls16, ls17):
    words = sum(len(s["narration"].split()) for s in entry["scenes"])
    print(entry["episodeId"], len(entry["scenes"]), "scene,", words, "kata")

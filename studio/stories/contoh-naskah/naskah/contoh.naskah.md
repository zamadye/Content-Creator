# Naskah: Pergi ke Warung

@id contoh-naskah
@look kampung-sore
@fps 30
@author naskah
@tag contoh
@tag naskah

@cast aku = char.male-dewasa-polo
@cast sosok = entity.pale-standing
@object motor = vehicle.motorcycle.bebek

## 1. Jalan kampung, sore | 5
- set: road.asphalt.straight @ 0 0 0
- set: nature.tree.karet @ -3.2 0 2.4 | rot 0.7
- set: building.house.village @ -6.2 0 -3.5 | rot 1.57
- set: kenney.retro-urban.detail-light-single @ 2.2 0 1.4
- actor: aku walk @ 0 0 1.4 facing -Z
- object: motor @ -0.6 0 1.0 | rot -0.1
- camera: dolly-in from 0.6 1.5 -5.4 to 0.4 1.42 -2.2 fov 42
- light: sore
- text: Sore itu aku pulang lewat jalan yang sama.

## 2. Berhenti di depan warung | 4
- set: road.dirt.straight @ 0 0 0
- set: building.shop.warung @ 2.8 0 -2.0 | rot -1.57
- set: kenney.furniture.bench @ 2.0 0 0.6 | rot -1.2
- set: kenney.retro-urban.detail-awning-small @ 2.6 2.2 -1.4
- actor: aku idle @ 0 0 0.8 facing -Z
- camera: static from 0.3 1.55 3.4
- light: lampu-teplok
- text: Warung itu masih buka, seperti biasa.

## 3. Sosok di ujung jalan | 3
- set: road.asphalt.straight @ 0 0 0
- actor: sosok idle @ 0.2 0 -1.6 facing +Z
- camera: low-angle from 0.1 0.5 2.6 to 0.2 1.0 -1.6 fov 42
- light: malam
- text: Ada yang berdiri di ujung jalan.

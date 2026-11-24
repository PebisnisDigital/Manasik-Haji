# Adventure V4.0

## Kampanye Haji lengkap — 22 November 2026

Peta utama kini menghubungkan **12 bab playable** dari Miqat hingga Wada’. Sembilan bab baru memakai arena dan kendali manasik yang sudah ada melalui sesi per bab, checkpoint dan lencana; tiga petualangan Tawaf/Sa’i/Tahallul mempertahankan save asli. Kedua pilihan nafar tersedia. Rincian cakupan, hasil QA dan syarat rilis yang tersisa ada di [arah pengembangan](ARAH-PENGEMBANGAN.md) dan [audit teknis terbaru](GAMEDEV-AUDIT.md). Catatan V4/V5 di bawah adalah riwayat mode persiapan klasik yang terpisah.

## Kawasan Perjalanan — exploration, vehicle and visual chapter

`district.html` adds a fictional neighborhood with five ordered preparation objectives, NPC dialogue, luggage collection, a driveable bus, terminal parking, rewards and checkpoint recovery. The terminal links to the existing playable chapters according to their original unlocks. The lobby and chapter map both link to this district; the classic adventure and all previous chapter saves remain available. See [district controls, architecture and limitations](DISTRICT.md).

## Browser quest technical upgrade — 21 November 2026

The current default entry is the chapter map; Tawaf (03), Sa’i (04) and Tahallul (05) remain the playable browser quests. The classic preparation adventure below remains accessible with `adventure.html?classic=1` and retains its own progress.

The quest chapters now share camera-relative desktop/touch controls, a collision-aware third-person camera with vertical orbit, landscape/menu input blocking, compatible sub-checkpoint saves with backup recovery, a mission/reward tracker, and the existing adaptive graphics settings. Dense NPC groups reuse their original meshes through instancing; NPCs yield near the player. No new ritual requirements or planned chapters were added. See [the audit, implementation and validation report](GAMEDEV-AUDIT.md) for source mapping, save compatibility, measured draw calls and device-test limits.

Historical implementation notes follow.
Level 1 has three ordered objectives, procedural low-poly house, manually controlled character and guided walking, family dialogue, cinematic camera, generated ambience and browser speech. Level 2–35 are roadmap only. Progress is a local, tenant-scoped checkpoint. Existing practice modes and Supabase are unchanged. No real registration, document collection or cloud adventure reporting.

## V4.2
Close third-person shoulder camera with drag orbit, camera-relative movement, collision boom, enclosed room and prayer alcove with doorway, procedural wood texture, soft shadows, directional mission arrow. Existing levels 1–2 and checkpoints stay compatible. Models remain stylized, not photorealistic. Real-browser visual and control testing required.

## V4.3 Indonesian home
Original procedural ceramic floor, woven mat, batik motifs, Indonesian calendar, street and roof-tile window illustration, water dispenser, fan, sandal rack, household objects, sarong and peci. Synthetic ambient motor/fan/birds and conversational Indonesian guide. No outside recordings, photographs or assets. Existing save, levels, quests and camera are unchanged. Stylized art, not a photorealistic reconstruction.

## V4.4
Auto-collect 3D rotating coins via proximity (0.7m), scripted alternating character dialogues with gestures, knowledge popup with replay and explicit continuation. Six lesson cards for levels 1–2. Text and timed subtitles if device speech unavailable. Existing checkpoints remain compatible. No extra points from repeated overlap. Knowledge content must receive qualified review before commercial use.

## V4.5
NPC text-only ambient conversations on entering a 2.2m radius, 2.65m exit hysteresis, view-dependent world-space chat bubbles projected over the current speaker; no speech synthesis for NPC chat or lesson content. Coin pickup and lesson popup independent of conversation. Guide speech restricted to mission directions and level transitions. Same save format and two playable levels.

## V4.6 meaningful mission gates
Each coin represents a concrete learning objective, not a location. Level 1: parental prayers/restu (adab, not a validity condition), family responsibilities, budget planning. Level 2: intention, health preparation, official registration routes. NPC mandatory dialogue must finish; other tasks require correct educational choice before coin reveal and auto pickup. New version-scoped save preserves old checkpoint separately and carries avatar/campaign. Future chapters must use the same action → learning validation → reward → explanation pattern, with official guidance and qualified review. Reference: https://haji.go.id/berita/manasik-berbekal-al-fatihah-dirjen-pelayanan-haji-tekankan-kesiapan-jemaah-hingga-pascahaji-1792226604315 and https://haji.go.id/berita/kemenhaj-rilis-buku-paket-bimbingan-manasik-haji-dan-umrah-2026-1770184158036 .

## V4.7 direct guidance
No quiz or right/wrong answers in adventure. Required family dialogue remains silent; other missions unlock coins upon arrival. Each reward displays direct practical guidance, bullets and optional caution. Existing progress key retained. Levels 3–10 guide content is stored in src/adventure/future-guides.json as draft content only; not playable until scenes and objectives are implemented. Administrative requirements vary by route, season and official guidance. Religious and health content requires qualified review. Sources to verify: https://haji.go.id/ ; https://karawang.imigrasi.go.id/kenali-prosedur-pembuatan-paspor-untuk-haji-dan-umrah/ ; https://jatim.haji.go.id/berita/menteri-haji-dan-umrah-tekankan-profesionalisme-ppiu-dan-pihk-dalam-mukernas-iii-sapuhi-di-malang-1786507102980 .

## V4.8 travel office
Level 3 playable after completing Level 2. Three staff NPCs, separate travel office environment, white-label name and accent, fictional registration guidance, route-aware hajj/umrah lessons, existing saves migrated by compatible level extension. No real documents or payments. The office is an educational simulation, not proof of licensing. Level 4 remains planned. Official guidance: https://sulsel.haji.go.id/berita/sosialisasi-di-pangkep-kemenhaj-sulsel-paparkan-perubahan-regulasi-haji-dan-umrah-1790669122734 and https://bengkulu.haji.go.id/berita/kemenhaj-mukomuko-imbau-masyarakat-cermat-pilih-travel-umrah-lewat-aplikasi-satu-haji-1770206676294 .

## V4.9 — Document preparation
Level 4 playable after Level 3. Separate educational document-service environment based on the service-room layout, blue signage and three staffed service desks, fictional passport/visa/archive specimens marked CONTOH and TIDAK BERLAKU, no uploads, payment or camera capture. Three direct guidance coins. Existing checkpoints remain compatible; level 5 is planned. References: https://jakartapusat.imigrasi.go.id/index.php/layanan/warga-negara-indonesia-wni/paspor-baru/haji-umroh and https://karawang.imigrasi.go.id/kenali-prosedur-pembuatan-paspor-untuk-haji-dan-umrah/ . Verify current requirements with authorities before actual travel.

## V5.0 — Health preparation
Level 5 playable after Level 4. Clinic training environment, examination bed, demo blood pressure monitor without a patient reading, vaccine-information counter and pharmacy props. Doctor, nurse and pharmacist text dialogue, direct guidance cards, no quiz, no patient data, no simulated clinical clearance and no actual medical service. Existing checkpoints remain compatible. Level 6 is planned. Official health references: https://www.moh.gov.sa/en/healthawareness/pilgrims-health/pages/default.aspx ; https://www.moh.gov.sa/en/healthawareness/pilgrims-health/pages/pre-hajj-health-guidelines.aspx ; https://jdih.kemkes.go.id/documents/keputusan-menteri-kesehatan-nomor-hk0107menkes5082024 . Vaccine requirements vary with season, route and traveler; refer to current official guidance and medical professionals.

## V5.1 — Packing
Level 6 uses a dedicated home packing room with three luggage stations. Tap each of three guided items per mission to move the corresponding 3D prop into the suitcase; no quiz or sensitive input. Rules for male/female clothing vary. After all items are packed, the existing auto-coin and direct guide appear. Progress is saved per completed mission, not per item; restarting a pending station repeats its packing. Level 7 planned. Confirm current airline and ihram rules with the carrier and qualified guidance.

## V5.2 — Manasik class
Level 7 playable after Level 6. Classroom with two teaching NPCs, introductory route-aware tamattu/umrah guidance, ihram clothing display, miniature Kaaba and sa’i path, two user-started animated diagrams with synchronized 3D markers; seven counterclockwise laps and seven one-way traversals from Safa to Marwah. Both demos must finish before the last coin unlocks. No quiz, no worship or ritual-validity claim, and diagrams are not to scale. Actual practice stages remain later levels. Sources: https://islam.nu.or.id/amp/syariah/lima-rukun-ibadah-umrah-pVRwb ; https://app.nu.or.id/faq/haji-umrah/bagaimana-saat-ragu-ragu-dalam-hitungan-tawaf-atau-sa-i ; https://jatim.nu.or.id/keislaman/penjelasan-lengkap-syarat-rukun-dan-wajib-haji-AwwjB . Seek qualified review for detailed fiqh before release to pilgrims.

## V5.3 — Departure day
Level 8 playable after Level 7. Outdoor Indonesian porch and coach gathering scene, three-item final check, silent farewell conversation, direct guidance with personal prayer and QS Az-Zukhruf 43:13–14 excerpt, group-leader dialogue followed by loading the demo suitcase into the coach. No actual bus ride or booking: airport begins with Level 9. Same local checkpoint key. Level 9 planned. No document uploads. Religious guidance should receive qualified review.

## V5.4 — Airport
Level 9 playable after Level 8. Fictional international terminal with an apron-facing window, parked airliner, check-in counter and conveyor, security tray and scanner, immigration booth, waiting seats and demo boarding gate A01. Three NPC-dialogue missions followed by ordered tap actions (3+3+2); bag movement and gate animation; no quiz, no real document upload or travel booking. Immigration is an action within the second station, not a separate navigable mission. Real procedures vary; follow airport and airline staff. Same checkpoint key; level 10 planned.

## V5.5 — Flight to Saudi
Level 10 playable after Level 9. Stylized cabin with seats, overhead bins, windows and moving clouds, cabin staff and guide NPCs. Three step-based missions: safety/seatbelt and vehicle prayer (Arabic, transliteration and meaning), hydration/seated leg movement demonstration, and itinerary-specific miqat guidance. Route choice Jeddah directly toward Makkah or Madinah first is stored locally as optional flightRoute upon coin completion (legacy checkpoints remain compatible), to be used in later levels. No actual flight, ritual, diagnosis or forced prayer recitation. Cabin walking is an educational abstraction and only advised when crew permit. Sources: https://sumsel.haji.go.id/berita/kloter-11-embarkasi-palembang-berangkat-ke-tanah-suci-jemaah-kenakan-pakaian-ihram-sejak-dari-asrama-haji-1778296404854 ; https://sumbar.haji.go.id/berita/kloter-01-embarkasi-padang-bergerak-ke-makkah-jemaah-ambil-miqat-di-bir-ali-1777686044024 ; https://kemkes.go.id/id/%20inilah-tips-senam-peregangan-pesawa . Qualified review needed. Level 11 planned.

## V5.6 — Perjalanan dan miqat
Level 11 branches on saved flightRoute. Jeddah route remains in an approaching-miqat cabin before the prescribed boundary (preparation from before boarding); Madinah route uses a stylized Bir Ali courtyard and stationary coach, after an implied stay in Madinah. Three dialogue + two guide-card missions: clothing, intention, talbiyah; Arabic, transliteration and meaning, no recitation validation or quiz. Avatar clothing guidance differs by avatar, actual avatar dress is unchanged. No actual flight/bus animation or ritual performance; the courtyard is illustrative, not a geographic replica. Missing route on legacy data defaults to direct Jeddah. Reference: https://sumbar.haji.go.id/berita/kloter-01-embarkasi-padang-bergerak-ke-makkah-jemaah-ambil-miqat-di-bir-ali-1777686044024 ; https://sumsel.haji.go.id/berita/kloter-11-embarkasi-palembang-berangkat-ke-tanah-suci-jemaah-kenakan-pakaian-ihram-sejak-dari-asrama-haji-1778296404854 ; https://aceh.kemenag.go.id/baca/haji-dan-persaudaraan-islam . Qualified review before use. Level 12 planned.

# Skrip Video Demo (maksimal 90 detik)

Rekam aplikasi yang benar-benar berjalan. Jangan menambahkan visual yang menyerupai uji lapangan, pilot, pabrik nyata, atau logo pelanggan. Semua angka di demo adalah data simulasi.

## Opsi perekaman

| Opsi | Cara | Hasil |
| --- | --- | --- |
| Otomatis (tanpa suara) | `npm run build` lalu `node scripts/record-demo.mjs test-results/video` | `energiaction-demo.mp4` sekitar 80 detik, 1280×720, dengan caption di layar. Membutuhkan Playwright dan ffmpeg. |
| Manual dengan narasi | Buka URL demo publik. Rekam layar dengan OBS atau perekam bawaan OS pada 1280×720. Ikuti tabel di bawah. | Video dengan suara narator. |

Untuk video otomatis, tambahkan narasi suara dari kolom "Narasi" saat editing. Panjang narasi sudah disesuaikan dengan durasi adegan.

## Storyboard

| Waktu | Layar | Aksi | Narasi (Bahasa Indonesia) |
| --- | --- | --- | --- |
| 0-12 s | 1. Assessment, bagian atas | Tampilkan label "Data simulasi" dan ringkasan hasil. | Audit energi sering menemukan potensi hemat di sistem kompresor. Manajemen tetap butuh justifikasi investasi yang angkanya bisa diperiksa. |
| 12-32 s | 1. Assessment, Baseline energi | Ketik daya -5 kW. Tunjukkan pesan penolakan. Kembalikan ke 110. Ketik jam operasi 9000. Kembalikan ke 6000. | Engineer mengisi daya terukur, jam operasi, dan tarif. Nilai tidak valid ditolak. Baseline: 110 kW kali 6.000 jam sama dengan 660.000 kWh per tahun. |
| 32-52 s | 2. Skenario | Ubah pengurangan daya kebocoran dari 10% ke 15%. Gulir ke "Tumpang tindih penghematan". Kembalikan ke 10%. | Bandingkan perbaikan kebocoran, optimasi kontrol, dan gabungan. Opsi gabungan dihitung berurutan, jadi penghematan yang tumpang tindih tidak dihitung dua kali. |
| 52-70 s | 3. Analisis Finansial | Buka "Lihat Perhitungan". Gulir ke "Uji realisasi penghematan". | Setiap angka punya rumus, substitusi, dan sumber. Simple payback opsi gabungan 2,1 tahun. Jika hanya separuh penghematan tercapai, payback menjadi 4,9 tahun. |
| 70-90 s | 4. Evidence Review, lalu 5. Investment Brief | Ubah status "Asumsi pengurangan daya: optimasi kontrol" menjadi "Diperiksa engineer". Buka Brief. Gulir ke "Batasan analisis". | Register evidence membedakan pengukuran, dokumen, dan asumsi. Status Ready berarti data lengkap untuk review, bukan sertifikasi. Brief dapat dicetak sebagai PDF. Keterbatasan: data simulasi, simple payback, dan AI belum diaktifkan. |

## Pemeriksaan sebelum unggah

- Durasi tidak melebihi 90 detik.
- Label "Data simulasi" terlihat minimal di adegan pertama.
- Tidak ada klaim penghematan aktual, pilot, pelanggan, atau partnership.
- Status AI di video sesuai kondisi URL demo. Jika AI belum aktif, narasi harus menyebut "AI belum diaktifkan".

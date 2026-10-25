# Catatan Pendaftaran MAJU:ON 2026: EnergiAction Bankable

Tujuan: membantu tim menjawab enam pertanyaan formulir MAJU:ON dengan bukti yang dapat diperiksa.

## Status informasi program

| Hal | Status | Sumber |
| --- | --- | --- |
| Penyelenggara | MAJU:ON adalah program kewirausahaan muda bidang energi dan lingkungan di Indonesia, digagas UD IMPACT dan didukung SK Innovation E&S. | IDN Times (liputan Hackathon 2025), Antara (Mei 2026) |
| Cohort kedua | Korea JoongAng Daily (Mei 2026) melaporkan rencana peluncuran cohort kedua pada September. | Cuplikan mesin pencari |
| Deadline 27 Oktober 2026, 23.59 WIB | TIDAK TAHU dari sumber publik. Tanggal ini berasal dari brief tim. | Pencarian tidak menemukan halaman pendaftaran |
| Teks enam pertanyaan resmi | TIDAK TAHU. Teks pertanyaan tidak ditemukan di sumber publik yang dapat diakses. | Tema di bawah adalah ASUMSI |

Tindakan tim: ganti judul Q1 sampai Q6 dengan teks pertanyaan resmi. Sesuaikan draf jika tema berbeda. Jalankan `npm test` setelah mengedit. Test `application-notes` memeriksa bahwa setiap draf maksimal 1.400 karakter.

Aturan pengisian:

- Jangan menambah jumlah wawancara, hasil uji pengguna, pelanggan, pilot, partnership, penghematan aktual, atau willingness to pay yang belum ada.
- Ganti `[URL demo]` hanya dengan URL publik yang sudah dibuka tanpa login. Jangan memakai localhost.
- Ganti `[Nama]` dan komitmen waktu dengan data tim yang sebenarnya.

---

## Q1. Masalah apa yang diselesaikan, dan siapa yang mengalaminya? (ASUMSI tema)

Draf jawaban (maksimal 1.400 karakter):

<!-- draft:Q1 -->
Audit energi di pabrik sering menemukan peluang hemat, misalnya kebocoran compressed air atau kontrol kompresor yang boros. Langkah berikutnya sering tersendat. Engineer harus menyusun ulang baseline, perhitungan penghematan, biaya, dan bukti agar manajemen dapat memutuskan investasi.

Studi audit energi di Amerika Serikat menemukan pabrik hanya melaksanakan sekitar separuh rekomendasi, dan adopsi dipengaruhi payback serta biaya awal (Anderson dan Newell, 2004). Di Indonesia, Energy Transition Partnership (2024) mencatat keterbatasan pengalaman menyusun dokumen proyek efisiensi energi yang bankable. APEC (2017) dan OECD (2021) mencatat bank belum familiar menilai proyek efisiensi energi.

Pengguna yang kami sasar: energy manager, auditor energi industri, dan tim utilitas. Pembeli: perusahaan industri yang mempertimbangkan investasi efisiensi energi.

Hipotesis kami: keputusan tertunda karena asumsi tidak terlihat dan bukti belum lengkap. Hipotesis ini belum kami uji melalui wawancara pengguna.
<!-- /draft -->

| Kategori | Isi |
| --- | --- |
| Bukti dari sumber publik | Anderson dan Newell (2004). ETP Diagnostic Review (2024). APEC (2017). OECD (2021). Rincian dan status verifikasi di `docs/PROBLEM_VALIDATION.md` (L1 sampai L4). |
| Bukti pengujian produk sendiri | Tidak relevan untuk membuktikan masalah. |
| Asumsi | Gesekan utama ada pada penyusunan justifikasi, bukan pada audit. Pola dari AS berlaku sebagian di Indonesia. |
| Informasi yang masih harus diberikan tim | Contoh nyata dari pengalaman anggota tim atau kontak industri, jika ada. Jangan mengarang contoh. |

---

## Q2. Apa solusinya dan bagaimana cara kerjanya? (ASUMSI tema)

Draf jawaban (maksimal 1.400 karakter):

<!-- draft:Q2 -->
EnergiAction Bankable adalah aplikasi web yang mengubah temuan audit sistem kompresor menjadi Investment Decision Brief untuk Plant Manager.

Alurnya lima langkah. Assessment: daya terukur, jam operasi, tarif, dan biaya per tindakan. Skenario: perbaikan kebocoran, optimasi kontrol, gabungan, dan tanpa intervensi. Analisis Finansial: konsumsi baseline dan setelah perbaikan, penghematan energi dan biaya, biaya investasi, dan simple payback. Evidence Review: membedakan data pengukuran, dokumen, asumsi, dan data yang belum tersedia, beserta status pemeriksaan engineer. Brief: dapat dicetak atau disimpan sebagai PDF.

Setiap rumus tampil di panel "Lihat Perhitungan" beserta sumber angkanya. Skenario gabungan dihitung berurutan agar penghematan tidak dihitung ganda. Payback tidak ditampilkan jika penghematan bersih tidak positif. Input tidak valid ditolak.

Fitur AI dirancang hanya untuk membaca teks audit menjadi usulan terstruktur dengan kutipan sumber. Engineer memvalidasi setiap usulan sebelum dipakai. AI tidak menghitung hasil finansial. Pada demo ini AI belum diaktifkan. Demo memakai data simulasi: [URL demo]
<!-- /draft -->

| Kategori | Isi |
| --- | --- |
| Bukti dari sumber publik | Metode sekuensial untuk tindakan yang saling memengaruhi: ACEEE (1997) tentang AIRMaster. |
| Bukti pengujian produk sendiri | Alur lima langkah berjalan di browser. Hasil pengujian di `docs/TEST_REPORT.md`. Screenshot di `docs/screenshots/`. |
| Asumsi | Simple payback cukup untuk keputusan tahap awal. Proyek besar mungkin butuh NPV atau IRR. |
| Informasi yang masih harus diberikan tim | URL demo publik setelah deploy. |

---

## Q3. Apa bukti bahwa pengguna membutuhkan solusi ini? (ASUMSI tema)

Draf jawaban (maksimal 1.400 karakter):

<!-- draft:Q3 -->
Wawancara pengguna: Not yet. Kami belum mewawancarai energy manager, auditor energi, atau pembeli.

Bukti yang ada saat ini terdiri dari dua jenis. Pertama, sumber publik tentang kesenjangan antara rekomendasi audit dan pelaksanaan: Anderson dan Newell (2004), Energy Transition Partnership (2024), dan PP 33/2023 yang mewajibkan industri dengan konsumsi energi minimal 4.000 TOE per tahun melaksanakan rekomendasi audit energi.

Kedua, pengujian produk sendiri: unit test dan end-to-end test untuk rumus, validasi input, perubahan skenario, status evidence, dan ekspor brief. Pengujian ini membuktikan perhitungan berjalan sesuai rumus. Pengujian ini tidak membuktikan kebutuhan pasar.

Rencana validasi: wawancara 8 sampai 12 energy manager atau auditor dengan panduan tertulis, lalu uji tugas menyusun brief dari data audit contoh dengan dan tanpa demo. Kriteria lulus kami tetapkan sebelum wawancara. Contoh: minimal 5 responden menyebut penyusunan justifikasi investasi sebagai langkah yang lama atau berulang, dengan contoh proyek nyata.
<!-- /draft -->

| Kategori | Isi |
| --- | --- |
| Bukti dari sumber publik | `docs/PROBLEM_VALIDATION.md` L1, L2, L5. Ambang 4.000 TOE perlu dicek ke teks PP 33/2023. |
| Bukti pengujian produk sendiri | Jumlah test dan hasil di `docs/TEST_REPORT.md`. |
| Asumsi | Kewajiban regulasi meningkatkan kebutuhan dokumentasi. Ini belum membuktikan kebutuhan software. |
| Informasi yang masih harus diberikan tim | Jumlah wawancara yang benar-benar dilakukan sebelum submit. Jika nol, tetap tulis "Not yet". |

---

## Q4. Apa dampak lingkungan atau energi, dan bagaimana mengukurnya? (ASUMSI tema)

Draf jawaban (maksimal 1.400 karakter):

<!-- draft:Q4 -->
Dampak yang kami ukur adalah energi listrik yang dihemat dari tindakan yang benar-benar dilaksanakan, dalam kWh per tahun. Penghematan diverifikasi dengan metode pengukuran yang sama dengan baseline. EnergiAction menghitung estimasi sebelum investasi, bukan penghematan aktual.

Estimasi CO2 hanya ditampilkan jika pengguna mengisi faktor emisi grid, wilayah, tahun, dan sumber resmi. Aplikasi tidak memakai faktor emisi default.

Kami belum memiliki data penghematan aktual, pilot, atau pelanggan.

Konteks dari sumber publik: pembangkitan compressed air sekitar 10% listrik fasilitas industri tipikal menurut survei lama US DOE, dan kebocoran pada sistem yang kurang terawat dapat mencapai 20 sampai 30% output kompresor. Penghematan energi sektor industri Indonesia sekitar 2% dari konsumsi, dibanding praktik internasional 3 sampai 5% (GIZ, 2026). Angka ini adalah konteks, bukan dampak produk.

Indikator setelah pilot: jumlah brief yang disetujui, kWh terverifikasi setelah implementasi, dan waktu penyusunan brief.
<!-- /draft -->

| Kategori | Isi |
| --- | --- |
| Bukti dari sumber publik | DOE dan Compressed Air Challenge Fact Sheet 7. GIZ (2026). `docs/PROBLEM_VALIDATION.md` L6, L8. |
| Bukti pengujian produk sendiri | Test memastikan CO2 tidak tampil tanpa faktor emisi, wilayah, tahun, dan sumber. |
| Asumsi | Brief yang lebih lengkap meningkatkan peluang persetujuan. Belum diuji. |
| Informasi yang masih harus diberikan tim | Tidak ada angka dampak yang boleh ditambahkan sebelum ada pilot terukur. |

---

## Q5. Siapa pembelinya, bagaimana model bisnisnya, dan apa alternatifnya? (ASUMSI tema)

Draf jawaban (maksimal 1.400 karakter):

<!-- draft:Q5 -->
Pengguna: energy manager, auditor energi industri, dan tim utilitas. Pembeli: perusahaan industri yang mempertimbangkan investasi efisiensi energi, terutama yang wajib menjalankan manajemen energi.

Alternatif saat ini: spreadsheet internal, laporan audit dalam bentuk dokumen, dan perangkat analisis compressed air seperti AIRMaster+ dari US DOE yang kini menjadi bagian dari MEASUR. Perangkat tersebut juga menghitung penghematan. Perbedaan yang ingin kami uji: register evidence yang membedakan pengukuran, dokumen, dan asumsi, serta brief keputusan untuk manajemen.

Model pendapatan yang akan diuji: langganan per fasilitas atau per proyek untuk tim energi, dan lisensi untuk auditor atau ESCO yang menyusun brief untuk klien. Harga dan willingness to pay belum diuji. Kami tidak mencantumkan angka WTP sebelum wawancara pembeli.

Risiko utama: kebutuhan mungkin sudah cukup terpenuhi oleh spreadsheet, dan keputusan investasi bisa lebih ditentukan siklus anggaran daripada kualitas bukti.
<!-- /draft -->

| Kategori | Isi |
| --- | --- |
| Bukti dari sumber publik | AIRMaster+ sebagai bagian MEASUR: halaman AIRMaster di energy.gov. |
| Bukti pengujian produk sendiri | Tidak ada. Model bisnis belum diuji. |
| Asumsi | Auditor dan ESCO bisa menjadi kanal distribusi. Pembeli bersedia membayar untuk brief yang lebih cepat. |
| Informasi yang masih harus diberikan tim | Hasil wawancara pembeli, jika ada. Kompetitor lokal yang diketahui tim. |

---

## Q6. Siapa tim Anda, apa perannya, dan berapa komitmen waktunya? (ASUMSI tema)

Draf jawaban (maksimal 1.400 karakter):

<!-- draft:Q6 -->
[Nama], peran: product dan engineering. Membangun demo web, perhitungan deterministik, dan pengujian otomatis. Komitmen: [jam per minggu].

[Nama], peran: domain energi. Menyusun metode perhitungan, register evidence, dan wawancara energy manager. Komitmen: [jam per minggu].

[Nama], peran: bisnis. Wawancara pembeli, model harga, dan kemitraan. Komitmen: [jam per minggu].

Rencana tiga bulan setelah seleksi: (1) wawancara 8 sampai 12 pengguna dan 3 sampai 5 pembeli, (2) uji tugas dengan data audit anonim, (3) aktifkan AI ekstraksi dengan batas biaya dan ukur tingkat penolakan validator, (4) tambah sistem kedua, misalnya pompa, hanya jika hasil wawancara mendukung.

Status saat ini: demo web berjalan dengan data simulasi. Kode dan hasil pengujian tersedia di repository GitHub tim.
<!-- /draft -->

| Kategori | Isi |
| --- | --- |
| Bukti dari sumber publik | Tidak relevan. |
| Bukti pengujian produk sendiri | Repository dan `docs/TEST_REPORT.md`. |
| Asumsi | Struktur tiga peran. Ganti sesuai tim. |
| Informasi yang masih harus diberikan tim | Nama, peran, latar belakang, dan komitmen waktu setiap anggota. Jangan mengisi angka yang belum disepakati tim. |

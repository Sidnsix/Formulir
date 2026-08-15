let allSurahs = [];
let currentTab = 'surah';
let activeSurahNum = 1;
let activeJuzNum = 1;
let currentPlayingId = null;

// Selektor DOM Eksternal
const menuList = document.getElementById('menuList');
const contentBody = document.getElementById('contentBody');
const activeHeaderTitle = document.getElementById('activeHeaderTitle');
const activeHeaderDesc = document.getElementById('activeHeaderDesc');
const searchInput = document.getElementById('searchInput');
const sidebar = document.getElementById('sidebar');
const mobileToggle = document.getElementById('mobileToggle');
const themeToggle = document.getElementById('themeToggle');
const globalAudio = document.getElementById('globalAudioPlayer');

// Fitur Penyimpanan Mode Tema Terakhir (Persistent Theme)
const savedTheme = localStorage.getItem('theme') || 'light';
if (savedTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
}

themeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
        document.documentElement.removeAttribute('data-theme');
        themeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';
        localStorage.setItem('theme', 'light');
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
        localStorage.setItem('theme', 'dark');
    }
});

// Kontrol Penutup Navigasi Drawer HP
mobileToggle.addEventListener('click', () => sidebar.classList.toggle('open'));

// Memulai Memuat Informasi Utama dari API Publik
async function init() {
    try {
        const res = await fetch('https://equran.id');
        const data = await res.json();
        allSurahs = data.data;
        renderList();
        loadSurah(1, 'Al-Fatihah', 'Pembukaan');
    } catch (err) {
        contentBody.innerHTML = '<div class="loading-state"><p>Gagal memuat data. Periksa koneksi internet Anda.</p></div>';
    }
}

// Navigasi Tab Pengelompokan (Surat vs Juz) Berbasis Gaya Sindonews
function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    if(tab === 'surah') document.getElementById('tabSurah').classList.add('active');
    if(tab === 'juz') document.getElementById('tabJuz').classList.add('active');
    searchInput.value = '';
    renderList();
}

// Modul Penyorot Kata Kunci Pencarian (Search Highlight Text)
function highlightText(text, search) {
    if (!search) return text;
    const regex = new RegExp(`(${search})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

// Memproses Tampilan Item List Kiri Dinamis
function renderList(filter = '') {
    menuList.innerHTML = '';
    const q = filter.trim().toLowerCase();

    if (currentTab === 'surah') {
        allSurahs.forEach(s => {
            if (s.namaLatin.toLowerCase().includes(q)) {
                const div = document.createElement('div');
                div.className = `menu-item ${activeSurahNum === s.nomor ? 'active' : ''}`;
                div.onclick = () => {
                    activeSurahNum = s.nomor;
                    sidebar.classList.remove('open');
                    loadSurah(s.nomor, s.namaLatin, s.arti);
                    renderList(filter);
                };
                
                const displayTitle = highlightText(s.namaLatin, q);
                div.innerHTML = `
                    <div class="menu-item-left">
                        <div class="surah-number">${s.nomor}</div>
                        <div class="surah-info"><h3>${displayTitle}</h3><p>${s.arti} • ${s.jumlahAyat} Ayat</p></div>
                    </div>
                    <div class="surah-arabic">${s.nama}</div>`;
                menuList.appendChild(div);
            }
        });
    } else {
        for (let i = 1; i <= 30; i++) {
            if (`juz ${i}`.includes(q) || `${i}` === q) {
                const div = document.createElement('div');
                div.className = `menu-item ${activeJuzNum === i ? 'active' : ''}`;
                div.onclick = () => {
                    activeJuzNum = i;
                    sidebar.classList.remove('open');
                    loadJuz(i);
                    renderList(filter);
                };
                
                const displayJuzTitle = highlightText(`Juz Ke-${i}`, q);
                div.innerHTML = `
                    <div class="menu-item-left">
                        <div class="juz-number">${i}</div>
                        <div class="juz-info"><h3>${displayJuzTitle}</h3><p>Kumpulan ayat pilihan Juz ${i}</p></div>
                    </div>
                    <i class="fa-solid fa-chevron-right" style="color: var(--primary)"></i>`;
                menuList.appendChild(div);
            }
        }
    }
}

searchInput.addEventListener('input', (e) => renderList(e.target.value));

// Memuat Teks Lengkap Surat & Injeksi Komponen Interaktif Player Murottal
async function loadSurah(num, name, desc) {
    showLoading();
    stopAudio();
    activeHeaderTitle.innerText = name;
    activeHeaderDesc.innerText = desc;
    try {
        const res = await fetch(`https://equran.id/${num}`);
        const data = await res.json();
        let html = num !== 1 && num !== 9 ? '<div class="bismillah-card">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>' : '';
        html += '<div class="ayat-list">';
        
        data.data.ayat.forEach(a => {
            const uniqueId = `audio-${num}-${a.nomorAyat}`;
            const audioUrl = a.audio['01']; 
            
            html += `
                <div class="ayat-card" id="card-${uniqueId}">
                    <div class="ayat-header">
                        <span class="ayat-badge">Ayat ${a.nomorAyat}</span>
                        <div class="ayat-actions">
                            <button class="action-btn" onclick="togglePlayAudio('${audioUrl}', '${uniqueId}')" id="btn-${uniqueId}" title="Putar Murottal">
                                <i class="fa-solid fa-play"></i>
                            </button>
                            <button class="action-btn" onclick="copyAyat('${a.teksArab}', '${a.teksIndonesia}', 'QS. ${name}: ${a.nomorAyat}')" title="Salin Ayat">
                                <i class="fa-solid fa-copy"></i>
                            </button>
                        </div>
                    </div>
                    <div class="ayat-arabic">${a.teksArab}</div>
                    <div class="ayat-latin">${a.teksLatin}</div>
                    <div class="ayat-translation">${a.teksIndonesia}</div>
                </div>`;
        });
        contentBody.innerHTML = html + '</div>';
        contentBody.scrollTop = 0;
    } catch { contentBody.innerHTML = '<p>Gagal memuat ayat surat.</p>'; }
}

// Memuat Struktur Kumpulan Ayat per Juz
async function loadJuz(juzNum) {
    showLoading();
    stopAudio();
    activeHeaderTitle.innerText = `Juz Ke-${juzNum}`;
    activeHeaderDesc.innerText = `Memproses struktur ayat...`;
    try {
        const [resId, resAr] = await Promise.all([
            fetch(`https://alquran.cloud{juzNum}/id.indonesian`),
            fetch(`https://alquran.cloud{juzNum}/quran-uthmani`)
        ]);
        const dataId = await resId.json();
        const dataAr = await resAr.json();
        
        let html = '<div class="ayat-list">';
        dataId.data.ayahs.forEach((a, idx) => {
            const arabText = dataAr.data.ayahs[idx].text;
            html += `
                <div class="ayat-card">
                    <div class="ayat-header">
                        <span class="ayat-badge">${a.surah.englishName} : ${a.numberInSurah}</span>
                        <div class="ayat-actions">
                            <button class="action-btn" onclick="copyAyat('${arabText}', '${a.text}', '${a.surah.englishName}: ${a.numberInSurah}')" title="Salin Ayat">
                                <i class="fa-solid fa-copy"></i>
                            </button>
                        </div>
                    </div>
                    <div class="ayat-arabic">${arabText}</div>
                    <div class="ayat-translation">${a.text}</div>
                </div>`;
        });
        activeHeaderDesc.innerText = `Total ${dataId.data.ayahs.length} Ayat`;
        contentBody.innerHTML = html + '</div>';
        contentBody.scrollTop = 0;
    } catch { contentBody.innerHTML = '<p>Gagal memuat ayat Juz.</p>'; }
}

// Logika Manajemen Pemutar Audio Murottal Per Ayat
function togglePlayAudio(url, id) {
    const clickedBtn = document.getElementById(`btn-${id}`);
    const clickedCard = document.getElementById(`card-${id}`);

    if (currentPlayingId === id) {
        if (!globalAudio.paused) {
            globalAudio.pause();
            clickedBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
            clickedBtn.classList.remove('playing-audio');
            clickedCard.classList.remove('playing');
        } else {
            globalAudio.play();
            clickedBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
            clickedBtn.classList.add('playing-audio');
            clickedCard.classList.add('playing');
        }
    } else {
        stopAudio();
        currentPlayingId = id;
        globalAudio.src = url;
        globalAudio.play();
        
        clickedBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
        clickedBtn.classList.add('playing-audio');
        clickedCard.classList.add('playing');
        
        globalAudio.onended = () => stopAudio();
    }
}

// Menghentikan Seluruh Aktivitas Suara Murottal & Reset Warna Efek Visual
function stopAudio() {
    if (currentPlayingId) {
const activeBtn = document.getElementById(btn-${currentPlayingId});const activeCard = document.getElementById(card-${currentPlayingId});if (activeBtn) {activeBtn.innerHTML = '';activeBtn.classList.remove('playing-audio');}if (activeCard) activeCard.classList.remove('playing');}globalAudio.pause();currentPlayingId = null;}// Fungsi Salin Clipboard APIfunction copyAyat(arab, idText, info) {const fullText = ${arab}\n\nArtinya: "${idText}" (${info});navigator.clipboard.writeText(fullText).then(() => {showToast(Ayat berhasil disalin!);}).catch(() => {showToast('Gagal menyalin teks.');});}// Komponen Popup Pemberitahuan UI Ringan (Toast)function showToast(message) {let toast = document.querySelector('.toast');if (!toast) {toast = document.createElement('div');toast.className = 'toast';document.body.appendChild(toast);}toast.innerText = message;toast.classList.add('show');setTimeout(() => toast.classList.remove('show'), 2500);}// Menampilkan Animasi Memuat Sederhanafunction showLoading() {contentBody.innerHTML = '';}window.addEventListener('DOMContentLoaded', init);

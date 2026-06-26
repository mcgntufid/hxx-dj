const html = document.documentElement;
let currentLang = localStorage.getItem('lang') || 'ar';

function setLanguage(lang) {
    html.setAttribute('lang', lang);
    html.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    document.getElementById('langBtn').textContent = lang === 'ar' ? 'English' : 'العربية';

    document.querySelectorAll('[data-ar][data-en]').forEach(el => {
        if (el.tagName === 'INPUT') {
            el.placeholder = el.getAttribute(`data-${lang}-placeholder`);
        } else {
            el.textContent = el.getAttribute(`data-${lang}`);
        }
    });

    localStorage.setItem('lang', lang);
    currentLang = lang;
}

document.getElementById('langBtn').onclick = () => {
    setLanguage(currentLang === 'ar' ? 'en' : 'ar');
};

setLanguage(currentLang);

let myDeviceId = localStorage.getItem('hxxdj_device_id');
if (!myDeviceId) {
    myDeviceId = 'device_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('hxxdj_device_id', myDeviceId);
}

// Default Tracks
const discoverTracks = [
    { id: "sp1", name: "معزوفة الطاقة والنشاط", artist: "SoundHelix Alpha", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", isDiscover: true },
    { id: "sp2", name: "لحن الاسترخاء والدراسة", artist: "SoundHelix Beta", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", isDiscover: true },
    { id: "sp3", name: "موسیقى سایبربانك رقمية", artist: "SoundHelix Gamma", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3", isDiscover: true },
    { id: "sp4", name: "إيقاع العصر الهادئ", artist: "SoundHelix Delta", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3", isDiscover: true }
];

// --- IndexedDB ---
let db;
const DB_NAME = 'HXXDJ_DB';
const STORE_NAME = 'songs';

let customSongs = [];
let allSongs = [];
let currentPlaylist = [];
let currentIndex = -1;
let isShuffle = false;
let isRepeat = false;
let isLiked = false;

const audio = document.getElementById('playerAudio');
const progressBar = document.getElementById('progressBar');
const currentTimeEl = document.getElementById('currentTime');
const totalTimeEl = document.getElementById('totalTime');
const playPauseBtn = document.getElementById('playPauseBtn');
const likeBtn = document.getElementById('likeBtn');

function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve();
        };
        request.onupgradeneeded = (e) => {
            db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };
    });
}

async function saveSongToDB(song) {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    await tx.objectStore(STORE_NAME).add(song);
}

async function getAllSongsFromDB() {
    const tx = db.transaction(STORE_NAME, 'readonly');
    return await new Promise((resolve) => {
        const req = tx.objectStore(STORE_NAME).getAll();
        req.onsuccess = () => resolve(req.result);
    });
}

async function deleteSongFromDB(id) {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    await tx.objectStore(STORE_NAME).delete(id);
}

function openModal() { document.getElementById('addModal').style.display = 'flex'; }
function closeModal() {
    document.getElementById('addModal').style.display = 'none';
    document.getElementById('songName').value = '';
    document.getElementById('artistName').value = '';
    document.getElementById('songFile').value = '';
}

function openFullChat() {
    document.getElementById('chatOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeFullChat() {
    document.getElementById('chatOverlay').classList.remove('active');
    document.body.style.overflow = 'auto';
}

document.getElementById('songFile').onchange = (e) => {
    const file = e.target.files[0];
    if (file && !document.getElementById('songName').value) {
        document.getElementById('songName').value = file.name.replace('.mp3','');
    }
};

async function saveCustomSong() {
    const name = document.getElementById('songName').value.trim();
    const artist = document.getElementById('artistName').value.trim();
    const songFile = document.getElementById('songFile').files[0];

    if (!name || !artist || !songFile) {
        alert(currentLang === 'ar' ? 'الرجاء ملء جميع الحقول واختيار ملف MP3' : 'Please fill all fields and select MP3 file');
        return;
    }

    const song = {
        id: 'custom_' + Date.now(),
        name: name,
        artist: artist,
        file: songFile,
        uploaderId: myDeviceId,
        isDiscover: false
    };

    await saveSongToDB(song);
    await loadSongs();
    closeModal();
}

async function loadSongs() {
    customSongs = await getAllSongsFromDB();
    allSongs = [...discoverTracks, ...customSongs];
    renderSongsList();
}

function playSong(id) {
    currentPlaylist = allSongs;
    currentIndex = currentPlaylist.findIndex(s => s.id === id);
    if (currentIndex === -1) return;

    const song = currentPlaylist[currentIndex];
    updatePlayerUI(song);

    if (song.url) {
        audio.src = song.url;
    } else if (song.file) {
        audio.src = URL.createObjectURL(song.file);
    }
    audio.play();
}

function updatePlayerUI(song) {
    document.getElementById('miniPlayer').classList.add('active');
    document.getElementById('miniTitle').textContent = song.name;
    document.getElementById('miniArtist').textContent = song.artist.split('|')[0].trim();
    document.getElementById('miniArt').textContent = '💿';

    document.getElementById('fullSongName').textContent = song.name;
    document.getElementById('fullArtistName').textContent = song.artist.split('|')[0].trim();

    const fullArt = document.getElementById('fullPlayerArt');
    if (song.cover) {
        fullArt.style.backgroundImage = `url(${song.cover})`;
        fullArt.style.backgroundSize = 'cover';
        fullArt.style.backgroundPosition = 'center';
        fullArt.textContent = '';
    } else {
        fullArt.style.backgroundImage = 'none';
        fullArt.textContent = '💿';
    }
    updateActiveRow();
}

function updateActiveRow() {
    document.querySelectorAll('.song-row').forEach(row => {
        row.classList.remove('active');
        if (row.dataset.id === currentPlaylist[currentIndex]?.id) {
            row.classList.add('active');
        }
    });
}

function openFullPlayer() {
    document.getElementById('fullPlayer').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeFullPlayer() {
    document.getElementById('fullPlayer').classList.remove('active');
    document.body.style.overflow = 'auto';
}

document.getElementById('miniPlayer').onclick = openFullPlayer;

function togglePlayPause() {
    if (audio.paused) {
        audio.play();
    } else {
        audio.pause();
    }
}

function toggleShuffle() {
    isShuffle = !isShuffle;
    document.getElementById('shuffleBtn').classList.toggle('active', isShuffle);
}

function toggleRepeat() {
    isRepeat = !isRepeat;
    document.getElementById('repeatBtn').classList.toggle('active', isRepeat);
}

function toggleLike() {
    isLiked = !isLiked;
    likeBtn.textContent = isLiked ? '★' : '☆';
    likeBtn.style.color = isLiked ? '#1DB954' : 'white';
}

function shufflePlay() {
    if (allSongs.length === 0) return;
    const randomIndex = Math.floor(Math.random() * allSongs.length);
    playSong(allSongs[randomIndex].id);
}

function formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

audio.ontimeupdate = () => {
    if (audio.duration) {
        progressBar.value = (audio.currentTime / audio.duration) * 100;
        currentTimeEl.textContent = formatTime(audio.currentTime);
        totalTimeEl.textContent = formatTime(audio.duration);
    }
};

progressBar.oninput = () => {
    if (audio.duration) {
        audio.currentTime = (progressBar.value / 100) * audio.duration;
    }
};

audio.onplay = () => {
    playPauseBtn.textContent = '⏸️';
    document.querySelectorAll('.mini-control-btn')[0].textContent = '⏸️';
};
audio.onpause = () => {
    playPauseBtn.textContent = '▶️';
    document.querySelectorAll('.mini-control-btn')[0].textContent = '▶️';
};

audio.onended = () => {
    if (isRepeat) {
        audio.currentTime = 0;
        audio.play();
    } else {
        playNext();
    }
};

function playNext() {
    if (currentPlaylist.length === 0) return;
    if (isShuffle) {
        currentIndex = Math.floor(Math.random() * currentPlaylist.length);
    } else if (currentIndex < currentPlaylist.length - 1) {
        currentIndex++;
    } else {
        currentIndex = 0;
    }
    playSong(currentPlaylist[currentIndex].id);
}

function playPrev() {
    if (currentPlaylist.length === 0) return;
    if (audio.currentTime > 3) {
        audio.currentTime = 0;
    } else if (currentIndex > 0) {
        currentIndex--;
        playSong(currentPlaylist[currentIndex].id);
    } else {
        currentIndex = currentPlaylist.length - 1;
        playSong(currentPlaylist[currentIndex].id);
    }
}

function toggleDropdown(id) {
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
        if (menu.dataset.id !== id) menu.classList.remove('active');
    });
    const menu = document.querySelector(`.dropdown-menu[data-id="${id}"]`);
    if (menu) menu.classList.toggle('active');
}

async function deleteSong(id) {
    await deleteSongFromDB(id);
    await loadSongs();
    if (currentPlaylist[currentIndex]?.id === id) {
        audio.pause();
        document.getElementById('miniPlayer').classList.remove('active');
        closeFullPlayer();
    }
}

function renderSongsList() {
    const list = document.getElementById('songsList');
    list.innerHTML = '';
    allSongs.forEach(song => {
        const row = document.createElement('div');
        row.className = 'song-row';
        row.dataset.id = song.id;

        const artHtml = song.cover ? `<img src="${song.cover}" alt="">` : '💿';

        let deleteOption = '';
        if (!song.isDiscover && song.uploaderId === myDeviceId) {
            deleteOption = `<div class="dropdown-item delete" onclick="deleteSong('${song.id}')">${currentLang === 'ar' ? 'حذف' : 'Delete'}</div>`;
        }

        row.innerHTML = `
            <div class="song-art">${artHtml}</div>
            <div class="song-info">
                <div class="song-title">${song.name}</div>
                <div class="song-subtitle">📁 ${song.artist}</div>
            </div>
            <div class="song-actions">
                <span class="eq-icon">📶</span>
                <button class="more-btn" onclick="event.stopPropagation(); toggleDropdown('${song.id}')">⋮</button>
                <div class="dropdown-menu" data-id="${song.id}">
                    ${deleteOption}
                </div>
            </div>
        `;
        row.onclick = () => playSong(song.id);
        list.appendChild(row);
    });
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.more-btn')) {
        document.querySelectorAll('.dropdown-menu').forEach(menu => menu.classList.remove('active'));
    }
});

// Search logic
document.getElementById('searchInput').oninput = (e) => {
    const query = e.target.value.toLowerCase();
    document.querySelectorAll('.song-row').forEach(row => {
        const title = row.querySelector('.song-title').textContent.toLowerCase();
        const artist = row.querySelector('.song-subtitle').textContent.toLowerCase();
        row.style.display = (title.includes(query) || artist.includes(query)) ? 'flex' : 'none';
    });
};

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeFullPlayer();
});

window.onclick = function(e) {
    if (e.target == document.getElementById('addModal')) closeModal();
};

initDB().then(() => {
    loadSongs();
});
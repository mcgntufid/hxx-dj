// 1. Initialize IndexedDB (Simulated setup for demonstration)
function initDB() {
  return new Promise((resolve, reject) => {
    console.log("IndexedDB Initialized...");
    const savedSongs = [
      { id: 1, title: "Lofi Chill Beat", artist: "Unknown", cover: "https://via.placeholder.com/50/FF5733/FFFFFF?text=Lofi" },
      { id: 2, title: "Midnight Drive", artist: "Synthwave", cover: "https://via.placeholder.com/50/33A1FF/FFFFFF?text=Synth" }
    ];
    resolve(savedSongs);
  });
}

// 2. Render the Songs List
function renderSongsList(songs) {
  const listContainer = document.getElementById('song-list');
  listContainer.innerHTML = ''; 

  songs.forEach(song => {
    const li = document.createElement('li');
    li.className = 'song-item';

    li.innerHTML = 
      <div class="cover" style="background-image: url(${song.cover})"></div>
      <div class="song-info">
        <strong>${song.title}</strong><br>
        <small>${song.artist}</small>
      </div>
      <button class="menu-btn" onclick="toggleMenu(event, ${song.id})">⋮</button>
      
      <div class="dropdown-menu" id="menu-${song.id}">
        <button onclick="deleteSong(${song.id})">Delete Song</button>
      </div>
    ;
    listContainer.appendChild(li);
  });
}

// 3. Dropdown Menu Logic
function toggleMenu(event, id) {
  event.stopPropagation(); 
  closeAllMenus();
  document.getElementById(menu-${id}).classList.add('active');
}

function deleteSong(id) {
  console.log(Song ${id} deleted from IndexedDB!);
  alert(Song ${id} deleted!);
}

// 4. Click-Outside-to-Close Logic
function closeAllMenus() {
  document.querySelectorAll('.dropdown-menu').forEach(menu => {
    menu.classList.remove('active');
  });
}

document.addEventListener('click', () => {
  closeAllMenus();
});

// 5. Boot up the app
initDB().then(songs => {
  renderSongsList(songs);
}).catch(error => {
  console.error("Failed to load database:", error);
});

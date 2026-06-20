document.addEventListener("DOMContentLoaded", () => {
    const selectedTeamCode = localStorage.getItem('playerTeam');
    const selectedTeamFlag = localStorage.getItem('playerFlag');
    
    if (!selectedTeamCode || !selectedTeamFlag) {
        window.location.replace("index.html");
        return;
    }

    document.getElementById('my-team-name').textContent = selectedTeamCode;
    document.getElementById('my-team-flag').src = selectedTeamFlag; 

    const pitch = document.getElementById('pitch');
    const formationSelect = document.getElementById('formation');
    const drawBtn = document.getElementById('draw-btn');
    const draftAnimArea = document.getElementById('draft-animation');
    const rollingCountryText = document.getElementById('rolling-country');
    const playerListArea = document.getElementById('player-selection-list');
    const actionBox = document.getElementById('action-box');
    const formationBox = document.getElementById('formation-box');
    const statusText = document.getElementById('status-text');
    
    let worldCupData = [];
    let selectedPlayerToPlace = null; 
    let draftedPlayers = []; 

    const formations = {
        '4-3-3': { FWD: 3, MID: 3, DEF: 4, GK: 1 },
        '4-4-2': { FWD: 2, MID: 4, DEF: 4, GK: 1 },
        '3-5-2': { FWD: 2, MID: 5, DEF: 3, GK: 1 },
        '4-2-3-1': { FWD: 1, MID: 5, DEF: 4, GK: 1 }
    };

    function renderPitch(formationKey) {
        pitch.innerHTML = '';
        const config = formations[formationKey];
        const order = ['FWD', 'MID', 'DEF', 'GK'];

        order.forEach(pos => {
            const count = config[pos];
            if (count > 0) {
                const rowDiv = document.createElement('div');
                rowDiv.className = 'pitch-row';

                for (let i = 0; i < count; i++) {
                    const slot = document.createElement('div');
                    slot.className = 'player-slot';
                    slot.setAttribute('data-position', pos); 
                    slot.innerHTML = `<span class="slot-pos">${pos}</span><span class="slot-icon">+</span>`;
                    
                    slot.addEventListener('click', function() {
                        if (this.classList.contains('blink')) {
                            placePlayerInSlot(this);
                        }
                    });
                    rowDiv.appendChild(slot);
                }
                pitch.appendChild(rowDiv);
            }
        });
    }

    // --- KADRO KİLİDİ (READ-ONLY MODU) KONTROLÜ ---
    const isTournamentActive = sessionStorage.getItem('activeTournament') === 'true';
    const savedSquad = JSON.parse(localStorage.getItem('myDraftedSquad'));

    if (isTournamentActive && savedSquad && savedSquad.length === 11) {
        draftedPlayers = savedSquad;
        formationBox.style.display = 'none';
        renderPitch('4-3-3'); 
        
        const posOrder = { 'GK': 1, 'DEF': 2, 'MID': 3, 'FWD': 4 };
        savedSquad.sort((a, b) => posOrder[a.pos] - posOrder[b.pos]);
        
        savedSquad.forEach(player => {
            const emptySlot = document.querySelector(`.player-slot[data-position="${player.pos}"]:not(.occupied)`);
            if(emptySlot) {
                emptySlot.classList.add('occupied');
                emptySlot.innerHTML = player.rating;
            }
        });
        
        updateRosterUI();
        updateTeamRatings();

        actionBox.classList.remove('hidden');
        drawBtn.textContent = "TURNUVAYA GERİ DÖN";
        drawBtn.style.background = "linear-gradient(90deg, #d4af37, #aa8000)"; 
        
        drawBtn.addEventListener('click', () => {
            // Eğer grup aşaması bittiyse doğrudan elemelere, bitmediyse gruplara yolla
            if(localStorage.getItem('groupStageFinished') === 'true') {
                window.location.replace("elemeler.html");
            } else {
                window.location.replace("gruplar.html");
            }
        });

    } else {
        renderPitch(formationSelect.value);
        formationSelect.addEventListener('change', (e) => {
            renderPitch(e.target.value);
        });
        drawBtn.addEventListener('click', startDraftDraw);
        loadPlayersData();
    }

    async function loadPlayersData() {
        try {
            const response = await fetch('world-cup2026.json');
            worldCupData = await response.json();
        } catch (error) { console.error("JSON okunamadı."); }
    }

    function formatCountryNameForFlag(countryName) {
        const flagMap = {
            "Türkiye": "turkey", "Güney Kore": "south-korea", "Suudi Arabistan": "saudi",
            "Brezilya": "brazil", "Arjantin": "argentina", "Fransa": "france", "Almanya": "germany",
            "İngiltere": "england", "İspanya": "spain", "İtalya": "italy", "Portekiz": "portugal",
            "Hollanda": "netherlands", "Belçika": "belgium", "Hırvatistan": "croatia", "Norveç": "norway",
            "İsviçre": "switzerland", "Danimarka": "denmark", "İsveç": "sweden", "Polonya": "poland",
            "Sırbistan": "serbia", "Fas": "morocco", "Senegal": "senegal", "Mısır": "egypt",
            "Cezayir": "algeria", "Nijerya": "nigeria", "Kamerun": "cameroon", "Gana": "ghana",
            "Fildişi Sahili": "ivory-coast", "Japonya": "japan", "İran": "iran", "Avustralya": "australia",
            "Katar": "qatar", "Birleşik Arap Emirlikleri": "uae", "ABD": "usa", "Meksika": "mexico",
            "Kanada": "canada", "Kosta Rika": "costa-rica", "Uruguay": "uruguay", "Kolombiya": "colombia",
            "Şili": "chile", "Peru": "peru", "Ekvador": "equador", "Galler": "wales", "İskoçya": "scotland",
            "Ukrayna": "ukraine", "Yunanistan": "greece", "Çekya": "czech-republic", "Panama": "panama",
            "Güney Afrika": "south-africa", "Bosna Hersek": "bosnia", "Yeşil Burun Adaları": "cape-verde",
            "Irak": "iraq", "Avusturya": "austria", "Kongo Demokratik Cumhuriyeti": "congo", 
            "Özbekistan": "uzbekistan", "Ürdün": "jordan", "Tunus": "tunisia", "Haiti": "haiti"
        };
        if (flagMap[countryName]) return flagMap[countryName];
        const charMap = { 'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u', 'Ç': 'C', 'Ğ': 'G', 'İ': 'I', 'Ö': 'O', 'Ş': 'S', 'Ü': 'U' };
        let formatted = countryName.replace(/[çğıöşüÇĞİÖŞÜ]/g, match => charMap[match]);
        return formatted.toLowerCase().replace(/\s+/g, '-');
    }

    function updateTeamRatings() {
        let defSum = 0, defCount = 0;
        let midSum = 0, midCount = 0;
        let attSum = 0, attCount = 0;

        draftedPlayers.forEach(p => {
            let rating = parseInt(p.rating) || 0;
            if (p.pos === 'GK' || p.pos === 'DEF') { defSum += rating; defCount++; } 
            else if (p.pos === 'MID') { midSum += rating; midCount++; } 
            else if (p.pos === 'FWD') { attSum += rating; attCount++; }
        });

        document.getElementById('stat-def').textContent = defCount > 0 ? Math.round(defSum / defCount) : 0;
        document.getElementById('stat-mid').textContent = midCount > 0 ? Math.round(midSum / midCount) : 0;
        document.getElementById('stat-att').textContent = attCount > 0 ? Math.round(attSum / attCount) : 0;
    }

    function startDraftDraw() {
        if (selectedPlayerToPlace !== null || draftedPlayers.length >= 11) return;

        formationBox.style.display = 'none';
        actionBox.classList.add('hidden');
        statusText.classList.add('hidden');

        const availableCountries = worldCupData.filter(item => item.country !== selectedTeamCode);
        if (availableCountries.length === 0) return;

        draftAnimArea.classList.remove('hidden');
        playerListArea.classList.add('hidden');
        playerListArea.innerHTML = '';

        let counter = 0;
        const interval = setInterval(() => {
            const randomForAnim = availableCountries[Math.floor(Math.random() * availableCountries.length)].country;
            rollingCountryText.textContent = randomForAnim;
            counter++;

            if (counter > 15) { 
                clearInterval(interval);
                const finalCountryData = availableCountries[Math.floor(Math.random() * availableCountries.length)];
                rollingCountryText.textContent = ""; 
                showPlayersFromCountry(finalCountryData);
            }
        }, 80); 
    }

    function showPlayersFromCountry(countryData) {
        draftAnimArea.classList.add('hidden');
        playerListArea.classList.remove('hidden');
        
        const flagImgName = formatCountryNameForFlag(countryData.country);
        const countryTitle = document.createElement('div');
        countryTitle.style.display = 'flex';
        countryTitle.style.alignItems = 'center';
        countryTitle.style.justifyContent = 'center';
        countryTitle.style.gap = '10px';
        countryTitle.style.paddingBottom = '8px';
        countryTitle.style.marginBottom = '6px';
        countryTitle.style.borderBottom = '1px dashed #1e293b';
        countryTitle.style.flexShrink = '0';
        
        countryTitle.innerHTML = `
            <img src="flags/${flagImgName}.jpg" alt="Bayrak" style="width: 26px; height: 26px; border-radius: 50%; object-fit: cover; border: 1.5px solid #00d2ff;" onerror="this.src='flags/default.jpg'">
            <strong style="color: #00d2ff; font-size: 1.1rem; letter-spacing: 1px;">${countryData.country.toUpperCase()}</strong>
        `;
        playerListArea.appendChild(countryTitle);

        const positions = ['GK', 'DEF', 'MID', 'FWD'];
        let validPlayerCount = 0; 
        
        positions.forEach(pos => {
            const availableSlots = document.querySelectorAll(`.player-slot[data-position="${pos}"]:not(.occupied)`).length;
            
            if (countryData.players[pos]) {
                countryData.players[pos].forEach(player => {
                    const card = document.createElement('div');
                    card.className = 'draft-player-card';

                    const isAlreadyDrafted = player.isDrafted === true;
                    const displayName = isAlreadyDrafted ? `${player.name} <span style="color:#ef4444; font-size:0.7rem;">(Kadronda)</span>` : player.name;

                    card.innerHTML = `<div><span class="p-name">${displayName}</span><span class="p-pos">${pos}</span></div><span class="p-rating">${player.rating}</span>`;

                    if (availableSlots === 0 || isAlreadyDrafted) {
                        card.classList.add('disabled');
                        if(isAlreadyDrafted) card.style.opacity = '0.3'; 
                    } else {
                        validPlayerCount++;
                        card.addEventListener('click', () => {
                            selectPlayerFromList(player, pos, countryData.country);
                        });
                    }
                    playerListArea.appendChild(card);
                });
            }
        });

        playerListArea.scrollTop = 0;

        if (validPlayerCount === 0) {
            playerListArea.innerHTML += `<div style="color: #ef4444; font-weight: bold; text-align: center; margin-top: 15px;">Seçilebilir oyuncu yok, yeniden çekiliyor...</div>`;
            setTimeout(() => { startDraftDraw(); }, 1500);
        }
    }

    function selectPlayerFromList(player, pos, originalCountry) {
        player.isDrafted = true; 
        selectedPlayerToPlace = { name: player.name, rating: player.rating, pos: pos, originalCountry: originalCountry };
        playerListArea.classList.add('hidden');
        statusText.classList.remove('hidden');
        
        const validSlots = document.querySelectorAll(`.player-slot[data-position="${pos}"]:not(.occupied)`);
        validSlots.forEach(slot => slot.classList.add('blink'));
    }

    function placePlayerInSlot(slotElement) {
        slotElement.classList.remove('blink');
        slotElement.classList.add('occupied');
        slotElement.innerHTML = selectedPlayerToPlace.rating; 
        
        document.querySelectorAll('.blink').forEach(s => s.classList.remove('blink'));

        draftedPlayers.push(selectedPlayerToPlace);
        updateRosterUI();
        updateTeamRatings(); 

        selectedPlayerToPlace = null;
        statusText.classList.add('hidden');

        if (draftedPlayers.length === 11) {
            actionBox.classList.remove('hidden'); 
            drawBtn.textContent = "KADRO TAMAMLANDI - MAÇA GEÇ!";
            drawBtn.style.background = "linear-gradient(90deg, #10b981, #059669)"; 
            
            drawBtn.removeEventListener('click', startDraftDraw);
            drawBtn.addEventListener('click', () => {
                
                // YENİ OYUN BAŞLADI: ESKİ OYUNUN TÜM İZLERİNİ SİL! (Elemeler Dahil)
                localStorage.setItem('myDraftedSquad', JSON.stringify(draftedPlayers));
                localStorage.removeItem('tournamentData'); // Grupları sıfırla
                localStorage.removeItem('currentMatchday'); // Grup gününü sıfırla
                localStorage.removeItem('groupStageFinished'); // Grup bitiş bayrağını sıfırla
                localStorage.removeItem('bracketData'); // Elemeleri sıfırla (BUNU UNUTMUŞTUK)
                localStorage.removeItem('bracketRound'); // Eleme turunu sıfırla
                localStorage.removeItem('amIEliminated'); // Benim elenme durumumu sıfırla
                
                // Sisteme turnuvaya girdiğimizi haber ver (KİLİT MEKANİZMASI İÇİN)
                sessionStorage.setItem('activeTournament', 'true');
                
                window.location.replace("gruplar.html"); 
            });
        } else {
            setTimeout(() => { startDraftDraw(); }, 500);
        }
    }

    function updateRosterUI() {
        const rosterDiv = document.getElementById('roster-list');
        const countSpan = document.getElementById('player-count');
        
        rosterDiv.innerHTML = '';
        countSpan.textContent = `${draftedPlayers.length}/11`;

        const posOrder = { 'GK': 1, 'DEF': 2, 'MID': 3, 'FWD': 4 };
        const sortedPlayers = [...draftedPlayers].sort((a, b) => posOrder[a.pos] - posOrder[b.pos]);

        sortedPlayers.forEach(p => {
            const item = document.createElement('div');
            item.className = 'roster-item';
            item.innerHTML = `<span class="r-pos">${p.pos}</span><span class="r-name">${p.name}</span><span class="r-rating">${p.rating}</span>`;
            rosterDiv.appendChild(item);
        });
    }
});
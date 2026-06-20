document.addEventListener("DOMContentLoaded", () => {
    const myTeamCode = localStorage.getItem('playerTeam');
    let tournamentGroups = JSON.parse(localStorage.getItem('tournamentData'));
    
    let matchday = parseInt(localStorage.getItem('currentMatchday')) || 1;
    let groupStageFinished = localStorage.getItem('groupStageFinished') === 'true';

    function getCountryCode(countryName) {
        const codes = {
            "Meksika": "MEX", "Güney Afrika": "RSA", "Güney Kore": "KOR", "Çekya": "CZE",
            "Kanada": "CAN", "Bosna Hersek": "BIH", "Katar": "QAT", "İsviçre": "SUI",
            "Brezilya": "BRA", "Fas": "MAR", "Haiti": "HAI", "İskoçya": "SCO",
            "ABD": "USA", "Paraguay": "PAR", "Avustralya": "AUS", "Türkiye": "TUR",
            "Almanya": "GER", "Curaçao": "CUW", "Fildişi Sahili": "CIV", "Ekvador": "ECU",
            "Hollanda": "NED", "Japonya": "JPN", "İsveç": "SWE", "Tunus": "TUN",
            "Belçika": "BEL", "Mısır": "EGY", "İran": "IRN", "Yeni Zelanda": "NZL",
            "İspanya": "ESP", "Yeşil Burun Adaları": "CPV", "Suudi Arabistan": "KSA", "Uruguay": "URU",
            "Fransa": "FRA", "Senegal": "SEN", "Irak": "IRQ", "Norveç": "NOR",
            "Arjantin": "ARG", "Cezayir": "ALG", "Avusturya": "AUT", "Ürdün": "JOR",
            "Portekiz": "POR", "Kongo Demokratik Cumhuriyeti": "COD", "Özbekistan": "UZB", "Kolombiya": "COL",
            "İngiltere": "ENG", "Hırvatistan": "CRO", "Gana": "GHA", "Panama": "PAN"
        };
        return codes[countryName] || countryName.substring(0, 3).toUpperCase();
    }

    function formatCountryNameForFlag(countryName) {
        const flagMap = {
            "Türkiye": "turkey", "Güney Kore": "south-korea", "Suudi Arabistan": "saudi-arabia",
            "Brezilya": "brazil", "Arjantin": "argentina", "Fransa": "france", "Almanya": "germany",
            "İngiltere": "england", "İspanya": "spain", "İtalya": "italy", "Portekiz": "portugal",
            "Hollanda": "netherlands", "Belçika": "belgium", "Hırvatistan": "croatia", "Norveç": "norway",
            "İsviçre": "switzerland", "Danimarka": "denmark", "İsveç": "sweden", "Polonya": "poland",
            "Sırbistan": "serbia", "Fas": "morocco", "Senegal": "senegal", "Mısır": "egypt",
            "Cezayir": "algeria", "Nijerya": "nigeria", "Kamerun": "cameroon", "Gana": "ghana",
            "Fildişi Sahili": "ivory-coast", "Japonya": "japan", "İran": "iran", "Avustralya": "australia",
            "Katar": "qatar", "Birleşik Arap Emirlikleri": "uae", "ABD": "usa", "Meksika": "mexico",
            "Kanada": "canada", "Kosta Rika": "costa-rica", "Uruguay": "uruguay", "Kolombiya": "colombia",
            "Şili": "chile", "Peru": "peru", "Ekvador": "ecuador", "Galler": "wales", "İskoçya": "scotland",
            "Ukrayna": "ukraine", "Yunanistan": "greece", "Çekya": "czech-republic", "Panama": "panama",
            "Güney Afrika": "south-africa", "Bosna Hersek": "bosnia", "Yeşil Burun Adaları": "cape-verde",
            "Irak": "iraq", "Avusturya": "austria", "Kongo Demokratik Cumhuriyeti": "congo-dr", 
            "Özbekistan": "uzbekistan", "Ürdün": "jordan", "Tunus": "tunisia", "Haiti": "haiti"
        };
        if (flagMap[countryName]) return flagMap[countryName];
        const charMap = { 'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u', 'Ç': 'C', 'Ğ': 'G', 'İ': 'I', 'Ö': 'O', 'Ş': 'S', 'Ü': 'U' };
        let formatted = countryName.replace(/[çğıöşüÇĞİÖŞÜ]/g, match => charMap[match]);
        return formatted.toLowerCase().replace(/\s+/g, '-');
    }

    async function initializeTournament() {
        try {
            const response = await fetch('world-cup2026.json');
            const data = await response.json();
            
            let initialGroups = { 'A': [], 'B': [], 'C': [], 'D': [], 'E': [], 'F': [], 'G': [], 'H': [], 'I': [], 'J': [], 'K': [], 'L': [] };
            
            data.forEach(team => {
                const groupLetter = team.group;
                if(initialGroups[groupLetter]) {
                    initialGroups[groupLetter].push({
                        code: getCountryCode(team.country), 
                        flag: formatCountryNameForFlag(team.country),
                        pts: 0, gf: 0, ga: 0, gd: 0,
                        def: parseInt(team.team_ratings.DEF), 
                        mid: parseInt(team.team_ratings.MID), 
                        att: parseInt(team.team_ratings.ATT)
                    });
                }
            });

            tournamentGroups = initialGroups;
            localStorage.setItem('tournamentData', JSON.stringify(tournamentGroups));
            renderAllGroups();

        } catch (error) { console.error("Gruplar yüklenemedi: ", error); }
    }

    function renderAllGroups() {
        const container = document.getElementById('groups-container');
        container.innerHTML = '';

        Object.keys(tournamentGroups).forEach(letter => {
            const teamsInGroup = tournamentGroups[letter];

            teamsInGroup.sort((a, b) => {
                if (b.pts !== a.pts) return b.pts - a.pts;
                if (b.gd !== a.gd) return b.gd - a.gd;
                return b.gf - a.gf;
            });

            const groupBox = document.createElement('div');
            groupBox.className = 'group-box';

            const letterDiv = document.createElement('div');
            letterDiv.className = 'group-letter';
            letterDiv.textContent = letter;
            groupBox.appendChild(letterDiv);

            const teamListDiv = document.createElement('div');
            teamListDiv.className = 'team-list';

            teamsInGroup.forEach(team => {
                const rowDiv = document.createElement('div');
                rowDiv.className = team.code === myTeamCode ? 'team-row my-team' : 'team-row';

                rowDiv.innerHTML = `
                    <div class="team-info">
                        <img src="flags/${team.flag}.jpg" class="team-flag" onerror="this.src='flags/default.jpg'">
                        <span class="team-name">${team.code}</span>
                    </div>
                    <span class="team-pts">${team.pts}</span>
                `;
                teamListDiv.appendChild(rowDiv);
            });
            groupBox.appendChild(teamListDiv);
            container.appendChild(groupBox);
        });
    }

    if (!tournamentGroups) { initializeTournament(); } 
    else { renderAllGroups(); }

    const simBtn = document.getElementById('simulate-match-btn');
    
    if (groupStageFinished) {
        simBtn.textContent = "SON 32 TURUNA GEÇ (ELEMELER)";
        simBtn.style.background = "linear-gradient(90deg, #d4af37, #aa8000)";
        simBtn.addEventListener('click', () => {
            window.location.replace("elemeler.html"); // YÖNLENDİRME EKLENDİ
        });
    } else {
        simBtn.textContent = matchday + ". MAÇLARI SİMÜLE ET";
        simBtn.addEventListener('click', () => {
            window.location.replace("mac.html");
        });
    }
});
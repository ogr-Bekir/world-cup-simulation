document.addEventListener("DOMContentLoaded", async () => {
    const myTeamCode = localStorage.getItem('playerTeam');
    let tournamentGroups = JSON.parse(localStorage.getItem('tournamentData'));
    
    let isKnockout = localStorage.getItem('groupStageFinished') === 'true';
    let matchday = parseInt(localStorage.getItem('currentMatchday')) || 1;
    let bracketRound = parseInt(localStorage.getItem('bracketRound')) || 0;
    
    const roundNames = ["SON 32 TURU", "SON 16 TURU", "ÇEYREK FİNAL", "YARI FİNAL", "FİNAL"];
    document.getElementById('matchday-text').textContent = isKnockout ? roundNames[bracketRound] : `GRUP AŞAMASI - ${matchday}. MAÇ`;

    const mySquad = JSON.parse(localStorage.getItem('myDraftedSquad')) || [];
    let myDef = 0, myMid = 0, myAtt = 0, dCount = 0, mCount = 0, aCount = 0;
    mySquad.forEach(p => {
        let r = parseInt(p.rating);
        if (p.pos === 'GK' || p.pos === 'DEF') { myDef += r; dCount++; }
        else if (p.pos === 'MID') { myMid += r; mCount++; }
        else if (p.pos === 'FWD') { myAtt += r; aCount++; }
    });
    myDef = dCount > 0 ? Math.round(myDef / dCount) : 75;
    myMid = mCount > 0 ? Math.round(myMid / mCount) : 75;
    myAtt = aCount > 0 ? Math.round(myAtt / aCount) : 75;

    function getCountryCode(countryName) {
        const codes = {
            "Meksika": "MEX", "Güney Afrika": "RSA", "Güney Kore": "KOR", "Çekya": "CZE", "Kanada": "CAN", "Bosna Hersek": "BIH", "Katar": "QAT", "İsviçre": "SUI",
            "Brezilya": "BRA", "Fas": "MAR", "Haiti": "HAI", "İskoçya": "SCO", "ABD": "USA", "Paraguay": "PAR", "Avustralya": "AUS", "Türkiye": "TUR",
            "Almanya": "GER", "Curaçao": "CUW", "Fildişi Sahili": "CIV", "Ekvador": "ECU", "Hollanda": "NED", "Japonya": "JPN", "İsveç": "SWE", "Tunus": "TUN",
            "Belçika": "BEL", "Mısır": "EGY", "İran": "IRN", "Yeni Zelanda": "NZL", "İspanya": "ESP", "Yeşil Burun Adaları": "CPV", "Suudi Arabistan": "KSA", "Uruguay": "URU",
            "Fransa": "FRA", "Senegal": "SEN", "Irak": "IRQ", "Norveç": "NOR", "Arjantin": "ARG", "Cezayir": "ALG", "Avusturya": "AUT", "Ürdün": "JOR",
            "Portekiz": "POR", "Kongo Demokratik Cumhuriyeti": "COD", "Özbekistan": "UZB", "Kolombiya": "COL", "İngiltere": "ENG", "Hırvatistan": "CRO", "Gana": "GHA", "Panama": "PAN"
        };
        return codes[countryName] || countryName.substring(0, 3).toUpperCase();
    }

    let worldCupData = [];
    try {
        const response = await fetch('world-cup2026.json');
        worldCupData = await response.json();
    } catch (e) { console.error("JSON çekilemedi."); }

    function calculateGoals(att, mid, oppDef, oppMid) {
        let diff = ((att * 0.6) + (mid * 0.4)) - ((oppDef * 0.6) + (oppMid * 0.4));
        let expected = 1.2 + (diff * 0.05); 
        if (expected < 0.2) expected = 0.2; 
        let luck = Math.random(); 
        if (luck < 0.15) return Math.max(0, Math.round(expected - 1)); 
        else if (luck < 0.70) return Math.round(expected); 
        else if (luck < 0.90) return Math.round(expected + 1); 
        else return Math.round(expected + 2); 
    }

    function getRandomScorer(teamCode, isMyTeam) {
        let scorers = [];
        if (isMyTeam) {
            scorers = mySquad.filter(p => p.pos === 'FWD' || p.pos === 'MID');
            if (scorers.length === 0) scorers = mySquad; 
        } else {
            const tData = worldCupData.find(t => getCountryCode(t.country) === teamCode);
            if(tData && tData.players) {
                scorers = [...(tData.players.FWD || []), ...(tData.players.MID || [])];
                if(scorers.length === 0 && tData.players.DEF) scorers = [...tData.players.DEF];
            }
        }
        if (scorers && scorers.length > 0) {
            let randIndex = Math.floor(Math.random() * scorers.length);
            return scorers[randIndex].name;
        }
        return "Bilinmeyen Oyuncu"; 
    }

    function animateMyMatch(teamA, teamB, goalsA, goalsB) {
        document.getElementById('home-code').textContent = teamA.code;
        document.getElementById('home-flag').src = `flags/${teamA.flag}.jpg`;
        document.getElementById('away-code').textContent = teamB.code;
        document.getElementById('away-flag').src = `flags/${teamB.flag}.jpg`;

        let isAMe = (teamA.code === myTeamCode);
        let events = [];
        for(let i=0; i<goalsA; i++) { events.push({ min: Math.floor(Math.random() * 89) + 1, scorer: getRandomScorer(teamA.code, isAMe), isHome: true }); }
        for(let i=0; i<goalsB; i++) { events.push({ min: Math.floor(Math.random() * 89) + 1, scorer: getRandomScorer(teamB.code, !isAMe), isHome: false }); }
        events.sort((a, b) => a.min - b.min);

        const timeDisplay = document.getElementById('match-timer');
        const hScore = document.getElementById('home-score');
        const aScore = document.getElementById('away-score');
        const evList = document.getElementById('events-list');
        const finishBtn = document.getElementById('finish-match-btn');
        
        finishBtn.textContent = isKnockout ? "MAÇI BİTİR VE AĞACA DÖN" : "MAÇI BİTİR VE GRUBA DÖN";

        let currentMin = 0, cHome = 0, cAway = 0;
        const timer = setInterval(() => {
            currentMin++;
            timeDisplay.textContent = currentMin + "'";
            while (events.length > 0 && events[0].min === currentMin) {
                let ev = events.shift();
                const row = document.createElement('div');
                row.className = 'goal-row';
                if (ev.isHome) {
                    cHome++; hScore.textContent = cHome;
                    row.innerHTML = `<div class="goal-half goal-home">${ev.scorer} <span class="goal-icon">⚽</span> <span class="goal-min">${ev.min}'</span></div><div class="goal-half goal-away"></div>`;
                } else {
                    cAway++; aScore.textContent = cAway;
                    row.innerHTML = `<div class="goal-half goal-home"></div><div class="goal-half goal-away"><span class="goal-min">${ev.min}'</span> <span class="goal-icon">⚽</span> ${ev.scorer}</div>`;
                }
                evList.appendChild(row);
                evList.scrollTop = evList.scrollHeight; 
            }
            if (currentMin >= 90) {
                clearInterval(timer);
                timeDisplay.textContent = "MS";
                timeDisplay.style.background = "#d4af37";
                timeDisplay.style.color = "black";
                finishBtn.classList.remove('hidden');
            }
        }, 55); 
    }

    // --- GRUP AŞAMASI ---
    if (!isKnockout) {
        function simulateBackgroundMatchGroup(teamA, teamB) {
            let aDef = teamA.def; let aMid = teamA.mid; let aAtt = teamA.att;
            let bDef = teamB.def; let bMid = teamB.mid; let bAtt = teamB.att;
            let goalsA = calculateGoals(aAtt, aMid, bDef, bMid);
            let goalsB = calculateGoals(bAtt, bMid, aDef, aMid);
            teamA.gf += goalsA; teamA.ga += goalsB; teamA.gd += (goalsA - goalsB);
            teamB.gf += goalsB; teamB.ga += goalsA; teamB.gd += (goalsB - goalsA);
            if (goalsA > goalsB) { teamA.pts += 3; } else if (goalsB > goalsA) { teamB.pts += 3; } else { teamA.pts += 1; teamB.pts += 1; }
        }

        Object.keys(tournamentGroups).forEach(letter => {
            let group = tournamentGroups[letter];
            let m1, m2;
            if (matchday === 1) { m1 = [0, 1]; m2 = [2, 3]; }
            else if (matchday === 2) { m1 = [0, 2]; m2 = [1, 3]; }
            else { m1 = [0, 3]; m2 = [1, 2]; }

            let match1IsMine = (group[m1[0]].code === myTeamCode || group[m1[1]].code === myTeamCode);
            let match2IsMine = (group[m2[0]].code === myTeamCode || group[m2[1]].code === myTeamCode);

            if (match1IsMine) {
                let tA = group[m1[0]], tB = group[m1[1]];
                let gA = calculateGoals(myAtt, myMid, tB.def, tB.mid); let gB = calculateGoals(tB.att, tB.mid, myDef, myMid);
                if(tB.code === myTeamCode) { gA = calculateGoals(tA.att, tA.mid, myDef, myMid); gB = calculateGoals(myAtt, myMid, tA.def, tA.mid); }
                tA.gf += gA; tA.ga += gB; tA.gd += (gA - gB); tB.gf += gB; tB.ga += gA; tB.gd += (gB - gA);
                if (gA > gB) tA.pts += 3; else if (gB > gA) tB.pts += 3; else { tA.pts += 1; tB.pts += 1; }
                animateMyMatch(tA, tB, gA, gB);
            } else { simulateBackgroundMatchGroup(group[m1[0]], group[m1[1]]); }

            if (match2IsMine) {
                let tA = group[m2[0]], tB = group[m2[1]];
                let gA = calculateGoals(myAtt, myMid, tB.def, tB.mid); let gB = calculateGoals(tB.att, tB.mid, myDef, myMid);
                if(tB.code === myTeamCode) { gA = calculateGoals(tA.att, tA.mid, myDef, myMid); gB = calculateGoals(myAtt, myMid, tA.def, tA.mid); }
                tA.gf += gA; tA.ga += gB; tA.gd += (gA - gB); tB.gf += gB; tB.ga += gA; tB.gd += (gB - gA);
                if (gA > gB) tA.pts += 3; else if (gB > gA) tB.pts += 3; else { tA.pts += 1; tB.pts += 1; }
                animateMyMatch(tA, tB, gA, gB);
            } else { simulateBackgroundMatchGroup(group[m2[0]], group[m2[1]]); }
        });

        document.getElementById('finish-match-btn').addEventListener('click', () => {
            localStorage.setItem('tournamentData', JSON.stringify(tournamentGroups));
            if (matchday < 3) { localStorage.setItem('currentMatchday', matchday + 1); } 
            else { localStorage.setItem('groupStageFinished', 'true'); }
            window.location.replace("gruplar.html");
        });
    } 
    // --- ELEME AŞAMASI ---
    else {
        let bracketData = JSON.parse(localStorage.getItem('bracketData'));
        let currentMatches = bracketData[bracketRound];
        let nextRoundMatches = [];

        // Önce Benim Maçımı Bul ve Görsel Olarak Oynat
        let myMatchData = currentMatches.find(m => m.team1.code === myTeamCode || m.team2.code === myTeamCode);
        
        currentMatches.forEach(match => {
            let t1 = match.team1; let t2 = match.team2;
            let isT1Me = (t1.code === myTeamCode); let isT2Me = (t2.code === myTeamCode);

            let t1Def = isT1Me ? myDef : t1.def; let t1Mid = isT1Me ? myMid : t1.mid; let t1Att = isT1Me ? myAtt : t1.att;
            let t2Def = isT2Me ? myDef : t2.def; let t2Mid = isT2Me ? myMid : t2.mid; let t2Att = isT2Me ? myAtt : t2.att;

            let g1 = calculateGoals(t1Att, t1Mid, t2Def, t2Mid);
            let g2 = calculateGoals(t2Att, t2Mid, t1Def, t1Mid);

            // Elemelerde Beraberlik Olmaz (Penaltılar)
            if (g1 === g2) { if (Math.random() > 0.5) g1++; else g2++; }

            match.score1 = g1; match.score2 = g2;
            match.winner = (g1 > g2) ? t1 : t2;
            match.isPlayed = true;

            // Eğer ben yenildiysem durumu kaydet
            if ((isT1Me && g1 < g2) || (isT2Me && g2 < g1)) {
                localStorage.setItem('amIEliminated', 'true');
            }

            if (isT1Me || isT2Me) { animateMyMatch(t1, t2, g1, g2); }
        });

        // Kazananları Bir Sonraki Tura Hazırla (Final hariç)
        if (bracketRound < 4) {
            for (let i = 0; i < currentMatches.length; i += 2) {
                nextRoundMatches.push({
                    team1: currentMatches[i].winner,
                    team2: currentMatches[i+1].winner,
                    score1: null, score2: null, winner: null, isPlayed: false
                });
            }
            bracketData[bracketRound + 1] = nextRoundMatches;
        }

        document.getElementById('finish-match-btn').addEventListener('click', () => {
            localStorage.setItem('bracketData', JSON.stringify(bracketData));
            localStorage.setItem('bracketRound', bracketRound + 1);
            window.location.replace("elemeler.html");
        });
    }
});
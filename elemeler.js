document.addEventListener("DOMContentLoaded", () => {
    
    const myTeamCode = localStorage.getItem('playerTeam');
    let tournamentGroups = JSON.parse(localStorage.getItem('tournamentData'));
    
    // BENİM RÜYA KADROM
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

    let bracketData = JSON.parse(localStorage.getItem('bracketData'));
    let currentRound = parseInt(localStorage.getItem('bracketRound')) || 0; 
    let amIEliminated = localStorage.getItem('amIEliminated') === 'true';

    const roundNames = ["SON 32 TURU", "SON 16 TURU", "ÇEYREK FİNAL", "YARI FİNAL", "FİNAL"];
    if(currentRound < 5) document.getElementById('round-title').textContent = roundNames[currentRound];
    else document.getElementById('round-title').textContent = "ŞAMPİYON BELLİ OLDU";

    // 1. AĞACI OLUŞTUR (İlk Açılış)
    if (!bracketData) {
        let allTeams = [];
        Object.keys(tournamentGroups).forEach(groupLetter => {
            let group = tournamentGroups[groupLetter];
            group.sort((a, b) => {
                if (b.pts !== a.pts) return b.pts - a.pts;
                if (b.gd !== a.gd) return b.gd - a.gd;
                return b.gf - a.gf;
            });
            group[0].rank = 1; group[1].rank = 2; group[2].rank = 3;
            allTeams.push(group[0], group[1], group[2]);
        });

        let firsts = allTeams.filter(t => t.rank === 1).sort((a,b) => (b.pts - a.pts) || (b.gd - a.gd));
        let seconds = allTeams.filter(t => t.rank === 2).sort((a,b) => (b.pts - a.pts) || (b.gd - a.gd));
        let thirds = allTeams.filter(t => t.rank === 3).sort((a,b) => (b.pts - a.pts) || (b.gd - a.gd)).slice(0, 8);

        let pot1 = [...firsts, seconds[0], seconds[1], seconds[2], seconds[3]]; 
        let pot2 = [...seconds.slice(4), ...thirds]; 

        let roundOf32 = [];
        for (let i = 0; i < 16; i++) {
            roundOf32.push({
                team1: pot1[i], team2: pot2[15 - i], 
                score1: null, score2: null, winner: null, isPlayed: false
            });
        }

        bracketData = [ roundOf32, Array(8).fill({}), Array(4).fill({}), Array(2).fill({}), Array(1).fill({}) ];
        localStorage.setItem('bracketData', JSON.stringify(bracketData));
    }

    // 2. TABLOYU ÇİZ
    function renderBracket() {
        const container = document.getElementById('bracket-container');
        container.innerHTML = '';

        const cols = [
            { title: "SON 32", matches: bracketData[0].slice(0,8) },
            { title: "SON 16", matches: bracketData[1].slice(0,4) },
            { title: "ÇEYREK FİNAL", matches: bracketData[2].slice(0,2) },
            { title: "YARI FİNAL", matches: bracketData[3].slice(0,1) },
            { title: "FİNAL", matches: bracketData[4], isFinal: true },
            { title: "YARI FİNAL", matches: bracketData[3].slice(1,2) },
            { title: "ÇEYREK FİNAL", matches: bracketData[2].slice(2,4) },
            { title: "SON 16", matches: bracketData[1].slice(4,8) },
            { title: "SON 32", matches: bracketData[0].slice(8,16) }
        ];

        cols.forEach(colData => {
            const colDiv = document.createElement('div');
            colDiv.className = colData.isFinal ? 'bracket-column final-col' : 'bracket-column';
            
            const cTitle = document.createElement('div');
            cTitle.className = 'col-title';
            cTitle.textContent = colData.title;
            colDiv.appendChild(cTitle);

            colData.matches.forEach(match => {
                const mBox = document.createElement('div');
                mBox.className = 'match-box';

                if (!match.team1 || !match.team1.code) {
                    mBox.innerHTML = `
                        <div class="t-row"><div class="t-info"><span class="t-name">Belli Değil</span></div></div>
                        <div class="t-row"><div class="t-info"><span class="t-name">Belli Değil</span></div></div>
                    `;
                } else {
                    let isT1Me = (match.team1.code === myTeamCode);
                    let isT2Me = (match.team2.code === myTeamCode);
                    if(isT1Me || isT2Me) mBox.classList.add('my-match');

                    let t1Class = 't-row'; let t2Class = 't-row';
                    if (isT1Me) t1Class += ' my-team';
                    if (isT2Me) t2Class += ' my-team';

                    if (match.isPlayed) {
                        if (match.score1 > match.score2) { t1Class += ' winner'; t2Class += ' passive'; } 
                        else { t2Class += ' winner'; t1Class += ' passive'; }
                    }

                    mBox.innerHTML = `
                        <div class="${t1Class}">
                            <div class="t-info"><img src="flags/${match.team1.flag}.jpg" class="t-flag" onerror="this.src='flags/default.jpg'"><span class="t-name">${match.team1.code}</span></div>
                            <span class="t-score">${match.score1 !== null ? match.score1 : '-'}</span>
                        </div>
                        <div class="${t2Class}">
                            <div class="t-info"><img src="flags/${match.team2.flag}.jpg" class="t-flag" onerror="this.src='flags/default.jpg'"><span class="t-name">${match.team2.code}</span></div>
                            <span class="t-score">${match.score2 !== null ? match.score2 : '-'}</span>
                        </div>
                    `;
                }
                colDiv.appendChild(mBox);
            });
            container.appendChild(colDiv);
        });

        if (currentRound === 0) container.scrollLeft = 0; 
        else container.scrollLeft = (container.scrollWidth - container.clientWidth) / 2; 
    }
    renderBracket();

    // 3. BUTON KONTROLÜ VE HIZLI SİMÜLASYON
    const btn = document.getElementById('simulate-round-btn');
    
    // BUTON DURUMLARI (Turnuva Bittiğinde Artık Tıklanabilir ve Yeniden Başlatır)
    if (currentRound >= 5) {
        btn.textContent = "TURNUVA BİTTİ - YENİDEN BAŞLA"; 
        btn.disabled = false;
        btn.style.background = "linear-gradient(90deg, #d4af37, #aa8000)";
    } else if (amIEliminated) {
        btn.textContent = "GERİ KALANI OTOMATİK SİMÜLE ET";
        btn.classList.add('danger');
    }

    function calculateKnockoutGoals(att, mid, oppDef, oppMid) {
        let diff = ((att * 0.6) + (mid * 0.4)) - ((oppDef * 0.6) + (oppMid * 0.4));
        let expected = 1.2 + (diff * 0.05); 
        if (expected < 0.2) expected = 0.2; 
        let luck = Math.random(); 
        if (luck < 0.15) return Math.max(0, Math.round(expected - 1)); 
        else if (luck < 0.70) return Math.round(expected); 
        else if (luck < 0.90) return Math.round(expected + 1); 
        else return Math.round(expected + 2); 
    }

    btn.addEventListener('click', () => {
        // A) EĞER TURNUVA BİTTİYSE: BÜYÜK SIFIRLAMA VE ANA SAYFAYA DÖNÜŞ
        if (currentRound >= 5) {
            localStorage.clear(); // Her şeyi kökten temizle
            sessionStorage.clear(); // Kilitleri aç
            window.location.replace("index.html"); // Ana giriş ekranına fırlat
            return;
        }

        // B) Eğer Elendiysem (Otomatik Hızlı Simülasyon)
        if (amIEliminated) {
            while (currentRound < 5) {
                let currentMatches = bracketData[currentRound];
                let nextRoundMatches = [];
                for (let i = 0; i < currentMatches.length; i++) {
                    let m = currentMatches[i];
                    let g1 = calculateKnockoutGoals(m.team1.att, m.team1.mid, m.team2.def, m.team2.mid);
                    let g2 = calculateKnockoutGoals(m.team2.att, m.team2.mid, m.team1.def, m.team1.mid);
                    if (g1 === g2) { if (Math.random() > 0.5) g1++; else g2++; }
                    m.score1 = g1; m.score2 = g2; m.winner = (g1 > g2) ? m.team1 : m.team2; m.isPlayed = true;
                }
                if (currentRound < 4) {
                    for (let i = 0; i < currentMatches.length; i += 2) {
                        nextRoundMatches.push({ team1: currentMatches[i].winner, team2: currentMatches[i+1].winner, score1: null, score2: null, winner: null, isPlayed: false });
                    }
                    bracketData[currentRound + 1] = nextRoundMatches;
                }
                currentRound++;
            }
            localStorage.setItem('bracketData', JSON.stringify(bracketData));
            localStorage.setItem('bracketRound', currentRound);
            
            // Simülasyon bitti, butonu yeniden başlata çevir
            btn.textContent = "TURNUVA BİTTİ - YENİDEN BAŞLA"; 
            btn.disabled = false; 
            btn.classList.remove('danger');
            btn.style.background = "linear-gradient(90deg, #d4af37, #aa8000)";
            document.getElementById('round-title').textContent = "ŞAMPİYON BELLİ OLDU";
            
            renderBracket();
            return;
        }

        // C) Normal Turnuva Akışı (Maç ekranına yolla)
        window.location.replace("mac.html");
    });
});
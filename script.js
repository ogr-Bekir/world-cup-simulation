document.addEventListener("DOMContentLoaded", () => {
    // --- BİLGİLENDİRME EKRANI (MODAL) İŞLEMLERİ ---
    const welcomeModal = document.getElementById('welcome-modal');
    const startGameBtn = document.getElementById('start-game-btn');

    // Oyna butonuna basılınca modalı yavaşça gizle
    startGameBtn.addEventListener('click', () => {
        welcomeModal.classList.add('hidden');
    });

    // --- TAKIM SEÇİM İŞLEMLERİ ---
    const teamButtons = document.querySelectorAll('.team-slot');
    const confirmButton = document.getElementById('confirm-btn');
    let selectedTeamCode = null;
    let selectedTeamFlag = null; // Bayrak yolunu tutacak değişken

    teamButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Önce tüm butonlardaki seçili durumunu kaldır
            teamButtons.forEach(btn => btn.classList.remove('selected'));
            
            // Tıklanan butona seçili durumunu ekle
            button.classList.add('selected');
            
            // Tıklanan takımın kodunu ve bayrak görselinin yolunu al
            selectedTeamCode = button.getAttribute('data-team');
            selectedTeamFlag = button.querySelector('.team-flag').getAttribute('src'); 
            
            // Onay butonunu aktif et ve yazısını güncelle
            confirmButton.disabled = false;
            confirmButton.textContent = `${selectedTeamCode} İLE OYUNA BAŞLA`;
        });
    });

    // Oyuna Başla butonuna tıklandığında
    confirmButton.addEventListener('click', () => {
        if (selectedTeamCode && selectedTeamFlag) {
            // Seçilen takımı ve bayrağı tarayıcı hafızasına kaydet
            localStorage.setItem('playerTeam', selectedTeamCode);
            localStorage.setItem('playerFlag', selectedTeamFlag); 
            
            // Kadro kurma sayfasına yönlendir
            window.location.href = "kadro.html"; 
        }
    });
});
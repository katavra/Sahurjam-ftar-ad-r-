

class GameManager {
    constructor() {
        this.score = 0;
        this.money = 0;
        this.day = 1;
        this.phase = 'iftar'; // 'iftar' veya 'sahur'
        this.dayLength = 120;
        this.time = this.dayLength;
        
        this.gameContainer = document.getElementById('game-container');
        this.waiter = new Waiter(this.gameContainer);
        this.kitchen = new Kitchen();
        
        this.customers = [];
        this.tables = [];

        // İftar malzemeleri: but, ayran, salata
        this.iftarIngredients = ["🍗", "🥛", "🥗"]; // but, ayran, salata
        
        // İftar kombinasyonlari
        this.iftarMeals = [
            "🍗🥛",    // but + ayran
            "🍗🥗",    // but + salata
            "🥛🥗",    // ayran + salata
            "🍗🥛🥗", // tam set
        ];

        // Sahur malzemeleri: domates, peynir, börek
        this.sahurIngredients = ["🍅", "🧀", "🥐"]; // domates, peynir, börek
        
        // Sahur kombinasyonlari
        this.sahurMeals = [
            "🍅🧀", // domates + peynir
            "🍅🥐", // domates + börek
            "🧀🥐", // peynir + börek
            "🍅🧀🥐", // tam set
        ];
        // Ses efektleri
        this.bgMusic = new Audio('muzik.m4a');
        this.bgMusic.loop = true;
        this.cannonSound = new Audio('bomba.m4a');
        this.musicMuted = false;
        
        this.init(); // Setup events and counter immediately, but don't start timers yet
    }

    init() {
        this.bindEvents();
        this.setupTables();
        this.updateKitchenCounter();
        
        // Giriş Ekranını Dinle
        const startIftar = document.getElementById('btn-iftar');
        const startSahur = document.getElementById('btn-sahur');
        
        const startWithPhase = (phase) => {
            this.phase = phase;
            document.getElementById('start-screen').style.display = 'none';
            this.startGame();
        };
        
        if (startIftar) startIftar.addEventListener('click', () => startWithPhase('iftar'));
        if (startSahur) startSahur.addEventListener('click', () => startWithPhase('sahur'));
    }

    startGame() {
        // Müziği başlat (Tarayıcı etkileşim sonrası izin verir)
        if (this.bgMusic) {
            this.bgMusic.play().catch(e => console.log("Müzik başlatılamadı:", e));
        }

        // Tezgahı seçilen faza göre güncelle
        this.updateKitchenCounter();
        
        // Starts Game Loop
        this.timerInterval = setInterval(() => this.tickTimer(), 1000);
        
        // Spawn first customer
        setTimeout(() => this.spawnCustomer(), 2000);
        
        this.updateHUD(); // Initialize HUD and lighting
    }

    tickTimer() {
        this.time--;
        if (this.time <= 0) {
            this.endOfDay();
        }
        this.updateHUD();
    }

    updateHUD() {
        document.getElementById('score').innerText = this.score;
        document.getElementById('money').innerText = this.money;
        document.getElementById('time').innerText = this.time;
        
        const phaseName = this.phase === 'iftar' ? 'İftar' : 'Sahur';
        document.getElementById('day-counter').innerText = `${this.day}. Gün ${phaseName}`;
        
        // Fenerleri ve Gece Efektini Sahur'da göster
        const lanternString = document.getElementById('lantern-string');
        const nightOverlay = document.getElementById('night-overlay');
        
        const isNight = this.phase === 'sahur';
        
        if (lanternString) {
            lanternString.style.display = isNight ? 'block' : 'none';
        }
        if (nightOverlay) {
            nightOverlay.style.opacity = isNight ? '1' : '0';
        }
    }

    bindEvents() {
        // Yardımcı fonksiyon: Tıklanan bölgeye garsonu gönder
        const goToZone = (zone, callback) => {
            const rect = zone.getBoundingClientRect();
            const containerRect = this.gameContainer.getBoundingClientRect();
            
            // Masaya/Mutfaga gidiş koordinatı (merkezi)
            const targetX = rect.left - containerRect.left + (rect.width / 2);
            const targetY = rect.top - containerRect.top + (rect.height / 2) + 20;

            this.waiter.moveTo(targetX, targetY, () => {
                if(callback) callback();
            });
        };

        // Mevcut statik interactive-zone'lar
        document.querySelectorAll('.interactive-zone').forEach(zone => {
            zone.addEventListener('click', (e) => {
                goToZone(zone, () => this.handleInteraction(zone));
            });
        });

        // Dinamik olarak eklenen yemeklere (meal) tıklama dinleyicisi
        document.addEventListener('meal-ready', (e) => {
            const mealEl = e.detail.element;
            mealEl.addEventListener('click', (ev) => {
                ev.stopPropagation(); // Mutfak tezgahı click eventini engelle
                goToZone(mealEl, () => this.handleInteraction(mealEl));
            });
        });

        // Müşteriye tıklandığında (masaya tıklamak yerine)
        document.addEventListener('customer-clicked', (e) => {
            const customer = e.detail.customer;
            // Find which table the customer is seated at
            const table = this.tables.find(t => t.customer === customer);
            if (table) {
                // Waiter moves to the customer's location
                goToZone(customer.element, () => this.handleInteraction(table.element));
            }
        });

        document.addEventListener('customer-angry', (e) => {
             const c = e.detail.customer;
             
             // 50 para cezası, oyun bitmez
             if (e.detail.penalty) {
                 this.money = Math.max(0, this.money - 50);
                 this.updateHUD();
             }
             
             // Masadan kalkma
             const table = this.tables.find(t => t.customer === c);
             if (table) table.free();
             
             this.customers = this.customers.filter(cust => cust !== c);
        });

        // Ramazan Topu Etkileşimi
        const cannon = document.getElementById('ramadan-cannon');
        if (cannon) {
            cannon.addEventListener('click', () => {
                cannon.classList.add('shake-cannon');
                
                if (this.cannonSound) {
                    this.cannonSound.currentTime = 1; // 1. saniyeden atak başlat
                    this.cannonSound.play().catch(e => console.log("Ses çalınamadı:", e));
                }
                
                setTimeout(() => cannon.classList.remove('shake-cannon'), 500);
            });
        }


        // Market Events
        // (Market button removed from HUD)

        document.getElementById('close-market').addEventListener('click', () => {
            document.getElementById('market-modal').style.display = 'none';
            if (this.time === this.dayLength) {
                // Starting a new day if timer was reset
                this.startNewDay();
            }
        });

        document.querySelectorAll('.buy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetId = parseInt(btn.getAttribute('data-target'));
                const price = parseInt(btn.getAttribute('data-price'));

                if (this.money >= price) {
                    this.money -= price;
                    this.updateHUD();

                    // Unlock table
                    const table = this.tables.find(t => t.id === targetId);
                    if (table) {
                        table.isLocked = false;
                        table.element.classList.remove('locked');
                    }

                    // Update Market UI
                    btn.parentElement.classList.add('bought');
                    btn.remove();
                } else {
                    alert("Yeterli paranız yok! Gerekli miktar: ₺" + price);
                }
            });
        });

        // Müzik Aç/Kapat Butonu
        const musicBtn = document.getElementById('music-toggle');
        if (musicBtn) {
            musicBtn.addEventListener('click', () => this.toggleMusic());
        }
    }

    toggleMusic() {
        if (!this.bgMusic) return;
        
        this.musicMuted = !this.musicMuted;
        this.bgMusic.muted = this.musicMuted;
        
        const musicBtn = document.getElementById('music-toggle');
        if (musicBtn) {
            musicBtn.innerText = this.musicMuted ? '🔇' : '🔊';
        }
    }

    handleInteraction(zone) {
        const type = zone.getAttribute('data-type');
        
        if (type === 'table') {
            const tableId = parseInt(zone.getAttribute('data-id'));
            const table = this.tables.find(t => t.id === tableId);
            
            if (table && table.customer) {
                const c = table.customer;
                
                if (c.state === 'ORDERING') {
                    const order = c.takeOrder();
                    // Sadece sipariş alınır, tezgaha ekleme yok. Malzemeler hep orada.
                } 
                else if (c.state === 'WAITING_FOOD' && this.waiter.hasItem()) {
                    // Garson yemek getiriyorsa
                    const success = c.receiveFood(this.waiter.heldItem);
                    if (success) {
                        this.waiter.dropItem();
                    }
                }
                else if (c.state === 'READY_TO_PAY') {
                    // Puanı al
                    const earns = c.payAndLeave();
                    this.money += earns;
                    this.score += 10;
                    this.updateHUD();
                    table.free();
                }
            }
        }
        else if (type === 'meal') {
            // Mutfaktan belirli bir hazır yemeği al (Removed since meals are hand-combined now)
        }
        else if (type === 'trash') {
            // Garsonun elindeki yemeği çöpe at
            if (this.waiter.hasItem()) {
                this.waiter.dropItem();
            }
        }
        else if (type === 'register') {
            // Bonus ya da banka (geliştirilecek)
        }
    }

    setupTables() {
        document.querySelectorAll('.table').forEach(tEl => {
            const id = parseInt(tEl.getAttribute('data-id'));
            
            // X ve Y değerlerini element üzerinden okuyalım
            const rect = tEl.getBoundingClientRect();
            const containerRect = this.gameContainer.getBoundingClientRect();
            const x = rect.left - containerRect.left;
            const y = rect.top - containerRect.top;

            this.tables.push({
                id: id,
                element: tEl,
                x: x,
                y: y,
                isFull: false,
                isLocked: tEl.classList.contains('locked'),
                customer: null,
                free: function() {
                    this.isFull = false;
                    this.customer = null;
                }
            });
        });
    }

    updateKitchenCounter() {
        const counter = document.getElementById('kitchen-counter');
        if (!counter) return;
        
        counter.innerHTML = ''; // Temizle
        
        if (this.phase === 'sahur') {
            // Sahur'da: sabit malzeme istasyonları (🧀 🥐 🍅)
            this.sahurIngredients.forEach(ingredient => {
                const btn = document.createElement('div');
                btn.className = 'text-meal interactive-zone';
                btn.style.fontSize = '2rem';
                btn.style.padding = '12px';
                btn.innerText = ingredient;
                
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const rect = btn.getBoundingClientRect();
                    const containerRect = this.gameContainer.getBoundingClientRect();
                    const targetX = rect.left - containerRect.left + (rect.width / 2);
                    const targetY = rect.top - containerRect.top + (rect.height / 2) + 20;
                    
                    this.waiter.moveTo(targetX, targetY, () => {
                        this.waiter.addIngredient(ingredient);
                    });
                });
                
                counter.appendChild(btn);
            });
        } else {
            // İftar'da: sabit malzeme istasyonları (🍗 🥛 🥗)
            this.iftarIngredients.forEach(ingredient => {
                const btn = document.createElement('div');
                btn.className = 'text-meal interactive-zone';
                btn.style.fontSize = '2rem';
                btn.style.padding = '12px';
                btn.innerText = ingredient;
                
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const rect = btn.getBoundingClientRect();
                    const containerRect = this.gameContainer.getBoundingClientRect();
                    const targetX = rect.left - containerRect.left + (rect.width / 2);
                    const targetY = rect.top - containerRect.top + (rect.height / 2) + 20;
                    
                    this.waiter.moveTo(targetX, targetY, () => {
                        this.waiter.addIngredient(ingredient);
                    });
                });
                
                counter.appendChild(btn);
            });
        }
    }

    spawnCustomer() {
        if (this.time <= 0) return; // Gün sonundaysa gelmesin

        // Generate next spawn conditionally
        const baseTime = 6000;
        const randomBonus = Math.random() * 4000;
        setTimeout(() => this.spawnCustomer(), baseTime + randomBonus);
        // Boş masa bul (Kilitli olmayan)
        const emptyTable = this.tables.find(t => !t.isFull && !t.isLocked);
        if (!emptyTable) return;

        // Yarat ve yolla: Sağdan, aşağıdan 300px yukarıdan
        const containerRect = this.gameContainer.getBoundingClientRect();
        const startX = containerRect.width;
        const startY = containerRect.height - 300;

        // Pass current available meals to customer based on day progression
        const availableMealCount = Math.min(3 + (this.day - 1), 20); // starts at 3, max 20
        const activeMenuList = this.phase === 'iftar' ? this.iftarMeals : this.sahurMeals;
        const currentMenu = activeMenuList.slice(0, availableMealCount);

        const customer = new Customer('normal', startX, startY, this.gameContainer, currentMenu);
        this.customers.push(customer);
        
        emptyTable.isFull = true;
        emptyTable.customer = customer;

        // Masa animasyonu: DOM çizildikten az sonra hareketi tetikle
        setTimeout(() => {
            // Masa 175x175 (275px görsel). 4 sandalyeden birini rastgele seç
            const seatPositions = [
                { x: 55, y: 25 },   // Üst Sol
                { x: 105, y: 25 },  // Üst Sağ
                { x: 55, y: 140 },  // Alt Sol
                { x: 105, y: 140 }  // Alt Sağ
            ];
            
            const randomSeat = seatPositions[Math.floor(Math.random() * seatPositions.length)];
            const targetX = emptyTable.x + randomSeat.x;
            const targetY = emptyTable.y + randomSeat.y;
            
            customer.moveTo(targetX, targetY, () => {
                 customer.seatAt(emptyTable);
            });
        }, 50);
    }

    endOfDay() {
        clearInterval(this.timerInterval);
        
        // Günü Değerlendir (Update Summary UI instead of alert)
        document.getElementById('day-summary-title').innerText = `Gün ${this.day} Bitti!`;
        document.getElementById('summary-money').innerText = this.money;
        document.getElementById('summary-score').innerText = this.score;
        
        // Müşterileri temizle
        this.customers.forEach(c => c.element.remove());
        this.customers = [];
        this.tables.forEach(t => t.free());

        // Elindeki yemeği sil
        if (this.waiter.hasItem()) {
            this.waiter.dropItem();
        }

        // Tezgahtaki yemekleri sil (Removed as no pre-cooked meals exist)

        this.waiter.moveTo(this.gameContainer.clientWidth / 2, this.gameContainer.clientHeight / 2);

        // Next Day Prep
        this.time = this.dayLength;
        // İlerleyiş (Phase değişimi)
        if (this.phase === 'iftar') {
            this.phase = 'sahur';
        } else {
            this.phase = 'iftar';
            this.day++;
        }
        
        this.updateHUD();
        this.updateKitchenCounter(); // Yeni güne ait menüyü tezgaha yerleştir

        // Show Market Automatically
        document.getElementById('market-modal').style.display = 'flex';

        // Modal closed triggers new day start in market button events
    }

    startNewDay() {
        this.updateHUD();
        this.timerInterval = setInterval(() => this.tickTimer(), 1000);
        setTimeout(() => this.spawnCustomer(), 2000);
    }
}

// Oyunu başlat
new GameManager();

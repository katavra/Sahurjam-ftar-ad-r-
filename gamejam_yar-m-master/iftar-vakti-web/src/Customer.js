class Customer {
    constructor(type, x, y, containerElement, currentMenu) {
        this.type = type; // 'aile', 'yasli', vb.
        this.container = containerElement;
        
        // Settings based on GDD
        this.maxPatience = 100; // Total
        this.patience = this.maxPatience;
        this.patienceDecreaseRate = 2; // Per second initially
        this.state = 'WAITING_SEAT'; // WAITING_SEAT, SEATED, ORDERING, WAITING_FOOD, EATING, READY_TO_PAY, LEFT

        this.element = this.createDOM(x, y);
        this.orderBubble = null;
        this.patienceBar = null;
        this.patienceInterval = null;
        
        const safeMenu = currentMenu || ["Domates çorbası"];
        const randomMeal = safeMenu[Math.floor(Math.random() * safeMenu.length)];
        
        this.desiredItem = { 
            id: randomMeal, 
            icon: randomMeal, 
            points: 15 // sabit puan
        };
    }

    createDOM(x, y) {
        const char = document.createElement('div');
        char.className = 'customer-sprite interactive-customer';
        const karakterler = ['karakter1.jpeg', 'karakter2.jpeg', 'karakter3.jpeg', 'karakter4.jpeg'];
        if (Customer._charIndex === undefined) Customer._charIndex = 0;
        const charImg = karakterler[Customer._charIndex % karakterler.length];
        Customer._charIndex++;
        char.innerHTML = `<img src="${charImg}" class="customer-img" />`;
        char.style.left = `${x}px`;
        char.style.top = `${y}px`;
        char.style.cursor = 'pointer';
        
        char.addEventListener('click', (e) => {
            e.stopPropagation();
            const event = new CustomEvent('customer-clicked', { detail: { customer: this } });
            document.dispatchEvent(event);
        });

        this.container.appendChild(char);
        return char;
    }

    moveTo(x, y, onComplete) {
        this.element.style.left = `${x}px`;
        this.element.style.top = `${y}px`;
        
        setTimeout(() => {
            if(onComplete) onComplete();
        }, 3000); // 3 seconds matching the CSS transition
    }

    seatAt(table) {
        this.state = 'SEATED';
        
        // Sabr barı hemen göster
        this.createPatienceBar();
        this.startPatienceTimer();
        
        // Hemen el kaldırsın (sipariş vermeye hazır)
        this.showOrder();
    }

    createPatienceBar() {
        if (!this.patienceBarContainer) {
            this.patienceBarContainer = document.createElement('div');
            this.patienceBarContainer.className = 'patience-bar-container';
            this.patienceBar = document.createElement('div');
            this.patienceBar.className = 'patience-bar';
            this.patienceBarContainer.appendChild(this.patienceBar);
            this.element.appendChild(this.patienceBarContainer);
            this.updatePatienceUI();
        }
    }

    showOrder() {
        this.state = 'ORDERING';
        
        this.orderBubble = document.createElement('div');
        this.orderBubble.className = 'order-bubble';
        this.orderBubble.innerHTML = '🖐️';
        this.element.appendChild(this.orderBubble);

        // Sabır sıfırlanır, tekrar azalmaya başlar yeni bekleme evresi için
        this.resetPatience();
    }

    takeOrder() {
        if (this.state === 'ORDERING') {
            this.state = 'WAITING_FOOD';
            this.orderBubble.innerHTML = '⏳ ' + this.desiredItem.icon;
            this.resetPatience();
            return this.desiredItem;
        }
        return null;
    }

    receiveFood(foodItem) {
        // Sort individual emoji chars so order of picking doesn't matter
        const sortEmoji = str => [...str].sort().join('');
        const desired = sortEmoji(this.desiredItem.icon);
        const offered = sortEmoji(foodItem.icon);
        
        if (this.state === 'WAITING_FOOD' && desired === offered) {
            this.state = 'EATING';
            if(this.orderBubble) this.orderBubble.remove();
            this.stopPatienceTimer();
            
            // Eating time
            setTimeout(() => {
                this.state = 'READY_TO_PAY';
                this.element.innerHTML = '😋';
                
                this.orderBubble = document.createElement('div');
                this.orderBubble.className = 'order-bubble';
                this.orderBubble.innerHTML = '💵';
                this.element.appendChild(this.orderBubble);
                
                this.resetPatience();
                this.startPatienceTimer();
            }, 4000);
            return true;
        }
        return false; // Wrong food
    }

    payAndLeave() {
        if (this.state === 'READY_TO_PAY') {
            this.state = 'LEFT';
            
            // Cleanup UI
            if(this.orderBubble) this.orderBubble.remove();
            if(this.patienceBarContainer) this.patienceBarContainer.remove();
            
            this.stopPatienceTimer();
            const rect = this.container.getBoundingClientRect();
            this.moveTo(rect.width / 2, rect.height + 50, () => {
                this.element.remove();
            });
            
            // Point formula
            return this.desiredItem.points + Math.floor(this.patience / 10);
        }
        return 0;
    }

    // UI and Logic for time
    startPatienceTimer() {
        if (!this.patienceBarContainer) {
            this.createPatienceBar();
        }

        this.patienceInterval = setInterval(() => {
            this.patience -= this.patienceDecreaseRate;
            this.updatePatienceUI();

            if (this.patience <= 0) {
                this.getAngryAndLeave();
            }
        }, 1000); // Ticks every second
    }

    stopPatienceTimer() {
        clearInterval(this.patienceInterval);
    }

    resetPatience() {
        this.patience = this.maxPatience;
        this.updatePatienceUI();
    }

    updatePatienceUI() {
        if(this.patienceBar) {
            const pct = Math.max(0, (this.patience / this.maxPatience) * 100);
            this.patienceBar.style.width = `${pct}%`;
            
            if (pct > 60) this.patienceBar.style.backgroundColor = '#00ff00';
            else if (pct > 30) this.patienceBar.style.backgroundColor = '#ffcc00';
            else this.patienceBar.style.backgroundColor = '#ff0000';
        }
    }

    getAngryAndLeave() {
        this.state = 'LEFT';
        this.stopPatienceTimer();
        this.element.innerHTML = '😠'; // Angry face
        if(this.orderBubble) this.orderBubble.remove();
        if(this.patienceBarContainer) this.patienceBarContainer.remove();
        
        // Exit to the right (where they came from)
        const rect = this.container.getBoundingClientRect();
        this.moveTo(rect.width + 100, rect.height - 300, () => {
             this.element.remove();
        });

        // Notify game manager: ceza kes ve oyunu bitirme
        const event = new CustomEvent('customer-angry', { detail: { customer: this, penalty: true } });
        document.dispatchEvent(event);
    }
}

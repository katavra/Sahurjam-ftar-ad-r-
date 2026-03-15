class Waiter {
    constructor(gameContainer) {
        this.element = document.getElementById('waiter');
        this.trayElement = document.getElementById('tray');
        
        // State
        this.isMoving = false;
        this.heldItem = null;
        this.position = { x: 450, y: 250 };
        this.speed = 300; // ms for transition
    }

    moveTo(x, y, onComplete = null) {
        if (this.moveTimeout) {
            clearTimeout(this.moveTimeout);
        }
        
        this.isMoving = true;
        this.position = { x, y };
        
        // CSS Transition handles the animation
        this.element.style.left = `${x}px`;
        this.element.style.top = `${y}px`;

        this.moveTimeout = setTimeout(() => {
            this.isMoving = false;
            this.moveTimeout = null;
            if (onComplete) onComplete();
        }, 800); // Slowed down 50% from 400ms
    }

    pickUpItem(itemData) {
        this.heldItem = itemData;
        this.trayElement.style.display = 'flex';
        this.trayElement.innerHTML = itemData.icon;
    }

    addIngredient(emojiChar) {
        if (!this.heldItem) {
            // Yeni yemek başlat
            this.heldItem = { id: emojiChar, icon: emojiChar, points: 15 };
        } else {
            // Mevcut combinasyona ekle
            this.heldItem.icon += emojiChar;
            this.heldItem.id = this.heldItem.icon;
        }
        this.trayElement.style.display = 'flex';
        this.trayElement.innerHTML = this.heldItem.icon;
    }

    dropItem() {
        const item = this.heldItem;
        this.heldItem = null;
        this.trayElement.style.display = 'none';
        this.trayElement.innerHTML = '';
        return item;
    }

    hasItem() {
        return this.heldItem !== null;
    }
}

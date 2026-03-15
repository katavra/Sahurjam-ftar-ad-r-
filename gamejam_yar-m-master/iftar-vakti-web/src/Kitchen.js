class Kitchen {
    constructor() {
        this.readyMeals = []; // Yemekler burada bekler
        this.isCooking = false;
        this.counterElement = document.getElementById('kitchen-counter');
    }

    // Yemek pişirme simülasyonu
    cookMeal(mealId, icon, prepTimeMs, onReady) {
        this.isCooking = true;
        
        // Puan/isim detayları menüde tanımlı gibi düşünüldü
        setTimeout(() => {
            const uniqueId = mealId + '_' + Date.now() + Math.random();
            const mealData = { id: mealId, icon: icon, points: 20, uniqueId: uniqueId };
            
            // Görseli oluştur
            const mealEl = document.createElement('div');
            mealEl.className = 'ready-meal interactive-zone';
            mealEl.setAttribute('data-type', 'meal');
            mealEl.setAttribute('data-meal', uniqueId);
            mealEl.innerHTML = icon;
            this.counterElement.appendChild(mealEl);
            mealData.element = mealEl; // Sakla ki silerken silelim

            this.readyMeals.push(mealData);
            this.isCooking = false;
            
            // Trigger an event so GameManager can bind click easily
            const event = new CustomEvent('meal-ready', { detail: { element: mealEl } });
            document.dispatchEvent(event);

            if (onReady) onReady(mealData);
        }, prepTimeMs);
    }
    
    hasReadyMeals() {
        return this.readyMeals.length > 0;
    }

    // This method is now replaced by click events on the meals themselves,
    // which we will handle in GameManager. We expose a function to remove a specific meal.
    removeMeal(mealIdStr) {
        const index = this.readyMeals.findIndex(m => m.uniqueId === mealIdStr);
        if (index > -1) {
            const meal = this.readyMeals.splice(index, 1)[0];
            if(meal.element) meal.element.remove();
            return meal;
        }
        return null;
    }
}

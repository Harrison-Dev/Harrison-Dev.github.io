// 遊戲狀態
const gameState = {
    day: 1,
    money: 10000,
    gameOver: false,
    maxDays: 30,
    products: {
        a: { name: '商品A', price: 100, tariff: 10, inventory: 0 },
        b: { name: '商品B', price: 150, tariff: 15, inventory: 0 },
        c: { name: '商品C', price: 80, tariff: 5, inventory: 0 }
    },
    tariffChanges: [],
    priceMultipliers: { a: 1, b: 1, c: 1 }
};

// DOM 元素
const elements = {
    currentDay: document.getElementById('current-day'),
    currentMoney: document.getElementById('current-money'),
    tariffs: {
        a: document.getElementById('tariff-a'),
        b: document.getElementById('tariff-b'),
        c: document.getElementById('tariff-c')
    },
    inventory: {
        a: document.getElementById('inventory-a'),
        b: document.getElementById('inventory-b'),
        c: document.getElementById('inventory-c')
    },
    prices: {
        a: document.getElementById('price-a'),
        b: document.getElementById('price-b'),
        c: document.getElementById('price-c')
    },
    buyInputs: {
        a: document.getElementById('buy-a'),
        b: document.getElementById('buy-b'),
        c: document.getElementById('buy-c')
    },
    sellInputs: {
        a: document.getElementById('sell-a'),
        b: document.getElementById('sell-b'),
        c: document.getElementById('sell-c')
    },
    buyButtons: document.querySelectorAll('.buy-btn'),
    sellButtons: document.querySelectorAll('.sell-btn'),
    nextDayBtn: document.getElementById('next-day-btn'),
    logContainer: document.getElementById('log-container'),
    tariffForecast: document.getElementById('tariff-forecast'),
    modal: document.getElementById('game-over-modal'),
    finalMoney: document.getElementById('final-money'),
    restartBtn: document.getElementById('restart-btn')
};

// 初始化遊戲
function initGame() {
    updateUI();
    generateTariffChanges();
    updateTariffForecast();
    addLog('遊戲開始！您從 $' + gameState.money + ' 起步。');

    // 設置按鈕事件監聽
    elements.buyButtons.forEach(btn => {
        btn.addEventListener('click', () => buyProduct(btn.dataset.product));
    });

    elements.sellButtons.forEach(btn => {
        btn.addEventListener('click', () => sellProduct(btn.dataset.product));
    });

    elements.nextDayBtn.addEventListener('click', nextDay);
    elements.restartBtn.addEventListener('click', restartGame);
}

// 更新界面
function updateUI() {
    elements.currentDay.textContent = gameState.day;
    elements.currentMoney.textContent = gameState.money;

    // 更新關稅
    for (const [key, product] of Object.entries(gameState.products)) {
        elements.tariffs[key].textContent = product.tariff + '%';
        elements.inventory[key].textContent = product.inventory;
        
        // 計算顯示價格（包含關稅）
        const displayPrice = Math.round(product.price * (1 + product.tariff / 100) * gameState.priceMultipliers[key]);
        elements.prices[key].textContent = displayPrice;
    }
}

// 生成關稅變化計劃
function generateTariffChanges() {
    gameState.tariffChanges = [];
    
    // 生成未來幾天的關稅變化點
    const numChanges = 5 + Math.floor(Math.random() * 5); // 5-10個變化點
    
    for (let i = 0; i < numChanges; i++) {
        const day = 2 + Math.floor(Math.random() * (gameState.maxDays - 2)); // 從第2天開始可能有變化
        const product = ['a', 'b', 'c'][Math.floor(Math.random() * 3)];
        const changeType = Math.random() > 0.5 ? 'increase' : 'decrease';
        const changeAmount = 5 + Math.floor(Math.random() * 20); // 5-25%的變化
        
        gameState.tariffChanges.push({
            day,
            product,
            changeType,
            changeAmount
        });
    }
    
    // 按天數排序
    gameState.tariffChanges.sort((a, b) => a.day - b.day);
}

// 更新關稅預測
function updateTariffForecast() {
    const nextChanges = gameState.tariffChanges.filter(change => change.day > gameState.day).slice(0, 2);
    
    if (nextChanges.length === 0) {
        elements.tariffForecast.textContent = '未來幾天關稅可能保持穩定。';
        return;
    }
    
    const forecasts = nextChanges.map(change => {
        const daysUntil = change.day - gameState.day;
        const product = gameState.products[change.product].name;
        const direction = change.changeType === 'increase' ? '上漲' : '下降';
        
        return `${daysUntil}天後，${product}的關稅可能會${direction}。`;
    });
    
    elements.tariffForecast.textContent = forecasts.join(' ');
}

// 購買產品
function buyProduct(productKey) {
    const amount = parseInt(elements.buyInputs[productKey].value);
    if (isNaN(amount) || amount <= 0) {
        addLog('請輸入有效的購買數量。');
        return;
    }
    
    const product = gameState.products[productKey];
    const totalCost = Math.round(amount * product.price * (1 + product.tariff / 100) * gameState.priceMultipliers[productKey]);
    
    if (totalCost > gameState.money) {
        addLog(`資金不足，無法購買 ${amount} 個 ${product.name}。`);
        return;
    }
    
    // 執行購買
    gameState.money -= totalCost;
    product.inventory += amount;
    
    addLog(`購買了 ${amount} 個 ${product.name}，花費 $${totalCost}。`);
    elements.buyInputs[productKey].value = 0;
    updateUI();
}

// 銷售產品
function sellProduct(productKey) {
    const amount = parseInt(elements.sellInputs[productKey].value);
    if (isNaN(amount) || amount <= 0) {
        addLog('請輸入有效的銷售數量。');
        return;
    }
    
    const product = gameState.products[productKey];
    
    if (amount > product.inventory) {
        addLog(`庫存不足，無法銷售 ${amount} 個 ${product.name}。`);
        return;
    }
    
    // 銷售價格比購買價格略高（不包含關稅）
    const sellPriceMultiplier = 1.1 + Math.random() * 0.1; // 1.1-1.2的售價倍數
    const totalEarning = Math.round(amount * product.price * sellPriceMultiplier * gameState.priceMultipliers[productKey]);
    
    // 執行銷售
    gameState.money += totalEarning;
    product.inventory -= amount;
    
    addLog(`銷售了 ${amount} 個 ${product.name}，獲得 $${totalEarning}。`);
    elements.sellInputs[productKey].value = 0;
    updateUI();
}

// 進入下一天
function nextDay() {
    if (gameState.gameOver) return;
    
    gameState.day++;
    
    // 檢查遊戲是否結束
    if (gameState.day > gameState.maxDays) {
        endGame();
        return;
    }
    
    // 應用關稅變化
    applyTariffChanges();
    
    // 隨機價格波動
    applyPriceFluctuations();
    
    // 更新UI
    updateUI();
    updateTariffForecast();
    addLog(`進入第 ${gameState.day} 天。`);
}

// 應用關稅變化
function applyTariffChanges() {
    const todaysChanges = gameState.tariffChanges.filter(change => change.day === gameState.day);
    
    todaysChanges.forEach(change => {
        const product = gameState.products[change.product];
        const oldTariff = product.tariff;
        
        if (change.changeType === 'increase') {
            product.tariff += change.changeAmount;
        } else {
            product.tariff = Math.max(0, product.tariff - change.changeAmount);
        }
        
        const direction = change.changeType === 'increase' ? '上漲' : '下降';
        addLog(`${product.name}的關稅${direction}了，從 ${oldTariff}% 變為 ${product.tariff}%。`);
    });
    
    // 每5天隨機添加一個戲劇性的關稅變化
    if (gameState.day % 5 === 0) {
        const product = ['a', 'b', 'c'][Math.floor(Math.random() * 3)];
        const isMajorIncrease = Math.random() > 0.3;
        const changeAmount = isMajorIncrease ? 30 + Math.floor(Math.random() * 30) : 5 + Math.floor(Math.random() * 10);
        
        if (isMajorIncrease) {
            gameState.products[product].tariff += changeAmount;
            addLog(`🔥 重大事件：${gameState.products[product].name}的關稅突然大幅上漲 ${changeAmount}%！`);
        } else {
            gameState.products[product].tariff = Math.max(0, gameState.products[product].tariff - changeAmount);
            addLog(`⭐ 好消息：${gameState.products[product].name}的關稅下降了 ${changeAmount}%！`);
        }
    }
}

// 應用價格波動
function applyPriceFluctuations() {
    for (const key of Object.keys(gameState.products)) {
        // 價格有小幅度波動
        const fluctuation = 0.95 + Math.random() * 0.1; // 0.95-1.05之間的波動
        gameState.priceMultipliers[key] *= fluctuation;
        
        // 確保倍數在合理範圍內
        if (gameState.priceMultipliers[key] < 0.8) gameState.priceMultipliers[key] = 0.8;
        if (gameState.priceMultipliers[key] > 1.2) gameState.priceMultipliers[key] = 1.2;
    }
}

// 添加日誌
function addLog(message) {
    const logEntry = document.createElement('p');
    logEntry.textContent = `[第 ${gameState.day} 天] ${message}`;
    elements.logContainer.prepend(logEntry);
    
    // 限制日誌條目數量
    if (elements.logContainer.children.length > 50) {
        elements.logContainer.removeChild(elements.logContainer.lastChild);
    }
}

// 結束遊戲
function endGame() {
    gameState.gameOver = true;
    elements.finalMoney.textContent = gameState.money;
    elements.modal.style.display = 'flex';
    
    // 根據資金判斷表現
    let performance;
    if (gameState.money >= 30000) {
        performance = '傑出的貿易商！';
    } else if (gameState.money >= 20000) {
        performance = '優秀的貿易商！';
    } else if (gameState.money >= 15000) {
        performance = '還不錯的貿易商。';
    } else if (gameState.money >= 10000) {
        performance = '勉強保本。';
    } else {
        performance = '需要更多的練習...';
    }
    
    addLog(`遊戲結束！您的最終資金是 $${gameState.money}。${performance}`);
}

// 重新開始遊戲
function restartGame() {
    // 重置遊戲狀態
    gameState.day = 1;
    gameState.money = 10000;
    gameState.gameOver = false;
    gameState.products = {
        a: { name: '商品A', price: 100, tariff: 10, inventory: 0 },
        b: { name: '商品B', price: 150, tariff: 15, inventory: 0 },
        c: { name: '商品C', price: 80, tariff: 5, inventory: 0 }
    };
    gameState.priceMultipliers = { a: 1, b: 1, c: 1 };
    
    // 清空日誌
    elements.logContainer.innerHTML = '';
    
    // 關閉模態框
    elements.modal.style.display = 'none';
    
    // 重新初始化
    generateTariffChanges();
    updateUI();
    updateTariffForecast();
    addLog('遊戲重新開始！您從 $' + gameState.money + ' 起步。');
}

// 初始化遊戲
document.addEventListener('DOMContentLoaded', initGame); 
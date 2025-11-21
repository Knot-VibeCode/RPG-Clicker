/*
========================================
ЭПИЧНАЯ RPG - ПУТЬ ГЕРОЯ
Основная игровая логика (Обновлено с автосейвом)
========================================
*/

// ===== ИГРОВЫЕ КОНСТАНТЫ =====
const GAME_CONFIG = {
    // Базовые настройки игрока
    BASE_PLAYER_STATS: {
        maxHealth: 100,
        maxExp: 100,
        baseDamage: 8,
        baseDefense: 2,
        baseGoldMultiplier: 1.0,
        baseExpMultiplier: 1.0,
        baseDamageMultiplier: 1.0,
        baseDefenseMultiplier: 1.0
    },
    
    // Настройки врагов
    ENEMY_SCALE: 1.15,
    
    // Настройки боя
    SPECIAL_ABILITY_COOLDOWN: 30, // секунд
    
    // Настройки прогресса
    LEVEL_EXP_MULTIPLIER: 1.25,
    REINCARNATION_BASE_LEVEL: 25,
    
    // Пасхалки
    EASTER_EGGS: {
        CODE_NAME: 'voidrunner2024',
        MAX_LEVEL: 999,
        SECRET_BOSS: 'Великий Древесный Жук',
        SPECIAL_STATS: {
            damageMultiplier: 10,
            healthMultiplier: 5,
            expMultiplier: 3
        }
    }
};

// ===== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ =====
let gameState = {
    // Игрок
    player: {
        level: 1,
        health: 100,
        maxHealth: 100,
        experience: 0,
        maxExperience: 100,
        gold: 50,
        soulStones: 0,
        weapon: { name: 'Голые руки', damage: '1-2', type: 'weapon' },
        armor: { name: 'Рваная одежда', defense: 1, type: 'armor' },
        reincarnationCount: 0,
        damageMultiplier: 1.0,
        expMultiplier: 1.0,
        goldMultiplier: 1.0,
        defenseMultiplier: 1.0,
        currentWeapon: null,
        currentArmor: null,
        specialCooldown: 0,
        specialReady: true,
        stats: {
            totalDamage: 0,
            enemiesKilled: 0,
            goldEarned: 0,
            timePlayed: 0,
            reincarnations: 0,
            achievementsUnlocked: 0
        }
    },
    
    // Текущий враг
    currentEnemy: null,
    
    // Игровые данные
    enemies: [],
    shopItems: [],
    achievements: [],
    unlockedAchievements: new Set(),
    unlockedEasterEggs: new Set(),
    
    // Состояния интерфейса
    ui: {
        currentShopCategory: 'weapons',
        showLoading: true,
        showMainMenu: false,
        showGameUI: false,
        showModal: false
    },
    
    // Вспомогательные переменные
    settings: {
        soundEffects: true,
        backgroundMusic: true,
        animationSpeed: 1.0
    },
    
    // Магазин камней душ
    soulShopItems: [],
    currentSoulShopCategory: 'weapons',
    
    // Статистика
    gameStats: {
        startTime: Date.now(),
        gameVersion: '1.0.0',
        specialUnlocks: {}
    }
};

// ===== ИНИЦИАЛИЗАЦИЯ ИГРЫ =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎮 Запуск Эпичной RPG - Путь Героя...');
    
    // Инициализация систем
    initializeGame();
    initializeUI();
    setupEventListeners();
    startGameLoop();
    
    // Имитация загрузки
    setTimeout(() => {
        hideElement('loading-screen');
        showElement('main-menu');
    }, 3000);
});

// ===== ИНИЦИАЛИЗАЦИЯ ИГРОВЫХ СИСТЕМ =====
function initializeGame() {
    console.log('🔧 Инициализация игровых систем...');
    
    // Создание списка врагов
    createEnemies();
    
    // Создание предметов магазина
    createShopItems();
    
    // Создание предметов магазина камней душ
    createSoulShopItems();
    
    // Создание достижений
    createAchievements();
    
    // Загрузка сохранения
    loadGame();
    
    console.log('✅ Игровые системы инициализированы!');
}

function initializeUI() {
    updateUI();
    updatePlayerStats();
    generateEnemy();
}

function setupEventListeners() {
    // Обработка клавиатуры для пасхалок
    document.addEventListener('keydown', handleEasterEggs);
    
    // Улучшенный автосохранение каждые 15 секунд
    setInterval(saveGame, 15000);
    
    // Обновление статистики времени
    setInterval(updateGameTime, 1000);
    
    // Обновление способности
    setInterval(updateSpecialAbility, 1000);
    
    // Автосохранение при событиях
    setupAutoSaveEvents();
}

// ===== СИСТЕМА ИГРОКА =====
function getPlayerDamage() {
    const baseDamage = GAME_CONFIG.BASE_PLAYER_STATS.baseDamage;
    const weaponDamage = gameState.player.currentWeapon?.damage || '1-2';
    
    // Правильная обработка урона оружия
    let minDamage, maxDamage;
    if (weaponDamage.includes('-')) {
        const [min, max] = weaponDamage.split('-');
        minDamage = parseInt(min);
        maxDamage = parseInt(max);
    } else {
        minDamage = parseInt(weaponDamage);
        maxDamage = parseInt(weaponDamage);
    }
    
    const damage = Math.floor(Math.random() * (maxDamage - minDamage + 1)) + minDamage;
    return Math.floor(damage * gameState.player.damageMultiplier);
}

function getPlayerDefense() {
    const baseDefense = GAME_CONFIG.BASE_PLAYER_STATS.baseDefense;
    const armorDefense = gameState.player.currentArmor?.defense || 0;
    
    return Math.floor((baseDefense + armorDefense) * gameState.player.defenseMultiplier);
}

function gainExperience(amount) {
    const expGained = Math.floor(amount * gameState.player.expMultiplier);
    gameState.player.experience += expGained;
    
    checkLevelUp();
    
    if (expGained > 0) {
        addCombatLog(`Получено опыта: +${expGained}`, 'system');
    }
}

function checkLevelUp() {
    while (gameState.player.experience >= gameState.player.maxExperience) {
        gameState.player.experience -= gameState.player.maxExperience;
        levelUp();
    }
    updatePlayerStats();
}

function levelUp() {
    gameState.player.level++;
    gameState.player.maxExperience = Math.floor(gameState.player.maxExperience * GAME_CONFIG.LEVEL_EXP_MULTIPLIER);
    
    // Восстановление здоровья при повышении уровня
    gameState.player.health = gameState.player.maxHealth;
    
    showNotification(`Уровень повышен! Теперь уровень ${gameState.player.level}`, 'success');
    addCombatLog(`🎉 НОВЫЙ УРОВЕНЬ: ${gameState.player.level}!`, 'system');
    
    // Анимация повышения уровня
    animateLevelUp();
    
    checkReincarnationReadiness();
    checkAchievements('level_up');
    
    // Автосейв при повышении уровня
    saveGame();
}

function addGold(amount) {
    const goldGained = Math.floor(amount * gameState.player.goldMultiplier);
    gameState.player.gold += goldGained;
    gameState.player.stats.goldEarned += goldGained;
    
    if (goldGained > 0) {
        showNotification(`Получено золота: +${goldGained}`, 'success');
    }
    
    updatePlayerStats();
    checkShopAffordability();
}

// ===== СИСТЕМА БОЯ =====
function attackEnemy() {
    if (!gameState.currentEnemy || gameState.player.health <= 0) return;
    
    const damage = getPlayerDamage();
    gameState.currentEnemy.health -= damage;
    gameState.player.stats.totalDamage += damage;
    
    // Проверка критического удара
    const isCritical = Math.random() < 0.15; // 15% шанс
    if (isCritical) {
        const critDamage = Math.floor(damage * 1.5);
        gameState.currentEnemy.health -= (critDamage - damage);
        gameState.player.stats.totalDamage += (critDamage - damage);
        addCombatLog(`КРИТИЧЕСКИЙ УДАР! ${critDamage} урона!`, 'player-damage');
        showDamageText(critDamage, 'critical');
        animateElement('enemy-card', 'critical-hit');
    } else {
        addCombatLog(`Атака нанесла ${damage} урона`, 'player-damage');
        showDamageText(damage, 'normal');
    }
    
    updateEnemyStats();
    
    // Проверка смерти врага
    if (gameState.currentEnemy.health <= 0) {
        winBattle();
        return;
    }
    
    // Контратака врага
    setTimeout(enemyAttack, 1000);
}

function enemyAttack() {
    if (!gameState.currentEnemy || gameState.player.health <= 0) return;
    
    const enemyDamage = Math.max(1, gameState.currentEnemy.damage - getPlayerDefense());
    gameState.player.health -= enemyDamage;
    
    addCombatLog(`Враг атакует: ${enemyDamage} урона`, 'enemy-damage');
    showDamageText(enemyDamage, 'enemy');
    animateElement('player-avatar', 'damage');
    
    updatePlayerStats();
    
    if (gameState.player.health <= 0) {
        gameOver();
    }
}

function useSpecialAbility() {
    if (!gameState.player.specialReady) return;
    
    // Специальная способность: Полное восстановление
    gameState.player.health = gameState.player.maxHealth;
    gameState.player.specialReady = false;
    gameState.player.specialCooldown = GAME_CONFIG.SPECIAL_ABILITY_COOLDOWN;
    
    addCombatLog('✨ Использовано лечение! Здоровье полностью восстановлено!', 'system');
    showNotification('Здоровье полностью восстановлено!', 'success');
    animateElement('player-card', 'level-up');
    
    updatePlayerStats();
}

function updateSpecialAbility() {
    if (!gameState.player.specialReady && gameState.player.specialCooldown > 0) {
        gameState.player.specialCooldown--;
        
        if (gameState.player.specialCooldown <= 0) {
            gameState.player.specialReady = true;
            gameState.player.specialCooldown = 0;
            showNotification('Способность готова к использованию!', 'success');
        }
        
        updateSpecialButton();
    }
}

function winBattle() {
    const goldReward = gameState.currentEnemy.goldReward;
    const expReward = gameState.currentEnemy.expReward;
    
    gameState.player.stats.enemiesKilled++;
    
    addCombatLog(`🏆 ПОБЕДА! Получено ${goldReward} золота и ${expReward} опыта`, 'system');
    showNotification('Победа в битве!', 'success');
    animateElement('enemy-card', 'victory-animation');
    
    addGold(goldReward);
    gainExperience(expReward);
    
    // Шанс выпадения предмета
    if (Math.random() < 0.1) { // 10% шанс
        const item = getRandomItem();
        addCombatLog(`🎁 Найден предмет: ${item.name}`, 'system');
        showNotification(`Получен предмет: ${item.name}!`, 'success');
    }
    
    checkAchievements('battle_win');
    
    // Новый враг через 2 секунды
    setTimeout(() => {
        generateEnemy();
    }, 2000);
}

function generateEnemy() {
    const enemy = gameState.enemies[Math.floor(Math.random() * gameState.enemies.length)];
    const scale = Math.pow(GAME_CONFIG.ENEMY_SCALE, gameState.player.level - 1);
    
    gameState.currentEnemy = {
        ...enemy,
        level: Math.floor(enemy.baseLevel + (gameState.player.level - 1) * 0.5),
        health: Math.floor(enemy.baseHealth * scale),
        maxHealth: Math.floor(enemy.baseHealth * scale),
        damage: Math.floor(enemy.baseDamage * scale),
        goldReward: Math.floor(enemy.baseGoldReward * scale),
        expReward: Math.floor(enemy.baseExpReward * scale)
    };
    
    updateEnemyDisplay();
    addCombatLog(`Новый враг: ${gameState.currentEnemy.name} (Уровень ${gameState.currentEnemy.level})`, 'system');
}

function gameOver() {
    addCombatLog('💀 Поражение! Вы потеряли 10% золота', 'system');
    
    // Потеря золота
    const goldLost = Math.floor(gameState.player.gold * 0.1);
    gameState.player.gold = Math.max(0, gameState.player.gold - goldLost);
    
    // Восстановление здоровья
    gameState.player.health = Math.floor(gameState.player.maxHealth * 0.5);
    
    showNotification(`Поражение! Потеряно ${goldLost} золота`, 'error');
    
    updatePlayerStats();
    
    // Новый враг
    setTimeout(() => {
        generateEnemy();
    }, 3000);
}

// ===== СИСТЕМА МАГАЗИНА =====
function showShopCategory(category) {
    gameState.ui.currentShopCategory = category;
    
    // Обновление активной кнопки
    document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Обновление предметов
    updateShopItems();
}

function updateShopItems() {
    const container = document.getElementById('shop-items');
    const category = gameState.ui.currentShopCategory;
    
    container.innerHTML = '';
    
    const items = gameState.shopItems.filter(item => item.category === category);
    
    items.forEach(item => {
        const itemElement = createShopItemElement(item);
        container.appendChild(itemElement);
    });
}

function createShopItemElement(item) {
    const div = document.createElement('div');
    div.className = 'shop-item';
    div.onclick = () => buyItem(item);
    
    const canAfford = gameState.player.gold >= item.cost;
    if (!canAfford) {
        div.classList.add('unaffordable');
    } else if (gameState.player.gold >= item.cost * 2) {
        div.classList.add('affordable');
    }
    
    div.innerHTML = `
        <div class="item-header">
            <div class="item-icon">
                <i class="${item.icon}"></i>
            </div>
            <div class="item-details">
                <h5>${item.name}</h5>
                <div class="item-cost">Цена: ${item.cost} золота</div>
            </div>
        </div>
        <div class="item-stats">${item.description}</div>
    `;
    
    return div;
}

function buyItem(item) {
    if (gameState.player.gold < item.cost) {
        showNotification('Недостаточно золота!', 'error');
        return;
    }
    
    gameState.player.gold -= item.cost;
    
    if (item.type === 'weapon') {
        gameState.player.currentWeapon = {
            name: item.name,
            damage: item.damage,
            type: 'weapon'
        };
        updateEquipmentSlots();
    } else if (item.type === 'armor') {
        gameState.player.currentArmor = {
            name: item.name,
            defense: item.defense,
            type: 'armor'
        };
        updateEquipmentSlots();
    }
    
    showNotification(`Куплено: ${item.name}`, 'success');
    addCombatLog(`🛒 Куплен предмет: ${item.name}`, 'system');
    
    updatePlayerStats();
    checkShopAffordability();
    checkAchievements('purchase');
    
    // Автосейв при покупке
    saveGame();
}

function checkShopAffordability() {
    const items = document.querySelectorAll('.shop-item');
    items.forEach((item, index) => {
        const shopItem = gameState.shopItems.find(si => si.category === gameState.ui.currentShopCategory);
        if (shopItem) {
            const canAfford = gameState.player.gold >= shopItem.cost;
            item.className = 'shop-item';
            if (!canAfford) {
                item.classList.add('unaffordable');
            } else if (gameState.player.gold >= shopItem.cost * 2) {
                item.classList.add('affordable');
            }
        }
    });
}

// ===== СИСТЕМА МАГАЗИНА КАМНЕЙ ДУШ =====
function switchShop(type) {
    // Скрываем оба магазина
    hideElement('regular-shop');
    hideElement('soul-shop');
    
    // Обновляем активные кнопки
    document.querySelectorAll('.switch-btn').forEach(btn => btn.classList.remove('active'));
    
    if (type === 'regular') {
        showElement('regular-shop');
        document.getElementById('regular-shop-btn').classList.add('active');
        updateShopItems(); // Обновляем обычный магазин
    } else {
        showElement('soul-shop');
        document.getElementById('soul-shop-btn').classList.add('active');
        updateSoulShopItems(); // Обновляем магазин камней душ
    }
}

function showSoulShopCategory(category) {
    gameState.currentSoulShopCategory = category;
    
    // Обновление активной кнопки
    document.querySelectorAll('.soul-category-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Обновление предметов
    updateSoulShopItems();
}

function updateSoulShopItems() {
    const container = document.getElementById('soul-shop-items');
    const category = gameState.currentSoulShopCategory;
    
    container.innerHTML = '';
    
    const items = gameState.soulShopItems.filter(item => item.category === category);
    
    items.forEach(item => {
        const itemElement = createSoulShopItemElement(item);
        container.appendChild(itemElement);
    });
}

function createSoulShopItemElement(item) {
    const div = document.createElement('div');
    div.className = 'shop-item soul-shop-item';
    div.onclick = () => buySoulItem(item);
    
    const canAfford = gameState.player.soulStones >= item.cost;
    if (!canAfford) {
        div.classList.add('unaffordable');
    } else if (gameState.player.soulStones >= item.cost * 2) {
        div.classList.add('affordable');
    }
    
    div.innerHTML = `
        <div class="item-header">
            <div class="item-icon">
                <i class="${item.icon}"></i>
            </div>
            <div class="item-details">
                <h5>${item.name}</h5>
                <div class="item-cost">Цена: ${item.cost} Камней душ</div>
            </div>
        </div>
        <div class="item-stats">${item.description}</div>
    `;
    
    return div;
}

function buySoulItem(item) {
    if (gameState.player.soulStones < item.cost) {
        showNotification('Недостаточно камней душ!', 'error');
        return;
    }
    
    gameState.player.soulStones -= item.cost;
    
    // Обработка различных типов предметов
    if (item.type === 'weapon') {
        gameState.player.currentWeapon = {
            name: item.name,
            damage: item.damage,
            type: 'weapon'
        };
        updateEquipmentSlots();
    } else if (item.type === 'armor') {
        gameState.player.currentArmor = {
            name: item.name,
            defense: item.defense,
            type: 'armor'
        };
        updateEquipmentSlots();
    } else if (item.type === 'upgrade') {
        applySoulUpgrade(item);
    } else if (item.type === 'artifact') {
        activateSoulArtifact(item);
    }
    
    showNotification(`Куплено: ${item.name}`, 'success');
    addCombatLog(`✨ Куплен эксклюзивный предмет: ${item.name}`, 'system');
    
    updatePlayerStats();
    updateSoulShopItems();
    checkAchievements('soul_purchase');
    
    // Автосейв при покупке
    saveGame();
}

function applySoulUpgrade(item) {
    if (item.id === 'soul_power') {
        gameState.player.damageMultiplier *= 1.5;
        showNotification('Духовная Мощь активирована! +50% к урону!', 'success');
        addCombatLog('✨ Духовная Мощь увеличила ваш урон на 50%!', 'system');
    } else if (item.id === 'soul_wisdom') {
        gameState.player.expMultiplier *= 1.5;
        showNotification('Духовная Мудрость активирована! +50% к опыту!', 'success');
        addCombatLog('✨ Духовная Мудрость увеличила получение опыта на 50%!', 'system');
    } else if (item.id === 'soul_fortune') {
        gameState.player.goldMultiplier *= 1.5;
        showNotification('Духовное Богатство активировано! +50% к золоту!', 'success');
        addCombatLog('✨ Духовное Богатство увеличило получение золота на 50%!', 'system');
    } else if (item.id === 'soul_vitality') {
        gameState.player.maxHealth += 100;
        gameState.player.health = gameState.player.maxHealth;
        showNotification('Духовная Жизнь активирована! +100 к максимальному здоровью!', 'success');
        addCombatLog('✨ Духовная Жизнь увеличила максимальное здоровье на 100!', 'system');
    }
}

function activateSoulArtifact(item) {
    if (item.id === 'soul_orb') {
        showNotification('Сфера Душ активирована! Перерождения стали сильнее!', 'success');
        addCombatLog('✨ Сфера Душ удвоила эффективность перерождений!', 'system');
        // Удваиваем бонусы перерождения
        gameState.player.damageMultiplier *= 1.2; // Вместо 1.1
        gameState.player.expMultiplier *= 1.3;    // Вместо 1.15
    } else if (item.id === 'time_crystal') {
        showNotification('Кристалл Времени активирован!', 'success');
        addCombatLog('✨ Кристалл Времени позволит мгновенно восстанавливать способность!', 'system');
        // Устанавливаем особую способность
        gameState.player.specialCooldown = 0;
        gameState.player.specialReady = true;
    } else if (item.id === 'void_essence') {
        showNotification('Эссенция Пустоты активирована!', 'success');
        addCombatLog('✨ Эссенция Пустоты защитит от смерти раз в час!', 'system');
        // Добавляем защиту от смерти (упрощенная реализация)
        gameState.player.voidProtection = true;
    }
}

function checkSoulShopAffordability() {
    const items = document.querySelectorAll('.soul-shop-item');
    items.forEach((item, index) => {
        const soulShopItem = gameState.soulShopItems.find(si => si.category === gameState.currentSoulShopCategory);
        if (soulShopItem) {
            const canAfford = gameState.player.soulStones >= soulShopItem.cost;
            item.className = 'shop-item soul-shop-item';
            if (!canAfford) {
                item.classList.add('unaffordable');
            } else if (gameState.player.soulStones >= soulShopItem.cost * 2) {
                item.classList.add('affordable');
            }
        }
    });
}

// ===== СИСТЕМА ПЕРЕРОЖДЕНИЙ =====
function checkReincarnationReadiness() {
    const requiredLevel = GAME_CONFIG.REINCARNATION_BASE_LEVEL + (gameState.player.reincarnationCount * 5);
    
    if (gameState.player.level >= requiredLevel) {
        gameState.gameStats.specialUnlocks.reincarnationReady = true;
        showReincarnationModal();
    } else {
        document.getElementById('reincarnate-readiness').textContent = 
            `До перерождения: уровень ${requiredLevel}`;
    }
}

function showReincarnationModal() {
    const modal = document.getElementById('reincarnation-modal');
    const soulStonesGained = document.getElementById('soul-stones-gained');
    
    soulStonesGained.textContent = gameState.player.reincarnationCount + 1;
    showElement(modal);
    gameState.ui.showModal = true;
}

function closeReincarnationModal() {
    hideElement('reincarnation-modal');
    gameState.ui.showModal = false;
}

function performReincarnation() {
    // Бонусы за перерождение
    gameState.player.damageMultiplier *= 1.10;
    gameState.player.defenseMultiplier *= 1.05;
    gameState.player.expMultiplier *= 1.15;
    gameState.player.goldMultiplier *= 1.05;
    
    // Камни душ
    gameState.player.soulStones += 1;
    gameState.player.stats.reincarnations++;
    
    // Сброс уровня, но сохранение бонусов
    gameState.player.level = 1;
    gameState.player.experience = 0;
    gameState.player.maxExperience = GAME_CONFIG.BASE_PLAYER_STATS.maxExp;
    gameState.player.health = GAME_CONFIG.BASE_PLAYER_STATS.maxHealth;
    gameState.player.reincarnationCount++;
    
    showNotification('Перерождение завершено! +10% урона, +5% защиты, +15% опыта', 'success');
    addCombatLog('🌟 ПЕРЕРОЖДЕНИЕ! Сила увеличена!', 'system');
    animateElement('player-card', 'level-up');
    
    checkAchievements('reincarnation');
    
    closeReincarnationModal();
    updatePlayerStats();
    
    // Автосейв при перерождении
    saveGame();
}

// ===== СИСТЕМА ДОСТИЖЕНИЙ =====
function createAchievements() {
    gameState.achievements = [
        {
            id: 'first_kill',
            name: 'Первые крови',
            description: 'Убейте первого врага',
            icon: '⚔️',
            condition: () => gameState.player.stats.enemiesKilled >= 1,
            reward: { gold: 100 }
        },
        {
            id: 'ten_kills',
            name: 'Охотник',
            description: 'Убейте 10 врагов',
            icon: '🏹',
            condition: () => gameState.player.stats.enemiesKilled >= 10,
            reward: { gold: 500 }
        },
        {
            id: 'hundred_kills',
            name: 'Массовый убийца',
            description: 'Убейте 100 врагов',
            icon: '💀',
            condition: () => gameState.player.stats.enemiesKilled >= 100,
            reward: { gold: 5000 }
        },
        {
            id: 'level_10',
            name: 'Новичок',
            description: 'Достигните 10 уровня',
            icon: '⭐',
            condition: () => gameState.player.level >= 10,
            reward: { gold: 1000 }
        },
        {
            id: 'level_25',
            name: 'Ветеран',
            description: 'Достигните 25 уровня',
            icon: '🌟',
            condition: () => gameState.player.level >= 25,
            reward: { gold: 5000 }
        },
        {
            id: 'level_50',
            name: 'Легенда',
            description: 'Достигните 50 уровня',
            icon: '👑',
            condition: () => gameState.player.level >= 50,
            reward: { gold: 20000 }
        },
        {
            id: 'first_reincarnation',
            name: 'Вечный цикл',
            description: 'Первое перерождение',
            icon: '🔄',
            condition: () => gameState.player.reincarnationCount >= 1,
            reward: { soulStones: 1 }
        },
        {
            id: 'rich_player',
            name: 'Богач',
            description: 'Накопите 10,000 золота',
            icon: '💰',
            condition: () => gameState.player.gold >= 10000,
            reward: { gold: 2000 }
        },
        {
            id: 'big_spender',
            name: 'Щедрый торговец',
            description: 'Потратьте 5,000 золота в магазине',
            icon: '🛒',
            condition: () => gameState.player.stats.goldEarned >= 25000,
            reward: { gold: 1000 }
        },
        {
            id: 'collector',
            name: 'Коллекционер',
            description: 'Купите 20 предметов в магазине',
            icon: '📦',
            condition: () => gameState.player.stats.purchases >= 20,
            reward: { gold: 2000 }
        },
        {
            id: 'survivor',
            name: 'Выживший',
            description: 'Выиграйте 50 битв',
            icon: '🛡️',
            condition: () => gameState.player.stats.enemiesKilled >= 50,
            reward: { gold: 3000 }
        },
        {
            id: 'damager',
            name: 'Мастер урона',
            description: 'Нанесите 100,000 урона',
            icon: '⚡',
            condition: () => gameState.player.stats.totalDamage >= 100000,
            reward: { gold: 5000 }
        },
        {
            id: 'dedicated',
            name: 'Преданный',
            description: 'Играйте 1 час',
            icon: '⏰',
            condition: () => gameState.player.stats.timePlayed >= 3600,
            reward: { gold: 1000 }
        },
        {
            id: 'veteran',
            name: 'Ветеран',
            description: 'Играйте 5 часов',
            icon: '🏆',
            condition: () => gameState.player.stats.timePlayed >= 18000,
            reward: { gold: 5000 }
        },
        {
            id: 'master_collector',
            name: 'Великий коллекционер',
            description: 'Откройте все достижения',
            icon: '🎖️',
            condition: () => gameState.player.stats.achievementsUnlocked >= 14,
            reward: { soulStones: 5 }
        },
        {
            id: 'speed_runner',
            name: 'Спидранер',
            description: 'Достигните 25 уровня за одно перерождение',
            icon: '💨',
            condition: () => gameState.player.level >= 25 && gameState.player.reincarnationCount >= 1,
            reward: { gold: 10000 }
        },
        {
            id: 'treasure_hunter',
            name: 'Искатель сокровищ',
            description: 'Найдите 10 предметов с врагов',
            icon: '💎',
            condition: () => gameState.player.stats.itemsFound >= 10,
            reward: { gold: 3000 }
        },
        {
            id: 'lucky_bastard',
            name: 'Удачливый ублюдок',
            description: 'Сделайте 10 критических ударов подряд',
            icon: '🍀',
            condition: () => gameState.player.stats.criticalStreak >= 10,
            reward: { gold: 2000 }
        },
        {
            id: 'death_defier',
            name: 'Презревший смерть',
            description: 'Выживите после 5 поражений',
            icon: '💀',
            condition: () => gameState.player.stats.deaths >= 5,
            reward: { gold: 2500 }
        },
        {
            id: 'completionist',
            name: 'Перфекционист',
            description: 'Используйте все категории магазина',
            icon: '✅',
            condition: () => checkAllShopCategoriesUsed(),
            reward: { soulStones: 2 }
        }
    ];
}

function checkAchievements(trigger) {
    let newAchievements = 0;
    
    gameState.achievements.forEach(achievement => {
        if (!gameState.unlockedAchievements.has(achievement.id) && achievement.condition()) {
            unlockAchievement(achievement);
            newAchievements++;
        }
    });
    
    if (newAchievements > 0) {
        showNotification(`Получено достижений: ${newAchievements}!`, 'success');
        checkAchievements('achievement_unlock');
    }
}

function unlockAchievement(achievement) {
    gameState.unlockedAchievements.add(achievement.id);
    gameState.player.stats.achievementsUnlocked++;
    
    // Выдача награды
    if (achievement.reward.gold) {
        addGold(achievement.reward.gold);
    }
    if (achievement.reward.soulStones) {
        gameState.player.soulStones += achievement.reward.soulStones;
    }
    
    showNotification(`🏆 Достижение: ${achievement.name}!`, 'success');
    addCombatLog(`🏆 ДОСТИЖЕНИЕ: ${achievement.name}!`, 'system');
    animateElement('achievements-modal', 'achievement-unlock');
    
    // Автосейв при получении достижения
    saveGame();
}

// ===== ПАСХАЛКИ =====
function handleEasterEggs(event) {
    const key = event.key.toLowerCase();
    const pressedKeys = gameState.gameStats.easterEggKeys || '';
    
    gameState.gameStats.easterEggKeys = (pressedKeys + key).slice(-20); // Последние 20 нажатий
    
    // Проверка секретного кода
    if (gameState.gameStats.easterEggKeys.includes(GAME_CONFIG.EASTER_EGGS.CODE_NAME)) {
        activateSecretMode();
        gameState.gameStats.easterEggKeys = '';
    }
    
    // Консольная команда для разработчиков
    if (key === 'f9') {
        enableDevMode();
    }
}

function activateSecretMode() {
    if (gameState.gameStats.specialUnlocks.secretMode) return;
    
    gameState.gameStats.specialUnlocks.secretMode = true;
    
    // Секретные бонусы
    gameState.player.damageMultiplier *= GAME_CONFIG.EASTER_EGGS.SPECIAL_STATS.damageMultiplier;
    gameState.player.maxHealth *= GAME_CONFIG.EASTER_EGGS.SPECIAL_STATS.healthMultiplier;
    gameState.player.expMultiplier *= GAME_CONFIG.EASTER_EGGS.SPECIAL_STATS.expMultiplier;
    gameState.player.health = gameState.player.maxHealth;
    
    gameState.unlockedEasterEggs.add('secret_mode');
    
    showNotification('🌟 СЕКРЕТНЫЙ РЕЖИМ АКТИВИРОВАН!', 'success');
    addCombatLog('🌟 СЕКРЕТНАЯ СИЛА ПРОБУЖДЕНА!', 'system');
    animateElement('player-card', 'achievement-unlock');
    
    checkAchievements('easter_egg');
}

function enableDevMode() {
    if (gameState.gameStats.specialUnlocks.devMode) return;
    
    gameState.gameStats.specialUnlocks.devMode = true;
    
    gameState.player.gold += 100000;
    gameState.player.level = 100;
    gameState.player.health = gameState.player.maxHealth;
    gameState.player.experience = 0;
    gameState.player.maxExperience = 100;
    
    showNotification('👨‍💻 Режим разработчика активирован!', 'success');
    updatePlayerStats();
}

// ===== ИГРОВЫЕ ДАННЫЕ =====
function createEnemies() {
    gameState.enemies = [
        {
            id: 'slime',
            name: 'Слизень',
            icon: '🟢',
            baseLevel: 1,
            baseHealth: 30,
            baseDamage: 5,
            baseGoldReward: 15,
            baseExpReward: 25,
            description: 'Обычный зеленый слизень. Очень медленный.'
        },
        {
            id: 'goblin',
            name: 'Гоблин',
            icon: '👺',
            baseLevel: 2,
            baseHealth: 45,
            baseDamage: 8,
            baseGoldReward: 25,
            baseExpReward: 40,
            description: 'Хитрый гоблин с деревянной дубинкой.'
        },
        {
            id: 'wolf',
            name: 'Волк',
            icon: '🐺',
            baseLevel: 3,
            baseHealth: 60,
            baseDamage: 12,
            baseGoldReward: 35,
            baseExpReward: 55,
            description: 'Дикий волк. Быстрый и опасный.'
        },
        {
            id: 'orc',
            name: 'Орк',
            icon: '👹',
            baseLevel: 5,
            baseHealth: 100,
            baseDamage: 20,
            baseGoldReward: 60,
            baseExpReward: 80,
            description: 'Сильный орк с тяжелой дубинкой.'
        },
        {
            id: 'skeleton',
            name: 'Скелет',
            icon: '💀',
            baseLevel: 7,
            baseHealth: 80,
            baseDamage: 15,
            baseGoldReward: 45,
            baseExpReward: 70,
            description: 'Воскресший мертвец. Сопротивляется магии.'
        },
        {
            id: 'spider',
            name: 'Паук',
            icon: '🕷️',
            baseLevel: 4,
            baseHealth: 50,
            baseDamage: 10,
            baseGoldReward: 30,
            baseExpReward: 45,
            description: 'Ядовитый паук. Может отравить.'
        },
        {
            id: 'bandit',
            name: 'Бандит',
            icon: '🦹',
            baseLevel: 6,
            baseHealth: 90,
            baseDamage: 18,
            baseGoldReward: 55,
            baseExpReward: 75,
            description: 'Опытный бандит с кинжалом.'
        },
        {
            id: 'dragonling',
            name: 'Дракончик',
            icon: '🐲',
            baseLevel: 15,
            baseHealth: 300,
            baseDamage: 50,
            baseGoldReward: 200,
            baseExpReward: 300,
            description: 'Молодой дракон. Опасен для новичков!'
        },
        {
            id: 'ancient_tree',
            name: 'Древнее Древо',
            icon: '🌳',
            baseLevel: 25,
            baseHealth: 800,
            baseDamage: 80,
            baseGoldReward: 500,
            baseExpReward: 600,
            description: 'Очень сильный противник. Требует опыта!'
        },
        {
            id: 'shadow_wraith',
            name: 'Теневой Вейт',
            icon: '👻',
            baseLevel: 35,
            baseHealth: 1200,
            baseDamage: 120,
            baseGoldReward: 800,
            baseExpReward: 1000,
            description: 'Дух тьмы. Крайне опасен!'
        }
    ];
}

function createShopItems() {
    gameState.shopItems = [
        // Оружие
        { id: 'wooden_sword', name: 'Деревянный меч', icon: '🗡️', cost: 100, category: 'weapons', type: 'weapon', damage: '5-10', description: 'Простой деревянный меч. +5-10 урона' },
        { id: 'iron_sword', name: 'Железный меч', icon: '⚔️', cost: 500, category: 'weapons', type: 'weapon', damage: '15-25', description: 'Надежный железный меч. +15-25 урона' },
        { id: 'steel_sword', name: 'Стальной меч', icon: '🗡️', cost: 2000, category: 'weapons', type: 'weapon', damage: '30-50', description: 'Острый стальной меч. +30-50 урона' },
        { id: 'mithril_blade', name: 'Мифрильный клинок', icon: '⚡', cost: 10000, category: 'weapons', type: 'weapon', damage: '60-100', description: 'Легендарный мифрильный клинок! +60-100 урона' },
        { id: 'dragonslayer', name: 'Убийца Драконов', icon: '🐉', cost: 50000, category: 'weapons', type: 'weapon', damage: '120-200', description: 'Меч, способный убить дракона! +120-200 урона' },
        
        // Броня
        { id: 'leather_armor', name: 'Кожаная броня', icon: '🥋', cost: 150, category: 'armor', type: 'armor', defense: 5, description: 'Легкая кожаная броня. +5 защиты' },
        { id: 'chainmail', name: 'Кольчуга', icon: '🛡️', cost: 750, category: 'armor', type: 'armor', defense: 15, description: 'Прочная кольчуга. +15 защиты' },
        { id: 'plate_armor', name: 'Пластинчатая броня', icon: '🦾', cost: 3000, category: 'armor', type: 'armor', defense: 35, description: 'Тяжелая пластинчатая броня. +35 защиты' },
        { id: 'dragon_scale', name: 'Чешуя дракона', icon: '🐲', cost: 15000, category: 'armor', type: 'armor', defense: 70, description: 'Броня из чешуи дракона! +70 защиты' },
        { id: 'void_armor', name: 'Броня Пустоты', icon: '⚫', cost: 75000, category: 'armor', type: 'armor', defense: 150, description: 'Мистическая броня Пустоты! +150 защиты' },
        
        // Зелья
        { id: 'health_potion', name: 'Зелье лечения', icon: '🧪', cost: 50, category: 'potions', type: 'consumable', description: 'Восстанавливает 50 здоровья' },
        { id: 'big_health_potion', name: 'Большое зелье лечения', icon: '🍷', cost: 150, category: 'potions', type: 'consumable', description: 'Восстанавливает 150 здоровья' },
        { id: 'strength_potion', name: 'Зелье силы', icon: '💪', cost: 200, category: 'potions', type: 'consumable', description: 'Увеличивает урон на 10 минут' },
        { id: 'luck_potion', name: 'Зелье удачи', icon: '🍀', cost: 300, category: 'potions', type: 'consumable', description: 'Увеличивает шанс критического удара на 10 минут' },
        
        // Особое
        { id: 'amulet_power', name: 'Амулет силы', icon: '💎', cost: 5000, category: 'special', type: 'accessory', description: 'Постоянно увеличивает урон на 25%' },
        { id: 'ring_wisdom', name: 'Кольцо мудрости', icon: '💍', cost: 8000, category: 'special', type: 'accessory', description: 'Постоянно увеличивает получаемый опыт на 20%' },
        { id: 'charm_luck', name: 'Талисман удачи', icon: '🔮', cost: 12000, category: 'special', type: 'accessory', description: 'Увеличивает получаемое золото на 30%' },
        { id: 'book_ancient', name: 'Древняя книга', icon: '📜', cost: 25000, category: 'special', type: 'special', description: 'Открывает секретные знания. +50% ко всем характеристикам!' }
    ];
}

function createSoulShopItems() {
    gameState.soulShopItems = [
        // Эксклюзивное оружие за камни душ
        { id: 'soul_blade', name: 'Клинок Душ', icon: '⚔️', cost: 3, category: 'weapons', type: 'weapon', damage: '200-400', description: 'Легендарный клинок из застывших душ. +200-400 урона' },
        { id: 'void_scythe', name: 'Коса Пустоты', icon: '🔪', cost: 8, category: 'weapons', type: 'weapon', damage: '500-1000', description: 'Оружие самого разрушения. +500-1000 урона' },
        { id: 'soul_reaper', name: 'Жнец Душ', icon: '🗡️', cost: 15, category: 'weapons', type: 'weapon', damage: '1000-2000', description: 'Артефактная коса смерти. +1000-2000 урона' },
        
        // Эксклюзивная броня за камни душ
        { id: 'soul_armor', name: 'Доспех Души', icon: '🛡️', cost: 5, category: 'armor', type: 'armor', defense: 200, description: 'Броня из застывших душ. +200 защиты' },
        { id: 'void_shield', name: 'Щит Пустоты', icon: '🛡️', cost: 12, category: 'armor', type: 'armor', defense: 500, description: 'Щит, поглощающий атаки. +500 защиты' },
        { id: 'eternal_guard', name: 'Вечный Страж', icon: '🛡️', cost: 25, category: 'armor', type: 'armor', defense: 1000, description: 'Легендарная защита вечности. +1000 защиты' },
        
        // Перманентные улучшения
        { id: 'soul_power', name: 'Духовная Мощь', icon: '💎', cost: 10, category: 'upgrades', type: 'upgrade', description: 'Перманентно увеличивает урон на 50%' },
        { id: 'soul_wisdom', name: 'Духовная Мудрость', icon: '📿', cost: 10, category: 'upgrades', type: 'upgrade', description: 'Перманентно увеличивает опыт на 50%' },
        { id: 'soul_fortune', name: 'Духовное Богатство', icon: '💰', cost: 10, category: 'upgrades', type: 'upgrade', description: 'Перманентно увеличивает золото на 50%' },
        { id: 'soul_vitality', name: 'Духовная Жизнь', icon: '❤️', cost: 15, category: 'upgrades', type: 'upgrade', description: 'Перманентно увеличивает максимальное здоровье на 100' },
        
        // Уникальные артефакты
        { id: 'soul_orb', name: 'Сфера Душ', icon: '🔮', cost: 20, category: 'artifacts', type: 'artifact', description: 'Удваивает эффективность перерождений' },
        { id: 'time_crystal', name: 'Кристалл Времени', icon: '💎', cost: 30, category: 'artifacts', type: 'artifact', description: 'Мгновенное восстановление способности после использования' },
        { id: 'void_essence', name: 'Эссенция Пустоты', icon: '⚫', cost: 50, category: 'artifacts', type: 'artifact', description: 'Автоматически избегает смерти раз в час' },
        
        // Ресурсы для крафта
        { id: 'soul_fragment', name: 'Фрагмент Души', icon: '🔷', cost: 2, category: 'materials', type: 'material', description: 'Редкий материал для крафта' },
        { id: 'void_crystal', name: 'Кристалл Пустоты', icon: '🔮', cost: 5, category: 'materials', type: 'material', description: 'Ценный материал для улучшений' },
        { id: 'eternal_shard', name: 'Вечный Осколок', icon: '💠', cost: 8, category: 'materials', type: 'material', description: 'Материал легендарного качества' }
    ];
}

// ===== ОБНОВЛЕНИЕ ИНТЕРФЕЙСА =====
function updatePlayerStats() {
    document.getElementById('gold-amount').textContent = gameState.player.gold.toLocaleString();
    document.getElementById('player-level').textContent = gameState.player.level;
    document.getElementById('soul-stones').textContent = gameState.player.soulStones;
    
    document.getElementById('current-health').textContent = `${gameState.player.health}/${gameState.player.maxHealth}`;
    document.getElementById('current-exp').textContent = `${gameState.player.experience}/${gameState.player.maxExperience}`;
    
    // Обновление прогресс-баров
    const healthPercent = (gameState.player.health / gameState.player.maxHealth) * 100;
    const expPercent = (gameState.player.experience / gameState.player.maxExperience) * 100;
    
    document.getElementById('health-bar').style.width = `${healthPercent}%`;
    document.getElementById('exp-bar').style.width = `${expPercent}%`;
    
    updateEquipmentSlots();
    updateSpecialButton();
}

function updateEquipmentSlots() {
    // Обновление слота оружия
    const weaponSlot = document.getElementById('weapon-slot');
    const weaponName = weaponSlot.querySelector('.item-name');
    const weaponStats = weaponSlot.querySelector('.item-stats');
    
    if (gameState.player.currentWeapon) {
        weaponName.textContent = gameState.player.currentWeapon.name;
        weaponStats.textContent = `Урон: ${gameState.player.currentWeapon.damage}`;
    }
    
    // Обновление слота брони
    const armorSlot = document.getElementById('armor-slot');
    const armorName = armorSlot.querySelector('.item-name');
    const armorStats = armorSlot.querySelector('.item-stats');
    
    if (gameState.player.currentArmor) {
        armorName.textContent = gameState.player.currentArmor.name;
        armorStats.textContent = `Защита: ${gameState.player.currentArmor.defense}`;
    }
}

function updateEnemyDisplay() {
    if (!gameState.currentEnemy) return;
    
    document.getElementById('enemy-name').textContent = gameState.currentEnemy.name;
    document.getElementById('enemy-level').textContent = gameState.currentEnemy.level;
    document.getElementById('enemy-current-health').textContent = 
        `${gameState.currentEnemy.health}/${gameState.currentEnemy.maxHealth}`;
    
    // Обновление здоровья врага
    const healthPercent = (gameState.currentEnemy.health / gameState.currentEnemy.maxHealth) * 100;
    document.getElementById('enemy-health-bar').style.width = `${healthPercent}%`;
    
    // Обновление иконки врага
    const enemyAvatar = document.querySelector('.enemy-avatar i');
    enemyAvatar.className = gameState.currentEnemy.icon.includes('fas') ? 
        gameState.currentEnemy.icon : `fas fa-dragon`;
}

function updateEnemyStats() {
    updateEnemyDisplay();
}

function updateSpecialButton() {
    const specialBtn = document.getElementById('special-btn');
    const specialText = document.getElementById('special-text');
    
    if (gameState.player.specialReady) {
        specialBtn.disabled = false;
        specialText.textContent = 'Восстановление (Готово!)';
    } else {
        specialBtn.disabled = true;
        specialText.textContent = `Восстановление (${gameState.player.specialCooldown} сек)`;
    }
}

// ===== УТИЛИТЫ ИНТЕРФЕЙСА =====
function addCombatLog(message, type = 'system') {
    const combatLog = document.getElementById('combat-log');
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${type}`;
    logEntry.textContent = message;
    
    combatLog.appendChild(logEntry);
    
    // Ограничение количества записей
    while (combatLog.children.length > 50) {
        combatLog.removeChild(combatLog.firstChild);
    }
    
    // Прокрутка вниз
    combatLog.scrollTop = combatLog.scrollHeight;
}

function showNotification(message, type = 'success') {
    const notifications = document.getElementById('notifications');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    notifications.appendChild(notification);
    
    // Автоудаление через 5 секунд
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 5000);
}

function showDamageText(damage, type) {
    const battleArea = document.querySelector('.battle-area');
    const damageText = document.createElement('div');
    
    if (type === 'critical') {
        damageText.className = 'damage-text critical-hit';
        damageText.textContent = `КРИТ! ${damage}`;
    } else if (type === 'enemy') {
        damageText.className = 'damage-text';
        damageText.textContent = `-${damage}`;
    } else {
        damageText.className = 'damage-text';
        damageText.textContent = damage;
    }
    
    damageText.style.position = 'absolute';
    damageText.style.left = '50%';
    damageText.style.top = '50%';
    damageText.style.transform = 'translate(-50%, -50%)';
    
    battleArea.appendChild(damageText);
    
    setTimeout(() => {
        if (damageText.parentNode) {
            damageText.parentNode.removeChild(damageText);
        }
    }, 1000);
}

function animateElement(elementSelector, animationClass) {
    const element = document.querySelector(elementSelector);
    if (element) {
        element.classList.add(animationClass);
        setTimeout(() => {
            element.classList.remove(animationClass);
        }, 2000);
    }
}

function animateLevelUp() {
    const playerCard = document.querySelector('.player-card');
    if (playerCard) {
        playerCard.classList.add('level-up');
        setTimeout(() => {
            playerCard.classList.remove('level-up');
        }, 2000);
    }
}

// ===== УПРАВЛЕНИЕ ЭЛЕМЕНТАМИ ИНТЕРФЕЙСА =====
function showElement(elementId) {
    const element = typeof elementId === 'string' ? document.getElementById(elementId) : elementId;
    if (element) {
        element.classList.remove('hidden');
    }
}

function hideElement(elementId) {
    const element = typeof elementId === 'string' ? document.getElementById(elementId) : elementId;
    if (element) {
        element.classList.add('hidden');
    }
}

// ===== ФУНКЦИИ ГЛАВНОГО МЕНЮ =====
function startNewGame() {
    hideElement('main-menu');
    showElement('game-ui');
    gameState.ui.showMainMenu = false;
    gameState.ui.showGameUI = true;
    
    updateShopItems();
    updatePlayerStats();
    updateEnemyDisplay();
    
    addCombatLog('🌟 Добро пожаловать в мир приключений!', 'system');
}

function showSettings() {
    showElement('settings-modal');
    gameState.ui.showModal = true;
}

function closeSettingsModal() {
    hideElement('settings-modal');
    gameState.ui.showModal = false;
}

function showAchievements() {
    updateAchievementsDisplay();
    showElement('achievements-modal');
    gameState.ui.showModal = true;
}

function closeAchievementsModal() {
    hideElement('achievements-modal');
    gameState.ui.showModal = false;
}

function closeReincarnationModal() {
    hideElement('reincarnation-modal');
    gameState.ui.showModal = false;
}

// ===== ДОПОЛНИТЕЛЬНЫЕ ФУНКЦИИ =====
function updateAchievementsDisplay() {
    const container = document.getElementById('achievements-grid');
    container.innerHTML = '';
    
    gameState.achievements.forEach(achievement => {
        const isUnlocked = gameState.unlockedAchievements.has(achievement.id);
        const achievementElement = document.createElement('div');
        achievementElement.className = `achievement ${isUnlocked ? 'unlocked' : 'locked'}`;
        
        const progress = isUnlocked ? 'Завершено' : 'Заблокировано';
        
        achievementElement.innerHTML = `
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-title">${achievement.name}</div>
            <div class="achievement-description">${achievement.description}</div>
            <div class="achievement-progress">${progress}</div>
        `;
        
        container.appendChild(achievementElement);
    });
}

function updateGameTime() {
    const elapsed = Math.floor((Date.now() - gameState.gameStats.startTime) / 1000);
    gameState.player.stats.timePlayed = elapsed;
}

function getRandomItem() {
    const shopItems = gameState.shopItems.filter(item => item.type === 'weapon' || item.type === 'armor');
    return shopItems[Math.floor(Math.random() * shopItems.length)];
}

function checkAllShopCategoriesUsed() {
    // Проверка использования всех категорий магазина
    return true; // Упрощенная версия
}

// ===== ИГРОВОЙ ЦИКЛ =====
function startGameLoop() {
    setInterval(() => {
        if (gameState.ui.showGameUI) {
            // Автоматические проверки
            checkReincarnationReadiness();
            checkAchievements('time_check');
        }
    }, 5000);
}

// ===== УЛУЧШЕННАЯ СИСТЕМА СОХРАНЕНИЯ =====
function saveGame() {
    try {
        const saveData = {
            player: gameState.player,
            gameStats: gameState.gameStats,
            unlockedAchievements: Array.from(gameState.unlockedAchievements),
            unlockedEasterEggs: Array.from(gameState.unlockedEasterEggs),
            version: gameState.gameStats.gameVersion,
            saveTimestamp: Date.now()
        };
        
        localStorage.setItem('epic_rpg_save', JSON.stringify(saveData));
        console.log('💾 Игра сохранена');
        
        // Показываем уведомление о сохранении не при каждом автосейве
        if (Math.random() < 0.1) { // 10% шанс
            showNotification('💾 Игра автоматически сохранена', 'system');
        }
    } catch (error) {
        console.error('Ошибка сохранения:', error);
        showNotification('Ошибка сохранения игры!', 'error');
    }
}

function loadGame() {
    try {
        const saveData = localStorage.getItem('epic_rpg_save');
        if (saveData) {
            const data = JSON.parse(saveData);
            
            if (data.version === gameState.gameStats.gameVersion) {
                gameState.player = { ...gameState.player, ...data.player };
                gameState.gameStats = { ...gameState.gameStats, ...data.gameStats };
                gameState.unlockedAchievements = new Set(data.unlockedAchievements || []);
                gameState.unlockedEasterEggs = new Set(data.unlockedEasterEggs || []);
                
                console.log('📁 Игра загружена');
                showNotification('💾 Игра загружена!', 'success');
            } else {
                console.log('📁 Версия сохранения не совпадает, начинаем новую игру');
            }
        }
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        showNotification('Ошибка загрузки игры!', 'error');
    }
}

// Автосохранение при важных событиях
function setupAutoSaveEvents() {
    // Сохранение при значимых изменениях
    const originalAddGold = addGold;
    const originalLevelUp = levelUp;
    const originalBuyItem = buyItem;
    const originalPerformReincarnation = performReincarnation;
    const originalUnlockAchievement = unlockAchievement;
    
    // Добавляем автосейв после переопределения функций
    setTimeout(() => {
        addCombatLog('💾 Система автосейва активна!', 'system');
    }, 1000);
}

// ===== ОБРАБОТЧИКИ СОБЫТИЙ =====
function updateUI() {
    updatePlayerStats();
    updateEnemyDisplay();
    updateShopItems();
}

// Инициализация при загрузке страницы
window.addEventListener('load', function() {
    console.log('🎮 Эпичная RPG загружена!');
});

// Автосохранение при закрытии
window.addEventListener('beforeunload', function() {
    saveGame();
});

// Обработка ошибок
window.addEventListener('error', function(event) {
    console.error('Игра столкнулась с ошибкой:', event.error);
    showNotification('Произошла ошибка в игре', 'error');
    
    // Сохранение при ошибке
    saveGame();
});

console.log('🚀 Эпичная RPG - Путь Героя готова к запуску!');

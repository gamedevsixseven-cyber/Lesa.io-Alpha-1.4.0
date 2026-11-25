/**
 * Lesa.io - Chest Weapons Pool Expansion (3 New Chest-Obtainable Weapons)
 *   1) tempest_bow (Legendary): Stormcaller Longbow
 *   2) void_mortar (Mythic, Evolvable ★): Vortex Void Mortar
 *   3) aurelion_scepter (Celestial, Evolvable ★ + Celestial Skill Tree): Aurelion Astral Scepter
 */

const CHEST_WEAPONS_EXPANSION = {
    tempest_bow: {
        id: 'tempest_bow',
        name: 'Stormcaller Longbow',
        rarity: 'Legendary',
        icon: '🏹',
        baseDelay: 17,
        baseDamage: 48,
        radius: 9,
        extraPierce: 2,
        maxBounces: 0,
        speedMultiplier: 1.72,
        critChanceBonus: 0.16,
        range: 1080,
        seekerEveryNShots: 4,
        color: '#f59e0b',
        image: 'assets/WeaponIcons/TempestLongbow.png',
        unlockSource: 'chest_drop',
        unlockLabel: 'EPIC / LEGENDARY+ CHEST',
        hideWhenLocked: true,
        cardStats: {
            damage: '48 Piercing',
            fireDelay: 'Swift (0.28s)',
            trait: '+16% Crit • 4th 3-Arrow Homing Storm Salvo'
        }
    },
    void_mortar: {
        id: 'void_mortar',
        name: 'Vortex Void Mortar',
        rarity: 'Mythic',
        icon: '🌀',
        baseDelay: 25,
        baseDamage: 62,
        radius: 13,
        extraPierce: 0,
        maxBounces: 0,
        speedMultiplier: 1.28,
        critChanceBonus: 0.14,
        range: 860,
        color: '#a855f7',
        image: 'assets/WeaponIcons/VoidSingularityMortar.png',
        unlockSource: 'chest_drop',
        unlockLabel: 'LEGENDARY / MYTHIC+ CHEST',
        hideWhenLocked: true,
        cardStats: {
            damage: '62 Singularity',
            fireDelay: 'Heavy (0.42s)',
            trait: 'Pulls Foes Into 1.5s Gravity Well • Evolvable ★'
        },
        evolved: {
            baseDamage: 84,
            baseDelay: 20,
            critChanceBonus: 0.22,
            uiStats: {
                damage: '84 Awakened',
                fireDelay: 'Awakened (0.33s)',
                trait: '+22% Crit • Larger 195px Gravity Vortex ★'
            }
        }
    },
    aurelion_scepter: {
        id: 'aurelion_scepter',
        name: 'Aurelion Astral Scepter',
        rarity: 'Celestial',
        icon: '🪄',
        baseDelay: 14,
        baseDamage: 66,
        radius: 11,
        extraPierce: 3,
        maxBounces: 0,
        speedMultiplier: 1.65,
        critChanceBonus: 0.20,
        range: 1060,
        starfallEveryNShots: 3,
        color: '#38bdf8',
        image: 'assets/WeaponIcons/AurelionAstralScepter.png',
        unlockSource: 'chest_drop',
        unlockLabel: 'MYTHIC (0.4%) / APEX (4%)',
        hideWhenLocked: true,
        cardStats: {
            damage: '66 Starlight',
            fireDelay: 'Fast (0.23s)',
            trait: '+3 Pierces • 3rd Starfall Pillar • Celestial Skill Tree'
        },
        evolved: {
            baseDamage: 88,
            baseDelay: 11,
            extraPierce: 5,
            critChanceBonus: 0.28,
            range: 1160,
            uiStats: {
                damage: '88 Awakened',
                fireDelay: 'Awakened (0.18s)',
                trait: '+28% Crit • +5 Pierces • Starfall Pillar ★'
            }
        }
    }
};

if (typeof WEAPONS !== 'undefined') {
    Object.assign(WEAPONS, CHEST_WEAPONS_EXPANSION);
}

// Mount .weapon-card DOM cards into #weapons-modal .weapons-grid before ModalManager initializes
function mountChestWeaponCards() {
    if (typeof document === 'undefined') return;
    const grid = document.querySelector('#weapons-modal .weapons-grid');
    if (!grid) return;

    Object.values(CHEST_WEAPONS_EXPANSION).forEach((w) => {
        if (grid.querySelector(`.weapon-card[data-weapon="${w.id}"]`)) return;
        const rLower = (w.rarity || 'legendary').toLowerCase();
        const card = document.createElement('div');
        card.className = `weapon-card rarity-${rLower}`;
        card.setAttribute('data-weapon', w.id);
        card.innerHTML = `
            <div class="weapon-card-top">
                <div class="weapon-id-group">
                    <div class="weapon-icon-wrap">
                        <img src="${w.image}" class="weapon-card-img" alt="${w.name}" loading="lazy" decoding="async">
                    </div>
                    <h3 class="weapon-name">${w.name.toUpperCase()}</h3>
                </div>
                <div class="weapon-badge badge-${rLower}">${w.rarity.toUpperCase()}</div>
            </div>
            <div class="weapon-stats-list">
                <div class="weapon-stat-row"><span class="stat-key">Damage:</span> <span class="stat-val">${w.cardStats.damage}</span></div>
                <div class="weapon-stat-row"><span class="stat-key">Fire Delay:</span> <span class="stat-val">${w.cardStats.fireDelay}</span></div>
                <div class="weapon-stat-row"><span class="stat-key">Trait:</span> <span class="stat-val">${w.cardStats.trait}</span></div>
            </div>
        `;
        grid.appendChild(card);
    });
}

if (typeof document !== 'undefined') {
    if (document.querySelector('#weapons-modal .weapons-grid')) mountChestWeaponCards();
    else if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountChestWeaponCards);
    else mountChestWeaponCards();
}

if (typeof window !== 'undefined') {
    window.CHEST_WEAPONS_EXPANSION = CHEST_WEAPONS_EXPANSION;
    window.mountChestWeaponCards = mountChestWeaponCards;
}
if (typeof module !== 'undefined' && module.exports) module.exports = { CHEST_WEAPONS_EXPANSION };

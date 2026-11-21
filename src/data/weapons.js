/**
 * Lesa.io - Authoritative Weapon Registry & Stats
 * Single source of truth for weapon damage, fire rates, projectiles, bounces, and pierce
 */

const WEAPONS = {
    pea: {
        id: 'pea',
        name: 'Pea Slingshot',
        icon: '🌱',
        baseDelay: 16,
        baseDamage: 25,
        radius: 8,
        extraPierce: 0,
        maxBounces: 0,
        color: '#2ed573',
        image: 'assets/WeaponIcons/PeaSlingshot.png'
    },
    watermelon: {
        id: 'watermelon',
        name: 'Melon Cannon',
        icon: '🍉',
        baseDelay: 25,
        baseDamage: 75,
        radius: 18,
        extraPierce: 0,
        maxBounces: 0,
        color: '#20bf6b',
        image: 'assets/WeaponIcons/MelonCannon.png'
    },
    pepper: {
        id: 'pepper',
        name: 'Chili Blaster',
        icon: '🌶️',
        baseDelay: 9,
        baseDamage: 22,
        radius: 8,
        extraPierce: 2,
        maxBounces: 0,
        color: '#eb4d4b',
        image: 'assets/WeaponIcons/ChilliBlaster.png'
    },
    bubble: {
        id: 'bubble',
        name: 'Bubble Gun',
        rarity: 'Exclusive',
        icon: '🫧',
        baseDelay: 12,
        baseDamage: 22,
        radius: 10,
        extraPierce: 0,
        maxBounces: 3,
        color: '#70a1ff',
        image: 'assets/WeaponIcons/BubbleGun.png',
        unlockSource: 'mail_alpha',
        unlockLabel: 'Alpha Founder Mail',
        hideWhenLocked: true
    },
    money_gun: {
        id: 'money_gun',
        name: 'Money Gun',
        icon: '💶',
        baseDelay: 10,
        baseDamage: 28,
        radius: 10,
        extraPierce: 1,
        maxBounces: 0,
        color: '#e67e22',
        image: 'assets/WeaponIcons/MoneyGun.png'
    },
    burger: {
        id: 'burger',
        name: 'Burger Toss',
        icon: '🍔',
        baseDelay: 18,
        baseDamage: 45,
        radius: 12,
        extraPierce: 1,
        maxBounces: 0,
        color: '#e59b52',
        image: 'assets/WeaponIcons/BurgerToss.png'
    },
    lightning: {
        id: 'lightning',
        name: 'Lightning Strike',
        icon: '⚡',
        baseDelay: 15,
        baseDamage: 38,
        radius: 10,
        extraPierce: 0,
        maxBounces: 0,
        color: '#00d2d3',
        image: 'assets/WeaponIcons/LightningStrike.png'
    },
    greek_flag: {
        id: 'greek_flag',
        name: 'Greek Flag',
        icon: '🇬🇷',
        baseDelay: 14,
        baseDamage: 36,
        radius: 12,
        extraPierce: 1,
        maxBounces: 0,
        speedMultiplier: 1.15,
        color: '#0d5eaf',
        image: 'assets/WeaponIcons/GreekFlag.png'
    },
    carbine: {
        id: 'carbine',
        name: "Kiloumpas's Carbine",
        rarity: 'Epic',
        icon: '🔫',
        baseDelay: 22,
        baseDamage: 54,
        radius: 9,
        extraPierce: 2,
        maxBounces: 0,
        speedMultiplier: 1.42,
        critChanceBonus: 0.15,
        range: 1150,
        color: '#fed330',
        image: 'assets/WeaponIcons/KiloumpasCarbine.png',
        unlockSource: 'boss_kiloumpas',
        unlockLabel: 'W15 KILOUMPAS',
        hideWhenLocked: true
    },
    dialtone: {
        id: 'dialtone',
        name: "Rouf's Dial-Tone Blaster",
        rarity: 'Legendary',
        icon: '📱',
        baseDelay: 14,
        baseDamage: 34,
        radius: 13,
        extraPierce: 2,
        maxBounces: 0,
        speedMultiplier: 0.94,
        range: 820,
        slowDuration: 1.5,
        slowMultiplier: 0.70,
        fanEveryNShots: 4,
        color: '#fed330',
        image: 'assets/WeaponIcons/RoufBlaster.png',
        unlockSource: 'boss_rouf',
        unlockLabel: 'W20 ROUF',
        hideWhenLocked: true
    },
    zeus_thunderbolt: {
        id: 'zeus_thunderbolt',
        name: "Zeus's Master Thunderbolt",
        rarity: 'Mythic',
        icon: '⚡',
        baseDelay: 15,
        baseDamage: 46,
        radius: 12,
        extraPierce: 2,
        maxBounces: 0,
        speedMultiplier: 1.55,
        critChanceBonus: 0.12,
        range: 1050,
        skyBoltEveryNShots: 5,
        color: '#fed330',
        image: 'assets/WeaponIcons/ZeusThunderbolt.png',
        unlockSource: 'boss_zeus',
        unlockLabel: 'DEFEAT ZEUS',
        hideWhenLocked: true,
        evolved: {
            baseDamage: 62,
            baseDelay: 13,
            extraPierce: 3,
            critChanceBonus: 0.18,
            skyBoltEveryNShots: 4,
            skyBoltRadius: 135,
            skyBoltSplashMult: 0.75,
            arcChance: 0.40,
            arcTargets: 3,
            arcRange: 220,
            arcDmgMult: 0.65,
            uiStats: {
                damage: '62 Awakened',
                fireDelay: 'Awakened (0.22s)',
                trait: '+18% Crit • +3 Pierces • 4th Sky-Bolt • Chains 3'
            }
        }
    }
};

if (typeof window !== 'undefined') {
    window.WEAPONS = WEAPONS;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WEAPONS };
}

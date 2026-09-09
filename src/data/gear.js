/**
 * Lesa.io - Gear Registry (Phase 1)
 * Data registry for Common (⚪), Uncommon (🟢), and select Rare (🔵) equipment.
 * Slots: helmet | armor | belt | gloves | boots
 */

const GEAR_DATA = {
    // ==========================================
    // 🪖 HELMETS (Crit & Skill CDR)
    // ==========================================
    straw_hat: {
        id: 'straw_hat',
        name: 'Straw Beach Hat',
        slot: 'helmet',
        rarity: 'common',
        cost: 350,
        stats: { critChance: 3 },
        statSummary: '+3% Crit Chance',
        icon: '👒',
        iconImg: 'assets/Helmets/StrawBeachHat.png',
        desc: 'Protects from harsh Mediterranean sun and stray peas.'
    },
    paper_cap: {
        id: 'paper_cap',
        name: 'Souvlaki Paper Cap',
        slot: 'helmet',
        rarity: 'common',
        cost: 450,
        stats: { critChance: 4 },
        statSummary: '+4% Crit Chance',
        icon: '🧑‍🍳',
        iconImg: 'assets/Helmets/SouvlakiPaperCap.png',
        desc: 'Smells of oregano and street food dedication.'
    },
    beanie: {
        id: 'beanie',
        name: 'Knitted Winter Beanie',
        slot: 'helmet',
        rarity: 'common',
        cost: 400,
        stats: { maxHp: 15 },
        statSummary: '+15 Max HP',
        icon: '🧶',
        iconImg: 'assets/Helmets/KnittedWinterBeanie.png',
        desc: 'Warm fleece knit that cushions head impacts.'
    },
    fisherman_cap: {
        id: 'fisherman_cap',
        name: "Greek Fisherman's Cap",
        slot: 'helmet',
        rarity: 'uncommon',
        cost: 950,
        stats: { critChance: 5 },
        statSummary: '+5% Crit Chance',
        icon: '⚓',
        iconImg: 'assets/Helmets/GreekFisherMansCaptainCap.png',
        desc: 'Black wool sea captain cap with embroidered gold cord.'
    },
    sun_visor: {
        id: 'sun_visor',
        name: 'Neon Sun Visor',
        slot: 'helmet',
        rarity: 'uncommon',
        cost: 1100,
        stats: { critChance: 6 },
        statSummary: '+6% Crit Chance',
        icon: '🧢',
        iconImg: 'assets/Helmets/NeonSunVisor.png',
        desc: 'Retro tennis visor shielding eyes from stadium glare.'
    },
    scooter_helmet: {
        id: 'scooter_helmet',
        name: 'Scooter Delivery Helmet',
        slot: 'helmet',
        rarity: 'uncommon',
        cost: 1200,
        stats: { critChance: 5 },
        statSummary: '+5% Crit Chance',
        icon: '🛵',
        iconImg: 'assets/Helmets/ScooterDeliveryHelmet.png',
        desc: 'Scuffed open-face helmet built for narrow city traffic.'
    },
    snorkel_mask: {
        id: 'snorkel_mask',
        name: "Diver's Snorkel Mask",
        slot: 'helmet',
        rarity: 'rare',
        cost: 2200,
        stats: { critChance: 7, critDamage: 12 },
        statSummary: '+7% Crit Chance, +12% Crit Damage',
        icon: '🤿',
        iconImg: 'assets/Helmets/DiverSnorkelMask.png',
        desc: 'Tempered glass mask granting crisp underwater target focus.'
    },
    hardhat: {
        id: 'hardhat',
        name: 'Bedrock Hardhat',
        slot: 'helmet',
        rarity: 'rare',
        cost: 2350,
        stats: { critChance: 6, maxHp: 25 },
        statSummary: '+6% Crit Chance, +25 Max HP',
        icon: '⛑️',
        iconImg: 'assets/Helmets/BedrockHardHat.png',
        desc: 'Yellow fiberglass safety helmet designed to withstand rubble.'
    },

    // ==========================================
    // 🦺 ARMOR (Max HP & Damage Reduction)
    // ==========================================
    tank_top: {
        id: 'tank_top',
        name: 'White Ribbed Tank Top',
        slot: 'armor',
        rarity: 'common',
        cost: 350,
        stats: { maxHp: 18 },
        statSummary: '+18 Max HP',
        icon: '🎽',
        iconImg: 'assets/Armors/WhiteRibbedTankTop.png',
        desc: 'Classic Greek dad balcony undershirt. Lightweight and airy.'
    },
    tourist_tee: {
        id: 'tourist_tee',
        name: 'Tourist "I ❤️ Greece" Tee',
        slot: 'armor',
        rarity: 'common',
        cost: 400,
        stats: { maxHp: 15 },
        statSummary: '+15 Max HP',
        icon: '👕',
        iconImg: 'assets/Armors/TouristIlovegreeceshirt.png',
        desc: '100% cotton souvenir tee bought on the Plaka.'
    },
    denim_vest: {
        id: 'denim_vest',
        name: 'Faded Denim Vest',
        slot: 'armor',
        rarity: 'common',
        cost: 450,
        stats: { maxHp: 20 },
        statSummary: '+20 Max HP',
        icon: '🦺',
        iconImg: 'assets/Armors/FadedDenimVest.png',
        desc: 'Rugged vintage vest with brass buttons.'
    },
    lifeguard_vest: {
        id: 'lifeguard_vest',
        name: 'Lifeguard Foam Vest',
        slot: 'armor',
        rarity: 'uncommon',
        cost: 950,
        stats: { maxHp: 35 },
        statSummary: '+35 Max HP',
        icon: '🦺',
        iconImg: 'assets/Armors/LifeGuardFoamVest.png',
        desc: 'High-visibility orange vest cushioned with impact foam.'
    },
    striped_shirt: {
        id: 'striped_shirt',
        name: 'Sailor Striped Longsleeve',
        slot: 'armor',
        rarity: 'uncommon',
        cost: 1050,
        stats: { maxHp: 30 },
        statSummary: '+30 Max HP',
        icon: '⛵',
        iconImg: 'assets/Armors/SailorStrippedLong.png',
        desc: 'Traditional navy and white Breton stripes for seaside resilience.'
    },
    tracksuit_top: {
        id: 'tracksuit_top',
        name: 'Retro Tracksuit Top',
        slot: 'armor',
        rarity: 'uncommon',
        cost: 1150,
        stats: { maxHp: 28 },
        statSummary: '+28 Max HP',
        icon: '🧥',
        iconImg: 'assets/Armors/RetroTrackSuitTop.png',
        desc: 'Silky polyester sports jacket with dual racing stripes.'
    },
    leather_apron: {
        id: 'leather_apron',
        name: 'Grillmaster Leather Apron',
        slot: 'armor',
        rarity: 'rare',
        cost: 2300,
        stats: { maxHp: 55, damageReduction: 6 },
        statSummary: '+55 Max HP, +6% Damage Reduction',
        icon: '🍳',
        iconImg: 'assets/Armors/GrillMasterLeather.png',
        desc: 'Sturdy cowhide apron impervious to hot sparks and flying grease.'
    },
    biker_jacket: {
        id: 'biker_jacket',
        name: 'Biker Kevlar Jacket',
        slot: 'armor',
        rarity: 'rare',
        cost: 2500,
        stats: { maxHp: 65, damageReduction: 5 },
        statSummary: '+65 Max HP, +5% Damage Reduction',
        icon: '🏍️',
        iconImg: 'assets/Armors/BikerKevlarJacket.png',
        desc: 'Heavy black leather jacket padded with ballistic lining.'
    },
    gucci_blazer: {
        id: 'gucci_blazer',
        name: 'Sakaki ths Nuxtas',
        slot: 'armor',
        rarity: 'exclusive',
        cost: 0,
        stats: { maxHp: 80, speed: 3, damageReduction: 8 },
        statSummary: '+80 Max HP, +3% Move Speed, +8% Damage Reduction',
        icon: '🧥',
        iconImg: 'assets/Armors/GucciVelvetBlazer.png',
        desc: '«Με ένα Gucci σακάκι, μες στη νύχτα...» Ειδικό συλλεκτικό σακάκι αφιερωμένο στον άρχοντα της νύχτας Γιώργο Μαζωνάκη. Αθάνατος.'
    },

    // ==========================================
    // 🥋 BELTS (Dash CDR & Mobility)
    // ==========================================
    twine_rope: {
        id: 'twine_rope',
        name: 'Tied Twine Rope',
        slot: 'belt',
        rarity: 'common',
        cost: 300,
        stats: { dashCooldown: 4 },
        statSummary: '-4% Dash Cooldown',
        icon: '🪢',
        iconImg: 'assets/Belts/TiedTwineRope.png',
        desc: 'Knotted garden hemp that keeps shorts secure during quick dashes.'
    },
    tracksuit_cord: {
        id: 'tracksuit_cord',
        name: 'Elastic Tracksuit Cord',
        slot: 'belt',
        rarity: 'common',
        cost: 350,
        stats: { dashCooldown: 4 },
        statSummary: '-4% Dash Cooldown',
        icon: '〰️',
        iconImg: 'assets/Belts/ElasticTracksuit.png',
        desc: 'Stretchy drawstring providing natural springiness.'
    },
    canvas_belt: {
        id: 'canvas_belt',
        name: 'Cheap Canvas Webbing',
        slot: 'belt',
        rarity: 'common',
        cost: 400,
        stats: { magnetRadius: 15 },
        statSummary: '+15 Magnet Radius',
        icon: '🎗️',
        iconImg: 'assets/Belts/CheapCanvasWebbing.png',
        desc: 'Standard utility webbing that holds a few extra pouches.'
    },
    dad_belt: {
        id: 'dad_belt',
        name: "Dad's Heavy Buckle Belt",
        slot: 'belt',
        rarity: 'uncommon',
        cost: 950,
        stats: { dashCooldown: 6 },
        statSummary: '-6% Dash Cooldown',
        icon: '🥋',
        iconImg: 'assets/Belts/DadsHeavyBuckle.png',
        desc: 'Wide brown leather belt with a solid brass buckle.'
    },
    neck_pouch: {
        id: 'neck_pouch',
        name: 'Tourist Neck Pouch',
        slot: 'belt',
        rarity: 'uncommon',
        cost: 1000,
        stats: { magnetRadius: 25 },
        statSummary: '+25 Magnet Radius',
        icon: '👛',
        iconImg: 'assets/Belts/TouristNeckPouch.png',
        desc: 'Zipped pouch worn under shirts to stash coins securely.'
    },
    plumber_belt: {
        id: 'plumber_belt',
        name: "Plumber's Tool Belt",
        slot: 'belt',
        rarity: 'uncommon',
        cost: 1100,
        stats: { dashCooldown: 5 },
        statSummary: '-5% Dash Cooldown',
        icon: '🔧',
        iconImg: 'assets/Belts/PlumbersToolBelt.png',
        desc: 'Heavy leather loops keeping tools organized on the run.'
    },
    fanny_pack: {
        id: 'fanny_pack',
        name: 'Streetwear Fanny Pack',
        slot: 'belt',
        rarity: 'rare',
        cost: 2100,
        stats: { dashCooldown: 9, magnetRadius: 25 },
        statSummary: '-9% Dash Cooldown, +25 Magnet',
        icon: '🎒',
        iconImg: 'assets/Belts/StreetWearFannyPack.png',
        desc: 'Crossbody Athens streetwear bag for instant ammo retrieval.'
    },
    gym_belt: {
        id: 'gym_belt',
        name: 'Gym Weightlifting Belt',
        slot: 'belt',
        rarity: 'rare',
        cost: 2350,
        stats: { dashCooldown: 8, maxHp: 20 },
        statSummary: '-8% Dash Cooldown, +20 Max HP',
        icon: '🏋️',
        iconImg: 'assets/Belts/GymWeightLiftingBelt.png',
        desc: 'Stiff lumbar support allowing explosive physical movements.'
    },

    // ==========================================
    // 🥊 GLOVES (Fire Rate & Bullet Damage)
    // ==========================================
    oven_mitts: {
        id: 'oven_mitts',
        name: 'Oven Mitts',
        slot: 'gloves',
        rarity: 'common',
        cost: 350,
        stats: { fireRate: 3 },
        statSummary: '+3% Fire Rate',
        icon: '🧤',
        iconImg: 'assets/Gloves/OvenMitts.png',
        desc: 'Padded floral kitchen mitts that insulate against hot barrels.'
    },
    blue_latex: {
        id: 'blue_latex',
        name: 'Blue Latex Gloves',
        slot: 'gloves',
        rarity: 'common',
        cost: 350,
        stats: { bulletSpeed: 5 },
        statSummary: '+5% Bullet Speed',
        icon: '🧤',
        iconImg: 'assets/Gloves/BlueLatexGloves.png',
        desc: 'Surgical grip with zero weapon slippage.'
    },
    cotton_gloves: {
        id: 'cotton_gloves',
        name: 'Cotton Garden Gloves',
        slot: 'gloves',
        rarity: 'common',
        cost: 400,
        stats: { bulletDamage: 3 },
        statSummary: '+3% Bullet Damage',
        icon: '🧤',
        iconImg: 'assets/Gloves/CottonGardenGloves.png',
        desc: 'Sturdy knit with rubberized palms for heavier projectile throws.'
    },
    fingerless_gloves: {
        id: 'fingerless_gloves',
        name: 'Biker Fingerless Gloves',
        slot: 'gloves',
        rarity: 'uncommon',
        cost: 950,
        stats: { fireRate: 6 },
        statSummary: '+6% Fire Rate',
        icon: '🥊',
        iconImg: 'assets/Gloves/BikerFingerlessGloves.png',
        desc: 'Perforated leather knuckles designed for lightning-fast trigger pulls.'
    },
    yellow_rubber: {
        id: 'yellow_rubber',
        name: 'Yellow Rubber Gloves',
        slot: 'gloves',
        rarity: 'uncommon',
        cost: 1000,
        stats: { maxHp: 10 },
        statSummary: '+10 Max HP',
        icon: '🧤',
        iconImg: 'assets/Gloves/RubberYellowGloves.png',
        desc: 'Heavy-duty household gloves that absorb shocks and electricity.'
    },
    gym_straps: {
        id: 'gym_straps',
        name: 'Weight Gym Straps',
        slot: 'gloves',
        rarity: 'uncommon',
        cost: 1100,
        stats: { bulletDamage: 5 },
        statSummary: '+5% Bullet Damage',
        icon: '🏋️',
        iconImg: 'assets/Gloves/WeightGymStraps.png',
        desc: 'Cotton wrist wraps ensuring crushing projectile force.'
    },
    spiky_gardening: {
        id: 'spiky_gardening',
        name: 'Spiky Gardening Gloves',
        slot: 'gloves',
        rarity: 'rare',
        cost: 2150,
        stats: { fireRate: 8, bulletDamage: 7 },
        statSummary: '+8% Fire Rate, +7% Bullet Damage',
        icon: '🌵',
        iconImg: 'assets/Gloves/SpikyGardeningGloves.png',
        desc: 'Heavy gauntlets embedded with prickly micro-spikes.'
    },
    goalkeeper_grips: {
        id: 'goalkeeper_grips',
        name: 'Goalkeeper Grips',
        slot: 'gloves',
        rarity: 'rare',
        cost: 2300,
        stats: { fireRate: 7, bulletSpeed: 6 },
        statSummary: '+7% Fire Rate, +6% Bullet Speed',
        icon: '🧤',
        iconImg: 'assets/Gloves/GoalkeeperGrips.png',
        desc: 'Sticky latex foam palms that deflect incoming projectiles.'
    },

    // ==========================================
    // 🩴 BOOTS (Movement Speed & Agility)
    // ==========================================
    flip_flops: {
        id: 'flip_flops',
        name: 'Rubber Flip-Flops',
        slot: 'boots',
        rarity: 'common',
        cost: 300,
        stats: { speed: 4 },
        statSummary: '+4% Move Speed',
        icon: '🩴',
        iconImg: 'assets/boots/RubberFlipsFlops.png',
        desc: 'Simple blue rubber thongs. Slap-slaps noisily across the arena.'
    },
    foam_clogs: {
        id: 'foam_clogs',
        name: 'Beach Foam Clogs',
        slot: 'boots',
        rarity: 'common',
        cost: 350,
        stats: { maxHp: 8 },
        statSummary: '+8 Max HP',
        icon: '👡',
        iconImg: 'assets/boots/BeachFoamGlogs.png',
        desc: 'Perforated foam footwear comfortable enough for all-day running.'
    },
    espadrilles: {
        id: 'espadrilles',
        name: 'Worn Canvas Espadrilles',
        slot: 'boots',
        rarity: 'common',
        cost: 400,
        stats: { speed: 4 },
        statSummary: '+4% Move Speed',
        icon: '👟',
        iconImg: 'assets/boots/WornCanvas.png',
        desc: 'Rope-soled canvas loafers offering light and silent steps.'
    },
    fisherman_boots: {
        id: 'fisherman_boots',
        name: 'Yellow Fisherman Boots',
        slot: 'boots',
        rarity: 'uncommon',
        cost: 950,
        stats: { speed: 7 },
        statSummary: '+7% Move Speed',
        icon: '👢',
        iconImg: 'assets/boots/YellowFisherMan.png',
        desc: 'High rubber waders completely immune to puddle traction loss.'
    },
    canvas_sneakers: {
        id: 'canvas_sneakers',
        name: 'Classic High-Top Sneakers',
        slot: 'boots',
        rarity: 'uncommon',
        cost: 1050,
        stats: { speed: 7 },
        statSummary: '+7% Move Speed',
        icon: '👟',
        iconImg: 'assets/boots/ClassicHighTopSneakers.png',
        desc: 'Timeless canvas ankle shoes with flexible rubber toe caps.'
    },
    soccer_cleats: {
        id: 'soccer_cleats',
        name: 'Soccer Cleats',
        slot: 'boots',
        rarity: 'uncommon',
        cost: 1150,
        stats: { speed: 6 },
        statSummary: '+6% Move Speed',
        icon: '⚽',
        iconImg: 'assets/boots/SoccerCleats.png',
        desc: 'Firm ground studs that bite into grass and prevent slipping.'
    },
    turbo_sneakers: {
        id: 'turbo_sneakers',
        name: 'Turbo Retro Air Sneakers',
        slot: 'boots',
        rarity: 'rare',
        cost: 2250,
        stats: { speed: 10, dashCooldown: 5 },
        statSummary: '+10% Move Speed, -5% Dash CD',
        icon: '⚡',
        iconImg: 'assets/boots/TurboRetroAirSneakers.png',
        desc: 'Pneumatic sole cushions that propel the wearer into full sprints.'
    },
    steel_toe: {
        id: 'steel_toe',
        name: 'Steel-Toe Work Boots',
        slot: 'boots',
        rarity: 'rare',
        cost: 2400,
        stats: { speed: 6, maxHp: 25 },
        statSummary: '+6% Move Speed, +25 Max HP',
        icon: '🥾',
        iconImg: 'assets/boots/SteelToeWorkBoots.png',
        desc: 'Reinforced industrial boots impervious to floor hazards.'
    }
};

const GEAR_ITEMS = {
    helmet: [],
    armor: [],
    belt: [],
    gloves: [],
    boots: []
};
for (const item of Object.values(GEAR_DATA)) {
    if (GEAR_ITEMS[item.slot]) {
        GEAR_ITEMS[item.slot].push(item);
    }
}

if (typeof window !== 'undefined') {
    window.GEAR_DATA = GEAR_DATA;
    window.GEAR_ITEMS = GEAR_ITEMS;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GEAR_DATA, GEAR_ITEMS };
}

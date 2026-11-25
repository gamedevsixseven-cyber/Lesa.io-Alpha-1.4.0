/**
 * Lesa.io - Celestial Weapon Skill Tree Catalog
 * Each Celestial weapon unlocks a branching 2-path specialization tree after ★ Awakening.
 * Selecting Node 1 of either branch permanently locks the alternate path.
 * The final node (Tier 3) of the chosen branch grants +1 permanent Special Trait / Ability.
 */

const CELESTIAL_SKILL_TREES = {
    hyperion_glaive: {
        weaponId: 'hyperion_glaive',
        title: 'HYPERION ASTRAL TREE',
        subtitle: 'Choose 1 eternal constellation branch after ★ Awakening. Locked paths cannot be changed.',
        paths: [
            {
                id: 'path_supernova',
                name: 'Solar Cataclysm',
                tagline: 'Heavy Cleaves & Eclipse Detonations',
                accent: '#fbbf24',
                nodes: [
                    {
                        id: 'hg_sup_1',
                        tier: 1,
                        name: 'Astral Heft',
                        statSummary: '+18 Base DMG • +5% Crit Chance',
                        stats: { baseDamage: 18, critChanceBonus: 0.05 },
                        cost: { coins: 25000, materials: { armory_shards: 35, mati_crystal: 10 } }
                    },
                    {
                        id: 'hg_sup_2',
                        tier: 2,
                        name: 'Titan Horizon',
                        statSummary: '+60 Range • +18% Cleave & Rift Radius',
                        stats: { range: 60, cleaveRadiusBonus: 0.18 },
                        cost: { coins: 45000, materials: { mati_crystal: 18, olympian_bronze: 14 } }
                    },
                    {
                        id: 'hg_sup_3',
                        tier: 3,
                        name: 'Eclipse Supernova',
                        statSummary: '+16 Base DMG • +1 Special Trait',
                        stats: { baseDamage: 16 },
                        cost: { coins: 70000, materials: { olympian_bronze: 22 }, evolutionStones: 1 },
                        specialTrait: {
                            id: 'solar_echo',
                            name: 'Solar Echo',
                            desc: '+1 Special Trait: Celestial Rifts trigger a delayed 290px Solar Collapse detonation (120% Base DMG + 0.9s Stun).'
                        }
                    }
                ]
            },
            {
                id: 'path_tempest',
                name: 'Phantom Astrolabe',
                tagline: 'Blinding Swing Speed & Swarm Blades',
                accent: '#38bdf8',
                nodes: [
                    {
                        id: 'hg_tmp_1',
                        tier: 1,
                        name: 'Quicksilver Edge',
                        statSummary: '-2F Attack Delay • +6% Crit Chance',
                        stats: { baseDelayDelta: -2, critChanceBonus: 0.06 },
                        cost: { coins: 25000, materials: { armory_shards: 35, mati_crystal: 10 } }
                    },
                    {
                        id: 'hg_tmp_2',
                        tier: 2,
                        name: 'Prism Conduit',
                        statSummary: '+12 Base DMG • +35% Star-Blade Damage',
                        stats: { baseDamage: 12, orbitDamageMultBonus: 0.35 },
                        cost: { coins: 45000, materials: { mati_crystal: 18, olympian_bronze: 14 } }
                    },
                    {
                        id: 'hg_tmp_3',
                        tier: 3,
                        name: 'Astral Flock',
                        statSummary: '-1F Attack Delay • +1 Special Trait',
                        stats: { baseDelayDelta: -1, orbitBladesBonus: 2 },
                        cost: { coins: 70000, materials: { olympian_bronze: 22 }, evolutionStones: 1 },
                        specialTrait: {
                            id: 'astral_flock',
                            name: 'Astral Flock',
                            desc: '+1 Special Trait: Summons +2 extra Orbiting Star-Blades (5 total) & swings fire twin seeking Prism Shards.'
                        }
                    }
                ]
            }
        ]
    },

    aurelion_scepter: {
        weaponId: 'aurelion_scepter',
        title: 'AURELION STARFALL TREE',
        subtitle: 'Choose 1 eternal constellation branch after ★ Awakening. Locked paths cannot be changed.',
        paths: [
            {
                id: 'path_starfall',
                name: 'Celestial Meteorum',
                tagline: 'Colossal Starfall Bombardment',
                accent: '#fef08a',
                nodes: [
                    {
                        id: 'au_stf_1',
                        tier: 1,
                        name: 'Starforged Core',
                        statSummary: '+16 Base DMG • +6% Crit Chance',
                        stats: { baseDamage: 16, critChanceBonus: 0.06 },
                        cost: { coins: 25000, materials: { armory_shards: 35, mati_crystal: 10 } }
                    },
                    {
                        id: 'au_stf_2',
                        tier: 2,
                        name: 'Orbital Velocity',
                        statSummary: '+20% Proj Speed • +2 Extra Pierces',
                        stats: { speedMultiplierBonus: 0.20, extraPierce: 2 },
                        cost: { coins: 45000, materials: { mati_crystal: 18, olympian_bronze: 14 } }
                    },
                    {
                        id: 'au_stf_3',
                        tier: 3,
                        name: 'Starfall Judgment',
                        statSummary: '+18 Base DMG • +1 Special Trait',
                        stats: { baseDamage: 18 },
                        cost: { coins: 70000, materials: { olympian_bronze: 22 }, evolutionStones: 1 },
                        specialTrait: {
                            id: 'starfall_judgment',
                            name: 'Starfall Judgment',
                            desc: '+1 Special Trait: Every 3rd Starfall burst calls 3 Orbital Meteors (145% AoE DMG + 0.7s Stun).'
                        }
                    }
                ]
            },
            {
                id: 'path_prism',
                name: 'Iridescent Overdrive',
                tagline: 'Rapid Beams & Refracting Split',
                accent: '#f0abfc',
                nodes: [
                    {
                        id: 'au_prm_1',
                        tier: 1,
                        name: 'Refraction Coil',
                        statSummary: '-2F Attack Delay • +5% Crit Chance',
                        stats: { baseDelayDelta: -2, critChanceBonus: 0.05 },
                        cost: { coins: 25000, materials: { armory_shards: 35, mati_crystal: 10 } }
                    },
                    {
                        id: 'au_prm_2',
                        tier: 2,
                        name: 'Prismatic Lens',
                        statSummary: '+10 Base DMG • +120 Beam Range',
                        stats: { baseDamage: 10, range: 120 },
                        cost: { coins: 45000, materials: { mati_crystal: 18, olympian_bronze: 14 } }
                    },
                    {
                        id: 'au_prm_3',
                        tier: 3,
                        name: 'Refracting Halo Beams',
                        statSummary: '-1F Attack Delay • +1 Special Trait',
                        stats: { baseDelayDelta: -1 },
                        cost: { coins: 70000, materials: { olympian_bronze: 22 }, evolutionStones: 1 },
                        specialTrait: {
                            id: 'refracting_halo_beams',
                            name: 'Refracting Halo Beams',
                            desc: '+1 Special Trait: Starlight hits split 3 homing mini prism bolts (45% DMG) + brief crit speed surge.'
                        }
                    }
                ]
            }
        ]
    }
};

if (typeof window !== 'undefined') window.CELESTIAL_SKILL_TREES = CELESTIAL_SKILL_TREES;
if (typeof module !== 'undefined' && module.exports) module.exports = { CELESTIAL_SKILL_TREES };

/**
 * Lesa.io - Authoritative Gameplay Tips & Strategy Knowledge Base
 * Compact high-performance catalog of categorized gameplay tips with instant dynamic parsing
 */

const RAW_TIPS = [
    // 1. HEROES & ARCHETYPES
    'hero_psanas_balance|hero|*Psanas* is the ultimate balanced all-rounder—his standard Slingshot delivers rapid, dependable single-target fire!',
    'hero_psogas_pierce|hero|*Psogas* moves 10% faster than other heroes and wields the fiery Chili Blaster with innate bullet pierce!',
    'hero_petros_tank|hero|*Petros* boasts a massive 150 base HP, takes 8% less damage, and starts equipped with the heavy explosive Watermelon Cannon!',
    'hero_roster_swapping|hero|Unlock new heroes in the *Roster* using Coins and Diamonds to experiment with different starting weapon styles!',
    'hero_speed_kiting|hero|*Psogas\' 5.2 move speed* lets you outrun charging brutes without even needing to spend your Dash!',
    'hero_petros_splash|hero|While playing *Petros*, aim melon shots right into the center of enemy packs to maximize splash damage!',

    // 2. ACTIVE SKILLS & COMBAT MOVEMENT
    'skill_blade_rush|combat|Press *[E]* to activate *Blade Rush*! Dash forward drawing a razor-sharp combat knife dealing 85 damage!',
    'skill_blade_rush_knockback|combat|*Blade Rush [E]* knocks enemies backward—use it as an aggressive escape tool when swarms pin you down!',
    'combat_dash_iframes|combat|Press *[SPACE] or Right-Click* to Dash! You are completely *invulnerable to damage* during the roll!',
    'combat_dash_through_bullets|combat|You can dash directly *through enemy projectiles* without taking damage thanks to invulnerability frames!',
    'combat_continuous_fire|combat|Hold down the *Left Mouse Button* for continuous autofire while guiding your hero with WASD or Arrow keys!',
    'combat_lead_your_shots|combat|Lead your shots slightly ahead of fast-moving targets like *Casillas* to land direct hits!',
    'combat_critical_sparks|combat|*Critical hits* deal 2x damage and trigger sparkling cartoon comic hit effects on impact!',
    'combat_circle_strafing|combat|Always *strafe in wide circles* around hordes rather than running in a straight line backwards!',

    // 3. SKATMIR (THE BRUISER TANK)
    'enemy_fatmir_charge_dodge|enemy|When *Skatmir* winds up his charge with red sparks, dash *90 degrees sideways* to avoid fatal knockback!',
    'enemy_fatmir_ground_slam|enemy|Don\'t get within 120 pixels of *Skatmir*! His ground slam creates a shockwave dealing heavy area damage!',
    'enemy_fatmir_high_hp|enemy|*Skatmir* has 180+ base HP! Focus continuous fire on him while staying out of his slam radius!',
    'enemy_fatmir_barrel_trap|enemy|Lure charging *Skatmirs* into red explosive barrels—one blast will strip almost their entire health bar!',
    'enemy_fatmir_wall_slam|enemy|Avoid arena boundaries when fighting *Skatmir*; getting pinned against a wall removes your dodging room!',

    // 4. CASILLAS (THE AGILE STRIKER)
    'enemy_casillas_dodge_stumble|enemy|*Casillas* can dive-dodge your shots, but stumbles briefly afterward—unleash full fire while he recovers!',
    'enemy_casillas_soccer_curving|enemy|*Casillas* kicks curving soccer balls that arc around obstacles—keep moving to throw off his aim!',
    'enemy_casillas_dodge_cooldown|enemy|*Casillas\' dive-dodge* has a 5-second cooldown; once he dodges your first shot, he is temporarily defenseless!',
    'enemy_casillas_fast_flank|enemy|*Casillas* sprints at nearly 4.0 speed! Use *Blade Rush [E]* to stagger him before he closes in!',
    'enemy_casillas_bubble_counter|enemy|The *Bubble Gun* is great against Casillas—ricocheting bubbles often hit him from behind during his dodge!',

    // 5. SKARMOGYFTOS (SMOKE CONJURER & LOOT THIEF)
    'enemy_skarmo_sleep_smoke|enemy|Avoid *Skarmogyftos\' purple smoke clouds*! Standing inside slows your hero down by *30%*!',
    'enemy_skarmo_cookie_vacuum|enemy|*Skarmogyftos* greedily vacuums up loose ground cookies to build a shield—hunt him down fast!',
    'enemy_skarmo_pinata_burst|enemy|When defeated, *Skarmogyftos bursts like a piñata*, returning all stolen XP cookies with juicy bonus interest!',
    'enemy_skarmo_smoke_teleport|enemy|*Skarmogyftos* can vanish in a POOF of smoke and flank you—turn around quickly when you hear him teleport!',
    'enemy_skarmo_curved_volley|enemy|Watch for *Skarmogyftos\' 3-way curved smoke volley*! Step between the expanding arcs to slip through unscathed!',

    // 5B. PSALTIS (THE HYPE MAN)
    'enemy_psaltis_anthem|enemy|*Psaltis* sings his anthem to hype up nearby enemies with bonus speed and damage—*silence him first*!',
    'enemy_psaltis_water_counter|enemy|Drench *Psaltis* with the *Nerobalonaki*! One water balloon and his anthem dissolves into a coughing fit!',
    'enemy_psaltis_high_note|enemy|Never corner *Psaltis*—his high-note blast knocks you back! Flank him from mid range instead!',

    // 6. KLEANTHIS (THE DAPPER CONQUEROR)
    'enemy_kleanthis_top_hat|enemy|*Kleanthis* enters the fray with high swagger and devastating cane strikes—keep your distance!',
    'enemy_kleanthis_defeat_bounty|enemy|Defeating *Kleanthis* awards a massive +300 score bounty and rare star drops!',

    // 7. WEAPONS & UPGRADES
    'weapon_pea_slingshot|weapon|The *Pea Slingshot* fires rapidly and benefits immensely from *Multi-Pea Burst* upgrades!',
    'weapon_watermelon_cannon|weapon|The *Watermelon Cannon* deals devastating AoE splash damage—ideal for eliminating dense enemy clusters!',
    'weapon_chili_blaster|weapon|The *Chili Blaster* shoots searing spicy projectiles that pierce straight through multiple enemies!',
    'weapon_bubble_gun|weapon|The *Bubble Gun* fires iridescent bubbles that bounce off obstacles and trap foes!',
    'weapon_kiloumpas_carbine|weapon|Defeat Wave 15 mini-boss *Kiloumpas* to unlock *Kiloumpas\'s Carbine*, firing high-velocity piercing slugs with +15% Crit!',
    'weapon_rouf_dialtone|weapon|Defeat Wave 20 boss *Rouf* to unlock *Rouf\'s Dial-Tone Blaster*, slowing enemies on hit and firing a 3-way sonic volley every 4th shot!',

    // 8. DROPS & POWERUPS
    'drop_xp_cookies|pickup|Collect golden *XP Cookies* to level up your hero and pick powerful upgrades during the match!',
    'drop_health_hearts|pickup|Keep an eye out for red *Health Hearts* dropped by defeated enemies when your health is low!',
    'drop_star_frenzy|pickup|Grab golden *Powerup Stars* to trigger a 7-second *Frenzy Mode* with maximum fire rate and speed!',
    'drop_magnet_candy|pickup|Pick up the blue *Magnet Candy* to instantly vacuum all loose XP cookies across the entire arena!',
    'drop_shield_bubble|pickup|The blue *Shield Drop* absorbs a full hit of enemy damage without depleting your HP bar!',

    // 9. INTERACTIVE ARENA
    'arena_explosive_barrels|arena|Shoot red *Explosive Barrels* to trigger a 250 damage shockwave against nearby enemy mobs!',
    'arena_wooden_crates|arena|Break brown *Wooden Crates* scattered throughout the arena to find hidden cookies and health hearts!',
    'arena_bouncy_mushrooms|arena|Step onto *Bouncy Mushrooms* for a sudden propulsion boost to escape dangerous encirclements!',
    'arena_boundary_radar|arena|Keep an eye on your mini-map radar in the corner to track enemy hordes before they ambush you!'
];

const GAMEPLAY_TIPS = RAW_TIPS.map((raw) => {
    const parts = raw.split('|');
    const id = parts[0];
    const category = parts[1];
    const body = parts.slice(2).join('|');
    const text = 'TIP: ' + body.replace(/\*([^*]+)\*/g, '<span class="loading-tip-highlight">$1</span>');
    return { id, category, text };
});

class TipsManager {
    static getRecentHistory() {
        try {
            const raw = localStorage.getItem('lesaio_recent_tips');
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    }

    static saveRecentHistory(history) {
        try {
            const maxStored = 12;
            const trimmed = history.slice(-maxStored);
            localStorage.setItem('lesaio_recent_tips', JSON.stringify(trimmed));
        } catch (e) {}
    }

    static getRandomTip(options = {}) {
        const { formatted = true, category = null, excludeId = null } = options;

        let pool = GAMEPLAY_TIPS;
        if (category) {
            const filtered = pool.filter(t => t.category === category);
            if (filtered.length > 0) pool = filtered;
        }

        const recentHistory = TipsManager.getRecentHistory();
        let candidates = pool.filter(t => !recentHistory.includes(t.id) && t.id !== excludeId);

        if (candidates.length === 0) {
            const prunedHistory = recentHistory.slice(Math.floor(recentHistory.length / 2));
            candidates = pool.filter(t => !prunedHistory.includes(t.id) && t.id !== excludeId);
            TipsManager.saveRecentHistory(prunedHistory);
        }

        if (candidates.length === 0) {
            candidates = pool.filter(t => t.id !== excludeId);
            if (candidates.length === 0) candidates = pool;
        }

        const randomIndex = Math.floor(Math.random() * candidates.length);
        const selectedTip = candidates[randomIndex];

        recentHistory.push(selectedTip.id);
        TipsManager.saveRecentHistory(recentHistory);

        if (formatted) {
            return selectedTip.text;
        }
        return selectedTip.text.replace(/<[^>]+>/g, '');
    }

    static getAllTips(formatted = true) {
        return GAMEPLAY_TIPS.map(t => formatted ? t.text : t.text.replace(/<[^>]+>/g, ''));
    }
}

if (typeof window !== 'undefined') {
    window.GAMEPLAY_TIPS = GAMEPLAY_TIPS;
    window.TipsManager = TipsManager;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GAMEPLAY_TIPS, TipsManager };
}

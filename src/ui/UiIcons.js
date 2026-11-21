/**
 * Lesa.io - Unified Cartoon Vector & Asset UI Icons Registry
 * Centralizes custom SVG/PNG UI icon rendering across menus, modals, and toasts.
 */
class UiIcons {
    static PATHS = {
        // Existing custom PNGs
        heroes: 'assets/icons/icon_heroes.png',
        skills: 'assets/icons/icon_skills.png',
        upgrades: 'assets/icons/icon_upgrades.png',
        inventory: 'assets/icons/icon_inventory.png',
        talents: 'assets/icons/icon_talents.png',
        gear: 'assets/icons/icon_gear.png',
        weapons: 'assets/icons/icon_weapons.png',
        sword: 'assets/GearUIIcons/ATK.png',
        atk: 'assets/GearUIIcons/ATK.png',
        shield: 'assets/GearUIIcons/DEF.png',
        def: 'assets/GearUIIcons/DEF.png',
        heart: 'assets/GearUIIcons/HP.png',
        hp: 'assets/GearUIIcons/HP.png',
        skill_blade_rush: 'assets/SkillsIcons/BladeRushSkill.png',

        // Weapon PNGs for HUD
        weapon_pea: 'assets/WeaponIcons/PeaSlingshot.png',
        weapon_watermelon: 'assets/WeaponIcons/MelonCannon.png',
        weapon_bubble: 'assets/WeaponIcons/BubbleGun.png',
        weapon_pepper: 'assets/WeaponIcons/ChilliBlaster.png',
        weapon_money_gun: 'assets/WeaponIcons/MoneyGun.png',
        weapon_burger: 'assets/WeaponIcons/BurgerToss.png',
        weapon_lightning: 'assets/WeaponIcons/LightningStrike.png',
        weapon_greek_flag: 'assets/WeaponIcons/GreekFlag.png',
        weapon_m4_carbine: 'assets/WeaponIcons/M4Carbine.png',
        weapon_spas12: 'assets/WeaponIcons/Spas12.png',
        weapon_rusty_smg: 'assets/WeaponIcons/StreetUzi.png',
        weapon_nail_gun: 'assets/WeaponIcons/VillageNailgun.png',
        weapon_plasma_pistol: 'assets/WeaponIcons/NeonArcPistol.png',
        weapon_sawnoff_shotgun: 'assets/WeaponIcons/SawnOffShotgun.png',
        weapon_frost_cannon: 'assets/WeaponIcons/CryoVortexCannon.png',
        weapon_boomerang_saw: 'assets/WeaponIcons/BoomerangSawblade.png',
        weapon_chrono_rifle: 'assets/WeaponIcons/ChronoRifle.png',
        weapon_symbiote: 'assets/WeaponIcons/SymbioteLauncher.png',
        weapon_carbine: 'assets/WeaponIcons/KiloumpasCarbine.png',
        weapon_dialtone: 'assets/WeaponIcons/RoufBlaster.png',
        weapon_zeus_thunderbolt: 'assets/WeaponIcons/ZeusThunderbolt.png',
        weapon_helios_cannon: 'assets/WeaponIcons/HeliosOmegaCannon.png',

        // Custom Comic SVG Icons
        coin: 'assets/ui-icons/coin.svg',
        gem: 'assets/ui-icons/gem.svg',
        lock: 'assets/ui-icons/lock.svg',
        unlock: 'assets/ui-icons/unlock.svg',
        check: 'assets/ui-icons/check.svg',
        cross: 'assets/ui-icons/cross.svg',
        warn: 'assets/ui-icons/warn.svg',
        star: 'assets/ui-icons/star.svg',
        olympian_star_stone: 'assets/ui-icons/olympian_star_stone.svg',
        timer: 'assets/ui-icons/timer.svg',
        hourglass: 'assets/ui-icons/hourglass.svg',
        celebrate: 'assets/ui-icons/celebrate.svg',
        gift: 'assets/ui-icons/gift.svg',
        target: 'assets/ui-icons/target.svg',
        boom: 'assets/ui-icons/boom.svg',
        flame: 'assets/ui-icons/flame.svg',
        bomb: 'assets/ui-icons/bomb.svg',
        bolt: 'assets/ui-icons/bolt.svg',
        plus: 'assets/ui-icons/plus.svg',
        search: 'assets/ui-icons/search.svg',
        crate: 'assets/ui-icons/crate.svg',
        scroll: 'assets/ui-icons/scroll.svg',
        swords: 'assets/ui-icons/swords.svg',
        boxing_glove: 'assets/ui-icons/boxing_glove.svg',
        wave: 'assets/ui-icons/wave.svg',
        cookie: 'assets/ui-icons/cookie.svg',
        snowflake: 'assets/ui-icons/snowflake.svg',
        crown: 'assets/ui-icons/crown.svg',
        trophy: 'assets/ui-icons/trophy.svg',
        people: 'assets/ui-icons/people.svg',
        bell: 'assets/ui-icons/bell.svg',
        mail: 'assets/ui-icons/mail.svg',
        calendar: 'assets/ui-icons/calendar.svg',
        gear_cog: 'assets/ui-icons/gear_cog.svg',
        music: 'assets/ui-icons/music.svg',
        sound: 'assets/ui-icons/sound.svg',
        cloud: 'assets/ui-icons/cloud.svg',
        sync: 'assets/ui-icons/sync.svg',
        edit: 'assets/ui-icons/edit.svg',
        copy: 'assets/ui-icons/copy.svg',
        chart: 'assets/ui-icons/chart.svg',
        gamepad: 'assets/ui-icons/gamepad.svg',
        soccer: 'assets/ui-icons/soccer.svg',
        rocket: 'assets/ui-icons/rocket.svg',
        handshake: 'assets/ui-icons/handshake.svg',
        orb_green: 'assets/ui-icons/orb_green.svg',
        orb_blue: 'assets/ui-icons/orb_blue.svg',
        orb_purple: 'assets/ui-icons/orb_purple.svg',
        orb_orange: 'assets/ui-icons/orb_orange.svg',
        orb_red: 'assets/ui-icons/orb_red.svg',
        orb_dark: 'assets/ui-icons/orb_dark.svg',
        mystery: 'assets/ui-icons/mystery.svg',
        sparkle: 'assets/ui-icons/sparkle.svg',
        tip_bulb: 'assets/ui-icons/tip_bulb.svg',
        fullscreen: 'assets/ui-icons/fullscreen.svg',
        pause: 'assets/ui-icons/pause.svg',
        home: 'assets/ui-icons/home.svg',
        play: 'assets/ui-icons/play.svg',
        info: 'assets/ui-icons/info.svg',
        boot: 'assets/ui-icons/boot.svg',
        wind: 'assets/ui-icons/wind.svg',
        swirl: 'assets/ui-icons/swirl.svg',
        magnet: 'assets/ui-icons/magnet.svg',
        tap: 'assets/ui-icons/tap.svg',
        siren: 'assets/ui-icons/siren.svg',
        temple: 'assets/ui-icons/temple.svg',
        phone_rotate: 'assets/ui-icons/phone_rotate.svg',
        dove: 'assets/ui-icons/dove.svg',
        bag_gold: 'assets/ui-icons/bag_gold.svg',
        credit_card: 'assets/ui-icons/credit_card.svg',
        cart: 'assets/ui-icons/cart.svg',
        wrench: 'assets/ui-icons/wrench.svg',
        key: 'assets/ui-icons/key.svg',
        book: 'assets/ui-icons/book.svg',
        megaphone: 'assets/ui-icons/megaphone.svg',
        crest: 'assets/ui-icons/crest.svg',
        mat_armory_shards: 'assets/ui-icons/mat_armory_shards.svg',
        mat_mati_crystal: 'assets/ui-icons/mat_mati_crystal.svg',
        mat_olympian_bronze: 'assets/ui-icons/mat_olympian_bronze.svg',
        mat_ambrosia_spark: 'assets/ui-icons/mat_ambrosia_spark.svg',
        evolution_stone: 'assets/ui-icons/evolution_stone.svg'
    };

    // Ordered replacement list so multi-codepoint glyphs (e.g. variation selectors) match before bare glyphs.
    static EMOJI_MAP = [
        ['⚠️', 'warn'], ['⚔️', 'swords'], ['🛡️', 'shield'], ['⏱️', 'timer'], ['🗡️', 'sword'],
        ['✉️', 'mail'], ['⚙️', 'gear_cog'], ['🏛️', 'temple'], ['ℹ️', 'info'], ['❤️', 'heart'],
        ['✏️', 'edit'], ['🛠️', 'wrench'], ['🪙', 'coin'], ['💎', 'gem'], ['🔒', 'lock'],
        ['🔓', 'unlock'], ['✅', 'check'], ['❌', 'cross'], ['⭐', 'star'], ['🌟', 'star'],
        ['⏱', 'timer'], ['⏳', 'hourglass'], ['🎉', 'celebrate'], ['🎁', 'gift'], ['🎯', 'target'],
        ['💥', 'boom'], ['🔥', 'flame'], ['💣', 'bomb'], ['⚡', 'bolt'], ['➕', 'plus'],
        ['🔍', 'search'], ['📦', 'crate'], ['📜', 'scroll'], ['🥊', 'boxing_glove'], ['🌊', 'wave'],
        ['🍪', 'cookie'], ['🧊', 'snowflake'], ['❄️', 'snowflake'], ['👑', 'crown'], ['🏆', 'trophy'],
        ['👥', 'people'], ['🔔', 'bell'], ['📅', 'calendar'], ['🎵', 'music'], ['🔊', 'sound'],
        ['🔇', 'sound'], ['☁️', 'cloud'], ['☁', 'cloud'], ['🔄', 'sync'], ['📋', 'copy'],
        ['📊', 'chart'], ['📈', 'chart'], ['🎮', 'gamepad'], ['⚽', 'soccer'], ['🚀', 'rocket'],
        ['🤝', 'handshake'], ['🟢', 'orb_green'], ['🔵', 'orb_blue'], ['🟣', 'orb_purple'],
        ['🟠', 'orb_orange'], ['🔴', 'orb_red'], ['⚫', 'orb_dark'], ['❓', 'mystery'],
        ['✨', 'sparkle'], ['💡', 'tip_bulb'], ['⛶', 'fullscreen'], ['⏸', 'pause'],
        ['🏡', 'home'], ['▶', 'play'], ['👟', 'boot'], ['💨', 'wind'], ['🌀', 'swirl'],
        ['🧲', 'magnet'], ['👆', 'tap'], ['🚨', 'siren'], ['🚔', 'siren'], ['📱', 'phone_rotate'],
        ['🕊️', 'dove'], ['🕊', 'dove'], ['💰', 'bag_gold'], ['💳', 'credit_card'], ['🛒', 'cart'],
        ['🔐', 'key'], ['📖', 'book'], ['📢', 'megaphone'], ['🎒', 'inventory'], ['🪖', 'heroes'],
        ['🎖️', 'talents'], ['🎖', 'talents'], ['📊', 'chart'], ['📨', 'mail'], ['💚', 'heart'],
        ['👴', 'heroes'], ['👑', 'crown'], ['👾', 'gamepad'], ['🪑', 'crate'], ['🦸', 'heroes'],
        ['🦹', 'bomb'], ['🧿', 'mat_mati_crystal']
    ];

    static esc(str) {
        return String(str == null ? '' : str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    static getPath(key) {
        return this.PATHS[key] || '';
    }

    static i(key, cls = '', alt = '') {
        const src = this.PATHS[key];
        if (!src) return '';
        const className = cls ? `ui-icon ${cls}` : 'ui-icon';
        return `<img src="${src}" class="${className}" alt="${this.esc(alt)}" draggable="false">`;
    }

    static renderDefIcon(def, cls = 'ui-icon-box') {
        if (def && def.iconImg) {
            const className = cls ? `ui-icon ${cls}` : 'ui-icon';
            return `<img src="${def.iconImg}" class="${className}" alt="${this.esc(def.title || def.name || '')}" draggable="false">`;
        }
        return this.toHtml((def && def.icon) || '', cls);
    }

    static toHtml(text, cls = '') {
        let out = this.esc(text);
        for (let idx = 0; idx < this.EMOJI_MAP.length; idx++) {
            const [emoji, key] = this.EMOJI_MAP[idx];
            if (out.includes(emoji)) {
                out = out.split(emoji).join(this.i(key, cls));
            }
        }
        return out;
    }

    static setRichText(el, text, cls = '') {
        if (!el) return;
        el.innerHTML = this.toHtml(text, cls);
    }
}

if (typeof window !== 'undefined') {
    window.UiIcons = UiIcons;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UiIcons };
}

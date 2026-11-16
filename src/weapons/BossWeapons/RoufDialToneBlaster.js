/**
 * Lesa.io - Boss Weapon: Rouf's Dial-Tone Blaster
 * Unlocked by defeating Wave 20 Final Boss Rouf.
 * Emits piercing 90s dial-tone shockwave pulses that jam/slow enemies by 30%
 * and unleashes a 3-wave Speed-Dial Surge every 4th shot.
 */

class RoufDialToneBlaster extends WeaponBase {
    constructor() {
        super({
            id: 'dialtone',
            name: "Rouf's Dial-Tone Blaster",
            type: 'dialtone',
            rarity: 'Legendary',
            hero: null,
            baseDelay: 14,
            baseDamage: 34,
            radius: 13,
            extraPierce: 2,
            maxBounces: 0,
            color: '#fed330',
            icon: 'assets/WeaponIcons/RoufBlaster.png',
            description: 'Final Boss Trophy • Rewires Rouf\'s 90s brick phone into a sonic jammer that slows hit foes (-30%) and bursts 3-way waves every 4th shot.',
            stats: {
                damage: '34 Sonic',
                fireRate: 'Brisk (0.23s)',
                pierce: '+2 Pierces',
                special: '30% Slow & 4th-Shot Fan'
            }
        });
    }

    /**
     * Render 2.5D Rigged 90s Brick Phone Sonic Blaster with telescopic antenna & beacon tip.
     */
    static drawWeapon(ctx, flash, recoil = 0) {
        ctx.save();
        ctx.translate(10, 0);

        const outline = '#141416';
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        // 1. Matte black 90s brick phone chassis aimed horizontally forward
        const bodyGrad = ctx.createLinearGradient(0, -8, 0, 8);
        if (flash) {
            bodyGrad.addColorStop(0, '#ffffff');
            bodyGrad.addColorStop(1, '#dfe4ea');
        } else {
            bodyGrad.addColorStop(0, '#485460');
            bodyGrad.addColorStop(0.5, '#1e272e');
            bodyGrad.addColorStop(1, '#0b0c10');
        }

        ctx.fillStyle = bodyGrad;
        ctx.strokeStyle = outline;
        ctx.lineWidth = 2.3;
        ctx.beginPath();
        ctx.roundRect(-2, -7.5, 25, 14.5, 3.5);
        ctx.fill();
        ctx.stroke();

        // Rubber side grip studs
        ctx.fillStyle = flash ? '#ffffff' : '#2f3640';
        ctx.fillRect(0, 5.2, 17, 3);
        ctx.strokeRect(0, 5.2, 17, 3);

        // 2. Numeric 3x3 keypad buttons (rear section)
        ctx.fillStyle = flash ? '#ffffff' : '#a4b0be';
        for (let col = 0; col < 3; col++) {
            for (let row = 0; row < 3; row++) {
                ctx.fillRect(0.5 + col * 3.1, -4.5 + row * 3.1, 2.0, 2.0);
            }
        }

        // 3. Glowing lime-green waveform LCD screen (front section)
        ctx.fillStyle = flash ? '#ffffff' : '#2ed573';
        ctx.strokeStyle = outline;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.roundRect(11, -5.2, 9.5, 10, 1.5);
        ctx.fill();
        ctx.stroke();

        // Crisp dark signal waveform trace inside LCD
        if (!flash) {
            ctx.strokeStyle = '#0f3d21';
            ctx.lineWidth = 1.3;
            ctx.beginPath();
            ctx.moveTo(12.2, 0);
            ctx.lineTo(13.6, -2.5);
            ctx.lineTo(15.2, 2.8);
            ctx.lineTo(16.8, -3.1);
            ctx.lineTo(18.2, 2.0);
            ctx.lineTo(19.5, 0);
            ctx.stroke();
        }

        // 4. Antenna collar + telescopic silver shaft
        ctx.fillStyle = flash ? '#ffffff' : '#2c3e50';
        ctx.strokeStyle = outline;
        ctx.lineWidth = 2.0;
        ctx.fillRect(22.5, -3.5, 4, 6.5);
        ctx.strokeRect(22.5, -3.5, 4, 6.5);

        ctx.fillStyle = flash ? '#ffffff' : '#dfe4ea';
        ctx.beginPath();
        ctx.moveTo(26.5, -2.2);
        ctx.lineTo(41, -1.0);
        ctx.lineTo(41, 1.0);
        ctx.lineTo(26.5, 2.2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 5. Glowing crimson transmitter orb at antenna tip
        ctx.fillStyle = flash ? '#ffffff' : '#e74c3c';
        ctx.beginPath();
        ctx.arc(43, 0, 3.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // White specular gleam on beacon orb
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(42, -1.1, 1.1, 0, Math.PI * 2);
        ctx.fill();

        // Sonic emitter arc rings when firing
        if (recoil > 1.5) {
            const alpha = Math.min(0.95, recoil / 6);
            ctx.strokeStyle = `rgba(254, 211, 48, ${alpha})`;
            ctx.lineWidth = 2.0;
            ctx.beginPath();
            ctx.arc(44, 0, 7 + recoil * 0.4, -0.75, 0.75);
            ctx.stroke();
            ctx.strokeStyle = `rgba(0, 210, 211, ${alpha * 0.85})`;
            ctx.beginPath();
            ctx.arc(44, 0, 11 + recoil * 0.5, -0.65, 0.65);
            ctx.stroke();
        }

        ctx.restore();
    }

    /**
     * Render glowing concentric sonic dial-tone crescent rings.
     */
    static drawBullet(ctx, bullet) {
        const r = Math.max(8, (bullet.radius || 13) * 1.2);
        const enemyWave = !!bullet.isEnemy;
        const primary = enemyWave ? '#fed330' : '#00d2d3';
        const secondary = enemyWave ? '#ff6b6b' : '#fed330';

        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Soft acoustic aura
        ctx.strokeStyle = enemyWave ? 'rgba(254, 211, 48, 0.35)' : 'rgba(0, 210, 211, 0.32)';
        ctx.lineWidth = 6.0;
        ctx.beginPath();
        ctx.arc(0, 0, r * 1.05, -Math.PI * 0.56, Math.PI * 0.56);
        ctx.stroke();

        // Outer ring
        ctx.strokeStyle = '#141416';
        ctx.lineWidth = 4.6;
        ctx.beginPath();
        ctx.arc(0, 0, r * 1.02, -Math.PI * 0.55, Math.PI * 0.55);
        ctx.stroke();

        ctx.strokeStyle = secondary;
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        ctx.arc(0, 0, r * 1.02, -Math.PI * 0.55, Math.PI * 0.55);
        ctx.stroke();

        // Inner harmonic wave arc
        ctx.strokeStyle = primary;
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.arc(-r * 0.28, 0, r * 0.64, -Math.PI * 0.45, Math.PI * 0.45);
        ctx.stroke();

        // Bright dial-tone pulse emitter orb
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#141416';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.arc(-r * 0.42, 0, r * 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }
}

if (typeof window !== 'undefined') {
    window.RoufDialToneBlaster = RoufDialToneBlaster;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RoufDialToneBlaster };
}

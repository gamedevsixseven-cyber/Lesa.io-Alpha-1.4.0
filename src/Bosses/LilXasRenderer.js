/**
 * Lesa.io - Lil Xas Easter Egg Renderer
 * Renders Lil Xas (cropped real photo head + signature blue shield visor glasses),
 * his VIP Stretch Limousine on the perimeter road, the Neon Concert Stage, and Concert Speakers.
 */

class LilXasRenderer {
    static _rawImg = null;
    static _rawStatus = 'idle'; // 'idle' | 'loading' | 'ready' | 'error'
    static _headCanvas = null;

    static getFaceImageSrc() {
        return encodeURI('Audio/LilXasEasterEgg/LilxasFACE.png');
    }

    static ensureLoaded() {
        if (this._rawStatus !== 'idle' || typeof Image === 'undefined') return;
        this._rawStatus = 'loading';
        const img = new Image();
        img.onload = () => {
            this._rawImg = img;
            this._rawStatus = 'ready';
            this._buildHeadCanvas();
        };
        img.onerror = () => {
            this._rawStatus = 'error';
        };
        img.src = this.getFaceImageSrc();
    }

    /**
     * Pre-crops Lil Xas's face & oversized blue shield glasses out of LilxasFACE.png
     * (excluding the bottom-left corner overlay), framed inside a clean comic portrait disc.
     */
    static _buildHeadCanvas() {
        if (typeof document === 'undefined' || !this._rawImg || !this._rawImg.naturalWidth) return;
        const size = 128;
        const c = document.createElement('canvas');
        c.width = size;
        c.height = size;
        const ctx = c.getContext('2d');
        const img = this._rawImg;
        const iw = img.naturalWidth;
        const ih = img.naturalHeight;

        // Crop strictly around his head, haircut & glasses cleanly above the bottom watermark
        const sx = iw * 0.14;
        const sy = ih * 0.05;
        const sw = iw * 0.76;
        const sh = ih * 0.74;

        ctx.save();
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2 - 4, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, size, size);
        ctx.restore();

        // Crisp comic outline around his portrait head
        ctx.lineWidth = 6;
        ctx.strokeStyle = '#18181b';
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2 - 4, 0, Math.PI * 2);
        ctx.stroke();

        // Highlight rim on his signature iridescent cobalt-blue wrap-around shield glasses
        ctx.save();
        ctx.translate(size * 0.51, size * 0.45);
        ctx.rotate(-0.04);
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.roundRect(-34, -14, 68, 25, 6);
        ctx.stroke();
        ctx.fillStyle = 'rgba(99, 102, 241, 0.22)';
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.48)';
        ctx.beginPath();
        ctx.moveTo(-18, -11);
        ctx.lineTo(-4, -11);
        ctx.lineTo(-14, 9);
        ctx.lineTo(-28, 9);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        this._headCanvas = c;
    }

    static drawLimo(ctx, limo) {
        if (!limo) return;
        const horiz = Math.abs(Math.cos(limo.angle || 0)) >= Math.abs(Math.sin(limo.angle || 0));
        ctx.save();
        ctx.translate(limo.x, limo.y);
        if (!horiz) ctx.rotate((limo.vx || 0) >= 0 ? Math.PI * 0.5 : -Math.PI * 0.5);
        else if ((limo.dir || 1) < 0) ctx.scale(-1, 1);

        const len = 216;
        const halfL = len / 2;
        const halfW = 30;
        const pulse = 0.5 + 0.5 * Math.sin((limo.age || 0) * 0.22);

        // Neon purple/cyan VIP underglow
        ctx.fillStyle = `rgba(168, 85, 247, ${0.28 + pulse * 0.16})`;
        ctx.beginPath();
        ctx.ellipse(0, 8, halfL + 16, halfW + 14, 0, 0, Math.PI * 2);
        ctx.fill();

        // Ground shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.beginPath();
        ctx.ellipse(2, 10, halfL + 6, halfW + 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Wheels (front & rear)
        ctx.fillStyle = '#111827';
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2;
        for (const wx of [-halfL + 30, halfL - 32]) {
            for (const wy of [-halfW - 2, halfW - 6]) {
                ctx.fillRect(wx - 13, wy, 26, 8);
                ctx.strokeRect(wx - 13, wy, 26, 8);
            }
        }

        // Open VIP passenger door if swinging open
        const doorProg = limo.doorOpen || 0;
        if (doorProg > 0.02) {
            ctx.save();
            const hingeX = -8;
            const sideY = limo.doorSide === 'top' ? -halfW : halfW;
            const swingDir = limo.doorSide === 'top' ? -1 : 1;
            ctx.translate(hingeX, sideY);
            ctx.rotate(swingDir * doorProg * 0.95);
            ctx.fillStyle = '#1e1b4b';
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 2.4;
            ctx.fillRect(0, -3, 36, 6);
            ctx.strokeRect(0, -3, 36, 6);
            ctx.restore();
        }

        // Stretch Limo glossy obsidian body
        const bodyGrad = ctx.createLinearGradient(-halfL, -halfW, -halfL, halfW);
        bodyGrad.addColorStop(0, '#27272a');
        bodyGrad.addColorStop(0.5, '#09090b');
        bodyGrad.addColorStop(1, '#18181b');
        ctx.fillStyle = bodyGrad;
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.roundRect(-halfL, -halfW, len, halfW * 2, 14);
        ctx.fill();
        ctx.stroke();

        // Gold racing trim stripe
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-halfL + 10, -halfW + 3, len - 20, 3);
        ctx.fillRect(-halfL + 10, halfW - 6, len - 20, 3);

        // Panoramic tinted VIP cabin roof & windows
        ctx.fillStyle = '#1e1b4b';
        ctx.strokeStyle = '#8b5cf6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-halfL + 26, -halfW + 9, len - 72, halfW * 2 - 18, 8);
        ctx.fill();
        ctx.stroke();

        // Roof neon strobe & VIP label
        ctx.fillStyle = pulse > 0.5 ? '#00f5ff' : '#e056fd';
        ctx.beginPath();
        ctx.roundRect(-34, -9, 68, 18, 5);
        ctx.fill();
        ctx.font = '900 10px "Luckiest Guy", sans-serif';
        ctx.fillStyle = '#09090b';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('LIL XAS', 0, 1);

        // Headlights (front) & Tail lights (back)
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(halfL - 5, -halfW + 7, 5, 11);
        ctx.fillRect(halfL - 5, halfW - 18, 5, 11);
        ctx.fillStyle = 'rgba(254, 240, 138, 0.24)';
        ctx.beginPath();
        ctx.moveTo(halfL, -14); ctx.lineTo(halfL + 110, -44); ctx.lineTo(halfL + 110, 44); ctx.lineTo(halfL, 14);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-halfL, -halfW + 8, 4, 11);
        ctx.fillRect(-halfL, halfW - 19, 4, 11);

        ctx.restore();
    }

    static drawStage(ctx, stage) {
        if (!stage) return;
        const w = 300;
        const h = 180;
        const hw = w / 2;
        const hh = h / 2;
        const t = (stage.age || 0) * 0.14;
        const blasting = !!stage.musicPlaying;

        ctx.save();
        ctx.translate(stage.x, stage.y);

        // Plush Red VIP Carpet leading toward parked limo side
        const carpetDir = stage.limoSide === 'south' ? 1 : -1;
        ctx.fillStyle = '#b91c1c';
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 3;
        const carpetStartY = carpetDir * hh;
        const carpetLen = carpetDir * 145;
        ctx.beginPath();
        ctx.roundRect(-28, Math.min(carpetStartY, carpetStartY + carpetLen), 56, Math.abs(carpetLen), 6);
        ctx.fill();
        ctx.stroke();

        // Blasting Stage Beat Glow Aura
        if (blasting) {
            const beat = 0.5 + 0.5 * Math.sin(t * 1.9);
            ctx.fillStyle = `rgba(217, 70, 239, ${0.14 + beat * 0.14})`;
            ctx.beginPath();
            ctx.ellipse(0, 0, hw + 55 + beat * 24, hh + 42 + beat * 18, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Main Concert Stage Deck
        const deckGrad = ctx.createLinearGradient(-hw, -hh, hw, hh);
        deckGrad.addColorStop(0, '#1e1b4b');
        deckGrad.addColorStop(0.5, '#311042');
        deckGrad.addColorStop(1, '#111827');
        ctx.fillStyle = deckGrad;
        ctx.strokeStyle = blasting ? '#f472b6' : '#8b5cf6';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.roundRect(-hw, -hh, w, h, 16);
        ctx.fill();
        ctx.stroke();

        // Inner Gold Trim
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-hw + 8, -hh + 8, w - 16, h - 16, 11);
        ctx.stroke();

        // Equalizer LED Dance Grid Tiles
        const cols = 10;
        const tileW = (w - 44) / cols;
        for (let i = 0; i < cols; i++) {
            const amp = blasting ? (0.35 + 0.65 * Math.abs(Math.sin(t * 1.4 + i * 0.9))) : 0.18;
            const barH = amp * 42;
            ctx.fillStyle = i % 2 === 0 ? 'rgba(0, 245, 255, 0.34)' : 'rgba(224, 86, 253, 0.34)';
            ctx.fillRect(-hw + 22 + i * tileW + 2, hh - 20 - barH, tileW - 4, barH);
        }

        // Sweeping Concert Spotlights
        const sweep = Math.sin((stage.age || 0) * 0.04) * 0.32;
        ctx.fillStyle = blasting ? 'rgba(56, 189, 248, 0.13)' : 'rgba(250, 204, 21, 0.08)';
        for (const sx of [-hw + 24, hw - 24]) {
            ctx.beginPath();
            ctx.moveTo(sx, -hh + 12);
            ctx.lineTo(sx + Math.sin(sweep) * 90 - 55, hh + 35);
            ctx.lineTo(sx + Math.sin(sweep) * 90 + 55, hh + 35);
            ctx.closePath();
            ctx.fill();
        }

        // Stage Top Marquee Banner
        ctx.fillStyle = '#09090b';
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(-118, -hh - 14, 236, 28, 8);
        ctx.fill();
        ctx.stroke();
        ctx.font = '900 13px "Luckiest Guy", cursive, sans-serif';
        ctx.fillStyle = blasting ? '#f472b6' : '#facc15';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🎤 LIL XAS LIVE CONCERT 🔊', 0, -hh);

        ctx.restore();
    }

    static drawSpeaker(ctx, sp) {
        const beat = sp.musicPlaying ? Math.sin((sp.age || 0) * 0.45 + (sp.speakerIndex || 0)) * 3.2 : 0;
        const vibX = sp.musicPlaying ? Math.sin((sp.age || 0) * 0.9 + sp.speakerIndex) * 1.8 : 0;
        const flash = sp.hitFlash > 0;
        const r = sp.radius || 30;

        ctx.save();
        ctx.translate(sp.x + vibX, sp.y);

        // Emitted Trash Music Shock Rings
        if (sp.musicPlaying) {
            const p1 = ((sp.age || 0) * 0.045 + (sp.speakerIndex || 0) * 0.25) % 1;
            ctx.strokeStyle = `rgba(232, 67, 147, ${(1 - p1) * 0.58})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, -10, r + p1 * 56, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.36)';
        ctx.beginPath();
        ctx.ellipse(0, r * 0.72, r * 1.05, r * 0.42, 0, 0, Math.PI * 2);
        ctx.fill();

        // Speaker Cabinet Tower
        ctx.fillStyle = flash ? '#ffffff' : '#18181b';
        ctx.strokeStyle = '#09090b';
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.roundRect(-24, -36 - beat * 0.4, 48, 60 + beat * 0.4, 8);
        ctx.fill();
        ctx.stroke();

        // Metallic Gold / Neon Frame Accent
        ctx.strokeStyle = flash ? '#ffffff' : '#d946ef';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-20, -32 - beat * 0.3, 40, 52 + beat * 0.3, 6);
        ctx.stroke();

        // Dual Vibrating Woofer Cones
        for (const [cy, cr] of [[-17, 11 + beat * 0.45], [6, 14 + beat * 0.65]]) {
            ctx.fillStyle = flash ? '#ffffff' : '#27272a';
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, cy, Math.max(6, cr), 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = flash ? '#facc15' : '#00f5ff';
            ctx.beginPath();
            ctx.arc(0, cy, Math.max(3, cr * 0.38), 0, Math.PI * 2);
            ctx.fill();
        }

        // Floating music note icons when active
        if (sp.musicPlaying) {
            const ny = -44 - ((sp.age || 0) * 0.8) % 24;
            ctx.font = '900 15px sans-serif';
            ctx.fillStyle = (sp.speakerIndex % 2 === 0) ? '#f472b6' : '#00f5ff';
            ctx.textAlign = 'center';
            ctx.fillText(sp.speakerIndex % 2 === 0 ? '♫' : '♪', Math.sin((sp.age || 0) * 0.14) * 14, ny);
        }

        ctx.restore();

        // Overhead Speaker HP Bar
        const hudY = sp.y - 48;
        const hpRatio = Math.max(0, Math.min(1, sp.hp / sp.maxHp));
        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = '800 11px "Luckiest Guy", sans-serif';
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#101014';
        ctx.strokeText(`🔊 SPEAKER ${(sp.speakerIndex || 0) + 1}`, sp.x, hudY - 4);
        ctx.fillStyle = '#f472b6';
        ctx.fillText(`🔊 SPEAKER ${(sp.speakerIndex || 0) + 1}`, sp.x, hudY - 4);
        ctx.fillStyle = '#1e272e';
        ctx.fillRect(sp.x - 24, hudY, 48, 6);
        ctx.fillStyle = '#e056fd';
        ctx.fillRect(sp.x - 24, hudY, 48 * hpRatio, 6);
        ctx.lineWidth = 1.6;
        ctx.strokeRect(sp.x - 24, hudY, 48, 6);
        ctx.restore();
    }

    static drawLilXas(ctx, b) {
        this.ensureLoaded();
        if (typeof EndlessBossRenderer !== 'undefined' && Array.isArray(b.zones)) {
            EndlessBossRenderer.drawTelegraphs(ctx, b.zones);
        }
        if (typeof LilXasAttacksFX !== 'undefined') {
            LilXasAttacksFX.drawBossEffects(ctx, b);
        }

        const r = b.radius || 34;
        const flash = b.hitFlash > 0;
        const liftY = b.liftY || 0;
        const bounce = Math.abs(Math.sin(b.walkCycle || b.age * 0.12)) * 4;
        const facingRight = Math.cos(b.angle || 0) >= 0;

        // Ground shadow (stays anchored when leaping!)
        ctx.save();
        ctx.translate(b.x, b.y);
        const sScale = Math.max(0.45, 1 - liftY * 0.003);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.36)';
        ctx.beginPath();
        ctx.ellipse(0, r * 0.85, r * 1.05 * sScale, r * 0.38 * sScale, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.translate(b.x, b.y - liftY);

        // Bass Shield Dome if Concert Speakers are still playing
        if (b.hasSpeakerShield) {
            const p = 0.5 + 0.5 * Math.sin((b.age || 0) * 0.18);
            ctx.fillStyle = `rgba(217, 70, 239, ${0.16 + p * 0.1})`;
            ctx.strokeStyle = `rgba(56, 189, 248, ${0.72 + p * 0.25})`;
            ctx.lineWidth = 3.2;
            ctx.beginPath();
            ctx.arc(0, -6, r + 16, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }

        // Streetwear Legs & Chunky Gold/White Sneakers
        if (typeof EndlessBossRenderer !== 'undefined') {
            EndlessBossRenderer.drawLegs(ctx, r * 0.92, b.walkCycle || 0, '#1f2937', '#facc15', flash);
        }

        // Grey Zip Hoodie Jacket Torso (matching LilxasFACE.png collar!)
        ctx.strokeStyle = '#18181b';
        ctx.lineWidth = 3.2;
        ctx.fillStyle = flash ? '#ffffff' : '#64748b';
        ctx.beginPath();
        ctx.roundRect(-r * 0.58, -r * 0.36 - bounce, r * 1.16, r * 0.92, 12);
        ctx.fill();
        ctx.stroke();

        // Zipper & Iced-Out Gold Chain ("XAS")
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(0, -r * 0.32 - bounce);
        ctx.lineTo(0, r * 0.50 - bounce);
        ctx.stroke();

        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(0, -r * 0.02 - bounce, r * 0.28, 0.15 * Math.PI, 0.85 * Math.PI);
        ctx.stroke();
        ctx.fillStyle = '#fef08a';
        ctx.strokeStyle = '#18181b';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(0, r * 0.24 - bounce, 5.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Arms: Hype Rapper Gesture + Iced Microphone
        const micWave = Math.sin((b.age || 0) * 0.24) * 5;
        const armSide = facingRight ? 1 : -1;
        ctx.fillStyle = flash ? '#ffffff' : '#475569';
        ctx.strokeStyle = '#18181b';
        ctx.lineWidth = 2.6;
        // Free hand waving beat
        ctx.beginPath();
        ctx.roundRect(-armSide * r * 0.85, -r * 0.18 - bounce - micWave, 14, 18, 6);
        ctx.fill();
        ctx.stroke();
        // Mic hand
        ctx.beginPath();
        ctx.roundRect(armSide * r * 0.48, -r * 0.25 - bounce + micWave * 0.5, 15, 20, 6);
        ctx.fill();
        ctx.stroke();
        // Diamond Bling Microphone
        const micX = armSide * (r * 0.62);
        const micY = -r * 0.42 - bounce + micWave * 0.5;
        ctx.fillStyle = '#09090b';
        ctx.fillRect(micX - 2.5, micY, 5, 15);
        ctx.fillStyle = b.enraged ? '#ff4757' : '#38bdf8';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(micX, micY - 2, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Signature Head: Pre-cropped Real Photo Face + Blue Shield Visor Glasses!
        const headY = -r * 0.72 - bounce;
        const headR = r * 0.76;
        ctx.save();
        ctx.translate(0, headY);
        ctx.rotate(Math.sin((b.age || 0) * 0.16) * 0.08);
        if (this._headCanvas) {
            ctx.drawImage(this._headCanvas, -headR, -headR, headR * 2, headR * 2);
        } else {
            // Crisp fallback vector portrait with matching blue shield visor glasses
            ctx.fillStyle = '#f3cfb6';
            ctx.strokeStyle = '#18181b';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, headR, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#2c1e16';
            ctx.beginPath();
            ctx.arc(0, -headR * 0.25, headR * 0.92, Math.PI, 0);
            ctx.fill();
            ctx.fillStyle = '#3b82f6';
            ctx.strokeStyle = '#1e1b4b';
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            ctx.roundRect(-headR * 0.76, -headR * 0.26, headR * 1.52, headR * 0.54, 6);
            ctx.fill();
            ctx.stroke();
        }
        ctx.restore();

        ctx.restore();

        // Boss Overhead Bar
        if (typeof EndlessBossRenderer !== 'undefined') {
            EndlessBossRenderer.drawBossHUD(ctx, {
                ...b,
                hudTopOffset: 24,
                rankColor: b.hasSpeakerShield ? '#e056fd' : '#ff4757',
                hudLabel: 'Lil Xas'
            });
        }
    }
}

if (typeof window !== 'undefined') {
    window.LilXasRenderer = LilXasRenderer;
}

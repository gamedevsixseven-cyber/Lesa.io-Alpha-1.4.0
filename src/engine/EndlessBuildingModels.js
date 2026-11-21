/**
 * Lesa.io - Endless Mode 2.5D Village Architectural Models
 * Static geometry builders (offscreen-cached per stage by EndlessBuildingRenderer):
 * Kafenio, Periptero, Bakery, Municipal Outpost, Cycladic Chapel, Stone Windmill.
 */

class EndlessBuildingModels {
    static bakeBuilding(ctx, arch, stage, spec) {
        ctx.fillStyle = stage >= 2 ? 'rgba(18, 12, 16, 0.38)' : 'rgba(16, 36, 18, 0.28)';
        ctx.beginPath();
        ctx.ellipse(8, 10, spec.halfW + 26, spec.halfH + 10, 0, 0, Math.PI * 2);
        ctx.fill();

        if (arch === 'kafenio') this.drawKafenio(ctx, stage);
        else if (arch === 'periptero') this.drawPeriptero(ctx, stage);
        else if (arch === 'bakery') this.drawBakery(ctx, stage);
        else if (arch === 'outpost') this.drawOutpost(ctx, stage);
        else if (arch === 'chapel') this.drawChapel(ctx, stage);
        else this.drawWindmill(ctx, stage);

        if (stage >= 2) this.drawDamageScars(ctx, spec, stage);
    }

    static drawFlagstoneApron(ctx, w, h, yOff, stage) {
        const x = -w * 0.5;
        ctx.fillStyle = stage >= 3 ? '#4a4240' : (stage === 2 ? '#78716c' : '#a8a29e');
        ctx.strokeStyle = '#18181b';
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.roundRect(x, yOff, w, h, 8);
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = 'rgba(24, 24, 27, 0.25)';
        ctx.lineWidth = 1.4;
        for (let lx = x + 18; lx < x + w - 8; lx += 22) {
            ctx.beginPath();
            ctx.moveTo(lx, yOff + 3);
            ctx.lineTo(lx, yOff + h - 3);
            ctx.stroke();
        }
    }

    static drawRoofTiles(ctx, x, y, w, h, ridgeColor, tileColor, darkColor, stage) {
        const ink = '#18181b';
        const tint = stage >= 3 ? '#3b2422' : (stage === 2 ? darkColor : tileColor);
        const hi = stage >= 3 ? '#59332d' : (stage === 2 ? tileColor : ridgeColor);

        ctx.fillStyle = tint;
        ctx.strokeStyle = ink;
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 7);
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = stage >= 3 ? 'rgba(20, 12, 12, 0.6)' : 'rgba(60, 20, 10, 0.35)';
        ctx.lineWidth = 1.6;
        for (let ry = y + 10; ry < y + h - 6; ry += 10) {
            ctx.beginPath();
            ctx.moveTo(x + 4, ry);
            ctx.lineTo(x + w - 4, ry);
            ctx.stroke();
        }
        ctx.fillStyle = hi;
        ctx.fillRect(x + 3, y + 2, w - 6, 7);
    }

    static drawWindow(ctx, x, y, w, h, stage, shutterColor = '#1e90ff') {
        const ink = '#18181b';
        if (shutterColor) {
            ctx.fillStyle = stage >= 3 ? '#2c2f36' : shutterColor;
            ctx.strokeStyle = ink;
            ctx.lineWidth = 2;
            ctx.fillRect(x - 7, y, 6, h);
            ctx.strokeRect(x - 7, y, 6, h);
            ctx.fillRect(x + w + 1, y, 6, h);
            ctx.strokeRect(x + w + 1, y, 6, h);
        }
        ctx.fillStyle = stage >= 3 ? '#ff6348' : (stage === 2 ? '#2b2d42' : (stage === 1 ? '#ffd166' : '#63cdda'));
        ctx.strokeStyle = ink;
        ctx.lineWidth = 2.2;
        ctx.fillRect(x, y, w, h);
        ctx.strokeRect(x, y, w, h);

        ctx.strokeStyle = stage >= 3 ? '#1e1b18' : '#fefefe';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(x + w * 0.5, y); ctx.lineTo(x + w * 0.5, y + h);
        ctx.moveTo(x, y + h * 0.5); ctx.lineTo(x + w, y + h * 0.5);
        ctx.stroke();
    }

    static drawKafenio(ctx, stage) {
        const ink = '#18181b';
        this.drawFlagstoneApron(ctx, 174, 48, 4, stage);

        ctx.fillStyle = stage >= 3 ? '#6d5d56' : (stage === 2 ? '#c7bba8' : '#f7edd8');
        ctx.strokeStyle = ink;
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.roundRect(-72, -52, 144, 68, 5);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = stage >= 3 ? '#3b3330' : '#b2a692';
        ctx.fillRect(-71, 6, 142, 9);

        ctx.fillStyle = stage >= 3 ? '#231917' : '#6f4e37';
        ctx.strokeStyle = ink;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.roundRect(-14, -22, 28, 37, [8, 8, 0, 0]);
        ctx.fill();
        ctx.stroke();
        this.drawWindow(ctx, -54, -28, 22, 22, stage, '#1e90ff');
        this.drawWindow(ctx, 32, -28, 22, 22, stage, '#1e90ff');

        const awY = -44;
        for (let s = 0; s < 9; s++) {
            const sx = -76 + s * 17;
            const blue = s % 2 === 0;
            ctx.fillStyle = stage >= 3 ? (blue ? '#27303f' : '#574f4c') : (blue ? '#1e90ff' : '#f8fafc');
            ctx.fillRect(sx, awY, 17, 16);
        }
        ctx.strokeStyle = ink;
        ctx.lineWidth = 2.5;
        ctx.strokeRect(-76, awY, 153, 16);

        this.drawRoofTiles(ctx, -78, -94, 156, 52, '#f0932b', '#c45b33', '#8c3f26', stage);
        ctx.fillStyle = stage >= 3 ? '#2c2523' : '#9c8c78';
        ctx.strokeStyle = ink;
        ctx.lineWidth = 2.5;
        ctx.fillRect(42, -110, 18, 22);
        ctx.strokeRect(42, -110, 18, 22);

        ctx.fillStyle = stage >= 3 ? '#2c2220' : '#1b3b6f';
        ctx.fillRect(-42, -59, 84, 15);
        ctx.strokeRect(-42, -59, 84, 15);
        ctx.fillStyle = stage >= 3 ? '#ff9f43' : '#f8fafc';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('ΚΑΦΕΝΕΙΟ', 0, -51);

        const tx = -42; const ty = 30;
        ctx.fillStyle = stage >= 3 ? '#3a2d28' : '#c08448';
        ctx.strokeStyle = ink;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(tx, ty, 14, 8, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        if (stage < 2) {
            ctx.fillStyle = '#00d2d3';
            ctx.fillRect(tx - 5, ty - 7, 4, 6);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(tx + 3, ty - 6, 4, 5);
        }
    }

    static drawPeriptero(ctx, stage) {
        const ink = '#18181b';
        this.drawFlagstoneApron(ctx, 136, 42, 4, stage);

        ctx.fillStyle = stage >= 3 ? '#2f3831' : (stage === 2 ? '#27593d' : '#218c54');
        ctx.strokeStyle = ink;
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.roundRect(-50, -48, 100, 66, 5);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = stage >= 3 ? '#6b4c24' : '#fed330';
        ctx.fillRect(-48, -6, 96, 8);

        ctx.fillStyle = stage >= 3 ? '#2c1717' : (stage === 1 ? '#ffeaa7' : '#222f3e');
        ctx.strokeStyle = ink;
        ctx.lineWidth = 2.4;
        ctx.fillRect(-34, -40, 68, 28);
        ctx.strokeRect(-34, -40, 68, 28);
        if (stage < 3) {
            const colors = ['#ff6b6b', '#48dbfb', '#feca57', '#ff9ff3', '#1dd1a1'];
            for (let i = 0; i < 5; i++) {
                ctx.fillStyle = colors[i];
                ctx.fillRect(-29 + i * 12, -36, 9, 10);
                ctx.fillStyle = colors[(i + 2) % 5];
                ctx.fillRect(-29 + i * 12, -24, 9, 8);
            }
        }

        ctx.fillStyle = stage >= 3 ? '#472623' : '#eb3b5a';
        ctx.fillRect(-46, 2, 26, 20);
        ctx.strokeRect(-46, 2, 26, 20);
        if (stage < 3) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-44, 2, 22, 5);
        }

        ctx.fillStyle = stage >= 3 ? '#2b2b2e' : '#3867d6';
        ctx.fillRect(20, -2, 24, 22);
        ctx.strokeRect(20, -2, 24, 22);

        this.drawRoofTiles(ctx, -56, -78, 112, 34, '#ff7f50', '#d63031', '#7d2020', stage);
        ctx.fillStyle = stage >= 3 ? '#1e1b18' : '#18181b';
        ctx.fillRect(-24, -95, 48, 20);
        ctx.strokeStyle = stage >= 3 ? '#ff4757' : '#fed330';
        ctx.lineWidth = 2;
        ctx.strokeRect(-24, -95, 48, 20);
        ctx.fillStyle = stage >= 3 ? '#ff6348' : (stage === 1 ? '#00f5ff' : '#fed330');
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('24H', 0, -85);
    }

    static drawBakery(ctx, stage) {
        const ink = '#18181b';
        this.drawFlagstoneApron(ctx, 174, 48, 4, stage);

        ctx.fillStyle = stage >= 3 ? '#5e4a41' : (stage === 2 ? '#9e846c' : '#dca972');
        ctx.strokeStyle = ink;
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.roundRect(-70, -50, 122, 66, 5);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = stage >= 3 ? '#3b2e28' : '#b8834f';
        for (let bx = -62; bx < 40; bx += 22) {
            ctx.fillRect(bx, -10, 14, 7);
            ctx.fillRect(bx + 8, 2, 12, 7);
        }

        ctx.fillStyle = stage >= 3 ? '#46312c' : '#a85d3c';
        ctx.strokeStyle = ink;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(54, -8, 24, Math.PI, 0);
        ctx.lineTo(78, 16);
        ctx.lineTo(30, 16);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = stage >= 3 ? '#ff3838' : (stage >= 1 ? '#ff9f1a' : '#2f221b');
        ctx.beginPath();
        ctx.arc(54, 10, 11, Math.PI, 0);
        ctx.lineTo(65, 15);
        ctx.lineTo(43, 15);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = stage >= 3 ? '#241815' : '#6c4223';
        ctx.beginPath();
        ctx.roundRect(-24, -22, 24, 38, [8, 8, 0, 0]);
        ctx.fill();
        ctx.stroke();
        this.drawWindow(ctx, -56, -28, 22, 20, stage, '#8d5524');

        ctx.fillStyle = stage >= 3 ? '#2a1d19' : '#e6d8c3';
        ctx.fillRect(-66, 8, 15, 16);
        ctx.strokeRect(-66, 8, 15, 16);

        ctx.fillStyle = stage >= 3 ? '#362d2a' : '#8d7b6b';
        ctx.fillRect(-52, -114, 20, 32);
        ctx.strokeRect(-52, -114, 20, 32);
        this.drawRoofTiles(ctx, -74, -92, 134, 48, '#eb8242', '#c85a32', '#7a3520', stage);

        ctx.fillStyle = stage >= 3 ? '#2c1e19' : '#5e3a20';
        ctx.fillRect(-38, -56, 68, 14);
        ctx.strokeRect(-38, -56, 68, 14);
        ctx.fillStyle = stage >= 3 ? '#ff9f43' : '#ffeaa7';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('ΦΟΥΡΝΟΣ', -4, -49);
    }

    static drawOutpost(ctx, stage) {
        const ink = '#18181b';
        this.drawFlagstoneApron(ctx, 162, 46, 4, stage);

        ctx.fillStyle = stage >= 3 ? '#2d3238' : (stage === 2 ? '#47505c' : '#636e72');
        ctx.strokeStyle = ink;
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.roundRect(-64, -50, 128, 66, 5);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = stage >= 3 ? '#1f2328' : '#a4b0be';
        ctx.fillRect(-26, -24, 52, 40);
        ctx.strokeRect(-26, -24, 52, 40);
        ctx.strokeStyle = '#2f3542';
        ctx.lineWidth = 1.6;
        for (let sy = -16; sy < 14; sy += 7) {
            ctx.beginPath(); ctx.moveTo(-24, sy); ctx.lineTo(24, sy); ctx.stroke();
        }

        ctx.fillStyle = stage >= 3 ? '#996415' : '#fed330';
        ctx.fillRect(-62, 6, 34, 8);
        ctx.fillRect(28, 6, 34, 8);

        ctx.fillStyle = stage >= 3 ? '#3b2c25' : '#dfe4ea';
        ctx.strokeStyle = ink;
        ctx.lineWidth = 2;
        ctx.fillRect(-56, -32, 20, 24);
        ctx.strokeRect(-56, -32, 20, 24);
        ctx.fillStyle = stage >= 2 ? '#ff4757' : '#ffa502';
        ctx.fillRect(-49, -24, 6, 8);

        ctx.fillStyle = stage >= 3 ? '#592020' : '#ff4757';
        ctx.fillRect(36, 4, 14, 18);
        ctx.strokeRect(36, 4, 14, 18);
        ctx.fillStyle = stage >= 3 ? '#264446' : '#00d2d3';
        ctx.fillRect(52, 8, 12, 16);
        ctx.strokeRect(52, 8, 12, 16);

        this.drawRoofTiles(ctx, -68, -88, 136, 44, '#747d8c', '#4b5563', '#2f3542', stage);
        ctx.fillStyle = '#2f3542';
        ctx.strokeStyle = ink;
        ctx.lineWidth = 2.4;
        ctx.fillRect(-44, -106, 6, 20);
        ctx.strokeRect(-44, -106, 6, 20);
        ctx.beginPath();
        ctx.arc(-41, -110, 7, 0, Math.PI * 2);
        ctx.fillStyle = stage >= 3 ? '#ff3838' : (stage >= 1 ? '#ffa502' : '#747d8c');
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = stage >= 3 ? '#485460' : '#ced6e0';
        ctx.beginPath();
        ctx.arc(34, -92, 14, Math.PI * 1.05, Math.PI * 1.95);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    static drawChapel(ctx, stage) {
        const ink = '#18181b';
        this.drawFlagstoneApron(ctx, 146, 46, 4, stage);

        ctx.fillStyle = stage >= 3 ? '#756f72' : (stage === 2 ? '#cbd5e1' : '#f8fafc');
        ctx.strokeStyle = ink;
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.roundRect(-52, -52, 104, 68, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = stage >= 3 ? '#231917' : '#7c4d2b';
        ctx.strokeStyle = ink;
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.roundRect(-14, -22, 28, 38, [14, 14, 0, 0]);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = stage >= 3 ? '#6b6466' : (stage === 2 ? '#cbd5e1' : '#f1f5f9');
        ctx.beginPath();
        ctx.roundRect(22, -74, 24, 34, [12, 12, 0, 0]);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = stage >= 3 ? '#4a3519' : '#f6b93b';
        ctx.beginPath();
        ctx.arc(34, -56, 6, Math.PI, 0);
        ctx.lineTo(41, -48);
        ctx.lineTo(27, -48);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = stage >= 3 ? '#1e2c45' : (stage === 2 ? '#29508a' : '#1e6bd6');
        ctx.beginPath();
        ctx.arc(-4, -58, 36, Math.PI, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = stage >= 3 ? '#9a6823' : '#fed330';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-4, -95); ctx.lineTo(-4, -113);
        ctx.moveTo(-11, -106); ctx.lineTo(3, -106);
        ctx.stroke();

        for (const px of [-36, 36]) {
            ctx.fillStyle = stage >= 3 ? '#3b2621' : '#c45b33';
            ctx.strokeStyle = ink;
            ctx.lineWidth = 2;
            ctx.fillRect(px - 6, 4, 12, 12);
            ctx.strokeRect(px - 6, 4, 12, 12);
            ctx.fillStyle = stage >= 3 ? '#261e1a' : (stage === 2 ? '#4d6629' : '#208b3a');
            ctx.beginPath();
            ctx.ellipse(px, -4, 7, 13, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }
    }

    static drawWindmill(ctx, stage) {
        const ink = '#18181b';
        this.drawFlagstoneApron(ctx, 132, 46, 4, stage);

        ctx.fillStyle = stage >= 3 ? '#766d6b' : (stage === 2 ? '#cbd5e1' : '#f8fafc');
        ctx.strokeStyle = ink;
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.moveTo(-46, 16);
        ctx.lineTo(-34, -74);
        ctx.lineTo(34, -74);
        ctx.lineTo(46, 16);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = stage >= 3 ? '#231917' : '#6c4223';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.roundRect(-13, -18, 26, 34, [13, 13, 0, 0]);
        ctx.fill();
        ctx.stroke();
        this.drawWindow(ctx, -9, -56, 18, 16, stage, '#1e90ff');

        ctx.fillStyle = stage >= 3 ? '#36231e' : (stage === 2 ? '#6e4532' : '#9c5636');
        ctx.beginPath();
        ctx.moveTo(-42, -72);
        ctx.lineTo(0, -114);
        ctx.lineTo(42, -72);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    static drawDamageScars(ctx, spec, stage) {
        ctx.save();
        ctx.fillStyle = stage >= 3 ? 'rgba(15, 10, 10, 0.56)' : 'rgba(28, 25, 23, 0.28)';
        ctx.beginPath();
        ctx.ellipse(-spec.halfW * 0.35, -38, 28, 18, -0.3, 0, Math.PI * 2);
        ctx.ellipse(spec.halfW * 0.32, -62, 24, 15, 0.25, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#18181b';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(-spec.halfW * 0.5, -46);
        ctx.lineTo(-spec.halfW * 0.34, -30);
        ctx.lineTo(-spec.halfW * 0.42, -16);
        ctx.moveTo(spec.halfW * 0.3, -44);
        ctx.lineTo(spec.halfW * 0.22, -26);
        ctx.stroke();
        ctx.restore();
    }
}

if (typeof window !== 'undefined') {
    window.EndlessBuildingModels = EndlessBuildingModels;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EndlessBuildingModels;
}

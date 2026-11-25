/**
 * Lesa.io - Endless Hard Mode Exclusive Enemies Renderer Facade
 * Dispatches each Hard Mode enemy to its specialized 2.5D renderer module.
 */

class HardEnemyRenderer {
    static drawVoidAcolyte(ctx, e) {
        if (typeof VoidAcolyteRenderer !== 'undefined') VoidAcolyteRenderer.draw(ctx, e);
    }

    static drawObsidianGolem(ctx, e) {
        if (typeof ObsidianGolemRenderer !== 'undefined') ObsidianGolemRenderer.draw(ctx, e);
    }

    static drawCrimsonWraith(ctx, e) {
        if (typeof CrimsonWraithRenderer !== 'undefined') CrimsonWraithRenderer.draw(ctx, e);
    }

    static drawStormTempest(ctx, e) {
        if (typeof StormTempestRenderer !== 'undefined') StormTempestRenderer.draw(ctx, e);
    }

    static drawEclipseHarbinger(ctx, e) {
        if (typeof EclipseHarbingerRenderer !== 'undefined') EclipseHarbingerRenderer.draw(ctx, e);
    }
}

if (typeof window !== 'undefined') window.HardEnemyRenderer = HardEnemyRenderer;
if (typeof module !== 'undefined' && module.exports) module.exports = { HardEnemyRenderer };

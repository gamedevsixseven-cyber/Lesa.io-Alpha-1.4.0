/**
 * Lesa.io - Rockstar-Style Developer Studio Opening Intro
 * Plays a cinematic dark-screen logo animation for "Psanas Games"
 * before transitioning smoothly into the game preloader.
 */
class DevIntro {
    constructor(onComplete = null) {
        this.onComplete = onComplete;
        this.introScreen = document.getElementById('dev-intro-screen');
        this.isDone = false;
        this.timer = null;

        if (!this.introScreen) {
            if (typeof this.onComplete === 'function') this.onComplete();
            return;
        }

        this.startAnimation();
    }

    startAnimation() {
        // Full cinematic presentation duration matching keyframes
        this.timer = setTimeout(() => {
            this.finish();
        }, 2600);
    }

    finish() {
        if (this.isDone) return;
        this.isDone = true;

        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }

        if (this.introScreen) {
            this.introScreen.classList.add('fade-out');
            if (typeof this.onComplete === 'function') {
                this.onComplete();
            }
            setTimeout(() => {
                this.introScreen.classList.add('hidden');
            }, 380);
        } else if (typeof this.onComplete === 'function') {
            this.onComplete();
        }
    }
}

if (typeof window !== 'undefined') {
    window.DevIntro = DevIntro;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DevIntro };
}

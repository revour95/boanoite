/* main.js
   Versão corrigida para:
   - Preload robusto (progress, complete, loaderror, fallback timeout)
   - Canvas full-screen sem bordas (Phaser.Scale.RESIZE)
   - Touch + mouse (pointerdown) controles
   - Logs claros no console
   - Mantém a estrutura: MenuScene (intro), GameScene (jogo), EndScene (final)
*/

/* ===========================
   Helpers - SVG -> data URI
   =========================== */
function svgToDataUri(svgString) {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);
}

/* ===========================
   Embedded SVG assets
   (mantive as na versão original para evitar 404s)
   =========================== */

/* Bat frames (3 frames) */
const bat_up_svg = `<svg xmlns='http://www.w3.org/2000/svg' width='64' height='48' viewBox='0 0 64 48'><g transform='translate(8,6)'><ellipse cx='16' cy='14' rx='8' ry='7' fill='#222' /><circle cx='16' cy='12' r='2' fill='#fff' /><path d='M0 18 C6 6, 12 6, 16 14 C20 6, 26 6, 32 18' fill='#333' stroke='#111' stroke-width='1'/></g></svg>`;
const bat_mid_svg = `<svg xmlns='http://www.w3.org/2000/svg' width='64' height='48' viewBox='0 0 64 48'><g transform='translate(8,8)'><ellipse cx='16' cy='12' rx='8' ry='6' fill='#222' /><circle cx='16' cy='10' r='2' fill='#fff' /><path d='M0 18 C8 12, 24 12, 32 18' fill='#333' stroke='#111' stroke-width='1'/></g></svg>`;
const bat_down_svg = `<svg xmlns='http://www.w3.org/2000/svg' width='64' height='48' viewBox='0 0 64 48'><g transform='translate(8,8)'><ellipse cx='16' cy='12' rx='8' ry='6' fill='#222' /><circle cx='16' cy='10' r='2' fill='#fff' /><path d='M0 8 C8 18, 24 18, 32 8' fill='#333' stroke='#111' stroke-width='1'/></g></svg>`;

/* Coin 32x32 */
const coin_svg = `<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'><circle cx='16' cy='16' r='14' fill='#f6c84c' stroke='#c68b1a' stroke-width='2'/><circle cx='12' cy='12' r='3' fill='rgba(255,255,255,0.7)'/></svg>`;

/* Spike */
const spike_svg = `<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'><polygon points='0,28 8,8 16,28 24,8 32,28' fill='#111' stroke='#444' stroke-width='1'/></svg>`;

/* Path tile 128x128 */
const path_tile_svg = `<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 128 128'><rect width='100%' height='100%' fill='#0b1530'/><g fill='#071025' opacity='0.9'><rect x='0' y='0' width='128' height='32'/><rect x='0' y='64' width='128' height='32'/></g></svg>`;

/* Calm final background */
const calm_bg_svg = `<svg xmlns='http://www.w3.org/2000/svg' width='720' height='480' viewBox='0 0 720 480'><defs><linearGradient id='g' x1='0' x2='0' y1='0' y2='1'><stop offset='0' stop-color='#dff7ee'/><stop offset='1' stop-color='#a9e0d8'/></linearGradient></defs><rect width='100%' height='100%' fill='url(#g)'/><ellipse cx='360' cy='420' rx='420' ry='120' fill='#e2f0ea'/><circle cx='550' cy='100' r='42' fill='#fff6a8' opacity='0.9'/></svg>`;

const ASSETS = {
  'bat_up': svgToDataUri(bat_up_svg),
  'bat_mid': svgToDataUri(bat_mid_svg),
  'bat_down': svgToDataUri(bat_down_svg),
  'coin': svgToDataUri(coin_svg),
  'spike': svgToDataUri(spike_svg),
  'path_tile': svgToDataUri(path_tile_svg),
  'calm_bg': svgToDataUri(calm_bg_svg)
};

/* ===========================
   Scenes
   =========================== */

/* PreloadScene */
class PreloadScene extends Phaser.Scene {
  constructor() { super({ key: 'PreloadScene' }); }

  preload() {
    // Use dynamic scale values (works com RESIZE)
    const w = Math.max(360, this.scale.width || window.innerWidth);
    const h = Math.max(640, this.scale.height || window.innerHeight);

    // Loading text centered (will reposition se houver resize)
    this.loadingText = this.add.text(w/2, h/2, 'Carregando...', {
      font: '18px Arial',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5);

    // Safety flags
    this._loadComplete = false;
    this._fallbackTriggered = false;

    // Progress handler (registered before queuing assets)
    this.load.on('progress', (value) => {
      const pct = Math.round(value * 100);
      // Update text with percent
      if (this.loadingText) this.loadingText.setText(`Carregando... ${pct}%`);
      console.log(`[Preload] progress ${pct}%`);
    });

    // Load error handler (log)
    this.load.on('loaderror', (file) => {
      console.warn('[Preload] asset failed to load:', file && file.key);
      // show small hint to user in the loading text
      if (this.loadingText) this.loadingText.setText('Carregando... (erro em asset)');
    });

    // Complete handler
    this.load.on('complete', () => {
      console.log('[Preload] complete');
      this._loadComplete = true;
      // show 100% briefly then start menu
      this.time.delayedCall(180, () => {
        if (this.loadingText) this.loadingText.destroy();
        this.scene.start('MenuScene');
      });
    });

    // Fallback: if loader hangs for any reason, proceed after 10s
    this._fallbackTimer = this.time.delayedCall(10000, () => {
      if (!this._loadComplete && !this._fallbackTriggered) {
        this._fallbackTriggered = true;
        console.warn('[Preload] fallback triggered after 10s — proceeding to MenuScene anyway.');
        if (this.loadingText) this.loadingText.setText('Carregando... (tempo esgotado)');
        this.time.delayedCall(300, () => {
          if (this.loadingText) this.loadingText.destroy();
          this.scene.start('MenuScene');
        });
      }
    });

    // Queue assets (data URIs so não há 404)
    try {
      this.load.image('path_tile', ASSETS.path_tile);
      this.load.image('calm_bg', ASSETS.calm_bg);
      this.load.image('coin', ASSETS.coin);
      this.load.image('spike', ASSETS.spike);
      this.load.image('bat_up', ASSETS.bat_up);
      this.load.image('bat_mid', ASSETS.bat_mid);
      this.load.image('bat_down', ASSETS.bat_down);
    } catch (err) {
      console.error('[Preload] exception while queueing assets', err);
    }

    // Note: Phaser starts the load automatically
  }

  create() {
    // nothing here; scene transition handled in 'complete' or fallback
  }

  // Reposition loading text on resize (helpful with RESIZE mode)
  resize(width, height) {
    if (this.loadingText) {
      this.loadingText.setPosition(width/2, height/2);
    }
  }
}

/* MenuScene (Intro) */
class MenuScene extends Phaser.Scene {
  constructor() { super({ key: 'MenuScene' }); }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    // Background tiled
    this.bg = this.add.tileSprite(0, 0, w, h, 'path_tile').setOrigin(0).setTint(0x0f1a2b);

    // Title and instructions
    this.add.text(w/2, h*0.12, 'Caminho do Morcego', { font: '24px Arial', fill: '#fff' }).setOrigin(0.5);
    this.add.text(w/2, h*0.2, 'Toque na tela para subir/voar\nEvite espinhos, colete moedas', {
      font: '14px Arial', fill: '#ddd', align: 'center'
    }).setOrigin(0.5);

    // Bat preview
    this.add.image(w/2, h*0.45, 'bat_mid').setScale(2);

    // Start hint (we'll let any pointerdown start for convenience)
    const startHint = this.add.text(w/2, h*0.78, 'Toque para começar', { font: '18px Arial', fill: '#fff' }).setOrigin(0.5);

    // Start on any pointerdown (touch or mouse)
    this.input.once('pointerdown', () => {
      console.log('[Menu] starting GameScene');
      this.scene.start('GameScene', { coinsNeeded: 8 });
    });
  }
}

/* GameScene (main gameplay) */
class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'GameScene' }); }

  init(data) {
    this.coinsNeeded = data.coinsNeeded || 8;
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    // Background
    this.bg = this.add.tileSprite(0, 0, w, h, 'path_tile').setOrigin(0);

    // Physics groups
    this.spikes = this.physics.add.group();
    this.coins = this.physics.add.group();

    // Player
    this.bat = this.physics.add.sprite(w*0.2, h*0.45, 'bat_mid');
    this.bat.setCollideWorldBounds(true);
    this.bat.body.setSize(32,30).setOffset(8,6);

    // Flap frames
    this.flapFrames = ['bat_up','bat_mid','bat_down'];
    this.flapFrameIndex = 0;
    this.lastFlapTime = 0;

    // Input: pointerdown (works for touch and mouse)
    this.input.on('pointerdown', this.flap, this);

    // Timers to spawn obstacles and coins
    this.obstacleTimer = this.time.addEvent({ delay: 1200, callback: this.spawnObstacles, callbackScope: this, loop: true });
    this.coinTimer = this.time.addEvent({ delay: 900, callback: this.spawnCoin, callbackScope: this, loop: true });

    // Overlaps for collisions
    this.physics.add.overlap(this.bat, this.coins, this.collectCoin, null, this);
    this.physics.add.overlap(this.bat, this.spikes, this.hitSpike, null, this);

    // HUD (Phaser text)
    this.coinsCollected = 0;
    this.lives = 1;
    this.score = 0;

    this.hudCoins = this.add.text(12, 12, `Moedas: 0/${this.coinsNeeded}`, { font: '14px Arial', fill: '#fff' }).setScrollFactor(0).setOrigin(0);
    this.hudLives = this.add.text(12, 34, `Vidas: ${this.lives}`, { font: '14px Arial', fill: '#fff' }).setScrollFactor(0).setOrigin(0);
    this.hudDistance = this.add.text(w - 12, 12, `Score: ${this.score}`, { font: '14px Arial', fill: '#fff' }).setScrollFactor(0).setOrigin(1,0);

    // Physics initial impulse
    this.bat.setVelocityY(-120);

    // Distance scoring timer
    this.scoreTimer = this.time.addEvent({ delay: 500, loop: true, callback: () => { this.score += 1; this.hudDistance.setText(`Score: ${this.score}`); } });
  }

  update(time, delta) {
    // Scroll background a uma velocidade relativa ao frame delta
    this.bg.tilePositionX += 0.5 * (delta/16);

    // flap animation (simple frame swap)
    if (time - this.lastFlapTime > 120) {
      this.flapFrameIndex = (this.flapFrameIndex + 1) % this.flapFrames.length;
      this.bat.setTexture(this.flapFrames[this.flapFrameIndex]);
      this.lastFlapTime = time;
    }

    // cleanup off-screen children
    this.spikes.children.iterate((s) => { if (s && s.x < -40) s.destroy(); });
    this.coins.children.iterate((c) => { if (c && c.x < -40) c.destroy(); });

    // out-of-bounds check (bottom or top too far)
    if (this.bat.y > this.scale.height + 40 || this.bat.y < -60) {
      this.endOrRespawn();
    }

    // win condition
    if (this.coinsCollected >= this.coinsNeeded) {
      this.finishLevel();
    }
  }

  flap() {
    // Impulso vertical para subir (touch/mouse)
    if (!this.bat || !this.bat.body) return;
    this.bat.setVelocityY(-260);
    // small visual tilt
    this.tweens.add({ targets: this.bat, angle: -12, duration: 120, yoyo: true, ease: 'Sine.easeInOut' });
  }

  spawnObstacles() {
    const h = this.scale.height;
    const spawnY = Phaser.Math.Between(h*0.2, h*0.86);
    const spike = this.spikes.create(this.scale.width + 40, spawnY, 'spike');
    spike.body.allowGravity = false;
    spike.setVelocityX(-180);
    spike.body.setSize(22,22).setOffset(5,4);
  }

  spawnCoin() {
    const h = this.scale.height;
    const spawnY = Phaser.Math.Between(h*0.2, h*0.7);
    const coin = this.coins.create(this.scale.width + 40, spawnY, 'coin');
    coin.body.allowGravity = false;
    coin.setVelocityX(-160);
    coin.setScale(1.2);
    this.tweens.add({ targets: coin, angle: 360, duration: 1200, loop: -1, ease: 'Linear' });
  }

  collectCoin(player, coin) {
    coin.destroy();
    this.coinsCollected += 1;
    this.score += 10;
    this.hudCoins.setText(`Moedas: ${this.coinsCollected}/${this.coinsNeeded}`);
    this.hudDistance.setText(`Score: ${this.score}`);
  }

  hitSpike(player, spike) {
    spike.destroy();
    this.lives -= 1;
    this.hudLives.setText(`Vidas: ${this.lives}`);
    this.cameras.main.flash(200, 255, 100, 60);
    if (this.lives <= 0) this.endOrRespawn();
  }

  endOrRespawn() {
    // Restart the scene to keep it simple
    console.log('[Game] respawn/restart');
    this.scene.restart({ coinsNeeded: this.coinsNeeded });
  }

  finishLevel() {
    // Stop timers and transition to end scene
    if (this.obstacleTimer) this.obstacleTimer.remove(false);
    if (this.coinTimer) this.coinTimer.remove(false);
    if (this.scoreTimer) this.scoreTimer.remove(false);
    this.cameras.main.fade(600, 0,0,0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('EndScene', { coins: this.coinsCollected, score: this.score });
    });
  }
}

/* EndScene (final calm + dialogues) */
class EndScene extends Phaser.Scene {
  constructor() { super({ key: 'EndScene' }); }

  init(data) {
    this.finalCoins = data.coins || 0;
    this.finalScore = data.score || 0;
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    this.add.image(0,0,'calm_bg').setOrigin(0).setDisplaySize(w,h);

    this.add.image(w*0.36, h*0.5, 'bat_mid').setScale(2.2);

    this.messages = [
      "Você chegou",
      "Eu estava com saudade",
      "Sinto algo lindo em você",
      "É muito mais do que sonhei para mim"
    ];
    this.msgIndex = 0;

    // Dialogue background (white rectangle)
    this.dialogBg = this.add.rectangle(w/2, h*0.78, w*0.88, 82, 0xffffff, 1).setStrokeStyle(2, 0xcccccc);
    this.dialogText = this.add.text(w/2, h*0.78, "", { color: '#111', font: '16px Arial', align: 'center', wordWrap: { width: w*0.8 } }).setOrigin(0.5);

    // Any tap advances dialog
    this.input.on('pointerdown', () => this.advanceDialog());

    this.showMessage(this.messages[this.msgIndex]);
    this.heart = this.add.text(w/2, h*0.62, '💖', { fontSize: '48px' }).setOrigin(0.5).setAlpha(0);

    // Buttons (rectangles + text)
    this.restartBtn = this.add.rectangle(w*0.32, h*0.9, w*0.38, 40, 0x2b8a78).setInteractive();
    this.restartTxt = this.add.text(w*0.32, h*0.9, 'Reiniciar', { color: '#fff', font: '16px Arial', fontWeight: '700' }).setOrigin(0.5);
    this.homeBtn = this.add.rectangle(w*0.68, h*0.9, w*0.38, 40, 0x5366f2).setInteractive();
    this.homeTxt = this.add.text(w*0.68, h*0.9, 'Voltar ao início', { color: '#fff', font: '16px Arial', fontWeight: '700' }).setOrigin(0.5);

    this.restartBtn.on('pointerdown', () => this.scene.start('GameScene', { coinsNeeded: 8 }));
    this.homeBtn.on('pointerdown', () => this.scene.start('MenuScene'));
  }

  showMessage(txt) {
    this.dialogText.setText(txt);
  }

  advanceDialog() {
    this.msgIndex++;
    if (this.msgIndex < this.messages.length) {
      this.showMessage(this.messages[this.msgIndex]);
    } else {
      this.dialogText.setText("...");
      this.tweens.add({ targets: this.heart, alpha: 1, scale: { from: 0.6, to: 1 }, duration: 600, ease: 'Back' });
      this.add.text(this.scale.width/2, this.scale.height*0.7, `Moedas coletadas: ${this.finalCoins}\nScore: ${this.finalScore}`, { color: '#064', font: '14px Arial', align: 'center' }).setOrigin(0.5);
    }
  }
}

/* ===========================
   Game config and boot
   =========================== */

/*
  Important: use Phaser.Scale.RESIZE so the canvas resizes to the viewport.
  This helps remove "borders" and works better across different mobile aspect ratios.
*/
const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: '#000000',
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 600 }, debug: false }
  },
  scale: {
    mode: Phaser.Scale.RESIZE,          // <-- resize canvas to fit the container / viewport
    autoCenter: Phaser.Scale.CENTER_BOTH
    // width/height not required; Phaser will use container size / window size
  },
  scene: [PreloadScene, MenuScene, GameScene, EndScene]
};

// Create game instance once DOM is ready
window.addEventListener('load', () => {
  try {
    window.game = new Phaser.Game(config);
    console.log('[Boot] Phaser game created');
  } catch (err) {
    console.error('[Boot] failed to create Phaser game', err);
  }
});

// Optional: log resize events for debug
window.addEventListener('resize', () => {
  if (window.game && window.game.scale) {
    // Phaser.Scale.RESIZE will handle layout, but we log for debug
    console.log('[Window] resized to', window.innerWidth, window.innerHeight);
  }
});

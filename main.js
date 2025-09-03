/* main.js
   Versão corrigida:
   - Fix no travamento do preload (load.on('complete') registrado antes do load)
   - Feedback de progresso para o texto "Carregando..."
   - Timeout fallback (10s) para evitar bloqueio infinito
   - Canvas ocupa 100vh/100vw (index + CSS ajustados)
   - Controles touch + desktop: input.on('pointerdown', ...) para todos
*/

/* ===========================
   Utility: SVG -> data URI
   =========================== */
function svgToDataUri(svgString) {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);
}

/* ===========================
   Embedded SVG Assets (data URIs)
   =========================== */

/* Bat frames (3 frames: up, mid, down) - each 64x48 */
const bat_up_svg = `<svg xmlns='http://www.w3.org/2000/svg' width='64' height='48' viewBox='0 0 64 48'>
  <g transform='translate(8,6)'>
    <ellipse cx='16' cy='14' rx='8' ry='7' fill='#222' />
    <circle cx='16' cy='12' r='2' fill='#fff' />
    <path d='M0 18 C6 6, 12 6, 16 14 C20 6, 26 6, 32 18' fill='#333' stroke='#111' stroke-width='1'/>
  </g>
</svg>`;
const bat_mid_svg = `<svg xmlns='http://www.w3.org/2000/svg' width='64' height='48' viewBox='0 0 64 48'>
  <g transform='translate(8,8)'>
    <ellipse cx='16' cy='12' rx='8' ry='6' fill='#222' />
    <circle cx='16' cy='10' r='2' fill='#fff' />
    <path d='M0 18 C8 12, 24 12, 32 18' fill='#333' stroke='#111' stroke-width='1'/>
  </g>
</svg>`;
const bat_down_svg = `<svg xmlns='http://www.w3.org/2000/svg' width='64' height='48' viewBox='0 0 64 48'>
  <g transform='translate(8,8)'>
    <ellipse cx='16' cy='12' rx='8' ry='6' fill='#222' />
    <circle cx='16' cy='10' r='2' fill='#fff' />
    <path d='M0 8 C8 18, 24 18, 32 8' fill='#333' stroke='#111' stroke-width='1'/>
  </g>
</svg>`;

/* Coin 32x32 */
const coin_svg = `<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'>
  <circle cx='16' cy='16' r='14' fill='#f6c84c' stroke='#c68b1a' stroke-width='2'/>
  <circle cx='12' cy='12' r='3' fill='rgba(255,255,255,0.7)'/>
</svg>`;

/* Spike (obstacle) 32x32 */
const spike_svg = `<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'>
  <polygon points='0,28 8,8 16,28 24,8 32,28' fill='#111' stroke='#444' stroke-width='1'/>
</svg>`;

/* Path tile 128x128 (dark, repeatable) */
const path_tile_svg = `<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 128 128'>
  <rect width='100%' height='100%' fill='#0b1530'/>
  <g fill='#071025' opacity='0.9'>
    <rect x='0' y='0' width='128' height='32'/>
    <rect x='0' y='64' width='128' height='32'/>
  </g>
</svg>`;

/* Calm final background */
const calm_bg_svg = `<svg xmlns='http://www.w3.org/2000/svg' width='720' height='480' viewBox='0 0 720 480'>
  <defs>
    <linearGradient id='g' x1='0' x2='0' y1='0' y2='1'>
      <stop offset='0' stop-color='#dff7ee'/>
      <stop offset='1' stop-color='#a9e0d8'/>
    </linearGradient>
  </defs>
  <rect width='100%' height='100%' fill='url(#g)'/>
  <ellipse cx='360' cy='420' rx='420' ry='120' fill='#e2f0ea'/>
  <circle cx='550' cy='100' r='42' fill='#fff6a8' opacity='0.9'/>
</svg>`;

/* Convert to data URIs */
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

/* --- PreloadScene --- */
class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload() {
    // Keep a reference to the loading text so we can update it.
    const w = this.sys.game.config.width;
    const h = this.sys.game.config.height;

    // Preserve the same "Carregando..." font/style used antes.
    // (Mesmas propriedades: '18px' e cor branca)
    this.loadingText = this.add.text(w/2, h/2, 'Carregando...', {
      font: '18px Arial',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5);

    // IMPORTANT: register events BEFORE loading assets so we won't miss the 'complete' event.
    this.load.on('progress', (value) => {
      // Atualiza o texto com percent (mantendo estilo)
      const pct = Math.round(value * 100);
      this.loadingText.setText(`Carregando... ${pct}%`);
      // keep same font & look
      this.loadingText.setStyle({ font: '18px Arial', color: '#ffffff' });
    });

    this._loadComplete = false;
    // on complete -> start menu
    this.load.on('complete', () => {
      this._loadComplete = true;
      // Small delay so player sees 100%
      this.time.delayedCall(200, () => {
        // remove loading text and start menu
        if (this.loadingText) this.loadingText.destroy();
        this.scene.start('MenuScene');
      });
    });

    // Fallback timeout: se algo travar no loader, evita bloqueio infinito.
    this._fallbackTimer = this.time.delayedCall(10000, () => {
      if (!this._loadComplete) {
        console.warn('[Preload] loader fallback triggered after 10s. Proceeding to MenuScene.');
        if (this.loadingText) this.loadingText.setText('Carregando... (tempo esgotado)');
        // proceed anyway to MenuScene to avoid stuck screen
        this.time.delayedCall(300, () => {
          if (this.loadingText) this.loadingText.destroy();
          this.scene.start('MenuScene');
        });
      }
    });

    // Now actually queue assets (data URIs) — paths are valid data URIs, no 404s.
    this.load.image('path_tile', ASSETS.path_tile);
    this.load.image('calm_bg', ASSETS.calm_bg);
    this.load.image('coin', ASSETS.coin);
    this.load.image('spike', ASSETS.spike);
    this.load.image('bat_up', ASSETS.bat_up);
    this.load.image('bat_mid', ASSETS.bat_mid);
    this.load.image('bat_down', ASSETS.bat_down);

    // Note: No explicit this.load.start() required — Phaser starts automatically.
  }

  create() {
    // Nothing here; scene change happens in 'complete' handler above.
  }
}

/* --- MenuScene (INTRO) --- */
class MenuScene extends Phaser.Scene {
  constructor() { super({ key: 'MenuScene' }); }

  create() {
    const w = this.sys.game.config.width;
    const h = this.sys.game.config.height;

    // Background tile (dark)
    this.bg = this.add.tileSprite(0, 0, w, h, 'path_tile').setOrigin(0).setTint(0x22335a);

    // Title + instructions (simple)
    this.add.text(w/2, h*0.13, 'Caminho do Morcego', { font: '22px Arial', fill: '#fff' }).setOrigin(0.5);
    this.add.text(w/2, h*0.22, 'Toque na tela para subir/voar\nEvite espinhos, colete moedas', {
      font: '14px Arial', fill: '#ddd', align: 'center'
    }).setOrigin(0.5);

    // bat preview
    this.add.image(w/2, h*0.45, 'bat_mid').setScale(1.6);

    // Big start area: make whole screen respond to pointer to maximize mobile-friendliness
    const startRect = this.add.rectangle(w/2, h*0.75, w*0.8, 64, 0xffffff).setInteractive({ useHandCursor: true });
    const startTxt = this.add.text(w/2, h*0.75, 'Começar', { color: '#111', font: '20px Arial', fontWeight: '700' }).setOrigin(0.5);
    startRect.on('pointerdown', () => {
      this.scene.start('GameScene', { coinsNeeded: 8 });
    });

    // Also allow tapping anywhere to start (optional small hint)
    this.input.once('pointerdown', (pointer) => {
      // protect: if pointer is over startRect it's already handled. So only if not started.
      // We'll start only if y < some threshold? To avoid accidental immediate start, we do nothing on first tap.
    });
  }
}

/* --- GameScene (main) --- */
class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'GameScene' }); }

  init(data) {
    this.coinsNeeded = data.coinsNeeded || 8;
  }

  create() {
    const w = this.sys.game.config.width;
    const h = this.sys.game.config.height;

    // Background
    this.bg = this.add.tileSprite(0, 0, w, h, 'path_tile').setOrigin(0);

    // Groups
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

    // Controls (pointerdown works for touch and mouse)
    this.input.on('pointerdown', this.flap, this);

    // Spawn timers
    this.obstacleTimer = this.time.addEvent({
      delay: 1200,
      callback: this.spawnObstacles,
      callbackScope: this,
      loop: true
    });
    this.coinTimer = this.time.addEvent({
      delay: 900,
      callback: this.spawnCoin,
      callbackScope: this,
      loop: true
    });

    // Overlaps
    this.physics.add.overlap(this.bat, this.coins, this.collectCoin, null, this);
    this.physics.add.overlap(this.bat, this.spikes, this.hitSpike, null, this);

    // HUD (rendered as Phaser Text on top of canvas)
    this.coinsCollected = 0;
    this.lives = 1;
    this.score = 0;

    this.hudCoins = this.add.text(10, 10, `Moedas: 0/${this.coinsNeeded}`, { font: '14px Arial', fill: '#fff' }).setScrollFactor(0).setOrigin(0);
    this.hudLives = this.add.text(10, 32, `Vidas: ${this.lives}`, { font: '14px Arial', fill: '#fff' }).setScrollFactor(0).setOrigin(0);
    this.hudDistance = this.add.text(w - 10, 10, `Score: 0`, { font: '14px Arial', fill: '#fff' }).setScrollFactor(0).setOrigin(1,0);

    // physics tweak: gravity comes from arcade config
    this.bat.setVelocityY(-120);

    // Distance scoring timer
    this.scoreTimer = this.time.addEvent({
      delay: 500,
      loop: true,
      callback: () => { this.score += 1; this.hudDistance.setText(`Score: ${this.score}`); }
    });
  }

  update(time, delta) {
    // Background scroll
    this.bg.tilePositionX += 0.5 * (delta/16);

    // flap animation
    if (time - this.lastFlapTime > 120) {
      this.flapFrameIndex = (this.flapFrameIndex + 1) % this.flapFrames.length;
      this.bat.setTexture(this.flapFrames[this.flapFrameIndex]);
      this.lastFlapTime = time;
    }

    // cleanup off-screen
    this.spikes.children.iterate((s) => { if (s && s.x < -40) s.destroy(); });
    this.coins.children.iterate((c) => { if (c && c.x < -40) c.destroy(); });

    // out-of-bounds
    if (this.bat.y > this.sys.game.config.height + 30 || this.bat.y < -40) {
      this.endOrRespawn();
    }

    // win condition
    if (this.coinsCollected >= this.coinsNeeded) {
      this.finishLevel();
    }
  }

  flap() {
    this.bat.setVelocityY(-260);
    this.tweens.add({ targets: this.bat, angle: -12, duration: 120, yoyo: true, ease: 'Sine.easeInOut' });
  }

  spawnObstacles() {
    const h = this.sys.game.config.height;
    const spawnY = Phaser.Math.Between(h*0.2, h*0.86);
    const spike = this.spikes.create(this.sys.game.config.width + 40, spawnY, 'spike');
    spike.body.allowGravity = false;
    spike.setVelocityX(-180);
    spike.body.setSize(22,22).setOffset(5,4);
  }

  spawnCoin() {
    const h = this.sys.game.config.height;
    const spawnY = Phaser.Math.Between(h*0.2, h*0.7);
    const coin = this.coins.create(this.sys.game.config.width + 40, spawnY, 'coin');
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
    this.scene.restart({ coinsNeeded: this.coinsNeeded });
  }

  finishLevel() {
    this.obstacleTimer.remove(false);
    this.coinTimer.remove(false);
    this.scoreTimer.remove(false);
    this.cameras.main.fade(600, 0,0,0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('EndScene', { coins: this.coinsCollected, score: this.score });
    });
  }
}

/* --- EndScene (final calm + dialogues) --- */
class EndScene extends Phaser.Scene {
  constructor() { super({ key: 'EndScene' }); }

  init(data) {
    this.finalCoins = data.coins || 0;
    this.finalScore = data.score || 0;
  }

  create() {
    const w = this.sys.game.config.width;
    const h = this.sys.game.config.height;
    this.add.image(0,0,'calm_bg').setOrigin(0).setDisplaySize(w,h);

    this.add.image(w*0.36, h*0.5, 'bat_mid').setScale(2.2);

    this.messages = [
      "Você chegou",
      "Eu estava com saudade",
      "Sinto algo lindo em você",
      "É muito mais do que sonhei para mim"
    ];
    this.msgIndex = 0;

    this.dialogBg = this.add.rectangle(w/2, h*0.78, w*0.88, 82, 0xffffff, 1).setStrokeStyle(2, 0xcccccc);
    this.dialogText = this.add.text(w/2, h*0.78, "", { color: '#111', font: '16px Arial', align: 'center', wordWrap: { width: w*0.8 } }).setOrigin(0.5);

    this.input.on('pointerdown', () => this.advanceDialog());

    this.showMessage(this.messages[this.msgIndex]);
    this.heart = this.add.text(w/2, h*0.62, '💖', { fontSize: '48px' }).setOrigin(0.5).setAlpha(0);

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
      this.add.text(this.sys.game.config.width/2, this.sys.game.config.height*0.7, `Moedas coletadas: ${this.finalCoins}\nScore: ${this.finalScore}`, { color: '#064', font: '14px Arial', align: 'center' }).setOrigin(0.5);
    }
  }
}

/* ===========================
   Boot the game (config)
   =========================== */

const GAME_WIDTH = 360;
const GAME_HEIGHT = 640;

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#000000',
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 600 }, debug: false }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [PreloadScene, MenuScene, GameScene, EndScene]
};

const game = new Phaser.Game(config);

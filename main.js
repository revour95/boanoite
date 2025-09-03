/* main.js
   Phaser 3 mobile-first game:
   - Intro scene (instructions + Start)
   - Game scene (bat flapping, obstacles, coins, HUD)
   - End scene (calm background + dialog sequence + heart)
   Assets are embedded as SVG data URIs so repo is static and self-contained.
*/

/* ===========================
   Utility: SVG -> data URI
   =========================== */
function svgToDataUri(svgString) {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);
}

/* ===========================
   Embedded SVG Assets (data URIs)
   Simple flat-style graphics for small screens.
   =========================== */

/* Bat frames (3 frames: up, mid, down) - each 64x48 */
const bat_up_svg = `<svg xmlns='http://www.w3.org/2000/svg' width='64' height='48' viewBox='0 0 64 48'>
  <rect width='100%' height='100%' fill='none'/>
  <g transform='translate(8,6)'>
    <ellipse cx='16' cy='14' rx='8' ry='7' fill='#222' />
    <circle cx='16' cy='12' r='2' fill='#fff' />
    <path d='M0 18 C6 6, 12 6, 16 14 C20 6, 26 6, 32 18' fill='#333' stroke='#111' stroke-width='1'/>
    <path d='M32 18 C26 10, 20 8, 16 8 C12 8, 6 10, 0 18' fill='none' stroke='#222' stroke-width='1'/>
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
  <rect width='100%' height='100%' fill='none'/>
  <polygon points='0,28 8,8 16,28 24,8 32,28' fill='#111' stroke='#444' stroke-width='1'/>
</svg>`;

/* Path tile 128x128 (dark, repeatable) */
const path_tile_svg = `<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 128 128'>
  <rect width='100%' height='100%' fill='#0b1530'/>
  <g fill='#071025' opacity='0.9'>
    <rect x='0' y='0' width='128' height='32'/>
    <rect x='0' y='64' width='128' height='32'/>
  </g>
  <circle cx='20' cy='30' r='1.5' fill='#2b3a57'/>
  <circle cx='100' cy='90' r='1.2' fill='#27364f'/>
</svg>`;

/* Calm final background 720x480 (pastel hills) */
const calm_bg_svg = `<svg xmlns='http://www.w3.org/2000/svg' width='720' height='480' viewBox='0 0 720 480'>
  <defs>
    <linearGradient id='g' x1='0' x2='0' y1='0' y2='1'>
      <stop offset='0' stop-color='#dff7ee'/>
      <stop offset='1' stop-color='#a9e0d8'/>
    </linearGradient>
  </defs>
  <rect width='100%' height='100%' fill='url(#g)'/>
  <ellipse cx='360' cy='420' rx='420' ry='120' fill='#e2f0ea'/>
  <ellipse cx='220' cy='430' rx='300' ry='90' fill='#d6efe7'/>
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
   Game configuration
   =========================== */
const GAME_WIDTH = 360;   // logical width (mobile-first)
const GAME_HEIGHT = 640;  // logical height

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#000000',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 600 },
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [PreloadScene, MenuScene, GameScene, EndScene]
};

/* ===========================
   Scenes
   - PreloadScene: load images (data URIs)
   - MenuScene: intro screen with instructions + Start
   - GameScene: main gameplay
   - EndScene: calm final + dialog boxes
   =========================== */

/* --- PreloadScene --- */
function PreloadScene() {
  Phaser.Scene.call(this, { key: 'PreloadScene' });
}
PreloadScene.prototype = Object.create(Phaser.Scene.prototype);
PreloadScene.prototype.constructor = PreloadScene;
PreloadScene.prototype.preload = function () {
  // Load images from data URIs
  this.load.image('path_tile', ASSETS.path_tile);
  this.load.image('calm_bg', ASSETS.calm_bg);
  this.load.image('coin', ASSETS.coin);
  this.load.image('spike', ASSETS.spike);

  // Bat frames as separate textures (we'll animate by switching textures)
  this.load.image('bat_up', ASSETS.bat_up);
  this.load.image('bat_mid', ASSETS.bat_mid);
  this.load.image('bat_down', ASSETS.bat_down);

  // Small loading text
  const w = this.sys.game.config.width;
  const h = this.sys.game.config.height;
  const txt = this.add.text(w/2, h/2, 'Carregando...', { fontSize: '18px', color: '#ffffff' }).setOrigin(0.5);
};

PreloadScene.prototype.create = function () {
  this.scene.start('MenuScene');
};

/* --- MenuScene (INTRO) --- */
function MenuScene() {
  Phaser.Scene.call(this, { key: 'MenuScene' });
}
MenuScene.prototype = Object.create(Phaser.Scene.prototype);
MenuScene.prototype.constructor = MenuScene;

MenuScene.prototype.create = function () {
  // background simple gradient using graphics
  const w = this.sys.game.config.width;
  const h = this.sys.game.config.height;

  // Add a tile background to mimic "caminho" feel (darker)
  const tile = this.add.tileSprite(0, 0, w, h, 'path_tile').setOrigin(0).setTint(0x22335a);

  // Title + instructions
  const title = this.add.text(w/2, h*0.18, 'Caminho do Morcego', { font: '22px Arial', fill: '#fff' }).setOrigin(0.5);
  const instr = this.add.text(w/2, h*0.28, 'Toque na tela para subir/voar\nEvite espinhos, colete moedas', {
    font: '14px Arial', fill: '#ddd', align: 'center'
  }).setOrigin(0.5);

  // Preview bat
  const bat = this.add.image(w/2, h*0.45, 'bat_mid').setScale(1.6);

  // Start button
  const startBtn = this.add.rectangle(w/2, h*0.68, w*0.6, 56, 0xffffff).setInteractive({ useHandCursor: true });
  startBtn.setStrokeStyle(2, 0x222222);
  const startTxt = this.add.text(w/2, h*0.68, 'Começar', { color: '#111', font: '20px Arial', fontWeight: '700' }).setOrigin(0.5);

  startBtn.on('pointerdown', () => {
    this.scene.start('GameScene', { coinsNeeded: 8 });
  });

  // Mobile hint (tap anywhere)
  this.input.once('pointerdown', () => {
    // do nothing - just allow first tap to be captured by start also
  });
};

/* --- GameScene (main) --- */
function GameScene() {
  Phaser.Scene.call(this, { key: 'GameScene' });
}
GameScene.prototype = Object.create(Phaser.Scene.prototype);
GameScene.prototype.constructor = GameScene;

GameScene.prototype.init = function (data) {
  this.coinsNeeded = data.coinsNeeded || 8;
};

GameScene.prototype.create = function () {
  const w = this.sys.game.config.width;
  const h = this.sys.game.config.height;

  // Background: tile sprite to create scrolling path
  this.bg = this.add.tileSprite(0, 0, w, h, 'path_tile').setOrigin(0).setScrollFactor(0, 0);

  // Groups
  this.spikes = this.physics.add.group();
  this.coins = this.physics.add.group();

  // Player (bat): start on left third
  this.bat = this.physics.add.sprite(w*0.2, h*0.45, 'bat_mid');
  this.bat.setCircle(12, 12, 12);
  this.bat.setCollideWorldBounds(true);
  this.bat.setBounce(0);
  this.bat.setGravityY(0); // use scene gravity via physics system

  // We'll animate with cycling textures every frame step
  this.flapFrames = ['bat_up','bat_mid','bat_down'];
  this.flapFrameIndex = 0;
  this.lastFlapTime = 0;

  // Physics tuning
  this.bat.body.setSize(32,30).setOffset(8,6);

  // Controls: pointer/touch to flap
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

  // Collisions / overlaps
  this.physics.add.overlap(this.bat, this.coins, this.collectCoin, null, this);
  this.physics.add.overlap(this.bat, this.spikes, this.hitSpike, null, this);

  // HUD
  this.coinsCollected = 0;
  this.lives = 1; // single life for simplicity (can be changed)
  this.score = 0;

  this.hudGroup = this.add.group();
  this.hudCoins = this.add.text(10, 10, `Moedas: 0/${this.coinsNeeded}`, { font: '14px Arial', fill: '#fff' }).setScrollFactor(0).setOrigin(0);
  this.hudLives = this.add.text(10, 32, `Vidas: ${this.lives}`, { font: '14px Arial', fill: '#fff' }).setScrollFactor(0).setOrigin(0);
  this.hudDistance = this.add.text(w - 10, 10, `Score: 0`, { font: '14px Arial', fill: '#fff' }).setScrollFactor(0).setOrigin(1,0);

  // Mute placeholder (no sounds included)
  this.isMuted = true;

  // Camera follow (mimic side-scrolling by moving obstacles left instead of camera)
  // We'll move groups left to create illusion of forward movement.

  // Add a minimal ground (invisible) to keep things consistent
  this.groundY = h * 0.9;

  // Initial bounce to avoid immediate fall
  this.bat.setVelocityY(-120);

  // Safety: world bounds
  this.physics.world.setBounds(0, 0, w, h);

  // Distance scoring: increment over time
  this.scoreTimer = this.time.addEvent({
    delay: 500,
    loop: true,
    callback: () => { this.score += 1; this.hudDistance.setText(`Score: ${this.score}`); }
  });
};

GameScene.prototype.update = function (time, delta) {
  // Background parallax
  this.bg.tilePositionX += 0.5 * (delta/16);

  // Flap animation (swap textures)
  if (time - this.lastFlapTime > 120) {
    this.flapFrameIndex = (this.flapFrameIndex + 1) % this.flapFrames.length;
    this.bat.setTexture(this.flapFrames[this.flapFrameIndex]);
    this.lastFlapTime = time;
  }

  // Remove off-screen spikes/coins
  this.spikes.children.iterate((s) => {
    if (!s) return;
    if (s.x < -40) s.destroy();
  });
  this.coins.children.iterate((c) => {
    if (!c) return;
    if (c.x < -40) c.destroy();
  });

  // If bat goes below visible area => lose
  if (this.bat.y > this.sys.game.config.height + 30 || this.bat.y < -40) {
    this.endOrRespawn();
  }

  // End condition: collected enough coins
  if (this.coinsCollected >= this.coinsNeeded) {
    this.finishLevel();
  }
};

/* --- Controls & spawn logic --- */
GameScene.prototype.flap = function () {
  // Impulse upwards
  this.bat.setVelocityY(-260);
  // small rotation effect
  this.tweens.add({
    targets: this.bat,
    angle: -12,
    duration: 120,
    yoyo: true,
    ease: 'Sine.easeInOut'
  });
};

GameScene.prototype.spawnObstacles = function () {
  const h = this.sys.game.config.height;
  const spawnY = Phaser.Math.Between(h*0.2, h*0.86);
  const spike = this.spikes.create(this.sys.game.config.width + 40, spawnY, 'spike');
  spike.setOrigin(0.5, 1);
  spike.setImmovable(true);
  spike.body.allowGravity = false;
  spike.setVelocityX(-180);
  spike.setScale(1.0);
  spike.body.setSize(22,22).setOffset(5,4);
};

GameScene.prototype.spawnCoin = function () {
  // spawn coin slightly higher than typical spikes
  const h = this.sys.game.config.height;
  const spawnY = Phaser.Math.Between(h*0.2, h*0.7);
  const coin = this.coins.create(this.sys.game.config.width + 40, spawnY, 'coin');
  coin.body.allowGravity = false;
  coin.setVelocityX(-160);
  coin.setScale(1.2);
  // simple rotation tween
  this.tweens.add({
    targets: coin,
    angle: 360,
    duration: 1200,
    loop: -1,
    ease: 'Linear'
  });
};

GameScene.prototype.collectCoin = function (player, coin) {
  coin.destroy();
  this.coinsCollected += 1;
  this.score += 10;
  this.hudCoins.setText(`Moedas: ${this.coinsCollected}/${this.coinsNeeded}`);
  this.hudDistance.setText(`Score: ${this.score}`);
};

GameScene.prototype.hitSpike = function (player, spike) {
  spike.destroy();
  this.lives -= 1;
  this.hudLives.setText(`Vidas: ${this.lives}`);
  // Flash effect
  this.cameras.main.flash(200, 255, 100, 60);
  if (this.lives <= 0) {
    this.endOrRespawn();
  }
};

GameScene.prototype.endOrRespawn = function () {
  // For this simple version we restart level (could be life-based)
  this.scene.restart({ coinsNeeded: this.coinsNeeded });
};

GameScene.prototype.finishLevel = function () {
  // Stop timers and move to EndScene
  this.obstacleTimer.remove(false);
  this.coinTimer.remove(false);
  this.scoreTimer.remove(false);

  // Small transition: fade out
  this.cameras.main.fade(600, 0,0,0);
  this.cameras.main.once('camerafadeoutcomplete', () => {
    this.scene.start('EndScene', { coins: this.coinsCollected, score: this.score });
  });
};

/* --- EndScene (final calm + dialogues) --- */
function EndScene() {
  Phaser.Scene.call(this, { key: 'EndScene' });
}
EndScene.prototype = Object.create(Phaser.Scene.prototype);
EndScene.prototype.constructor = EndScene;

EndScene.prototype.init = function (data) {
  this.finalCoins = data.coins || 0;
  this.finalScore = data.score || 0;
};

EndScene.prototype.create = function () {
  const w = this.sys.game.config.width;
  const h = this.sys.game.config.height;

  // calm background (full-size)
  const bg = this.add.image(0, 0, 'calm_bg').setOrigin(0).setDisplaySize(w, h);

  // Show bat arriving centered
  const bat = this.add.image(w*0.36, h*0.5, 'bat_mid').setScale(2.2);

  // Dialogue sequence content
  this.messages = [
    "Você chegou",
    "Eu estava com saudade",
    "Sinto algo lindo em você",
    "É muito mais do que sonhei para mim"
  ];
  this.msgIndex = 0;

  // Dialog box (Phaser text)
  this.dialogBg = this.add.rectangle(w/2, h*0.78, w*0.88, 82, 0xffffff, 1).setStrokeStyle(2, 0xcccccc);
  this.dialogText = this.add.text(w/2, h*0.78, "", { color: '#111', font: '16px Arial', align: 'center', wordWrap: { width: w*0.8 } }).setOrigin(0.5);

  // Make everything interactive to advance dialogues
  this.input.on('pointerdown', () => {
    this.advanceDialog();
  });

  // Start
  this.showMessage(this.messages[this.msgIndex]);

  // Heart at end (hidden)
  this.heart = this.add.text(w/2, h*0.62, '💖', { fontSize: '48px' }).setOrigin(0.5).setAlpha(0);

  // Buttons: Reiniciar / Voltar (HTML overlay simpler)
  const style = { fontSize: '14px', backgroundColor: '#ffffff', padding: 6 };
  // We'll add Phaser buttons using rectangles
  this.restartBtn = this.add.rectangle(w*0.32, h*0.9, w*0.38, 40, 0x2b8a78).setInteractive();
  this.restartTxt = this.add.text(w*0.32, h*0.9, 'Reiniciar', { color: '#fff', font: '16px Arial', fontWeight: '700' }).setOrigin(0.5);
  this.homeBtn = this.add.rectangle(w*0.68, h*0.9, w*0.38, 40, 0x5366f2).setInteractive();
  this.homeTxt = this.add.text(w*0.68, h*0.9, 'Voltar ao início', { color: '#fff', font: '16px Arial', fontWeight: '700' }).setOrigin(0.5);

  this.restartBtn.on('pointerdown', () => {
    this.scene.start('GameScene', { coinsNeeded: 8 });
  });
  this.homeBtn.on('pointerdown', () => {
    this.scene.start('MenuScene');
  });
};

EndScene.prototype.showMessage = function (txt) {
  this.dialogText.setText(txt);
};

EndScene.prototype.advanceDialog = function () {
  this.msgIndex++;
  if (this.msgIndex < this.messages.length) {
    this.showMessage(this.messages[this.msgIndex]);
  } else {
    // all messages shown -> show heart and final state
    this.dialogText.setText("...");
    this.tweens.add({
      targets: this.heart,
      alpha: 1,
      scale: { from: 0.6, to: 1 },
      duration: 600,
      ease: 'Back'
    });
    // show summary
    this.add.text(this.sys.game.config.width/2, this.sys.game.config.height*0.7, 
      `Moedas coletadas: ${this.finalCoins}\nScore: ${this.finalScore}`, { color: '#064', font: '14px Arial', align: 'center' })
      .setOrigin(0.5);
  }
};

/* ===========================
   Boot the game
   =========================== */

// We must declare the scenes before using them (Phaser requires functions to be hoisted)
function registerScenes() {
  // Scenes were declared via constructors above; nothing extra needed.
}

registerScenes();

const game = new Phaser.Game(config);

/* ===========================
   End of file
   =========================== */
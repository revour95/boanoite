/* main.js - versão atualizada
   Alterações principais:
   - Removido preload/tela de carregamento.
   - Gerei todas as texturas dinamicamente com Phaser.Graphics para evitar assets quebrados (quadrados verdes).
   - Mantive a lógica: MenuScene (intro), GameScene (jogo), EndScene (final).
   - Removidos botões Reiniciar/Voltar na tela final conforme pedido.
*/

/* ==============
   Funções utilitárias para gerar texturas procedurais
   ============== */
function generateBatTextures(scene) {
  // frame sizes
  const W = 64, H = 48;

  // bat_up
  let g = scene.add.graphics({ x: 0, y: 0 });
  g.clear();
  // wings (up)
  g.fillStyle(0x222222);
  g.fillEllipse(32, 22, 36, 22);
  g.fillStyle(0x333333);
  g.fillPath(); // no-op but keeps code consistent
  // eye
  g.fillStyle(0xffffff);
  g.fillCircle(36, 18, 3);
  g.generateTexture('bat_up', W, H);
  g.destroy();

  // bat_mid
  g = scene.add.graphics({ x: 0, y: 0 });
  g.clear();
  g.fillStyle(0x222222);
  g.fillEllipse(32, 24, 34, 20);
  g.fillStyle(0xffffff);
  g.fillCircle(36, 20, 3);
  g.generateTexture('bat_mid', W, H);
  g.destroy();

  // bat_down
  g = scene.add.graphics({ x: 0, y: 0 });
  g.clear();
  g.fillStyle(0x222222);
  g.fillEllipse(32, 26, 34, 18);
  g.fillStyle(0xffffff);
  g.fillCircle(36, 22, 3);
  g.generateTexture('bat_down', W, H);
  g.destroy();
}

function generateCoinTexture(scene) {
  const S = 32;
  const g = scene.add.graphics();
  g.clear();
  g.fillStyle(0xf6c84c);
  g.fillCircle(S/2, S/2, 14);
  g.lineStyle(2, 0xc68b1a);
  g.strokeCircle(S/2, S/2, 14);
  g.fillStyle(0xffffff, 0.9);
  g.fillCircle(12, 12, 3);
  g.generateTexture('coin', S, S);
  g.destroy();
}

function generateSpikeTexture(scene) {
  const S = 32;
  const g = scene.add.graphics();
  g.clear();
  g.fillStyle(0x111111);
  // draw alternating triangles
  g.beginPath();
  g.moveTo(0, S - 4);
  g.lineTo(8, 8);
  g.lineTo(16, S - 4);
  g.lineTo(24, 8);
  g.lineTo(32, S - 4);
  g.closePath();
  g.fillPath();
  g.lineStyle(1, 0x444444);
  // stroke isn't directly available on path, approximate with polygon strokes:
  g.strokeTriangle(0, S-4, 8, 8, 16, S-4);
  g.strokeTriangle(8, 8, 16, S-4, 24, 8);
  g.strokeTriangle(16, S-4, 24, 8, 32, S-4);
  g.generateTexture('spike', S, S);
  g.destroy();
}

function generatePathTile(scene) {
  const W = 128, H = 128;
  const g = scene.add.graphics();
  g.clear();
  g.fillStyle(0x0b1530);
  g.fillRect(0,0,W,H);
  g.fillStyle(0x071025, 0.9);
  g.fillRect(0,0,W,32);
  g.fillRect(0,64,W,32);
  g.generateTexture('path_tile', W, H);
  g.destroy();
}

function generateCalmBg(scene) {
  // simple soft background: solid + ellipse
  const W = 720, H = 480;
  const g = scene.add.graphics();
  g.clear();
  // base
  g.fillStyle(0xdff7ee);
  g.fillRect(0,0,W,H);
  // ellipse "ground"
  g.fillStyle(0xe2f0ea);
  g.fillEllipse(W/2, H - 60, 840, 240);
  // sun
  g.fillStyle(0xfff6a8);
  g.fillCircle(W - 170, 100, 42);
  g.generateTexture('calm_bg', W, H);
  g.destroy();
}

/* ==============
   BootScene - gera texturas em runtime e inicia MenuScene.
   (sem tela de carregamento visível)
   ============== */
class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'BootScene' }); }

  create() {
    // Generate all procedural textures (replaces loading SVGs)
    generatePathTile(this);
    generateCalmBg(this);
    generateCoinTexture(this);
    generateSpikeTexture(this);
    generateBatTextures(this);

    // Start the menu immediately
    this.scene.start('MenuScene');
  }
}

/* MenuScene */
class MenuScene extends Phaser.Scene {
  constructor() { super({ key: 'MenuScene' }); }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    this.bg = this.add.tileSprite(0, 0, w, h, 'path_tile').setOrigin(0).setTint(0x0f1a2b);

    this.add.text(w/2, h*0.12, 'Caminho do Morcego', { font: '24px Arial', fill: '#fff' }).setOrigin(0.5);
    this.add.text(w/2, h*0.2, 'Toque na tela para subir/voar\nEvite espinhos, colete moedas', {
      font: '14px Arial', fill: '#ddd', align: 'center'
    }).setOrigin(0.5);

    this.add.image(w/2, h*0.45, 'bat_mid').setScale(2);

    this.add.text(w/2, h*0.78, 'Toque para começar', { font: '18px Arial', fill: '#fff' }).setOrigin(0.5);

    // Start on any touch/click
    this.input.once('pointerdown', () => {
      this.scene.start('GameScene', { coinsNeeded: 8 });
    });
  }

  update() {
    // nothing for now
  }
}

/* GameScene */
class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'GameScene' }); }

  init(data) { this.coinsNeeded = data.coinsNeeded || 8; }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    this.bg = this.add.tileSprite(0, 0, w, h, 'path_tile').setOrigin(0);

    this.spikes = this.physics.add.group();
    this.coins = this.physics.add.group();

    this.bat = this.physics.add.sprite(w*0.2, h*0.45, 'bat_mid');
    this.bat.setCollideWorldBounds(true);
    this.bat.body.setSize(32,30).setOffset(8,6);

    this.flapFrames = ['bat_up','bat_mid','bat_down'];
    this.flapFrameIndex = 0;
    this.lastFlapTime = 0;

    // Controls (pointerdown works for touch + mouse)
    this.input.on('pointerdown', this.flap, this);

    // Spawners
    this.obstacleTimer = this.time.addEvent({ delay: 1200, callback: this.spawnObstacles, callbackScope: this, loop: true });
    this.coinTimer = this.time.addEvent({ delay: 900, callback: this.spawnCoin, callbackScope: this, loop: true });

    // Collisions
    this.physics.add.overlap(this.bat, this.coins, this.collectCoin, null, this);
    this.physics.add.overlap(this.bat, this.spikes, this.hitSpike, null, this);

    // HUD
    this.coinsCollected = 0;
    this.lives = 1;
    this.score = 0;

    this.hudCoins = this.add.text(12, 12, `Moedas: 0/${this.coinsNeeded}`, { font: '14px Arial', fill: '#fff' }).setScrollFactor(0).setOrigin(0);
    this.hudLives = this.add.text(12, 34, `Vidas: ${this.lives}`, { font: '14px Arial', fill: '#fff' }).setScrollFactor(0).setOrigin(0);
    this.hudDistance = this.add.text(w - 12, 12, `Score: ${this.score}`, { font: '14px Arial', fill: '#fff' }).setScrollFactor(0).setOrigin(1,0);

    // initial impulse
    this.bat.setVelocityY(-120);

    this.scoreTimer = this.time.addEvent({ delay: 500, loop: true, callback: () => { this.score += 1; this.hudDistance.setText(`Score: ${this.score}`); } });
  }

  update(time, delta) {
    // background scroll
    this.bg.tilePositionX += 0.5 * (delta/16);

    // flap animation
    if (time - this.lastFlapTime > 120) {
      this.flapFrameIndex = (this.flapFrameIndex + 1) % this.flapFrames.length;
      this.bat.setTexture(this.flapFrames[this.flapFrameIndex]);
      this.lastFlapTime = time;
    }

    // cleanup
    this.spikes.children.iterate((s) => { if (s && s.x < -40) s.destroy(); });
    this.coins.children.iterate((c) => { if (c && c.x < -40) c.destroy(); });

    // bounds
    if (this.bat.y > this.scale.height + 40 || this.bat.y < -60) {
      this.endOrRespawn();
    }

    // win
    if (this.coinsCollected >= this.coinsNeeded) {
      this.finishLevel();
    }
  }

  flap() {
    if (!this.bat || !this.bat.body) return;
    this.bat.setVelocityY(-260);
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
    // keep simple: restart game
    this.scene.restart({ coinsNeeded: this.coinsNeeded });
  }

  finishLevel() {
    if (this.obstacleTimer) this.obstacleTimer.remove(false);
    if (this.coinTimer) this.coinTimer.remove(false);
    if (this.scoreTimer) this.scoreTimer.remove(false);
    this.cameras.main.fade(600, 0,0,0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('EndScene', { coins: this.coinsCollected, score: this.score });
    });
  }
}

/* EndScene - sem botões de reiniciar/voltar conforme pedido */
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

    this.dialogBg = this.add.rectangle(w/2, h*0.78, w*0.88, 82, 0xffffff, 1).setStrokeStyle(2, 0xcccccc);
    this.dialogText = this.add.text(w/2, h*0.78, "", { color: '#111', font: '16px Arial', align: 'center', wordWrap: { width: w*0.8 } }).setOrigin(0.5);

    // advance dialog on tap, but no restart/home buttons
    this.input.on('pointerdown', () => this.advanceDialog());

    this.showMessage(this.messages[this.msgIndex]);
    this.heart = this.add.text(w/2, h*0.62, '💖', { fontSize: '48px' }).setOrigin(0.5).setAlpha(0);
  }

  showMessage(txt) {
    this.dialogText.setText(txt);
  }

  advanceDialog() {
    this.msgIndex++;
    if (this.msgIndex < this.messages.length) {
      this.showMessage(this.messages[this.msgIndex]);
    } else {
      // final state: show heart + stats; no buttons
      this.dialogText.setText("...");
      this.tweens.add({ targets: this.heart, alpha: 1, scale: { from: 0.6, to: 1 }, duration: 600, ease: 'Back' });
      this.add.text(this.scale.width/2, this.scale.height*0.7, `Moedas coletadas: ${this.finalCoins}\nScore: ${this.finalScore}`, { color: '#064', font: '14px Arial', align: 'center' }).setOrigin(0.5);
      // Do not add restart/home buttons per request
    }
  }
}

/* ==============
   Config e boot
   ============== */

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: '#000000',
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 600 }, debug: false }
  },
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, MenuScene, GameScene, EndScene]
};

window.addEventListener('load', () => {
  window.game = new Phaser.Game(config);
});

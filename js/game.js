const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 800,
  height: 400,
  scene: {
    preload,
    create,
    update,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: {
        y: 800,
      },
    },
  },
};

let isJumping = false;
const game = new Phaser.Game(config);
let backgroundImage = [];
var score = 0;
var scoreText;
var highScore = 0;
var highScoreText;
var scorePic;
var highScorePic;
var gameOver = false;
var worldOffsetY = -500;

function preload() {
  this.load.image('tiles', 'assets/images/grounds.png');
  this.load.image('score', 'assets/images/score.png');
  this.load.image('highscore', 'assets/images/HighScore.png');
  this.load.spritesheet('obstacles', 'assets/images/obstacles.png', {
    frameWidth: 64,
    frameHeight: 64,
  });
  this.load.tilemapTiledJSON('map', 'assets/tilemaps/level1.json');
  this.load.path = '../assets/images/';
  this.load.spritesheet('player', 'cubes.png', {
    frameWidth: 138,
    frameHeight: 135,
  });
  this.load.spritesheet('background', 'backgrounds-hd.png', {
    frameWidth: 1024,
    frameHeight: 1024,
  });
}

function create() {
  const map = this.make.tilemap({
    key: 'map',
  });
  const tileset = map.addTilesetImage('grounds', 'tiles');
  var tint = Math.random() * 0xffffff;
  for (let index = -1; index <= 21; index++) {
    var background = this.add
      .sprite(index * 1024, 0, 'background')
      .setOrigin(0, 0);
    background.tint = tint;
    backgroundImage.push(background);
  }

  this.physics.world.setBounds(
    0,
    worldOffsetY,
    map.widthInPixels,
    map.heightInPixels,
    true,
    true,
    true,
    true,
  );

  tint = Math.random() * 0xffffff;
  this.platforms = map.createDynamicLayer('Platforms', tileset, 0, worldOffsetY);
  this.platforms.setCollisionByExclusion(-1, true);
  this.platforms.tint = tint;
  var layer = this.platforms;
  console.log(layer);
  tint = Math.random() * 0xffffff;
  this.player = this.physics.add.sprite(50, 300, 'player');
  this.player.setBounce(0.1);
  this.player.tint = tint;
  this.player.setCollideWorldBounds(true);

  this.player.setScale(0.5);
  this.physics.add.collider(
    this.player,
    this.platforms,
    playerHitPlatform,
    null,
    this,
  );

  var camera = this.cameras.main;
  camera.setBounds(0, worldOffsetY, map.widthInPixels, map.heightInPixels);
  camera.startFollow(this.player);
  camera.setFollowOffset(this.player.x - 200, this.player.y - 220);
  this.cursors = this.input.keyboard.createCursorKeys();

  tint = Math.random() * 0xffffff;
  this.obstacles = this.physics.add.group({
    allowGravity: false,
    immovable: true,
  });

  var objTileset = map.getTileset('obstacles');
  const obstacleObjects = map.getObjectLayer('obstacles')['objects'];
  obstacleObjects.forEach(obstacleObject => {
    const obstacle = this.obstacles
      .create(
        obstacleObject.x,
        obstacleObject.y + worldOffsetY - obstacleObject.height,
        'obstacles',
      )
      .setOrigin(0, 0);
    obstacle.body
      .setSize(obstacle.width, obstacle.height - 20)
      .setOffset(0, 20);
    var frame = obstacleObject.gid - objTileset.firstgid;
    if (frame < 0) frame = 0;
    obstacle.setFrame(frame);
    obstacle.obstacleType = objTileset.tileProperties[frame];
    if (
      obstacle.obstacleType != null &&
      obstacle.obstacleType.obstacleType != 'spike'
    )
      obstacle.body.enable = false;
  });
  this.physics.add.collider(this.player, this.obstacles, playerHit, null, this);
  scorePic = this.add.image(50, 50, 'score').setOrigin(0, 0);
  scorePic.setScrollFactor(0);
  highScorePic = this.add.image(550, 50, 'highscore').setOrigin(0, 0);
  highScorePic.setScrollFactor(0);
  scoreText = this.add.text(142, 57, score, {
    fontSize: '20px',
    fontFamily: 'arial',
    fill: '#ffffff',
  });
  scoreText.setScrollFactor(0);
  highScoreText = this.add.text(677, 57, highScore, {
    fontSize: '20px',
    fontFamily: 'arial',
    fill: '#ffffff',
  });
  highScoreText.setScrollFactor(0);
}

function updateText() {
  scoreText.setText(score);
  highScoreText.setText(highScore);
}

function update() {
  if (this.player.x > 400) {
    backgroundImage.forEach(function (bkg) {
      bkg.x++;
    });
  }

  this.player.body.setVelocityX(250);
  if (gameOver) return;
  score += 1;
  updateText();

  if (this.player.body.onFloor()) this.player.angle = 0;
  else this.player.angle += 3;
  var pointer = this.input.activePointer;
  if (
    (this.cursors.space.isDown || pointer.isDown || this.cursors.up.isDown) &&
    this.player.body.onFloor()
  ) {
    this.player.setVelocityY(-500);
  }
}

function playerHitPlatform(player, platform) {
  if (player.body.blocked.right) {
    resetLevel(player, this);
  }
}

function playerHit(player, obstacle) {
  if (obstacle.obstacleType.obstacleType === 'object') return;
  else if (obstacle.obstacleType.obstacleType === 'portal') {
    showWonGame(this);
    return;
  }
  resetLevel(player, this);
}

function showWonGame(game) {
  var gameOverText = game.add.text(200, 200, 'YAY, YOU WON!!!!!', {
    fontSize: '50px',
    fontFamily: 'arial',
    fill: '#eeeeee',
  });
  gameOverText.setScrollFactor(0);
  if (score > highScore) {
    highScore = score;
    updateText();
  }
  gameOver = true;
}

function resetLevel(player, game) {
  // Set velocity back to 0
  player.setVelocity(0, 0);
  if (score > highScore) highScore = score;
  score = 0;
  // Put the player back in its original position
  player.setX(50);
  player.setY(300);
  // Use the default `idle` animation
  //player.play('idle', true);
  // Set the visibility to 0 i.e. hide the player
  player.setAlpha(0);
  // Add a tween that 'blinks' until the player is gradually visible
  let tw = game.tweens.add({
    targets: player,
    alpha: 1,
    duration: 100,
    ease: 'Linear',
    repeat: 5,
  });
  backgroundImage.forEach(function (bkg, index) {
    bkg.x = index * 1024
  });
}
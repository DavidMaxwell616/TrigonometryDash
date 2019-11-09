const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 800,
  heigth: 640,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: {
    preload,
    create,
    update,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: {
        y: 500,
      },
    },
  },
};

let isJumping = false;
const game = new Phaser.Game(config);
let backgroundImage;
var score = 0;
var scoreText;
var highScore = 0;
var highScoreText;
var scorePic;
var highScorePic;
var pointer;

function preload() {
  // Image layers from Tiled can't be exported to Phaser 3 (as yet)
  // So we add the background image separately
  //this.load.image('background', 'assets/images/background.png');
  // Load the tileset image file, needed for the map to know what
  // tiles to draw on the screen
  this.load.image('tiles', 'assets/tilesets/grounds.png');
  // Even though we load the tilesheet with the obstacle image, we need to
  // load the obstacle image separately for Phaser 3 to render it

  this.load.image('score', 'assets/images/score.png');
  this.load.image('highscore', 'assets/images/HighScore.png');

  this.load.spritesheet('obstacles', 'assets/images/obstacles.png', {
    frameWidth: 64,
    frameHeight: 64,
  });
  // Load the export Tiled JSON
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
  // Load player animations from the player spritesheet and atlas JSON
  // this.load.atlas('player', 'assets/images/kenney_player.png',
  //   'assets/images/kenney_player_atlas.json');
}

function create() {
  // Create a tile map, which is used to bring our level in Tiled
  // to our game world in Phaser
  const map = this.make.tilemap({
    key: 'map',
  });
  // Add the tileset to the map so the images would load correctly in Phaser
  const tileset = map.addTilesetImage('grounds', 'tiles');
  // Place the background image in our game world
  var tint = Math.random() * 0xffffff;
  for (let index = 0; index <= 22; index++) {
    backgroundImage = this.add
      .image(index * 1024, 0, 'background')
      .setOrigin(0, 0);
    backgroundImage.tint = tint;
  }

  this.physics.world.setBounds(
    0,
    -500,
    map.widthInPixels,
    map.heightInPixels,
    true,
    true,
    true,
    true,
  );

  // Add the platform layer as a static group, the player would be able
  // to jump on platforms like world collisions but they shouldn't move
  tint = Math.random() * 0xffffff;
  const platforms = map.createDynamicLayer('Platforms', tileset, 0, -500);
  // There are many ways to set collision between tiles and players
  // As we want players to collide with all of the platforms, we tell Phaser to
  // set collisions for every tile in our platform layer whose index isn't -1.
  // Tiled indices can only be >= 0, therefore we are colliding with all of
  // the platform layer
  platforms.setCollisionByExclusion(-1, true);
  platforms.tint = tint;

  // Add the player to the game world
  tint = Math.random() * 0xffffff;
  this.player = this.physics.add.sprite(50, 300, 'player');
  this.player.setBounce(0.1); // our player will bounce from items
  this.player.tint = tint;
  this.player.setCollideWorldBounds(true); // don't go out of the map

  this.player.setScale(0.5);
  this.physics.add.collider(this.player, platforms);
  var camera = this.cameras.main;
  camera.setBounds(0, -500, map.widthInPixels, map.heightInPixels);
  camera.startFollow(this.player);
  camera.setFollowOffset(this.player.x - 200, this.player.y - 150);
  // Enable user input via cursor keys
  this.cursors = this.input.keyboard.createCursorKeys();

  tint = Math.random() * 0xffffff;
  // Create a sprite group for all obstacles, set common properties to ensure that
  // sprites in the group don't move via gravity or by player collisions
  this.obstacles = this.physics.add.group({
    allowGravity: false,
    immovable: true,
  });

  var objTileset = map.getTileset('obstacles');
  // Get the obstacles from the object layer of our Tiled map. Phaser has a
  // createFromObjects function to do so, but it creates sprites automatically
  // for us. We want to manipulate the sprites a bit before we use them
  const obstacleObjects = map.getObjectLayer('obstacles')['objects'];
  obstacleObjects.forEach(obstacleObject => {
    // Add new obstacles to our sprite group
    const obstacle = this.obstacles
      .create(
        obstacleObject.x,
        obstacleObject.y - 500 - obstacleObject.height,
        'obstacles',
      )
      .setOrigin(0, 0);
    // By default the sprite has loads of whitespace from the base image, we
    // resize the sprite to reduce the amount of whitespace used by the sprite
    // so collisions can be more precise
    obstacle.body
      .setSize(obstacle.width, obstacle.height - 20)
      .setOffset(0, 20);
    var frame = obstacleObject.gid - objTileset.firstgid;
    obstacle.setFrame(frame);
    obstacle.spike = objTileset.tileProperties[frame];
  });
  // Add collision between the player and the obstacles
  this.physics.add.collider(this.player, this.obstacles, playerHit, null, this);

  scorePic = this.add.image(50, 50, 'score').setOrigin(0, 0);
  scorePic.setScrollFactor(0);

  highScorePic = this.add.image(550, 50, 'highscore').setOrigin(0, 0);
  highScorePic.setScrollFactor(0);

  scoreText = this.add.text(140, 58, score, {
    fontSize: '20px',
    fill: '#ffffff',
  });
  scoreText.setScrollFactor(0);

  highScoreText = this.add.text(675, 58, highScore, {
    fontSize: '20px',
    fill: '#ffffff',
  });
  highScoreText.setScrollFactor(0);

  pointer = this.input.activePointer;
}

function updateText() {
  scoreText.setText(score);
  highScoreText.setText(highScore);
}

function update() {
  // Control the player with left or right keys
  if (this.player.x > 400) backgroundImage.x += 13;
  this.player.x += 5;
  score += 1;
  updateText();

  if (this.player.body.onFloor()) this.player.angle = 0;
  else this.player.angle += 3;

  if ((this.cursors.space.isDown || pointer.isDown || this.cursors.up.isDown) &&
    this.player.body.onFloor()
  ) {
    this.player.setVelocityY(-350);
  }
}

function playerHit(player, obstacle) {
  if (!obstacle.spike.spike)
    return;
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
  let tw = this.tweens.add({
    targets: player,
    alpha: 1,
    duration: 100,
    ease: 'Linear',
    repeat: 5,
  });
}
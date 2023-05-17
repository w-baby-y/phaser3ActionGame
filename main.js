const D_WIDTH = 480;
const D_HEIGHT = 320;
let player; //プレイヤーのスプライトを格納
let bomb;
let score = 0;
let scoreText;
let gameOverText;
let jewelGroup;

// 1, Phaser3の設定データ
const config = {
  type: Phaser.AUTO,
  width: D_WIDTH, // ゲーム画面の横幅
  height: D_HEIGHT, // ゲーム画面の高さ
  antialias: false,
  scene: {
    preload: preload, // 素材の読み込み時の関数
    create: create, // 画面が作られた時の関数
    update: update, // 連続実行される関数
  },
  fps: {
    target: 24, // フレームレート
    forceSetTimeOut: true,
  },
  physics: {
    default: "arcade",
    arcade: {
      debug: false, // スプライトに緑の枠を表示します
      gravity: { y: 200 }, // 重力の方向とその強さ
    },
  },
};

// 2, Phaser3オブジェクトを作る
let phaser = new Phaser.Game(config);

// ゲーム素材の読み込み(画像や音ファイル)
function preload() {
  console.log("preload!!");
  this.load.image("block", "./assets/block.png");
  this.load.image("ground", "./assets/ground.png");
  this.load.image("pillar", "./assets/pillar.png");
  this.load.image("post", "./assets/post.png");
  this.load.image("sky", "./assets/sky.png");
  this.load.image("coin", "./assets/coin.png");
  this.load.image("jewel", "./assets/jewel.png");
  this.load.image("bomb", "assets/bomb.png");
  this.load.spritesheet("dude", "assets/dude.png", {
    //スプライトの指定
    frameWidth: 32,
    frameHeight: 48,
  });
}
// ゲーム画面の初期化(キャラクターの登場等)
function create() {
  console.log("create!!");
  this.add.image(D_WIDTH / 2, D_HEIGHT / 2, "sky"); //背景画像

  player = this.physics.add.sprite(240, 80, "dude"); //プレイヤー
  player.setBounce(0.2); // 少しバウンドする

  this.anims.create({
    key: "left",
    frames: this.anims.generateFrameNumbers("dude", { start: 0, end: 3 }),
    frameRate: 10,
    repeat: -1,
  });

  this.anims.create({
    key: "turn",
    frames: [{ key: "dude", frame: 4 }],
    frameRate: 20,
  });

  this.anims.create({
    key: "right",
    frames: this.anims.generateFrameNumbers("dude", { start: 5, end: 8 }),
    frameRate: 10,
    repeat: -1,
  });

  let staticGroup = this.physics.add.staticGroup(); //動かないグループをまとめる
  staticGroup.create(D_WIDTH / 2, D_HEIGHT - 32, "ground"); //地面を作る
  staticGroup.create(240, 240, "block"); // ブロック
  staticGroup.create(120, 120, "block"); // ブロック
  staticGroup.create(300, 100, "block"); // ブロック
  staticGroup.create(30, 230, "post"); // ポスト
  staticGroup.create(450, 160, "pillar"); // 電柱
  this.physics.add.collider(player, staticGroup); //地面とプレイやーの衝突処理

  let coinGroup = this.physics.add.group(); //コイングループをまとめる
  coinGroup.create(10, 0, "coin"); // コイン1
  coinGroup.create(100, 0, "coin"); // コイン1
  coinGroup.create(200, 0, "coin"); // コイン2
  coinGroup.create(300, 0, "coin"); // コイン3
  coinGroup.create(400, 0, "coin"); // コイン3
  this.physics.add.collider(coinGroup, staticGroup); //地面とコインの衝突処理

  jewelGroup = this.physics.add.group(); //ジュエルグループをまとめる
  //グローバル変数でjewelGroupを指定しているのに、改めてローカル関数内変数を定義したのでエラーになった
  // jewelGroup.setVisible(false);
  this.physics.add.collider(jewelGroup, staticGroup); //地面とコインの衝突処理

  // 爆弾と衝突判定
  let bombs = this.physics.add.group(); //bombグループをまとめる
  this.physics.add.collider(bombs, staticGroup); //ボムと地面の衝突処理

  //爆弾１個め
  let bomb = bombs.create(16, 16, "bomb");
  bomb.setBounce(1);
  bomb.setCollideWorldBounds(true);
  bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
  bomb.allowGravity = true;

  //爆弾２個め
  let bomb2 = bombs.create(500, 16, "bomb");
  bomb2.setBounce(1);
  bomb2.setCollideWorldBounds(true);
  bomb2.setVelocity(Phaser.Math.Between(-200, 200), 20);
  bomb2.allowGravity = true;

  scoreText = this.add.text(16, 16, "Score: 0", {
    fontSize: "32px",
    fill: "#fff",
  });

  //ただコインが消えるだけの処理
  //   this.physics.add.overlap(
  //     player,
  //     coinGroup,
  //     (p, c) => {
  //       c.destroy();
  //     },
  //     null,
  //     this
  //   );
  //   this.physics.add.overlap(
  //     player,
  //     jewelGroup,
  //     (p, c) => {
  //       c.destroy();
  //     },
  //     null,
  //     this
  //   );

  // //playerとcoinGroupが重なったらcollectCoinを呼ぶ
  this.physics.add.overlap(player, coinGroup, collectCoin, null, this);
  // playerとbombsが重なったらhitBombを呼ぶ
  this.physics.add.collider(player, bombs, hitBomb, null, this);
  // playerとjewelGroupが重なったらhitJewelを呼ぶ
  this.physics.add.collider(player, jewelGroup, hitJewel, null, this);

  // ゲームオーバー表示を追加する
  gameOverText = this.add.text(D_WIDTH / 2, D_HEIGHT / 2, "", {
    fontSize: "64px",
    fill: "#f00",
  });
  gameOverText.setOrigin(0.5);
}

function hitJewel(player, jewel) {
  jewel.destroy();
  this.physics.pause();
  player.anims.play("turn");
  gameOverText.setText("Game Clear!!");
}
//爆弾があたったときの判定
function hitBomb(player, bomb) {
  //ゲームを停止
  this.physics.pause();
  // プレイヤー表示変更
  player.setTint(0xff0000);
  player.anims.play("turn");
  gameOverText.setText("Game Over");
}

// playerとcoinが重なったらスコアを加算
function collectCoin(player, coin) {
  coin.destroy();
  score += 10;
  scoreText.setText("Score: " + score);

  if (score === 50) {
    //   jewelGroup.setVisible(true);
    let jewel = jewelGroup.create(450, 0, "jewel").setDisplaySize(30, 45); // ジュエル１
    // jewel.setBounce(1);
    // jewel.setCollideWorldBounds(true);
    // jewel.setVelocity(Phaser.Math.Between(-200, 200), 20);
    jewel.allowGravity = false;
  }
}

// ゲーム画面の更新(キャラクターの操作等)
function update() {
  //キーボード操作
  let cursors = this.input.keyboard.createCursorKeys();

  if (cursors.up.isDown && player.body.touching.down) {
    //地面に接しているときのみジャンプできる
    player.setVelocityY(-200);
  } else if (cursors.left.isDown) {
    player.setVelocityX(-200);
    player.anims.play("left", true);
  } else if (cursors.right.isDown) {
    player.setVelocityX(200);
    player.anims.play("right", true);
  } else {
    player.setVelocityX(0);
    player.anims.play("turn");
  }
}

// https://zenn.dev/sdkfz181tiger/books/d705035a8c0452/viewer/1bffc6
// https://blog.t-haku.com/dabble-in-phaser3/
// https://1-notes.com/phaser-3-group-codes/#

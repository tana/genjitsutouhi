// memo: 特定の場所にコメントを書くとうまく動作しない
// KAKKOとKOKKAは原因を調べた時に書き換えたところ、{と}の代わり。
// だけど戻しても変わらないかもしれない
var canvas;
var ctx;
var width = 640;
var height = 480;
var cnt = 0;
var mouseX = 0;
var mouseY = 0;
var clicked = false;

var gameover = false;
var endx = 0; // ゲームオーバー時の自機x
var endy = 0; // y
var endcnt = 0; // cnt

var score = 0;

var intervalID;

var playerW = 20;
var playerH = 20;

var bullet_cnt = 0;

function GameObject(x, y, w, h, next) {
  this.x = x;
  this.y = y;
  this.w = w;
  this.h = h;
  this.next = next;
}
function Enemy(x, y, created) {
  this.x = x;
  this.y = y;
  this.w = 10;
  this.h = 10;
  this.created = created;
  this.time = Math.floor(Math.random() * 10) + 20;
  this.draw = function() {
    var b = [this.x, this.y];
    ctx.beginPath();
    ctx.moveTo(b[0], b[1]);
    ctx.lineTo(b[0] + this.w, b[1]);
    ctx.lineTo(b[0] + this.w, b[1] + this.h);
    ctx.lineTo(b[0], b[1] + this.h);
    ctx.closePath();
    ctx.fill();
  }
  this.bullet_flag = false; // 発射したらtrue
  this.bullet_cnt = 0;
  this.bullet_type = (Math.random() > 0.5) ? 1 : 0; // 1は自機狙い、0は360度
}
Enemy.prototype = new GameObject();
Enemy.prototype.next = function(a) {
  var count = cnt - this.created;
  if (count * 2 < this.time) {
    this.y += 2;
  } else if (count < 80) {
    //if (this.bullet_flag) return;
    if (!(this.bullet_flag)) {
      if (this.bullet_type == 1) {
        if (count % 5 == 0) {
          var r = Math.atan2(mouseY - this.y, mouseX - this.x);
          var xspeed = Math.cos(r) * 10;
          var yspeed = Math.sin(r) * 10;
          addBullet(new SimpleBullet(this.x, this.y, xspeed, yspeed));
          this.bullet_cnt++;
        }
        if (this.bullet_cnt > 4) this.bullet_flag = true;
      } else {
        this.bullet_flag = true;
        if (this.bullet_cnt > 19) this.bullet_cnt = 0;
        if (this.bullet_cnt < 8 && this.bullet_cnt % 2 == 0) {
          for (var count = 0; count < 10; count++) {
            var x = Math.cos(Math.PI * 2 * (count / 10));
            var y = Math.sin(Math.PI * 2 * (count / 10));
            var blt = new SimpleBullet(this.x, this.y, x * 5, y * 5);
            addBullet(blt);
          }
        }
        this.bullet_cnt++;
      }
    }
  } else if (count > 80) {
    this.y -=1;
  }
}

function Bullet(x, y, next, owner) {
  if (owner == undefined) {
    owner = 0;
  }
  this.x = x;
  this.y = y;
  this.w = 3;
  this.h = 10;
  this.next = next;
  this.owner = owner;
  this.draw = function() {
    var b = [this.x, this.y];
    ctx.beginPath();
    ctx.moveTo(b[0], b[1]);
    ctx.lineTo(b[0] + 3, b[1]);
    ctx.lineTo(b[0] + 3, b[1] + 10);
    ctx.lineTo(b[0], b[1] + 10);
    ctx.closePath();
    ctx.fill();
  }
}
Bullet.prototype = new GameObject();

function SimpleBullet(x, y, xspeed, yspeed, owner) {
  if (owner == undefined) {
    owner = 0;
  }
  this.x = x;
  this.y = y;
  this.owner = owner;
  this.xspeed = xspeed; this.yspeed = yspeed;
}
SimpleBullet.prototype = new Bullet();
SimpleBullet.prototype.next = function(a) {
  this.x += this.xspeed;
  this.y += this.yspeed;
}

var bullets = [];
var bulletcnt = 0;

function newBullet(x, y, xspeed, yspeed) {
  bullets.push([x, y, xspeed, yspeed]);
  var c = bulletcnt;
  bulletcnt++;
  return c;
}
function addBullet(b) {
  bullets.push(b);
  var c = bulletcnt;
  bulletcnt++;
  return c;
}
function moveBullet() {
  for (var i in bullets) {
    /*var b = bullets[i];
    var x = b[0];
    var y = b[1];
    var xspeed = b[2];
    var yspeed = b[3];
    bullets[i] = [x + xspeed, y + yspeed, xspeed, yspeed]*/
    bullets[i].next(bullets[i]);
  }
}
function drawBullet() {
  for (var i in bullets) {
    bullet = bullets[i];
    /*b = [bullet.x, bullet.y];
    ctx.beginPath();
    ctx.moveTo(b[0], b[1]);
    ctx.lineTo(b[0] + 3, b[1]);
    ctx.lineTo(b[0] + 3, b[1] + 10);
    ctx.lineTo(b[0], b[1] + 10);
    ctx.closePath();
    ctx.fill();*/
    bullet.draw();
  }
}
// 画面から消えた弾を削除 メモリ開放用
function deleteBullet() {
  for (var i in bullets) {
    var b = bullets[i];
    if (b.x < 0 - b.w || b.y < 0 - b.h || b.x > width || b.y > height) {
      //ctx.fillText("deleted", 0, 100);
      delete bullets[i];
    }
  }
}
function check() {
  var w = playerW / 2;
  var h = playerH / 2;
  for (var i in bullets) {
    var b = bullets[i];
    if ((mouseX - w < b.x + b.w) &&
        (mouseY - h < b.y + b.h) &&
        (mouseX + w > b.x) &&
        (mouseY + h > b.y) &&
        b.owner == 0) {
      //ctx.fillText("hoge", 0, 200);
      gameover = true;
      endx = mouseX;
      endy = mouseY;
      endcnt = cnt;
    }
    if (b instanceof Bullet && b.owner == 1) {
    // 上のif文の上に一行コメント書いたらシンタックスエラー
    // と思ったら、上のif文の下にコメントが無いとシンタックスエラー?
    // でも無かった。何が悪いの
    // 敵に自分の弾が当たったかどうか判定
    //if (true) KAKKO
      for (var j in bullets) {
        var e = bullets[j];
        if (e instanceof Enemy &&
            b.x < e.x + e.w &&
            b.y < e.y + e.h &&
            b.x + b.w > e.x &&
            b.y + b.h > e.y) {
          /*gameover = true;
          endx = 0;
          endy = 0;
          endcnt = cnt;*/
          score++;
          delete bullets[j];
        }
      }
    }
  }
}

// 毎回呼ばれる
function draw() {
  if (gameover) {
    if (cnt - endcnt > 50) {
      ctx.fillStyle = "rgb(0, 0, 0)";
      ctx.fillText("GAME OVER score: " + score.toString(), 100, 100);
      window.clearInterval(intervalID);
    }
    ctx.beginPath();
    ctx.fillStyle = "rgb(255, 100, 0)";
    ctx.arc(endx, endy, cnt - endcnt, 0, 6.28, false);
    ctx.fill();
    ctx.closePath();
    if (cnt - endcnt > 10) {
      ctx.beginPath();
      ctx.fillStyle = "rgb(255, 50, 0)";
      ctx.arc(endx, endy, cnt - endcnt - 10, 0, 6.28, false);
      ctx.fill();
      ctx.closePath();
    }
    cnt++;
    return;
  }
  ctx.clearRect(0, 0, width, height);
  ctx.fillText("score: " + score.toString(), 0, 100);
  drawPlayer(); 
  if (clicked) {
    /*ctx.beginPath();
    ctx.moveTo(10, 10);
    ctx.lineTo(100, 100);
    ctx.closePath();
    ctx.stroke();*/
    //newBullet(mouseX - 1, mouseY, 0, -10);
    addBullet(new SimpleBullet(mouseX - 1, mouseY, 0, -10, 1));
  }
  if (cnt % 50 == 0) {
    addBullet(new Enemy(Math.floor(Math.random() * width), 0, cnt));
  }

  /*
  bulletx = Math.sin(cnt / 5) * 50 + width/2;//(Math.sin(cnt / 100) * (width/2 - 3)) + width/2;
  bullety = Math.sin(cnt / 2.5) * 50 + 50;
  ctx.fillRect(bulletx, bullety, 10, 10);
  if (cnt % 2 == 0) KAKKO
    newBullet(bulletx, bullety, 0, 10);
  KOKKA*/
  /*
  ctx.beginPath();
  ctx.moveTo(10, 10);
  ctx.lineTo(cnt, 100);
  ctx.stroke();
  */
  /*
  if (cnt % 10 == 0) KAKKO
    var i = Math.floor((cnt - Math.floor(cnt / 100)) / 10);
    i = i - 10 * Math.floor((i / 10));
    //alert(i);
    var now = cnt;
    //for (var i = 0; i < 10; i++) KAKKO
      var x = Math.cos(Math.PI * 2 * i / 10) * 30 + width/2;
      var y = Math.sin(Math.PI * 2 * i / 10) * 30 + 45;
      var bullet = new Bullet(x, y, function(self) KAKKO
        if (!(cnt - now < 100 - i * 10)) KAKKO
          self.y += 10;
        KOKKA
      KOKKA);
      addBullet(bullet);
    //KOKKA
  KOKKA*/
  /*
  if (cnt % 5 == 0) KAKKO
    //var count = cnt / 10 - Math.floor(cnt / 100);
    //alert (count);
    if (bullet_cnt > 19) bullet_cnt = 0;
    if (bullet_cnt < 8 && bullet_cnt % 2 == 0) KAKKO
      for (var count = 0; count < 10; count++) KAKKO
        var x = Math.cos(Math.PI * 2 * (count / 10));
        var y = Math.sin(Math.PI * 2 * (count / 10));
        var blt = new SimpleBullet(100, 10, x * 5, y * 5);
        addBullet(blt);
      KOKKA
    KOKKA
    bullet_cnt++;
  KOKKA*/
  //ctx.fillText("bullets: " + bullets.length.toString(), 0, 100);
  moveBullet();
  drawBullet();
  deleteBullet();
  check();
  cnt++;
}
// 自機を描画
function drawPlayer() {
  ctx.beginPath();
  ctx.moveTo(mouseX - 10, mouseY - 10);
  ctx.lineTo(mouseX + 10, mouseY - 10);
  ctx.lineTo(mouseX + 10, mouseY + 10);
  ctx.lineTo(mouseX - 10, mouseY + 10);
  ctx.closePath();
  ctx.fill();
}

// 最初にこれが実行される
function main() {
  canvas = document.getElementById("maincanvas");
  var rect = canvas.getBoundingClientRect();
  canvas.addEventListener("mousemove", function (e) {
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  }, false);
  canvas.addEventListener("mousedown", function(e) {
    clicked = true;
  }, false);
  canvas.addEventListener("mouseup", function(e) {
    clicked = false;
  }, false);
  ctx = canvas.getContext("2d");
  /*
  ctx.beginPath();
  ctx.moveTo(10, 10);
  ctx.lineTo(100, 100);
  ctx.closePath();
  ctx.stroke();
  */
  intervalID = window.setInterval(draw, 1000/30);
}

window.addEventListener("load", main, false);

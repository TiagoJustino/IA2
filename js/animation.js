var GITHUB_URL = 'https://api.github.com/events';
var receivedEvents = {}; 
var playerwidth = 149;
var playerheight = 405;
var hoopwidth = 132;
var hoopheight = 400;
var avatar;
var collectedData = [];
var count = 0;
var duration = 360;

var hoop = new Raster('img/github.png');
hoop.position = new Point(view.size.width - (hoopwidth / 2), view.size.height - (hoopheight / 2));

var player = new Raster('img/player.png');
player.position = new Point(- (playerwidth / 2), view.size.height - (playerheight / 2));

var ball;
var label;

// copied from http://stackoverflow.com/questions/1527803/generating-random-numbers-in-javascript-in-a-specific-range
var getRamdom = function(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

var onFrame = function(event) {
  if(collectedData.length === 0) {
    return;
  }
  if(!avatar || count === duration) {
    if(avatar) {
      avatar.remove();
      ball.remove();
      label.remove();
    }
    count = 0;
    var index = getRamdom(0, collectedData.length - 1);
    var avatarurl = collectedData[index].actor.avatar_url;
    avatar = new Raster(avatarurl);
    avatar.scale(0.2);

    var handPosition = new Point(player.position.x + 42, player.position.y - 183);
    ball = Path.Circle(handPosition, 35);
    ball.fillColor = 'orange';
    ball.strokeColor = ball.fillColor;

    label = new PointText({
      point: handPosition,
      justification: 'center',
      fontSize: 15,
      fillColor: 'black'
    });
    label.content = collectedData[index].type.substr(0, collectedData[index].type.indexOf('Event'));

    avatar.position.x = player.position.x - 51;
    avatar.position.y = player.position.y - 124;

    collectedData.splice(index, 1);
  }

  if(count < 80) {
    avatar.position.x += 3;
    player.position.x += 3;
    label.position.x += 3;
    ball.position.x += 3;
  } else if (count < 160) {
    avatar.position.x -= 3;
    player.position.x -= 3;
    label.position.x += 5;
    ball.position.x += 5;
  } else if (count < 219) {
    label.position.x += 5;
    ball.position.x += 5;
  } else {
    label.position.y += 3;
    ball.position.y += 3;
  }

  count += 1;
};

var onFetchedData = function( data ) {
  for(var i = 0; i < data.length; i++) {
    if(receivedEvents[data[i].id]) {
      data.splice(i, 1);
      i--;
    } else {
      receivedEvents[data[i].id] = true;
    }
  }
  collectedData = data;
  setTimeout(requestData, 60000);
}

var requestData = function() {
  $.getJSON( GITHUB_URL, onFetchedData);
}

requestData();

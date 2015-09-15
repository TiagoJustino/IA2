var current = null;
var newData = false;

var background = new Path.Rectangle(view.bounds);
var photon = new Raster('img/photon.png');
var nyan = new Raster('img/nyan.png');
var middleX = view.size.width / 2;
var middleY = view.size.height / 2;

photon.position = new Point(-100, middleY);
nyan.position = new Point(-100, middleY);

var active = photon;

var switchActive = function() {
  if(active == photon) {
    nyan.position.x = photon.position.x;
    photon.position.x = -100;
    active = nyan;
  } else {
    photon.position.x = nyan.position.x;
    nyan.position.x = -100;
    active = photon;
  }
}

var onFrame = function(event) {
  if(!current || !newData) {
    return;
  }

  if(current.orientation === 'Flat') {
    active.position.x = middleX;
    active.position.y = middleY;
  } else if(current.orientation === 'Landscape Left') {
    active.position.x = middleX + 150;
    active.position.y = middleY;
  } else if(current.orientation === 'Landscape Right') {
    active.position.x = middleX - 150;
    active.position.y = middleY;
  } else if(current.orientation === 'Portrait Down') {
    active.position.x = middleX;
    active.position.y = middleY + 150;
  } else if(current.orientation === 'Portrait Up') {
    active.position.x = middleX;
    active.position.y = middleY - 150;
  }

  colorVal = current.light / 4000;
  background.fillColor = new Color(colorVal, colorVal, colorVal);

  if(current.tap > 0 && newData) {
    switchActive();
  }
  newData = false;
};

var onFetchedData = function( data ) {
  values = data.split(':');
  current = {
    x: parseInt(values[0]),
    y: parseInt(values[1]),
    z: parseInt(values[2]),
    light: parseInt(values[3]),
    orientation: values[4],
    tap: parseInt(values[5])
  };
  newData = true;
}

var socket = io();
socket.on('to browser', onFetchedData);

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

var setAvatar = function(avatar) {
  if(avatar == 'nyan') {
    nyan.position.x = active.position.x;
    photon.position.x = -100;
    active = nyan;
  } else {
    photon.position.x = active.position.x;
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

  if(newData) {
    if(current.nyan > 0) {
      setAvatar('nyan');
    } else {
      setAvatar('photon');
    }
  }
  newData = false;
};

var onFetchedData = function( data ) {
  console.log('fetched', data);
  values = data.split(':');
  current = {
    x: parseInt(values[0].trim()),
    y: parseInt(values[1].trim()),
    z: parseInt(values[2].trim()),
    light: parseInt(values[3].trim()),
    orientation: values[4].trim(),
    nyan: parseInt(values[5].trim()),
    xangle: parseInt(values[6].trim()),
    yangle: parseInt(values[7].trim())
  };
  $('#xangle').text(current.xangle);
  $('#yangle').text(current.yangle);
  newData = true;
}

var onFetchedDataFromCloud = function( data ) {
  console.log('data from cloud');
  onFetchedData(JSON.parse(data.data).data);
}

var socket = io();
var url = "https://api.spark.io/v1/devices/" + $('#deviceid').val() + "/events/?access_token=" + $('#token').val();
var eventSource = new EventSource(url);
eventSource.addEventListener('accelData', onFetchedDataFromCloud);

var onSourceRadioChange = function() {
  source = this.value;
  if(source === 'serial') { 
    socket.on('to browser', onFetchedData);
    if(eventSource) {
      eventSource.removeEventListener('accelData', onFetchedDataFromCloud);
    }
  } else if (source === 'cloud') {
    socket.removeListener('to browser', onFetchedData);
    var token = $('#token').val();
    var deviceid = $('#deviceid').val();
    var url = "https://api.spark.io/v1/devices/" + deviceid + "/events/?access_token=" + token;
    eventSource = new EventSource(url);
    eventSource.addEventListener('accelData', onFetchedDataFromCloud);
  }
};

var onEventButtonClick = function() {
  var token = $('#token').val();
  var deviceid = $('#deviceid').val();
  var url = 'https://api.spark.io/v1/devices/events';
  $.post(url, {
    "name": "cloudevent",
    "data": $('#eventValue').val(),
    "ttl": 60,
    "private": true,
    "access_token": token
  });
};

var mode = 'orientation';
var onModeRadioChange = function() {
  mode = this.value;
};

var onModeButtonClick = function() {
  var token = $('#token').val();
  var deviceid = $('#deviceid').val();
  var url = 'https://api.spark.io/v1/devices/' + deviceid + '/setmode/?access_token=' + token;
  console.log(url);
  $.post(url, { "arg" : mode });
};

$(document).ready(function(){
  $('input[name=source]:radio').change(onSourceRadioChange);
  $('#eventButton').click(onEventButtonClick);
  $('input[name=mode]:radio').change(onModeRadioChange);
  $('#modeButton').click(onModeButtonClick);
});

var receivedEvents = {};
var usersData = [];
var eventsData = [];
var collectedData = [];
var accumulatedData = {};
var now;
var startTime;
var color = ['red', 'blue', 'brown', 'purple'];
var offset = 40;
var maxTime = 160;
var source = 'serial';

// modified from http://stackoverflow.com/questions/1584370/how-to-merge-two-arrays-in-javascript-and-de-duplicate-items
var arrayUnique = function (array) {
  var i;
  var j;
  var a = array.concat();
  for (i=0; i<a.length; ++i) {
    for (j=i+1; j<a.length; ++j) {
      if (a[i].id == a[j].id) {
        a.splice(j--, 1);
      }
    }
  }
  return a;
};

var formatString = function() {
  var args = arguments;
  var base = args[0];
  return base.replace(/{(\d+)}/g, function(match, number) { 
    number = parseInt(number);
    return typeof args[number + 1] != 'undefined'
      ? args[number + 1]
      : match
      ;
  });
};

var populateUsersList = function(data) {
  var compiledObj = {};
  var compiledData = [];
  for(var i = 0; i < data.length; i++) {
    var login = data[i].actor.login;
    var type = data[i].type.substr(0, data[i].type.indexOf('Event'))
    if(compiledObj[login]) {
      compiledObj[login].n += 1;
      compiledObj[login].lastEventType = type;
    } else {
      compiledObj[login] = {
        n: 1,
        lastEventType: type,
        login: login,
        avatar: data[i].actor.avatar_url
      };
    }
  }
  for(var o in compiledObj) {
    compiledData.push(compiledObj[o]);
  }
  usersData = compiledData.sort(function(a, b) {
    return a.n - b.n;
  });
  $('#userslist').empty();
  for(var i = 1; i <= 5; i++) {
    var user = usersData[usersData.length - i];
    if(user) {
      var str = '<li><img style="max-height: 100px; max-width: 100px" src="{0}"> {1} has {2} events, with the last being a {3}.</li>';
      var formatted = formatString(str, user.avatar, user.login, user.n, user.lastEventType)
      $('#userslist').append(formatted);
    }
  }
}

var populateEventsList = function(data) {
  var compiledObj = {};
  var compiledData = [];
  for(var i = 0; i < data.length; i++) {
    var type = data[i].type.substr(0, data[i].type.indexOf('Event'));
    if(compiledObj[type]) {
      compiledObj[type].n += 1;
    } else {
      compiledObj[type] = {type: type, n: 1};
    }
  }
  for(var o in compiledObj) {
    compiledData.push(compiledObj[o]);
  }
  eventsData = compiledData.sort(function(a, b) {
    return a.n - b.n;
  });
  $('#eventslist').empty();
  for(var i = 1; i <= eventsData.length; i++) {
    var event = eventsData[eventsData.length - i];
    if(event) {
      var str = '<li>{0} -> {1}</li>';
      var formatted = formatString(str, event.type, event.n);
      $('#eventslist').append(formatted);
    }
  }
}

var updateAccumulatedData = function() {
  for(i = 0; i < usersData.length; i++) {
    if(!accumulatedData[usersData[i].login]) {
      accumulatedData[usersData[i].login] = [];
    }
    accumulatedData[usersData[i].login].push({
      time: now,
      value: usersData[i].n
    })
  }

  for(i = 0; i < eventsData.length; i++) {
    if(!accumulatedData[eventsData[i].type]) {
      accumulatedData[eventsData[i].type] = [];
    }
    accumulatedData[eventsData[i].type].push({
      time: now,
      value: eventsData[i].n
    })
  }
}

var mapPoint = function(time, value) {
  var x = (time - startTime) * secondLength + offset;
  var y = view.size.height - value - offset;
  if (x > view.size.width - 7) {
    x = view.size.width - 7;
  }
  if (y < 7) {
    y = 7;
  }
  return new Point(x, y);
}

var drawPoint = function(point, color) {
  var shape = new Path.Circle(point, 5); 
  shape.strokeColor = color;
  shape.fillColor = color;
}

var path = [];
labelsStr = ['x', 'y', 'z', 'light'];
labels = [];
var plotData = function(x, y, index) {
  var point = mapPoint(x, y);
  if(!path[index]) {
    path[index] = new Path();
    path[index].strokeColor = color[index];
    path[index].strokeWidth = 3;
    path[index].segments = [];
  }
  if(labels[index]) {
    labels[index].remove();
  }
  labels[index] = new PointText({
    point: point + [10, (6 * i) - 9],
    justification: 'left',
    fontSize: 15, 
    fillColor: color[index]
  }); 
  labels[index].content = labelsStr[index];
  drawPoint(point, color[index]);
  path[index].add(point);
}

// amount of pixels per second.
var secondLength = 10;
var drawAxis = function() {
  var lines = [];
  var xstep = 20;
  var ystep = 10;
  // draw x axis
  lines.push({start: new Point(0, view.size.height - offset), end: new Point(view.size.width, view.size.height - offset)});
  // draw y axis
  lines.push({start: new Point(offset, 0), end: new Point(offset, view.size.height)});

  // draw x ticks
  for (var i = xstep; i < view.size.height - offset; i += xstep) {
    lines.push({start: new Point(offset - 3, i), end: new Point(offset + 3, i)});
    if (i % (3 * xstep) === 0) {
      var label = new PointText({
        point: new Point(offset - 20, i - 36),
        justification: 'center',
        fontSize: 15, 
        fillColor: 'black'
      }); 
      label.content = (view.size.height - i) * 10;
    }
  }

  // draw y ticks
  for (var i = ystep; i < (view.size.width - offset) / secondLength; i += ystep) {
    lines.push({start: new Point(i * secondLength + offset, view.size.height - offset - 3), end: new Point(i * secondLength + offset, view.size.height - offset + 3)});
    if (i % (3 * ystep) === 0) {
      var label = new PointText({
        point: new Point(i * secondLength + offset, view.size.height - offset + 16),
        justification: 'center',
        fontSize: 15, 
        fillColor: 'black'
      }); 
      label.content = Math.floor(i);
    }
  }

  for (var i = 0; i < lines.length; i++) {
    var linePath = new Path();
    linePath.strokeWidth = 2;
    linePath.strokeColor = 'black';
    linePath.moveTo(lines[i].start);
    linePath.lineTo(lines[i].end);
  }
}

var updateGraph = function() {
  path = [];
  startTime = getSeconds();
  project.activeLayer.removeChildren();
  var background = new Path.Rectangle(view.bounds);
  background.fillColor = 'lightgrey';
  drawAxis();
}

var onFetchedData = function( data ) {
  time = getSeconds();
  if(time - startTime > maxTime) {
    updateGraph();
  }
  values = data.split(':');
  for(i = 0; i < 4; i++) {
    plotData(time, Math.floor(parseInt(values[i])/10), i);
  }
  view.update(true);
}

var onFetchedDataFromCloud = function( data ) {
  onFetchedData(JSON.parse(data.data).data);
}

var getSeconds = function() {
  return Math.floor(new Date().getTime() / 1000);
}

updateGraph();
var socket = io();
socket.on('to browser', onFetchedData);
var eventSource = null;

$(document).ready(function(){
  $('#eventButton').click(function() {
    var token = $('#token').val();
    var deviceid = $('#deviceid').val();
    var url = 'https://api.spark.io/v1/devices/' + deviceid + '/cloudevent/?access_token=' + token;
    console.log(url);
    $.post(url, {"args": "1"});
  });
  $('input:radio').change( function(){
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
  });
});

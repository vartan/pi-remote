var express = require('express');
var app = express();
var sys = require('sys')
var exec = require('child_process').exec;


var devices = {};
var getCommandsForDevice = function(deviceName) {
  return function(error, stdout, stderr) {
    var lines = stderr.split("\n");
    for(var lineIndex in lines) {
      var line = lines[lineIndex];
      var parts = line.split(" ");
      if(parts.length>2) {
        var keyName = parts[2];
        devices[deviceName].push(keyName);
        console.log(deviceName + " found key: "+keyName);
      }
    }
  }
};
var getDevice = function (error, stdout, stderr) {
  if(error) {
    console.log("irsend not available.");
    return;
  }
  var lines = stderr.split("\n");
  for(var lineIndex in lines) {
    var line = lines[lineIndex];
    var parts = line.split(" ");
    if(parts.length>1) {
      var deviceName = parts[1];
      console.log("device found: "+deviceName.trim());
      devices[deviceName] = [];
      exec("irsend list \""+deviceName+"\" \"\"", getCommandsForDevice(deviceName));

    }
  }          
};
exec("irsend list \"\" \"\"", getDevice);
app.use(express.static(__dirname + '/html')); //where /html is a subfolder of your app 
app.get('/send/:device/:key', function(req, res) {
  var deviceName = req.param("device");
  var key = "KEY_"+req.param("key").toUpperCase();
  var keyNumber = ~~key;
  if(!devices.hasOwnProperty(deviceName)) {
    res.send("invalid device");
    return;
  }
  var device = devices[deviceName];
  var inArray = false;
  for(var i = 0; i < device.length; i++) {
    if(device[i] == key) {
      inArray = true; 
      break;
    }
  }
  if(!inArray) {
    res.send("invalid key number: "+key);
    return;
  }
  
  var command = "irsend SEND_ONCE "+deviceName+" "+key;
  exec(command, function(a,b,c){});
  res.send("valid");
});
app.listen('80');

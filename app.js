/**
 * app.js
 * 
 * IR Remote Web Service
 * 
 * @author Michael Vartan
 * @version 1.0.0 
 */

var express = require('express');
var app = express();
var sys = require('sys')
var exec = require('child_process').exec;

/**
 * Dictionary of devices and their buttons
 * @type {Object}
 */
var devices = {};
/**
 * Generates function to get devices' buttons from irsend command
 * @param  {String} deviceName name of device
 * @return {Function}            exec callback
 */ 
var getCommandsForDevice = function(deviceName) {
  /**
   * Get Device's Button from irsend command
   * @param  {String} error  Error from running command
   * @param  {String} stdout std out
   * @param  {String} stderr std err
   * @return {None}        
   */
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
/**
 * Get Device from irsend command
 * @param  {String} error  Error from running command
 * @param  {String} stdout std out
 * @param  {String} stderr std err
 * @return {None}        
 */
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
// Get all device information
exec("irsend list \"\" \"\"", getDevice);

// Define static HTML files
app.use(express.static(__dirname + '/html'));



// define GET request for /send/deviceName/buttonName
app.get('/send/:device/:key', function(req, res) {

  var deviceName = req.param("device");
  var key = req.param("key").toUpperCase();

  // Make sure that the user has requested a valid device 
  if(!devices.hasOwnProperty(deviceName)) {
    res.send("invalid device");
    return;
  }

  // Make sure that the user has requested a valid key/button
  var device = devices[deviceName];
  var deviceKeyFound = false;
  for(var i = 0; i < device.length; i++) {
    if(device[i] == key) {
      deviceKeyFound = true; 
      break;
    }
  }
  if(!deviceKeyFound) {
    res.send("invalid key number: "+key);
    return;
  }

  // send command to irsend
  var command = "irsend SEND_ONCE "+deviceName+" "+key;
  exec(command, function(error, stdout, stderr){
    if(error)
      res.send("Error sending command");
    else   
      res.send("Successfully sent command");
  });


}); // end define GET request for /send/deviceName/buttonName

// Listen on port 80
app.listen('80');

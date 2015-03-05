
/* Private */
 
// After render or update determine what process to call next based on real time passed
var queueNextAction = function() {
  var framesSkipped = Math.floor((currentTime - nextFrame) / mSecFrame) || 0;
  
  // 1. if we skipped to many frames, force a render
  if(maxSkippedFrames >= framesSkipped) {
    setImmediate(this.processFrame.call(this, framesSkipped));
    return; // exit
  }
  
  // 2. if we passed the next tick already, call processTick on that one
  if(nextTick <= currentTime) {
    var that = this;
    setImmediate(function() {
      call.processTick(that);
    });
    return; // exit
  }
  
  // 3. if we passed a frame, render the frame
  if(nextFrame <= currentTime) {
    var that = this;
    setImmediate(function() {
      processFrame.call(that, framesSkipped);
    });
    return; // exit
  }
  
  // 4. we have real time left, timeout till next tick or frame
  var currentTime = new Date().getTime();
  if(nextTick <= nextFrame) { // tick is next
    var timeLeft = this.nextTick - currentTime;
    var that = this;
    setTimeout(function() {
      processTick.call(that);
    }, timeLeft);
    return; // exit
  } else { // frame is next
    var timeLeft = this.nextFrame - currentTime;
    var that = this;
    setTimeout(function() {
      processFrame.call(that, framesSkipped);
    }, timeLeft);
    return; // exit
  }
}

var processTick = function() {
  var currentTime = new Date().getTime();
  this.nextTick += this.mSecTick; // define next tick
  this.update(this.mSecTick, currentTime); // call the actual update function
  queueNextAction.call(this); // queue next action
}

var processFrame = function(framesSkipped) {
  this.nextFrame += framesSkipped * this.mSecFrame; // in case frames have been skipped, set nextFrame accordingly
  this.lastFrame = this.nextFrame;
  this.nextFrame += this.mSecFrame; // Increment nextFrame
  
  calculateFps.call(this);
  
  var currentTime = new Date().getTime();
  var dt = currentTime - (this.nextTick - this.mSecTick); // Get the time between now and last update()
  
  this.render(dt); // call the actual render function
  queueNextAction.call(this); // queue next action
}

var calculateFps = function() {
  var currentTime = new Date().getTime();
  this.fps = 1 / (currentTime - this.lastFrame);
}

/* Public */

module.exports = Gameheart;
function Gameheart(mSecTick, maxFps, maxSkippedFrames, update, render) {
  this.mSecTick = mSecFrame; // Milliseconds inbetween update ticks
  this.maxFps = maxFps; // Cap on render actions per second (usually 60)
  this.mSecFrame = Math.floor(1000 / maxFps); // Milliseconds inbetween frames (when non are skipped) - calculated by maxFps
  this.maxSkippedFrames = maxSkippedFrames; // Max render frames to be skipped before we draw another one in favor of "catching up" on ticks
  
  this.update = update; // Update function (takes dt and t)
  this.render = render; // Render function (takes dt)
  
  this.nextTick; // Timestamp of the next tick to process
  this.nextFrame; // Timestamp of the next render frame to process
  this.lastFrame; // Timestamp for last rendered frame
  this.fps; // Calculated fps for actual rendering
}

Gameheart.prototype.start = function() {
  var currentTime = new Date().getTime();
  this.nextTick = currentTime + mSecTick;
  this.update();
  
  currentTime = new Date().getTime();
  this.nextFrame = currentTime + mSecFrame;
  this.render();
  
  queueNextAction.call(this);
}

// Very simple momentary fps counter
// For the future, consider: http://stackoverflow.com/questions/87304/calculating-frames-per-second-in-a-game
Gameheart.prototype.getFps = function() {
  return this.fps;
}


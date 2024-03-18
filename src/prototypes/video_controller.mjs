
class VideoController {
  constructor(props) {
    this.playing = false;
    this.totalLengthMS = 10000;
    this.progress = 0;
    this.mouse = {
      down: false,
      downX: undefined,
      currentX: undefined,
    }
    this.playStart = undefined;
    this.listeners = [];
    window.addEventListener("mousemove", (e) => {this.onMouseMove(e.clientX)});
    window.addEventListener("mouseup", (e) => {this.onMouseUp()});
  }
  addListener(listener) {
    this.listeners.push(listener);
  }
  notifyListeners() {
    for(let listener of this.listeners) {
      listener(this.getViewState());
    }
  }
  getViewState() {
    return {
      playing: this.playing,
      progress: this.computeProgress(),
      animationDuration: this.totalLengthMS,
      onMouseDown: (x, target) => this.onMouseDown(x, target),
      onPlay: () => this.play(),
      onPause: () => this.pause(),
    }
  }
  computeProgress() {
    let output = this.progress;
    if(this.mouse.down) {
      let rect = this.mouse.target.getBoundingClientRect();
      output += (this.mouse.currentX - this.mouse.downX) / (rect.right - rect.left);
    }
    if(this.playing) {
      output += (Date.now() - this.playStart) / this.totalLengthMS;
    }
    if(output > 1) return 1;
    if(output < 0) return 0;
    return output;
  }
  onMouseDown(x, target) {
    this.pause();
    let rect = target.getBoundingClientRect();
    this.progress = (x - rect.left) / (rect.right - rect.left);
    this.mouse.down = true;
    this.mouse.downX = x;
    this.mouse.currentX = x;
    this.mouse.target = target;
    this.notifyListeners();
  }
  onMouseUp() {
    if(!this.mouse.down) return;
    this.progress = this.computeProgress();
    this.mouse.down = false;
    this.notifyListeners();
  }
  onMouseMove(x) {
    if(!this.mouse.down) return;
    this.mouse.currentX = x;
    this.notifyListeners();
  }
  play() {
    if(this.playing) return;
    if(this.mouse.down) return;
    this.playing = true;
    this.playStart = Date.now();
    this.notifyListeners();
  }
  pause() {
    if(!this.playing) return;
    this.progress = this.computeProgress();
    this.playing = false;
    this.notifyListeners();
  }
}

export {VideoController}


class SlideshowController {
  /**
   * [lengths] is a list corresponding to the length of each segment in
   * milliseconds.
   */
  constructor(lengths) {
    this.playing = false;
    this.lengths = lengths;
    this.totalLengthMS = 0;
    for(let duration of lengths) this.totalLengthMS += duration;
    this.length_sums = [lengths[0]];
    for(let i = 1; i < lengths.length; i++) {
      this.length_sums.push(lengths[i] + this.length_sums[i - 1]);
    }
    this.progress = 0;
    this.mouse = {
      down: false,
      downX: undefined,
      currentX: undefined,
    }
    this.playStart = undefined;
    this.listeners = [];
    this.nextSlideThread = undefined;
    window.addEventListener("mousemove", (e) => {this.onMouseMove(e.clientX)});
    window.addEventListener("mouseup", (e) => {this.onMouseUp()});
  }
  addListener(listener) {
    this.listeners.push(listener);
  }
  notifyListeners() {
    for(let listener of this.listeners) {
      listener();
    }
  }
  hasNextSlide(progress) {
    if(this.length_sums.length < 2) return false;
    let lastSegmentStart = this.length_sums[this.length_sums.length - 2];
    return progress * this.totalLengthMS < lastSegmentStart;
  }
  timeTilNextSlide(progress) {
    let timeStamp = progress * this.totalLengthMS;
    for(let times of this.length_sums) {
      let proposed_output = times - timeStamp;
      if(proposed_output > 0) return proposed_output;
    }
    throw new Error("No more following slides");
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
    this.setNextSlideThread();
  }
  pause() {
    if(!this.playing) return;
    this.progress = this.computeProgress();
    this.playing = false;
    this.notifyListeners();
  }
  setNextSlideThread() {
    this.notifyListeners();
    let progress = this.computeProgress()
    if(this.hasNextSlide(progress)) {
      this.nextSlideThread = setTimeout(() => this.setNextSlideThread(), 
        this.timeTilNextSlide(progress) + 5);
    }
  }
}

export {SlideshowController}

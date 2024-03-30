
import {OptionalPair, SquareType} from "./view_enums.mjs";
import {ChessMap, ChessBitMap} from "../data/maps.mjs";
import {Piece} from "../data/enums.mjs";

class ReplayController {
  constructor(gamedata) {
    this.gamedata = gamedata;
    this.lengths = [];
    let stateHead = gamedata.history;
    while(!stateHead.tail.isNil()) {
      this.lengths.push(stateHead.head.currentTime - stateHead.tail.head.currentTime);
      stateHead = stateHead.tail;
    }
    this.lengths.reverse();
    this.lengths.push(100);
    this.startTime = stateHead.head.currentTime;
    
    this.playing = false; //whether the video is currently playing
    this.progress = 0; //the proportion of the video that has finished
                       //playing, ignoring playtime and slider
    this.totalLength = gamedata.history.head.currentTime - this.startTime + 100;
    this.mouse = {
      down: false,
      button: 0,
      downX: 0,
      downY: 0,
      currentX: 0,
      currentY: 0,
      r: -1,
      c: -1,
      target: undefined,
      board: false, //true if the mousedown event occurred on the board,
                    //false if it occurred on the progress bar
    }
    this.boardview = {
      select: OptionalPair.NONE,
      userArrows: [],
      highlights: ChessBitMap.empty(),
    }
    this.listeners = [];
    window.addEventListener("mouseup", 
      (e) => this.onMouseUp(e.clientX, e.clientY));
    window.addEventListener("mousemove", 
      (e) => this.onMouseMove(e.clientX, e.clientY));
  }
  /**
   * [listener] is of type [function]; the function is called whenever something
   * updates.
   */
  addListener(listener) {
    this.listeners.push(listener);
  }
  /**
   * Helper function for notifying listeners of a change
   */
  notifyListeners() {
    for(let listener of this.listeners) {
      listener();
    }
  }

  /**
   * Helper function for computing play progress, taking playing time and
   * play bar scrolling into account
   */
  computeProgress() {
    let output = this.progress;
    let now = Date.now();
    if(this.playing) {
      output += (now - this.playStart) / this.totalLength;
    }
    if(this.mouse.down && !this.mouse.board) {
      let rect = this.mouse.target.getBoundingClientRect();
      output += (this.mouse.currentX - this.mouse.downX) / 
        (rect.right - rect.left);
    }
    if(output > 1) return 1;
    if(output < 0) return 0;
    return output;
  }

  /**
   * Returns the state of the view to be displayed, according to the
   * specification for ReplayDesktop
   */
  getViewState() {
    let squareType = ChessMap.fromInitializer((r, c) => {
      if(this.boardview.highlights.get(r, c)) return SquareType.HIGHLIGHT;
      if((r + c) & 1) return SquareType.ODD;
      return SquareType.EVEN;
    });
    if(this.boardview.select.isPresent()) {
      let [r, c] = this.boardview.select.get();
      squareType.set(r, c, SquareType.SELECT);
    }
    let translate = ChessMap.fromDefault([0, 0]);
    let ms = this.mouse;
    if(ms.down && ms.board && ms.button === 0 
      && this.boardview.select.isPresent()) {
      translate.set(ms.r, ms.c, 
        [ms.currentX - ms.downX, ms.currentY - ms.downY]);
    }
    let progress = this.computeProgress();
    return {
      userArrows: this.boardview.userArrows,
      squareType: squareType,
      translate: translate,
      progress: this.computeProgress(),
      playing: this.playing,
      now: this.startTime + progress * this.totalLength,
      duration: this.totalLength,
      onMouseDownBoard: (r, c, x, y, b) => this.onMouseDownBoard(r, c, x, y, b),
      onMouseUpBoard: (r, c, x, y, b) => this.onMouseUpBoard(r, c, x, y),
      onMouseDownBar: (x, target) => this.onMouseDownBar(x, target),
      onNextFrame: () => this.nextFrame(),
      onPrevFrame: () => this.prevFrame(),
      onPlay: () => this.play(),
      onPause: () => this.pause(),
    }
  }
  /**
   * Helper function for getting the current state of the board, according to
   * this.progress
   */
  getBoard() {
    let now = this.startTime + this.computeProgress() * this.totalLength;
    let statePointer = this.gamedata.history;
    while(!statePointer.tail.isNil() && statePointer.head.currentTime > now) {
      statePointer = statePointer.tail;
    }
    return statePointer.head.boardHistory.head;
  }
  /**
   * Function to be called when mouse down occurs on the board
   */
  onMouseDownBoard(r, c, x, y, b) {
    this.mouse.down = true;
    this.mouse.button = b;
    this.mouse.downX = x;
    this.mouse.downY = y;
    this.mouse.currentX = x;
    this.mouse.currentY = y;
    this.mouse.r = r;
    this.mouse.c = c;
    this.mouse.board = true;
    if(b === 0) {
      this.boardview.userArrows = [];
      this.boardview.highlights = ChessBitMap.empty();
      if(this.getBoard().pieceAt(r, c) !== Piece.NULL) {
        this.boardview.select = OptionalPair.create(r, c);
      }
    }
    if(b === 2) {
      this.boardview.select = OptionalPair.NONE;
    }
    this.notifyListeners();
  }
  toggleArrow(iRow, iCol, fRow, fCol) {
    let list = this.boardview.userArrows;
    let spliced = false;
    for(let i = list.length - 1; i >= 0; i--) {
      let {ir, ic, fr, fc} = list[i];
      if(ir === iRow && ic === iCol && fr === fRow && fc === fCol) {
        list.splice(i, 1);
        spliced = true;
      }
    }
    if(!spliced) {
      list.push({iRow, iCol, fRow, fCol});
    }
  }
  onMouseDownBar(x, target) {
    this.pause();
    let rect = target.getBoundingClientRect();
    this.progress = (x - rect.left) / (rect.right - rect.left);
    this.mouse.down = true;
    this.mouse.downX = x;
    this.mouse.currentX = x;
    this.mouse.target = target;
    this.mouse.board = false;
    this.notifyListeners();
  }
  onMouseUpBoard(r, c, x, y) {
    if(!this.mouse.down || !this.mouse.board) return;
    this.mouse.down = false;
    if(this.mouse.button === 2) {
      if(this.mouse.r === r && this.mouse.c === c) {
        this.boardview.highlights.toggle(r, c);
      } else {
        this.toggleArrow(this.mouse.r, this.mouse.c, r, c);
      }
    }
    this.notifyListeners();
  }
  onMouseUp(x, y) {
    if(!this.mouse.down) return;
    if(this.mouse.board) return;
    this.mouse.currentX = x;
    this.mouse.currentY = y;
    this.progress = this.computeProgress();
    this.mouse.down = false;
    this.notifyListeners();
  }
  onMouseMove(x, y) {
    if(!this.mouse.down) return;
    this.mouse.currentX = x;
    this.mouse.currentY = y;
    this.notifyListeners();
  }
  play() {
    if(this.playing) return;
    if(this.mouse.down && !this.mouse.board) return;
    if(this.computeProgress() === 1) return;
    this.playing = true;
    this.playStart = Date.now();
    this.setNextSlideThread();
  }
  pause() {
    if(!this.playing) return;
    if(this.nextSlideThread) clearInterval(this.nextSlideThread);
    this.progress = this.computeProgress();
    this.playing = false;
    this.notifyListeners();
  }
  nextFrame() {
    this.pause();
    this.progress += 100 / this.totalLength;
    this.notifyListeners();
  }
  prevFrame() {
    this.pause();
    this.progress -= 100 / this.totalLength;
    this.notifyListeners();
  }
  setNextSlideThread() {
    this.notifyListeners();
    let progress = this.computeProgress();
    if(this.hasNextSlide(progress)) {
      this.nextSlideThread = setTimeout(() => this.setNextSlideThread(),
        this.timeTilNextSlide(progress) + 5);
    } else {
      this.nextSlideThread = setTimeout(() => this.pause(),
        this.totalLength * (1 - progress));
    }
  }
  hasNextSlide(progress) {
    let lastLength = this.lengths[this.lengths.length - 1];
    return progress * this.totalLength < this.totalLength - lastLength;
  }
  timeTilNextSlide(progress) {
    if(!this.hasNextSlide(progress)) {
      throw new Error("No next slide");
    }
    let time = progress * this.totalLength;
    for(let length of this.lengths) {
      time -= length;
      if(time < 0) return -time;
    }
  }
}

export {ReplayController}

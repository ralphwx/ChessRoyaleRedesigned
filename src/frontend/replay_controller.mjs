
class ReplayController {
  constructor(gamedata) {
    this.lengths = [];
    let stateHead = gamedata.history;
    while(!stateHead.tail.isNil()) {
      this.lengths.push(stateHead.head.currentTime - stateHead.tail.head.currentTime);
    }
    let startTime = stateHead.currentTime;
    
    this.playing = false; //whether the video is currently playing
    this.progress = 0; //the proportion of the video that has finished
                       //playing, ignoring playtime and slider
    this.totalLength = gamedata.history.head.currentTime - startTime;
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
  }
  /**
   * [listener] is of type [function]; the function is called whenever something
   * updates.
   */
  addListener(listener) {
    this.listeners.add(listener);
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
   * Returns the state of the view to be displayed, according to the
   * specification for ReplayDesktop
   */
  getViewState() {
    return {
      
    }
  }
  /**
   * Helper function for getting the current state of the board, according to
   * this.progress
   */
  getBoard() {
    //TODO
    return undefined;
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
    this.board = true;
    if(b === 0) {
      this.boardview.userArrows = [];
      this.boardview.highlights = ChessBitMap.empty();
      if(this.getBoard().pieceAt(r, c) !== Piece.NULL) {
        this.boardview.select = OptionalPair.create(r, c);
      }
    }
    if(b === 2) {
      this.viewState.select = OptionalPair.NONE;
    }
    this.notifyListeners();
  }
  onMouseDownBar() {

  }
  onMouseUp() {

  }
  onMouseMove() {

  }
  play() {

  }
  pause() {

  }
  setNextSlideThread() {

  }
}

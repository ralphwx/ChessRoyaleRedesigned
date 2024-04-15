
import {MaxHeap} from "../data/priority_queue.mjs";
import {Mutex} from "async-mutex";

class Scheduler {
  /**
   * Creates a new timer that executes function [func] at interval [interva],
   * and reacts to events in [reaction] time. [func] may return a list of 
   * timestamps to add to the schedule. Also, require that interval > reaction.
   *
   *
   * Implementation note, class invariant: while the scheduler is running,
   * this.schedule contains at least one item, this.thread is a timeout thread 
   * that executes at the most proximal time dictated by [schedule].
   */
  constructor(func, interval, reaction) {
    this.schedule = new MaxHeap((a, b) => {return a < b});
    this.mutex = new Mutex();
    this.func = func;
    this.thread = undefined;
    this.interval = interval;
    this.reaction = reaction;
  }
  setNextThread(now) {
    if(this.schedule.size === 0) {
      this.schedule.push(now + this.interval);
    }
    let nextTime = this.schedule.peek();
    while(this.schedule.size > 0 
     && this.schedule.peek() - now < this.reaction) this.schedule.pop();
    if(nextTime - now < this.reaction) {
      nextTime = now + this.reaction;
      this.schedule.push(nextTime);
    }
    if(nextTime - now > this.interval) {
      nextTime = now + this.interval;
      this.schedule.push(nextTime);
    }
    this.thread = setTimeout(() => {this.execute()}, nextTime - now);
  }
  /**
   * Executes the target function immediately. This function should never be
   * called by the main thread, only by the thread created in 
   * this.setNextThread().
   */
  execute() {
    this.mutex.runExclusive(() => {
      if(this.thread) clearTimeout(this.thread);
      this.schedule.pop();
      let newDates = this.func();
      if(newDates) {
        for(let time of newDates) this.schedule.push(time);
      }
      this.setNextThread(Date.now());
    });
  }
  /**
   * Tells the scheduler to react.
   */
  react() {
    this.mutex.runExclusive(() => {
      if(this.thread) clearTimeout(this.thread);
      let now = Date.now();
      this.schedule.push(now + this.reaction);
      this.setNextThread(now);
    });
  }
  start() {
    this.mutex.runExclusive(() => {
      this.setNextThread(Date.now());
    });
  }
  stop() {
    this.mutex.runExclusive(() => {
      if(this.thread) clearTimeout(this.thread);
      this.thread = undefined;
    });
  }
}

export {Scheduler}

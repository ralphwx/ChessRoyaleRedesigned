
class MaxHeap {
  /**
   * Constructs a new MaxHeap that uses comparison function [greaterThan], which
   * takes two arguments and returns whether the first element is greater 
   * (higher priority) than the second one
   */
  constructor(greaterThan) {
    this.greaterThan = greaterThan;
    this.data = [undefined];
    this.size = 0;
  }
  push(element) {
    this.size += 1;
    if(this.data.length > this.size) {
      this.data[this.size] = element;
    } else {
      this.data.push(element);
    }
    this.bubbleUp(this.size);
  }
  pop() {
    let output = this.data[1];
    this.data[1] = this.data[this.size];
    this.size -= 1;
    this.bubbleDown(1);
    return output;
  }
  peek() {
    if(this.size === 0) throw new Error("Cannot peek into empty heap");
    return this.data[1];
  }
  replace(element) {
    let output = this.data[1];
    this.data[1] = element;
    this.bubbleDown(1);
    return output;
  }
  bubbleUp(index) {
    while(index !== 1) {
      let guardian = index >> 1;
      if(this.greaterThan(this.data[guardian], this.data[index])) {
        break;
      }
      let temp = this.data[guardian];
      this.data[guardian] = this.data[index];
      this.data[index] = temp;
      index = guardian;
    }
  }
  bubbleDown(index) {
    while(true) {
      let child1 = index << 1;
      let child2 = child1 | 1;
      if(child1 > this.size) break;
      if(child2 > this.size) {
        if(this.greaterThan(this.data[index], this.data[child1])) break;
        let temp = this.data[index];
        this.data[index] = this.data[child1];
        this.data[child1] = temp;
        break;
      }
      if(this.greaterThan(this.data[index], this.data[child1])
       && this.greaterThan(this.data[index], this.data[child2])) break;
      let swapchild = this.greaterThan(this.data[child1], this.data[child2])
       ? child1 : child2;
      let temp = this.data[index];
      this.data[index] = this.data[swapchild];
      this.data[swapchild] = temp;
      index = swapchild;
    }
  }
}

function test() {
  let heap = new MaxHeap((a, b) => {return a < b});
  for(let i = 0; i < 20; i++) {
    let element = Math.floor(Math.random() * 20);
    heap.push(element);
  }
  
  while(heap.size > 0) {
    heap.replace(40);
    console.log(heap.peek());
    heap.pop();
  }
}

export {MaxHeap}

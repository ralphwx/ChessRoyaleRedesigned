
/**
 * OCaml style lists, with "head" being the first element of the list,
 * and a "tail" being an HTList object representing the remainder of the list
 * HTList.NIL represents an empty list, and a list whose "tail" is NIL is a
 * list with one element.
 *
 * Client classes should not use the constructor. Instead use HTList.NIL to get
 * the empty list and HTList.cons() to construct nonempty lists.
 */
class HTList {
  static NIL = new HTList(undefined, undefined);
  static cons(data, tail) {
    return new HTList(data, tail);
  }
  constructor(data, next) {
    this.head = data;
    this.tail = next;
    if(next === undefined) this.length = 0;
    else this.length = next.length + 1;
  }
  isNil() {
    return this.tail === undefined;
  }
}

export {HTList}

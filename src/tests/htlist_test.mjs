import {test, printResults} from "./test_framework.mjs";
import {HTList} from "../data/htlist.mjs";

let t1 = () => {
  let l = HTList.NIL;
  return l.length === 0;
}

let t2 = () => {
  let l = HTList.NIL;
  l = HTList.cons(1, l);
  l = HTList.cons(2, l);
  l = HTList.cons(3, l);
  return !l.isNil() && l.head === 3 && l.length === 3;
}

let t3 = () => {
  let l = HTList.NIL;
  l = HTList.cons(1, l);
  l = HTList.cons(2, l);
  l = HTList.cons(3, l);
  l = l.tail;
  l = l.tail;
  return !l.isNil() && l.head === 1 && l.length === 1;
}

test("empty list", t1);
test("nonempty list", t2);
test("past elements preserved", t3);
printResults();

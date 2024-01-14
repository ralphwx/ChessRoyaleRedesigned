
let salt_chars = []
for(let c = 'a'.charCodeAt(0); c <= 'z'.charCodeAt(0); c += 1) {
  salt_chars.push(String.fromCharCode(c));
}
for(let c = 'A'.charCodeAt(0); c <= 'Z'.charCodeAt(0); c += 1) {
  salt_chars.push(String.fromCharCode(c));
}

let gr = 1.618033988

/**
 * Returns a random string of alphabetic characters of length [n]
 */
function makeSalt(n) {
  let output = []
  for(let i = 0; i < n; i++) {
    let j = Math.floor(Math.random() * salt_chars.length)
    output.push(salt_chars[j]);
  }
  return output.join("");
}

/**
 * Hashes [str] to an integer between 0 and 2^30
 */
function makeHash(str) {
  let output = 0;
  for(let i = 0; i < str.length; i++) {
    output = output * 31 + str.charCodeAt(i);
    output %= (1 << 30)
  }
  output *= gr;
  output -= Math.floor(output);
  output *= (1 << 30)
  return Math.floor(output);
}

export {makeSalt, makeHash};

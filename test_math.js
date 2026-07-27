import { multiply, add, inv, squeeze } from "mathjs";

const hessian = [[2, 0], [0, 2]];
const gk = [1, 2];

const hInv = inv(hessian);
console.log("hInv is Array?", Array.isArray(hInv));

const pkMat = multiply(multiply(hInv, -1), gk);
console.log("pkMat is Array?", Array.isArray(pkMat));

let pk = Array.isArray(pkMat) && Array.isArray(pkMat[0]) 
     ? squeeze(pkMat) 
     : pkMat;

console.log("pk:", pk);
console.log("pk is Array?", Array.isArray(pk));

if (pk && typeof pk === 'object' && pk.toArray) {
  pk = pk.toArray();
}
// wait we need to force array
pk = Array.isArray(pk) ? pk : (pk && pk.toArray ? pk.toArray() : Array.from(pk));

let alpha = 1.0;
const step = multiply(pk, alpha);
console.log("step:", step);
console.log("step is Array?", Array.isArray(step));

let xk = [0, 0];
const xNext = add(xk, step);
console.log("xNext:", xNext);
console.log("xNext is Array?", Array.isArray(xNext));

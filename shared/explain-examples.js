(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.CodeAliveExamples=factory();})(globalThis,()=>[
  {id:'discount',title:'01 · A simple discount',language:'JavaScript',description:'Start with parameters, a guard clause and a return value.',code:`function discountedPrice(price, percent) {
  if (price < 0 || percent < 0 || percent > 100) {
    throw new Error("Invalid discount");
  }
  const savings = price * (percent / 100);
  return price - savings;
}`},
  {id:'cart',title:'02 · Shopping cart total',language:'JavaScript',description:'Follow a loop that accumulates a total.',code:`function cartTotal(items) {
  let total = 0;
  for (const item of items) {
    total += item.price * item.quantity;
  }
  return total;
}`},
  {id:'search',title:'03 · Find a user',language:'JavaScript',description:'See how an early return leaves a loop.',code:`function findUser(users, wantedId) {
  for (let index = 0; index < users.length; index++) {
    if (users[index].id === wantedId) {
      return users[index];
    }
  }
  return null;
}`},
  {id:'filter',title:'04 · Filter and map',language:'JavaScript',description:'Choose a callback scope to inspect its body.',code:`function activeNames(users) {
  const active = users.filter(user => user.active);
  return active.map(user => user.name);
}`},
  {id:'recursive',title:'05 · Recursive countdown',language:'JavaScript',description:'Inspect a base case and a recursive call without running it.',code:`function countdown(number) {
  if (number <= 0) {
    return [];
  }
  return [number, ...countdown(number - 1)];
}`},
  {id:'request',title:'06 · An async request',language:'JavaScript',description:'Recognize calls, await and error handling.',code:`async function loadProfile(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Profile request failed");
  }
  return await response.json();
}`},
  {id:'greeting',title:'07 · Typed greeting',language:'TypeScript',description:'Read typed inputs and alternative return expressions.',code:`function greeting(name: string, excited: boolean = false): string {
  const message = "Hello, " + name;
  if (excited) {
    return message + "!";
  }
  return message + ".";
}`},
  {id:'union',title:'08 · A union result',language:'TypeScript',description:'Inspect a branch on a discriminated union.',code:`type Result = { ok: true; value: number } | { ok: false; error: string };
function describeResult(result: Result): string {
  if (result.ok) {
    return "Value: " + result.value;
  }
  return result.error;
}`},
  {id:'arrow',title:'09 · Arrow function',language:'TypeScript',description:'An expression body returns a value implicitly.',code:`const area = (width: number, height: number): number => width * height;`},
  {id:'inventory',title:'10 · Reserve inventory',language:'TypeScript',description:'Spot a property write after a guard clause.',code:`type Inventory = { stock: number };
function reserve(inventory: Inventory, quantity: number): boolean {
  if (quantity <= 0 || inventory.stock < quantity) {
    return false;
  }
  inventory.stock -= quantity;
  return true;
}`}
]);

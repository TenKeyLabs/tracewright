export function setupCounter(element: HTMLButtonElement) {
  // init count
  let count = 0;
  const setCount = (count: number) => {
    count = count;
    element.innerHTML = `count is ${count}`;
  };
  element.addEventListener("click", () => setCount(count + 1));
  setCount(0);
}

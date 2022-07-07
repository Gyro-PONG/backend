function Counter() {
  let count = 1;

  Counter.prototype.getCountNumber = () => {
    return count++;
  };
}

module.exports = Counter;

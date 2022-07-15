class Counter {
  constructor() {
    this.count = 1;
  }

  get getCountNumber() {
    return this.count++;
  }
}

module.exports = Counter;

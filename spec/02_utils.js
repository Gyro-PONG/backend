const { expect } = require('chai');
const Counter = require('../utils/counter');

describe('02_utils 기능 테스트', () => {
  describe('Counter의 기능을 확인합니다', () => {
    it('getCountNumber를 처음 실행한 경우 1을 얻어야 합니다', () => {
      const counter = new Counter();
      expect(counter.getCountNumber).to.eq(1);
    });

    it('getCountNumber를 두 번 실행한 경우 2를 얻어야 합니다', () => {
      const counter = new Counter();
      expect(counter.getCountNumber).to.eq(1);
      expect(counter.getCountNumber).to.eq(2);
    });
  });
});

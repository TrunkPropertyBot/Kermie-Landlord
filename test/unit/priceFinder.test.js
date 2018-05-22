const PriceFinder = require('../../src/priceFinder');

test('should get a valid response when we send an address /', async (done) => {
  let suggestion;
  try {
    suggestion = await PriceFinder.suggestProperty('6 rushall cres, fitzroy north');
    expect(suggestion.matches.length).toBe(1);
  } catch(e) {
    throw new Error(e);
  }
  done();
});
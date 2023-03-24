
const { BadRequestError } = require("../expressError");
const { sqlForPartialUpdate } = require("./sql");


describe("sqlForPartialUpdate", function () {
  test("works: 1 item", function () {
    const result = sqlForPartialUpdate(
        { firstName: "Anna" },
        { firstName: "Ava", age: 20 });
    expect(result).toEqual({
      setCols: '"Ava"=$1',
      values: ["Anna"],
    });
  });

  test("works: 2 items", function () {
    const result = sqlForPartialUpdate({ firstName: "Anna", age: 20 }, { firstName: "Ava" });
    expect(result).toEqual({
      setCols: '"Ava"=$1, "age"=$2',
      values: ["Anna", 20],
    });
  });

  test('throws error when submitted without data', function () {
    try {
        sqlForPartialUpdate({}, {firstName: "Ava", age: 20});
    } catch (err) {
        expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

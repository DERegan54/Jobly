const {sqlForPartialUpdate} = require('./sql');

describe("sqlForPartialupdate", function () {
    test('updates a user', function () {
        const dataToUpdate = {
            firstName: "Angie",
            lastName: "Smith"
        }
        const jsToSql = {
            firstName: "first_name",
            lastName: "last_name"
        }
        const { setCols, values } = sqlForPartialUpdate(dataToUpdate, jsToSql);
        expect(setCols).toEqual(`"${jsToSql.firstName}"=$1, "${jsToSql.lastName}"=$2`);
        expect(values).toEqual([dataToUpdate.firstName, dataToUpdate.lastName]);
    });

    test("Error with no data", function () {
        expect(() => { sqlForPartialUpdate({}, {}) }).toThrow("No data");
    });
});
const { BadRequestError } = require("../expressError");

// THIS NEEDS SOME GREAT DOCUMENTATION.

/** sqlForParialUpdate(dataToUpdate, jsToSql) function provides SQL query for updating specific parts of data.
 *  Input parameters: 
 *      - dataToUpdate is the object containing the fields that will become the setCols in the SQL query as {field1: value1, field2, value2, etc.}. Example input: {firstName: 'Aliya', age: 32}
 *      - jsToSql is object that will map the data fields to the column names that will then be used in the SQL query.  Example:  {firstName: "first_name", age: "age"}
 *  Returns JSON object containing SQL necessary to update the correct columns
 *      - So, dataToUpdate: {firstName: 'Aliya', age: 32} 
 *      - Becomes SQL query: { setCols: '"first_name"=$1, "age"=$2',
 *                             values: ['Aliya', 32] }                             
**/

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  let result = {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
  return result;
}

module.exports = { sqlForPartialUpdate };

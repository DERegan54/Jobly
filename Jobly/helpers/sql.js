const { BadRequestError } = require("../expressError");

// THIS NEEDS SOME GREAT DOCUMENTATION.
// Line 13: The parameter 'dataToUpdate' is an object containing the data to be updated.  
//        The parameter 'jsToSql' is an object containing the key/value pairs corresponding SQL columns and values to be updated
// Line 15: The variable keys takes the dataToUpdate object and extracts the keys into an array, which will be the columns
// Line 16: If the keys array has a length of 0 (meaning it is empty), returns BadRequestError.
// Lines 19 - 21: Else, the keys array is mapped into an object "cols", containing 'colName' (column name) and 'idx' (index in keys array).
// Lines 23 - 27: The function returns an object with keys being 'setCols' (columns to be updated) and 'values' (the values to go into those columns).
//         The 'setCols' keys use the .join() method to join the columns into a string that can be put into the SET portion of the SQL query.
//         The 'values' keys use the object.values() method to put all of the values from the dataToUpdate object into an array that can be used in the SQL query.

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  // keys = [firstName, age];
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };

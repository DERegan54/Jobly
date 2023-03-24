"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(
          `SELECT handle
           FROM companies
           WHERE handle = $1`,
        [handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
          `INSERT INTO companies
           (handle, name, description, num_employees, logo_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
        [
          handle,
          name,
          description,
          numEmployees,
          logoUrl,
        ],
    );
    const company = result.rows[0];

    return company;
  }

  /** Find all companies with optional filter capability.
   * 
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * To filter companies by name, minEmployees, and/or maxEmployees, add a parameter in the 
   *    query string in the form of an object called searchCriteria, where the keys are the 
   *    search terms, an the values are the search value.s 
   * */

  // line 77: Include the searchCritera object as a parameter
  // line 78: Define variable baseQuery as the initial query we will then add our search criteria to
  // line 85: Destructure the searchCriteria object to extract the search terms we will use in the query
  // line 86: Define variable whereClauses as an empty array that will store the search terms passed into the searchCriteria object
  // line 87: Define variable whereValues as an empty array that will store the values passed into the searchCriteria object 
  // line 89: If minEmployees is greater than maxEmployees
  // line 90: Throw an error
  // line 93: If minEmployees is included in the searchCriteria object
  // line 94: Push minEmployees to the whereValues array for use in final query
  // line 95: Push `num_employees >= $${whereValues.length}` into whereClauses array for use in final query
  // line 98: If maxEmployees is included in the searchCriteria object
  // line 99: Push maxEmployees to the whereValues array for use in final query
  // line 100: Push `num_employees <= $${whereValues.length}` into whereClauses array for use in final query
  // line 103: If name is included in the searchCriteria object 
  // line 104: Push name in to the whereValues array as `%${name}%` for use in final query
  // line 105: Push `name ILIKE $${whereValues.length}` into whereClauses array for use in final query
  // line 108: Now we begin building our final query.  If the whereClauses array is not empty
  // line 109: redefine baseQuery by joining all items in the whereClauses array with ' AND ', and then 
  //        chaining on `WHERE` + whereClauses.join(' AND ')
  // line 112: Define finalQuery as baseQuery + "ORDER BY name" 
  // line 113: Define companiesRes as a query to the API database that includes finalQuery and whereValues
  // line 114: Return the rows of the companiesRes response. 
  static async findAll(searchCriteria = {}) {
    let baseQuery = `SELECT handle,
                            name,
                            description,
                            num_employees AS "numEmployees",
                            logo_url AS "logoUrl"
                     FROM companies
                     WHERE `
    const { name, minEmployees, maxEmployees } = searchCriteria;
    let whereClauses = [];
    let whereValues = [];

    if(minEmployees > maxEmployees) {
      throw new BadRequestError("minEmployees cannot be greater than maxEmployees");
    }

    if(minEmployees !== undefined) {
      whereValues.push(minEmployees);
      whereClauses.push(`num_employees >= $${whereValues.length}`);
    }

    if(maxEmployees !== undefined) {
      whereValues.push(maxEmployees);
      whereClauses.push(`num_employees <= $${whereValues.length}`);
    }

    if(name !== undefined) {
      whereValues.push(`%${name}%`);
      whereClauses.push(`name ILIKE $${whereValues.length}`);
    }
    
    if(whereClauses.length > 0) {
      baseQuery = baseQuery + `WHERE` + whereClauses.join(' AND ');
    } 

    let finalQuery = baseQuery + "ORDER BY name";
    const companiesRes = await db.query(finalQuery, whereValues)
    return companiesRes.rows;
  }

  
  /** Given a company handle, return data about company, including job postings.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where job postings are [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const companyRes = await db.query(
          `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           WHERE handle = $1`,
        [handle]);

    const company = companyRes.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
    
    const jobsRes = await db.query(
          `SELECT id, title, salary, equity
           FROM jobs
           WHERE company_handle = $1
           ORDER BY id`,
          [handle],
    );
    company.jobs = jobsRes.rows;

    return company;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          numEmployees: "num_employees",
          logoUrl: "logo_url",
        });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE companies 
                      SET ${setCols} 
                      WHERE handle = ${handleVarIdx} 
                      RETURNING handle, 
                                name, 
                                description, 
                                num_employees AS "numEmployees", 
                                logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
          `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
        [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}


module.exports = Company;

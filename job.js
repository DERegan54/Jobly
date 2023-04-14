"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for jobs. */

class Job {
  /** Create a job (from data), update db, return new company data.
   *
   * data should be { title, salary, equity, companyHandle }
   *
   * Returns { id, title, salary, equity, companyHandle }
   *
   * */

  static async create(data) {
    const result = await db.query(
          `INSERT INTO jobs (title, 
                             salary, 
                             equity,
                             company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
        [
          data.title, 
          data.salary,
          data.equity,
          data.companyHandle,
        ],
    );
    let job = result.rows[0];
    return job;
  }

  /** Find all jobs (with optional filtering capability).
   * Search criteria include: title, minSalary, hasEquity (not required)
   * Returns [{ id, title, salary, equity, companyHandle, companyName }, ...]
   * To filter jobs by title, minSalary, maxSalary, hasEquity and/or companyHandle, add a parameter to
   *   query string in the form of an object called searchCriteria, where the keys are 
   *   the search terms, and the values are the search values.
   **/

  // lines 62 - 69: Define variable query as the intitial query we will then add our final query
  // line 71: Define variable 'whereClauses' as an empty array that will store the search terms 
  // line 73: If minSalary is included in the query string object
  // line 74: Push minSalary to the whereValues array for use in the final query
  // line 75: Push `salary >= $${whereValues.length}` into the whereClauses array
  // line 78: If hasEquity === true
  // line 79: Push `equity > 0` to the whereClauses array for use in the final query 
  // line 82: If title is included in the query object 
  // line 83: Push `%${title}%` into whereValues array
  // line 84: Push `title ILIKE $${whereValues.length}` into whereClauses array for use in the final query
  // line 87: Now we begin building our final query.  If the whereClauses array is not empty...
  // line 88: ...Redefine query by joining all items in the whereClauses array with ' AND ', and then 
  //         chaining on " WHERE " + whereClauses.join(' AND ')
  // line 91: add " ORDER BY title" to the final query
  // line 92: Define jobsRes as the response we will get from the query to the database 
  // line 93: Return the rows of jobsRes response.
  static async findAll({ minSalary, hasEquity, title } = {}) {
    let query = `SELECT j.id,
                        j.title,
                        j.salary,
                        j.equity,
                        j.company_handle AS "companyHandle",
                        c.name AS "companyName"
                 FROM jobs j 
                   LEFT JOIN companies AS c ON c.handle = j.company_handle`;
    let whereClauses = [];
    let whereValues = [];

    if (minSalary !== undefined) {
      whereValues.push(minSalary);
      whereClauses.push(`salary >= $${whereValues.length}`);
    }

    if (hasEquity === true) {
      whereClauses.push(`equity > 0`);
    }

    if (title !== undefined) {
      whereValues.push(`%${title}%`);
      whereClauses.push(`title ILIKE $${whereValues.length}`);
    }

    if (whereClauses.length > 0) {
      query += " WHERE " + whereClauses.join(" AND ");
    }

    query += " ORDER BY title";
    const jobsRes = await db.query(query, whereValues);
    return jobsRes.rows;
  }

  /** Given a job title, return data about that job
   * 
   *  Returns { id, title, salary, equity, companyHandle, companyName }
   * 
   *  Throws NotFoundError if job is not found
   */

  static async get(id) {
    const jobRes = await db.query(
          `SELECT id,
                  title, 
                  salary,
                  equity,
                  company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1`, [id]);
  
    const job = jobRes.rows[0];

    if (!job) {
      throw new NotFoundError(`Job not found: ${id}`);
    }

    const companiesRes = await db.query(
          `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_Url AS "logoUrl"
           FROM companies
           WHERE handle = $1`, [job.companyHandle]);

    delete job.companyHandle;  // <-- What is this line for?
    job.company = companiesRes.rows[0];

    return job;
  }

  /** Update job data with `data`
     * 
     * This is a "partial update" --- it's fine if data doesn't contain all the fields;
     * this only changes provided ones.
     * 
     * Data can include {title, salary, equity}
     * 
     * Returns {id, title, salary, equity, companyHandle}
     * 
     * Throws NotFoundError if job not found.
    */

  static async update(id, data) {
    const { setCols, values} = sqlForPartialUpdate(
        data,
        {});
    const idVarIdx = "$" + (values.length +1);

    const querySql = `Update jobs
                      SET ${setCols}
                      WHERE id = ${idVarIdx}
                      RETURNING id,
                                title,
                                salary,
                                equity,
                                company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`Job not found: ${id}`);

    return job;
  }

  /** Delete given job posting from database; returns undefined. 
     * 
     * Throws NotFoundError if job not found.
    */

  static async remove(id) {
    const result = await db.query(
        `DELETE 
         FROM jobs
         WHERE id = $1
         RETURNING id`,
        [id]);
    const job = result.rows[0];

    if(!job) throw new NotFoundError(`Job not found: ${id}`);
  }
}

module.exports = Job;


"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

// Functions for job postings

class Job {
    /** Create a job posting (from data), update db, return new job data.
    * 
    * data should be { title, salary, equity, company_handle }
    * 
    * Returns { title, salary, equity, company_handle }
    * 
    * Throws BadRequestError if job posting already in database
    */

    static async create(data) {
        const result = await db.query(
                `INSERT INTO jobs
                (title, salary, equity, company_handle)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
            [
                data.title, 
                data.salary,
                data.equity,
                data.companyHandle,
            ]);
        let job = result.rows[0];

        return job;
    }

    /** Find all jobs
     * 
     *  Returns [{ id, title, salary, equity, companyHandle }, ...]
     *  To filter jobs by tile, minSalary, and/or hasEquity, add a parameter in the 
     *      query string in thd form of an object called searchCriteria, where the keys are the 
     *      search terms and the values are the search values.
     * */

    // line 64: Include the searchCriteria object as a parameter
    // line 65: Define variable baseQuery as the intitial query we will then add our search criteria to
    // line 73: Destructure the searchCriteria object to extract the search terms we will use in the query
    // line 74: Define variable 'whereClauses' as an empty array that will store the search terms passed into the searchCriteria object
    // line 75: Define variable 'whereValues' as an empty array that will store the search values passed into the searchCriteria object
    // line 77: If title is included in the searchCriteria object 
    // line 78: Push title to the whereValues array for use in the final query
    // line 79: Push `title ILIKE $${whereValues.length}` into whereClauses array for use in the final query
    // line 82: If minSalary is included in the searchCriteria object
    // line 83: Push minSalary to the whereValues array for use in the final query
    // line 84: Push `salary >= $${whereValues.length}` into whereClauses array for use in the final query
    // line 87: If hasEquity is included in the searchCriteria object
    // line 88: If hasEquity === true
    // line 89: Push `equity > 0` to the whereClauses array for use in the final query 
    // line 93: Now we begin building our final query.  If the whereClauses array is not empty
    // line 94: Redefine baseQuery by joining all items in the whereClauses array with ' AND ', and then 
    //         chaining on `WHERE` + whereClauses.join(' AND ')
    // line 97: Define finalQuery as baseQuery + "ORDER BY title"
    // line 98: Define jobsRes as a query to the API database that includes finalQuery and whereValues
    // line 99: Return the rows of jobsRes response.
    static async findAll(searchCriteria = {}) {
        let baseQuery = `SELECT j.id,
                                j.title,
                                j.salary,
                                j.equity,
                                j.company_handle AS "companyHandle",
                                c.name AS "companyName"
                         FROM jobs j
                            LEFT JOIN companies AS c ON c.handle = j.company_handle`;
        const { title, minSalary, hasEquity } = searchCriteria;
        let whereClauses = [];
        let whereValues = [];

        if(title !== undefined) {
            whereValues.push(`%${title}%`);
            whereClauses.push(`title ILIKE $${whereValues.length}`);
        }

        if(minSalary !== undefined) {
            whereValues.push(minSalary);
            whereClauses.push(`salary >= $${whereValues.length}`);
        }

        if(hasEquity !== undefined) {
            if(hasEquity === true) {
                whereClauses.push(`equity > 0`);
            }
        }

        if(whereClauses.length > 0) {
            baseQuery = baseQuery + `WHERE` + whereClauses.join(' AND ');
        }

        let finalQuery = baseQuery + "ORDER BY title";
        const jobsRes = await db.query(finalQuery, whereValues)
        return jobsRes.rows;
    }

    /** Given a job id, return data about job.
     * 
     * Returns { id, title, salary, equity, companyHandle }
     * 
     * Throws NotFoundError if not found.
     * 
     */

    static async get(id) {
        const jobRes = await db.query (
                `SELECT id,
                        title, 
                        salary,
                        equity
                        company_handle AS "companyHandle"
                 FROM jobs
                 WHERE id = $1`,
            [id]);
        
            const job = jobRes.rows[0];

            if(!job) throw new NotFoundError(`No job: ${id}`);

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

        if (!job) throw new NotFoundError(`No job: ${id}`);

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

        if(!job) throw new NotFoundError(`No job: ${id}`);
    }
}

module.exports = Job;
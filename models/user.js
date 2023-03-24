"use strict";

const db = require("../db");
const bcrypt = require("bcrypt");
const { sqlForPartialUpdate } = require("../helpers/sql");
const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} = require("../expressError");

const { BCRYPT_WORK_FACTOR } = require("../config.js");

/** Related functions for users. */

class User {
  /** authenticate user with username, password.
   *
   * Returns { username, first_name, last_name, email, is_admin }
   *
   * Throws UnauthorizedError is user not found or wrong password.
   **/

  static async authenticate(username, password) {
    // try to find the user first
    const result = await db.query(
          `SELECT username,
                  password,
                  first_name AS "firstName",
                  last_name AS "lastName",
                  email,
                  is_admin AS "isAdmin"
           FROM users
           WHERE username = $1`,
        [username],
    );

    const user = result.rows[0];

    if (user) {
      // compare hashed password to a new hash from password
      const isValid = await bcrypt.compare(password, user.password);
      if (isValid === true) {
        delete user.password; // Why is the user.password being deleted upon authentication?
        return user;
      }
    }

    throw new UnauthorizedError("Invalid username/password");
  }

  /** Register user with data.
   *
   * Returns { username, firstName, lastName, email, isAdmin }
   *
   * Throws BadRequestError on duplicates.
   **/

  static async register(
      { username, password, firstName, lastName, email, isAdmin }) {
    const duplicateCheck = await db.query(
          `SELECT username
           FROM users
           WHERE username = $1`,
        [username],
    );

    if (duplicateCheck.rows[0]) {
      throw new BadRequestError(`Duplicate username: ${username}`);
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

    const result = await db.query(
          `INSERT INTO users
           (username,
            password,
            first_name,
            last_name,
            email,
            is_admin)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING username, first_name AS "firstName", last_name AS "lastName", email, is_admin AS "isAdmin"`,
        [
          username,
          hashedPassword,
          firstName,
          lastName,
          email,
          isAdmin,
        ],
    );

    const user = result.rows[0];

    return user;
  }

  /** Find all users.
   *
   * Returns [{ username, first_name, last_name, email, is_admin }, ...]
   **/

  static async findAll() {
    const result = await db.query(
          `SELECT username,
                  first_name AS "firstName",
                  last_name AS "lastName",
                  email,
                  is_admin AS "isAdmin"
           FROM users
           ORDER BY username`,
    );

    return result.rows;
  }

  /** Given a username, return data about user.
   *
   * Returns { username, first_name, last_name, is_admin, jobs }
   *   where jobs is { id, title, company_handle, company_name, state }
   *
   * Throws NotFoundError if user not found.
   **/

  // line 135: Define variable "userRes" as the response received by querying the users table by username 
  // line 146: Define variable "user" as the row returned from the above query
  // line 148: If the username is not found in the database, throw NotFoundError
  // line 150: Define variable "userJobsAppliedRes" as the response received by querying the applications table
  // line 156: Define "user.applications" the result from mapping the applications returned from the above query
  //        to the correct JobIds.  This also attaches the applications to the returned "user"
  // line 157: Return the correct user along with data on jobs the user has applied to

  static async get(username) {
    const userRes = await db.query(
          `SELECT username,
                  first_name AS "firstName",
                  last_name AS "lastName",
                  email,
                  is_admin AS "isAdmin"
           FROM users
           WHERE username = $1`,
        [username],
    );

    const user = userRes.rows[0];

    if (!user) throw new NotFoundError(`No user: ${username}`);

    const userJobsAppliedRes = await db.query(
          `SELECT a.job_id
           FROM applications AS a
          WHERE a.username = $1`,
          [username]);
    
    user.applications = userJobsAppliedRes.rows.map(a => a.job_id);
    return user;
  }

  /** Update user data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain
   * all the fields; this only changes provided ones.
   *
   * Data can include:
   *   { firstName, lastName, password, email, isAdmin }
   *
   * Returns { username, firstName, lastName, email, isAdmin }
   *
   * Throws NotFoundError if not found.
   *
   * WARNING: this function can set a new password or make a user an admin.
   * Callers of this function must be certain they have validated inputs to this
   * or a serious security risks are opened.
   */

  static async update(username, data) {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, BCRYPT_WORK_FACTOR);
    }

    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          firstName: "first_name",
          lastName: "last_name",
          isAdmin: "is_admin",
        });
    const usernameVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE users 
                      SET ${setCols} 
                      WHERE username = ${usernameVarIdx} 
                      RETURNING username,
                                first_name AS "firstName",
                                last_name AS "lastName",
                                email,
                                is_admin AS "isAdmin"`;
    const result = await db.query(querySql, [...values, username]);
    const user = result.rows[0];

    if (!user) throw new NotFoundError(`No user: ${username}`);

    delete user.password;
    return user;
  }

  /** Delete given user from database; returns undefined. */

  static async remove(username) {
    let result = await db.query(
          `DELETE
           FROM users
           WHERE username = $1
           RETURNING username`,
        [username],
    );
    const user = result.rows[0];

    if (!user) throw new NotFoundError(`No user: ${username}`);
  }

  /** Apply for a job
   * 
   *  Updates applications table in database.
   *  Returns undefined.
   *  Parameters: username is username of applicant
   *              jobId is the id of the job applying for.
   */

  // line 227: The applyForJobs function allow registered users to apply for jobs posted on Jobly
  // line 228: Define variable "getJob" as query to jobs table for jobId passed in as parameter
  // line 233: Define variable "job" as response from database for the above query
  // line 236: If the jobId is not in the database,
  // line 237: Throw new NotFoundError
  // line 239: Define variable "getApplicant" as query to the users table for username passed in as parameter
  // line 244: Define variable "applicant" as response from database for above query
  // line 246: If the username is not in the database
  // line 247: Throw new NotFoundError
  // line 250: Database query that inserts the jobId and username into the applications table of the database

  static async applyForJob(username, jobId) {
    const getJob = await db.query(
        `SELECT id
         FROM jobs
         WHERE id = $1`, 
        [jobId]);
    const job = getJob.rows[0];

    if (!job) {
      throw new NotFoundError(`Job not found: ${jobId}`);
    }

    const getApplicant = await db.query(
          `SELECT username
           FROM users
           WHERE username= $1`,
          [username]);
    const applicant = getApplicant.rows[0];

    if (!applicant) {
      throw new NotFoundError(`User not found: ${username}`);
    }

    await db.query(
          `INSERT INTO applications(job_id, username)
           VALUES($1, $2)`,
          [jobId, username]);
  }
}


module.exports = User;

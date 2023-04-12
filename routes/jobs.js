"use strict";

/** Routes for jobs */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureAdmin, ensureCorrectUserOrAdmin } = require("../middleware/auth");
const Job = require("../models/job");

const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");
const jobSearchSchema = require("../schemas/jobSearch.json");

const router = new express.Router({ mergeParams: true });

/** POST / { job } 
 * Job should be { title, salary, equity, companyHandle }
 * Returns { title, salary, equity, companyHandle }
 * Authorization required: admin (checked with ensureAdmin middleware function)   
*/

router.post ("/", ensureAdmin, async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, jobNewSchema);
        if(!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }
        
        const job = await Job.create(req.body);
        return res.status(201).json({ job });
    } catch (err) {
        return next(err);
    }
});

/** GET / => { job: [ {title, salary, equity, companyHandle }, ...] }
 * Authorization required: none
 */
 
// line 57: Define variable "query" as the data in the query string
// line 58: If minSalary is not undefined in we must convert minSalary from a string to a integer
// line 59: Convert query.hasEquity into a boolean 
// line 60: Try
// line 661: Define validator as the result when calling jsonschema.validate on query, comparing it to jobSearchSchema
// line 62: If validator does not return valid...
// line 63: ...Define errs as the errors from validator mapped to the error stack
// line 64: throw new BadRequestError containing the above errors
// line 66: Define jobs as the query made using the Job.findAll(query) method from the Job model
// line 67: Return JSON object containing all jobs in the form of { jobs }
// line 68: Catch errors
// line 69: Return errors

router.get("/", async function (req, res, next) {
    let query = req.query;
    if (query.minSalary !== undefined) query.minSalary = +query.minSalary;
    query.hasEquity = query.hasEquity === "true";
    try {
        const validator = jsonschema.validate(query, jobSearchSchema);
        if(!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }
        let jobs = await Job.findAll(query);
        return res.json({ jobs });
    } catch (err) {
        return next(err);
    }
});

/** GET /[id] => { job }
 * Return Job as { id, title, salary, equity }
 * Authorization required: none
 */

router.get("/:id", async function (req, res, next) {
    try {
        const job = await Job.get(req.params.id);
        return res.json({job});
    } catch (err) {
        return next(err);
    }
});

/** PATCH /[id] { fld1, fld2, ... } => { job }
 * Patches job data
 * Fields can be: { title, salary, equity }
 * Authorization required: admin (checked with ensureAdmin middleware function)
 */

router.patch("/:id", ensureAdmin, async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, jobUpdateSchema);
        if(!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }

        const job = await Job.update(req.params.id, req.body);
        return res.json({ job });
    } catch (err) {
        return next(err);
    }
});

/** DELETE /[id] => { deleted: id } 
 * Authorization: admin (checked with ensureAdmin middleware function)
*/

router.delete("/:id", ensureAdmin, async function (req, res, next) {
    try {
        await Job.remove(req.params.id);
        return res.json({ deleted: req.params.id });
    } catch (err) {
        return next(err);
    }
});

module.exports = router;
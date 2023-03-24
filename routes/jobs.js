"use strict";

/** Routes for jobs */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn, ensureAdmin, ensureCorrectUserOrAdmin } = require("../middleware/auth");
const Job = require("../models/job");

const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");
const jobSearchSchema = require("../schemas/jobSearch.json");

const router = new express.Router();

/** POST / { job } => { job } 
 * 
 *  Job should be { title, salary, equity, companyHandle }
 * 
 *  Returns { title, salary, equity, companyHandle }
 * 
 * Authorization required: admin (checked with ensureAdmin middleware function)
*/

router.post("/", ensureAdmin, async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, jobNewSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }

        const job = await Job.create(req.body);
        return res.status(201).json({ job });
    } catch (err) {
        return next(err);
    }
});

/** GET / => { job: [ { title, salary, equity, companyHandle }, ...] }
 * 
 * Authorization required: none
 */

// line 63: Define variable "query" as the query string
// line 664: Try
// line 65: Define variable "validator" as calling the jsonschema validate method, passing in the query string and the jobSearchSchema
// line 66: If validator returns invalid,
// line 67: Define variable "errs" as the validator errors from the error stack
// line 68: Throw new BadRequestError(errs)
// line 70: Define variable "searchCritiaArr" as the array returnd from the query object when the Object.keys(query) method is called
// line 71: If searchCriteriaArr is empty,
// line 72: Define variable "jobs" as the response from calling findAll() without any parameters to get a list of all jobs in the database
// line 73: Return JSON object containing all jobs
// line 74: else
// line 75: Defind variable "filteredJobs" as response from calling findAll(query) so that the parameters are passed into the findAll() method
// line 76: Return JSON object containing only companies filtered by searchCriteria
// line 78: Catch errors
// line 79: Return errors

router.get("/", async function (req, res, next) {
    const query = req.query;
    try {
        const validator = jsonschema.validate(query, jobSearchSchema);
        if(!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }
        const searchCriteriaArr = Object.keys(query);
        if(searchCriteriaArr.length === 0) {
            const jobs = await Job.findAll();
            return res.json({ jobs });
        } else {
            const filteredJobs = await Job.findAll(query);
            return res.json({ filteredJobs });
        }    
    } catch (err) {
        return next(err);
    }
});

/** GET /[id] => { job }
 * 
 * Returns Job as { id, , title, salary, equity } 
 * 
 * Authorization required: none
 */

router.get("/:id", async function (req, res, next) {
    try {
        const job = await Job.get(req.params.id);
        return res.json({ job });
    } catch (err) {
        return next(err);
    }
});

/** PATCH /[id] { fld1, fld2, ... } => { job } 
 * 
 * Patches job data.
 * 
 * Fields can be: { title, salary, equity }
 * 
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
 * 
 * Authorization: admin (checked with ensureAdmin middleware function)
 */

router.delete("/:id", ensureAdmin, async function (req, res, next) {
    try { 
        await Job.remove(req.parama.id);
        return res.json({ deleted: req.params.id });
    } catch (err) {
        return next(err);
    }
});

module.exports = router;
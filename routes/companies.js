"use strict";

/** Routes for companies. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn, ensureAdmin } = require("../middleware/auth");
const Company = require("../models/company");

const companyNewSchema = require("../schemas/companyNew.json");
const companyUpdateSchema = require("../schemas/companyUpdate.json");

const router = new express.Router();


/** POST / { company } =>  { company }
 *
 * company should be { handle, name, description, numEmployees, logoUrl }
 *
 * Returns { handle, name, description, numEmployees, logoUrl }
 *
 * Authorization required: admin (checked with ensureAdmin middleware function)
 */

router.post("/", ensureAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, companyNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const company = await Company.create(req.body);
    return res.status(201).json({ company });
  } catch (err) {
    return next(err);
  }
});
// router.post("/", ensureAdmin, async function (req, res, next) {
//   try {
//     const validator = jsonschema.validate(req.body, companyNewSchema);
//     if (!validator.valid) {
//       const errs = validator.errors.map(e => e.stack);
//       throw new BadRequestError(errs);
//     }

//     const company = await Company.create(req.body);
//     return res.status(201).json({ company });
//   } catch (err) {
//     return next(err);
//   }
// });

/** GET /  =>
 *   { companies: [ { handle, name, description, numEmployees, logoUrl }, ...] }
 *
 * Can filter on provided search filters:
 * - minEmployees
 * - maxEmployees
 * - nameLike (will find case-insensitive, partial matches)
 *
 * Authorization required: none
 */

// line 70: Define variable 'query' as the query string
// line 71: Try
// line 72: Define variable 'validator' as calling the jsonschema validate method, passing in the query string and the companySearchSchema
// line 73: If validator returns invalid, 
// Line 74: Define variable 'errs' as the validator errors from the error stack 
// line 75: Throw new BadRequestError(errs)
// line 78: Define searchCriteriaArr as the array returned from query object using Object.keys(req.query)
// line 79: If searchCriteriaArr is empty
// line 80: Define companies as response from calling findAll() without any parameters to get all companies in database
// line 81: Return JSON object containing all companies
// line 782: else
// line 83: Define filteredCompanies as response from calling findAll(req.query) so that the parameters are passed into findAll() method
// line 84: Return JSON object containing only companies filtered by searchCriteria
// line 86: Catch errors
// line 87: Return errors

router.get("/", async function (req, res, next) {
  const query = req.query;
  try {
    const validator = jsonschema.validate(query, companySearchSchema);
    if(!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }
    
    const searchCriteriaArr = Object.keys(query);
    if(searchCriteriaArr.length === 0){
      const companies = await Company.findAll();
      return res.json({ companies });
    } else {
      const filteredCompanies = await Company.findAll(query)
      return res.json({ filteredCompanies })
    }
  } catch (err) {
    return next(err);
  }
});

/** GET /[handle]  =>  { company }
 *
 *  Company is { handle, name, description, numEmployees, logoUrl, jobs }
 *   where jobs is [{ id, title, companyHandle}, ...]
 *
 * Authorization required: none
 */

router.get("/:handle", async function (req, res, next) {
  try {
    const company = await Company.get(req.params.handle);
    return res.json({ company });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /[handle] { fld1, fld2, ... } => { company }
 *
 * Patches company data.
 *
 * fields can be: { name, description, numEmployees, logo_url }
 *
 * Returns { handle, name, description, numEmployees, logo_url }
 *
 * Authorization required: admin (checked with ensureAdmin middleware function)
 */

router.patch("/:handle", ensureAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, companyUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const company = await Company.update(req.params.handle, req.body);
    return res.json({ company });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /[handle]  =>  { deleted: handle }
 *
 * Authorization: admin (checked with ensureAdmin middleware function)
 */

router.delete("/:handle", ensureAdmin, async function (req, res, next) {
  try {
    await Company.remove(req.params.handle);
    return res.json({ deleted: req.params.handle });
  } catch (err) {
    return next(err);
  }
});


module.exports = {router};

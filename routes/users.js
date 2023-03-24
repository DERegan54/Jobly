"use strict";

/** Routes for users. */

const jsonschema = require("jsonschema");

const express = require("express");
const { ensureLoggedIn, ensureAdmin, ensureCorrectUserOrAdmin } = require("../middleware/auth");
const { BadRequestError } = require("../expressError");
const User = require("../models/user");
const { createToken } = require("../helpers/tokens");
const userNewSchema = require("../schemas/userNew.json");
const userUpdateSchema = require("../schemas/userUpdate.json");

const router = express.Router();


/** POST / { user }  => { user, token }
 *
 * Adds a new user. This is not the registration endpoint --- instead, this is
 * only for admin users to add new users. The new user being added can be an
 * admin.
 *
 * This returns the newly created user and an authentication token for them:
 *  {user: { username, firstName, lastName, email, isAdmin }, token }
 *
 * Authorization required: admin (check with ensureAdmin middleware function)
 **/

router.post("/", ensureAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, userNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const user = await User.register(req.body);
    const token = createToken(user);
    return res.status(201).json({ user, token });
  } catch (err) {
    return next(err);
  }
});

/** POST /users/:username/job/:id  { username, jobId } => { applied: jobId }
 * 
 *  Allows registered user to apply for jobs on Jobly by posting the username and jobId to 
 *    the applications table in the database 
 *  
 *  Returns { applied: jobId }
 *  
 *  Authorizaton required: registerd user or admin (check with ensureCorrectUserOrAdmin middleware function)
 */

// line 64: Try
// line 65: Makes request API for user to "apply for a job" via the applyForJob method from the User class
// line 66: Return status code 201 and JSON object {applied: JobId} (the JobId is in the form of req.params.id)
//        confirming that the user has applied for the job
// line 67: Catch
// line 68: Return error

router.post("/users/:username/job/:id", ensureCorrectUserOrAdmin, async function (req, res, next) {
  try {
    await User.applyForJob(req.params.username, req.params.id);
    return res.status(201).json({applied: req.params.id});
  } catch (err) {
    return next(err);
  }
});

/** GET / => { users: [ {username, firstName, lastName, email }, ... ] }
 *
 * Returns list of all users.
 *
 * Authorization required: admin (check with ensureAdmin middleware function)
 **/

router.get("/", ensureAdmin, async function (req, res, next) {
  try {
    const users = await User.findAll();
    return res.json({ users });
  } catch (err) {
    return next(err);
  }
});


/** GET /[username] => { user }
 *
 * Returns { username, firstName, lastName, isAdmin } where jobs that user has applied to is
 *  {id, title, salary, equity, companyHandle}
 * 
 *
 * Authorization required: logged in user or admin (checked with ensureCorrectUserOrAdmin middleware function)
 **/

router.get("/:username", ensureCorrectUserOrAdmin, async function (req, res, next) {
  try {
    const user = await User.get(req.params.username);
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});


/** PATCH /[username] { user } => { user }
 *
 * Data can include:
 *   { firstName, lastName, password, email }
 *
 * Returns { username, firstName, lastName, email, isAdmin }
 *
 * Authorization required: logged in user or admin (checked with ensureCorrectUserOrAdmin middleware function)
 **/
 

router.patch("/:username", ensureCorrectUserOrAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, userUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const user = await User.update(req.params.username, req.body);
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});


/** DELETE /[username]  =>  { deleted: username }
 *
 * Authorization required: logged in user or admin (checked with ensureCorrectUserOrAdmin middleware function)
 **/

router.delete("/:username", ensureCorrectUserOrAdmin, async function (req, res, next) {
  try {
    await User.remove(req.params.username);
    return res.json({ deleted: req.params.username });
  } catch (err) {
    return next(err);
  }
});


module.exports = router;

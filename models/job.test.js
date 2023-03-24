"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll, 
    testJobIds,
} = require("./_testCommon");

commonBeforeAll(commonBeforeAll);
commonBeforeEach(commonBeforeEach);
commonAfterEach(commonAfterEach);
commonAfterAll(commonAfterAll);

/**************************************** create */

describe("create", function () {
    const newJob = {
        title: "Test",
        salary: 75000,
        equity: 0,
        companyHandle: "test-company",
    };

    test("creates new job posting", async function () {
        let job = await Job.create(newJob);
        expect(job).toEqual({
            ...newJob,
            id: expect.any(Number),
        });
    });

    test("bad request with dupe", async function () {
        try {
            await Job.create(newJob);
            await Job.create(newJob);
            fail();
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });
});

/******************************************************* findAll */

describe("findAll", function () {
    test("findAll without filters", async function() {
        let jobs = await Job.findAll();
        expect(jobs).toEqual([
            {
                id: testJobIds[0],
                title: "Job1",
                salary: 20000,
                equity: "0.1",
                companyHandle: "c1"
            },
            {
                id: testJobIds[1],
                title: "Job2",
                salary: 30000,
                equity: 0,
                companyHandle: "c1",
            },
            {
                id: testJobIds[2],
                title: "Job3",
                salary: 45000,
                equity: "0.2",
                companyHandle: "c1",
            },
            {
                id: testJobIds[3],
                title: "Job4",
                salary: null,
                equity: null,
                companyHandle: "c1",
            },
        ]);
    });

    test("find companies with title filter", async function () {
        const searchCriteria = {title: Job1};
        let filteredJobs = await Job.findAll(searchCriteria);
        expect(filteredJobs).toEqual([
            {
                id: testJobIds[0],
                title: "Job1",
                salary: 20000,
                equity: "0.1",
                companyHandle: "c1",
            },
        ]);
    });

    test("find companies with minSalary filter", async function () {
        const searchCriteria = {minSalary: 3500};
        let filteredJobs = await Job.findAll(searchCriteria);
        expect(filteredJobs).toEqual([
            {
                id: testJobIds[2],
                title: "Job3",
                salary: 45000,
                equity: "0.2",
                companyHandle: "c1"
            },
        ]);
    });

    test("findCompanies with hasEquity filter", async function () {
        const searchCriteria = {hasEquity: true};
        let filteredJobs = await Job.findAll(searchCriteria);
        expect(filteredJobs).toEqual([
            {
                id: testJobIds[0],
                title: "Job1",
                salary: 20000,
                equity: "0.1",
                companyHandle: "c1",
            },
            {
                id: testJobIds[2],
                title: "Job3",
                salary: 45000,
                equity: "0.2",
                companyHandle: "c1",
            },
        ]);
    });

    test("find company with multiple filters", async function () {
        const searchCriteria = {minSalary: 20000, hasEquity: true};
        let filteredJobs = await Job.findAll(searchCriteria);
        expect(filteredJobs).toEqual([
            {
                id: testJobIds[0],
                title: "Job1",
                salary: 20000,
                equity: "0.1",
                companyHandle: "c1",
            },
            {
                id: testJobIds[2],
                title: "Job3",
                salary: 45000,
                equity: "0.2",
                companyHandle: "c1",      
            },
        ]);
    });

    test("fails with invalid search criteria", async function () {
        try {
            await Job.findAll({wrong: 80});
            fail();
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });
});
/*************************************************** get */

describe("get", function () {
    test("get one specific job", async function () {
        let job = await Job.get(testJobIds[0]);
        expect(job).toEqual({
            id: testJobIds[0],
            title: "Job1",
            salary: 20000,
            equity: "0.1",
            companyHandle: "c1",
        });
    });

    test("job not found", async function () {
        try {
            await Job.get(0);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});

/*************************************************** update */

describe("update", function () {
    let updateData = {
        title: "New",
        salary: 1000000,
        equity: "0.3",
    };

    test("updates a job posting", async function () {
        let job = await Job.update(testJobIds[0], updateData);
        expect(job).toEqual({
           id: testJobIds[0],
           companyHandle: "c1",
           ...updateData,
        });
    });

    test("job not found", async function () {
        try {
            await Job.update(0, {
                title: "test",
            });
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});

/******************************************************* remove */

describe("remove", function () {
    test("deletes a job", async function () {
        await Job.remove(testJobIds[0]);
        const res = await db.query(
            "SELECT id FROM jobs WHERE id=$1", 
            [testJobIds[0]]);
        expect(res.rows.length).toEqual(0);
    });

    test("job not found", async function () {
        try {
            await Job.remove(0);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});

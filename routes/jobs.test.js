"use strict";

const request = require("supertest");
const  { BadRequestError } = require("../expressError");
const db = require("../db");
const app = require("../app");

const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
    u1Token,
    adminToken,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
commonBeforeEach(commonBeforeEach);
commonAfterEach(commonAfterEach);
commonAfterAll(commonAfterAll);

/***************************************************** POST /jobs */

describe("POST /companies", function () {
    const newJob = {
        title: "Test",
        salary: 75000,
        equity: "0",
        companyHandle: "test-company",
    };

    test ("works for authorized admin", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(201);
        expect(resp.body).toEqual({
            job: {
                id: expect.any(Number),
                title: "Test",
                salary: 75000,
                equity: "0",
                companyHandle: "test-company",
            },
        });
    });

    test("unauthorized if not admin", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({
                companyHandle: "test-company",
                title: "Test",
                salary: 7500,
                equity: "0",
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("error with no data", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({})
            .set("authorization, `Bearer ${adminToken");
        expect(resp.statusCode).toEqual(400);
    });

    test("error with invalid data", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({
                companyHandle: "wrong",
                title: "Wrong",
                salary: 0,
                equity: "0",
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(400);
    });
});

/************************************************** GET /jobs */

describe("GET /jobs", function () {
    test("anonymous user can access", async function () {
        const resp = await request(app)
            .get("/jobs");
        expect(resp.body).toEqual({
            jobs: 
                [
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
                        equity: "0",
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
                ],
        });
    });

    test("filter jobs by title", async function () {
        const query = {title: "Job1"};
        const resp = await request(app).get.query(query);
        expect(resp.body).toEqual({
            jobs:
                [
                    {
                        id: testJobIds[0],
                        title: "Job1",
                        salary: 20000,
                        equity: "0.1",
                        companyHandle: "c1",
                    },
                ],
        });
    });

    test("filter jobs by minSalary", async function () {
        const query = {minSalary: 3500};
        const resp = await request(app).get.query(query);
        expect(resp.body).toEqual({
            jobs:
                [
                    {
                        id: testJobIds[2],
                        title: "Job3",
                        salary: 45000,
                        equity: "0.2",
                        companyHandle: "c1",
                    },
                ],
        });
    });

    test("filter by hasEquity", async function () {
        const query = {hasEquity: true};
        const resp = await request(app).get.query(query);
        expect(resp.body).toEqual({
            jobs: 
                [
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
                ],
        });
    });

    test("works with multiple filters", async function () {
        const query = {minSalary: 20000, hasEquity: true};
        const resp = await request(app).get.query(query);
        expect(resp.body).toEqual({
            jobs: 
                [
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
                ],
        });
    });

    test("fails with invalid filter", async function () {
        const query = {wrong: 8};
        const resp = await request(app).get.query(query);
        expect(resp.statusCode).toEqual(400);   
    });
});

/********************************************************* GET /jobs/:id */

describe("GET /jobs/:id", function () {
    test("anonymous user can access", async function () {
        const resp = await request(app)
            .get(`/jobs/testJobsIds[0]`);
        expect(resp.body).toEqual({
            job: {
                id: testJobsIds[0],
                title: "Job1",
                salary: 20000,
                equity: "0.1",
                company: {
                    handle: "c1",
                    name: "C1",
                    description: "Desc1",
                    numEmployees: 1,
                    logoUrl: "http://c1.img"
                },
            },
        });            
    });

    test("job not found", async function () {
        const resp = await request(app)
            .get(`/jobs/wrong`);
        expect(resp.statusCode).toEqual(404);
    });
});

/********************************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
    test("valid admins can access", async function () {
        const resp = await request(app)
            .patch(`/jobs/testJobsIds[0]`)
            .send({
                title: "JobOne",
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.body).toEqual({
            job: {
                id: "testJobsIds[0]",
                title: "JobOne",
                salary: 20000,
                equity: "0.1",
                companyHandle: "c1"
            },        
        });
    });
    
    test("unauthorized for anonymous users", async function() {
        const resp = await request(app)
            .patch(`/jobs/testJobsIds[0]`)
            .send({
                title: "JobOne",
            });
        expect(resp.statusCode).toEqual(401);
    });

    test("unauthorized for non-admin users", async function() {
        const resp = await request(app)
            .patch(`/jobs/testJobsIds[0]`)
            .send({
                title: "JobOne",
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("error on job not found", async function () {
        const resp = await request(app)
            .patch(`/jobs/testJobsIds[100]`)
            .send({
                title: "JobOne",
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(404);
    });

    test("error with invalid data", async function () {
        const resp = await request(app)
            .patch(`/jobs/testJobsIds[0]`)
            .send({
                salary: "twenty thousand",
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).ToEqual(400);
    });
});

/**************************************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
    test("valid admin can delete", async function () {
        const resp = await request(app)
            .delete(`/jobs/testJobsIds[0]`)
            .set("authorization", `Bearer ${adminToken}`)
        expect(resp.body).toEqual({ deleted: "testJobsIds[0]" });
    });

    test("unauthorized for anonymous users", async function () {
        const resp = await request(app)
            .delete(`jobs/testJobsIds[0]`)
        expect(resp.statusCode).toEqual(401);
    });

    test("unauthorized for non-admin users", async function () {
        const resp = await request(app)
            .delete(`jobs/testJobsIds[0]`)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("job not found", async function () {
        const resp = await request(app)
            .delete(`/jobs/testJobsIds[100]`)
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(404);
    });
});
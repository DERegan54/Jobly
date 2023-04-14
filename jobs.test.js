"use strict";

const request = require("supertest");
const { BadRequestError } = require("../expressError");
const db = require("../db");
const app = require("../app");

const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach, 
    commonAfterAll,
    u1Token,
    adminToken,
    testJobIds,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/***************************************************************** POST /jobs */

describe("POST /jobs", function () {
    test(" admins can post job postings", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({
                companyHandle: "c1",
                title: "New Job",
                salary: 100000,
                equity: "0.2",
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(201);
        expect(resp.body).toEqual({
            job: {
                id: expect.any(Number),
                title: "New Job",
                salary: 100000,
                equity: "0.2",
                companyHandle: "c1",
            },
        });
    });
    // Connection is being terminated here for some reason
    test("unauthorized for non-admin", async function () {
        const resp = await request(app)
            .post(`/jobs`)
            .send({
                companyHandle: "c1",
                title: "New Job",
                salary: 100000,
                equity: "0.2",
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("throws error with invalid data", async function () {
        const resp = await request(app)
            .post(`/jobs`)
            .send({
                companyHandle: "c1",
                title: "New Job",
                salary: "one hundred thousand",
                equity: "0.2",
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(400);
    });

    test("throws error with missing data", async function () {
        const resp = await request(app)
            .post(`/jobs`)
            .send({
                title: "NewJob",
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(400);
    });

});
   

/**************************************************************** GET /jobs */

describe("GET /jobs", function () {
    test("can get jobs", async function () {
        let resp = await request(app)
        .get(`/jobs`);
        expect(resp.body).toEqual({
            jobs: [
                {
                    id: expect.any(Number),
                    title: "J1",
                    salary: 1,
                    equity: "0.1",
                    companyHandle: "c1",
                    companyName: "C1",
                },
                {
                    id: expect.any(Number),
                    title: "J2",
                    salary: 2,
                    equity: "0.2",
                    companyHandle: "c1",
                    companyName: "C1",
                },
                {
                    id: expect.any(Number),
                    title: "J3",
                    salary: 3,
                    equity: null,
                    companyHandle: "c1",
                    companyName: "C1",
                },
            ],
        });
    });

    test("returns correct jobs with min salary filter", async function () {
        const resp = await request(app)
            .get(`/jobs`)
            .query({ minSalary: 2 });
        expect(resp.body).toEqual({
            jobs: [
                {
                    id: expect.any(Number),
                    title: "J2",
                    salary: 2,
                    equity: "0.2",
                    companyHandle: "c1",
                    companyName: "C1",
                },
                { 
                    id: expect.any(Number),
                    title: "J3",
                    salary: 3,
                    equity: null,
                    companyHandle: "c1",
                    companyName: "C1",
                },
            ]
        });
    });


    test("throws error on invalid filter criteria", async function () {
        let resp = await request(app)
            .get(`/jobs`)
            .query({ wrong: null});
        expect(resp.statusCode).toEqual(400);
    });
});

/*************************************************************** GET /jobs */

describe("GET /jobs/:id", function () {
    test("anonymous users can access job postings", async function () {
        const resp = await request(app)
            .get(`/jobs/${testJobIds[0]}`);
        expect(resp.body).toEqual({
            job: {
                id: testJobIds[0],
                title: "J1",
                salary: 1,
                equity: "0.1",
                company: {
                    handle: "c1",
                    name: "C1",
                    description: "Desc1",
                    numEmployees: 1, 
                    logoUrl: "http://c1.img",                
                },            
            },
        });
    });

    test("throws error if job not found", async function () {
        const resp = await request(app)
            .get(`/jobs/0`);
        expect(resp.statusCode).toEqual(404);
    });
});

/************************************************************* PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
    test("admins can update job postings", async function () {
        const resp = await request(app)
            .patch(`/jobs/${testJobIds[0]}`)
            .send({
                title: "Updated Job",
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.body).toEqual({
            job: {
                id: expect.any(Number),
                title: "Updated Job", 
                salary: 1,
                equity: "0.1",
                companyHandle: "c1",
            },
        });
    });

    test("non-admins unauthorized", async function () {
        const resp = await request(app)
            .patch(`/jobs/${testJobIds[0]}`)
            .send({
                title: "Updated Job",
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("throws error when job not found", async function () {
        const resp = await request(app)
            .patch(`/jobs/0`)
            .send({
                title: "Updated Job",
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(404);
    });

    test("throws error when attempt to patch unauthorized criteria", async function () {
        const resp = await request(app)
            .patch(`/jobs/${testJobIds[0]}`)
            .send({
                handle: "new handle"
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(400);
    });

    test("throws error when data is invalid", async function () {
        const resp = await request(app)
            .patch(`/jobs/${testJobIds[0]}`)
            .send({
                salary: "One hundred thousand",
            })
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(400);
    });
});

/***************************************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
    test("admins can delete", async function () {
        const resp = await request(app)
            .delete(`/jobs/${testJobIds[0]}`)
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.body).toEqual({ deleted: testJobIds[0].toString()});
    });

    test("non-admins unauthorized", async function () {
        const resp = await request(app)
            .delete(`/jobs/${testJobIds[0]}`)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("throws error when job not found", async function () {
        const resp = await request(app)
            .delete(`/jobs/0`)
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(404);
    });
});
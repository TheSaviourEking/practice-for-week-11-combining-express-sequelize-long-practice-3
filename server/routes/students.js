// Instantiate router - DO NOT MODIFY
const express = require('express');
const router = express.Router();

// Import model(s)
const { Student } = require('../db/models');
const { Op } = require("sequelize");

// List
router.get('/', async (req, res, next) => {
    let errorResult = { errors: [], count: 0, pageCount: 0 };

    // Phase 2A: Use query params for page & size
    // Your code here
    let page = req.query.page ? parseInt(req.query.page) : 1;
    let size = req.query.size ? parseInt(req.query.size) : 10;

    // for Optional phase 3c to work, we need to ignore the below checks
    // if (!parseInt(page) && page !== parseInt(0)) page = 1;
    // if (!parseInt(size) && size !== parseInt(0)) size = 10;
    if (parseInt(size) && size > 200) size = 200;


    // Phase 2B: Calculate limit and offset
    // Phase 2B (optional): Special case to return all students (page=0, size=0)
    // Phase 2B: Add an error message to errorResult.errors of
    // 'Requires valid page and size params' when page or size is invalid
    // Your code here

    // return all students (page=0, size=0)
    let limit = -1, offset = -1;
    if (page < 0) page = -page;
    if (size < 0) size = -size;

    if (page >= 1 && size >= 1) {
        limit = size;
        offset = (page - 1) * size;
    }

    if ((!Number(page) && page !== 0) || (!Number(size) && size !== 0)) {
        errorResult.errors.push({ message: 'Requires valid page and size params' })
    }

    // Phase 4: Student Search Filters
    /*
        firstName filter:
            If the firstName query parameter exists, set the firstName query
                filter to find a similar match to the firstName query parameter.
            For example, if firstName query parameter is 'C', then the
                query should match with students whose firstName is 'Cam' or
                'Royce'.

        lastName filter: (similar to firstName)
            If the lastName query parameter exists, set the lastName query
                filter to find a similar match to the lastName query parameter.
            For example, if lastName query parameter is 'Al', then the
                query should match with students whose lastName has 'Alfonsi' or
                'Palazzo'.

        lefty filter:
            If the lefty query parameter is a string of 'true' or 'false', set
                the leftHanded query filter to a boolean of true or false
            If the lefty query parameter is neither of those, add an error
                message of 'Lefty should be either true or false' to
                errorResult.errors
    */
    const where = {};

    // Your code here


    // Phase 2C: Handle invalid params with "Bad Request" response
    // Phase 3C: Include total student count in the response even if params were
    // invalid
    /*
        If there are elements in the errorResult.errors array, then
        return a "Bad Request" response with the errorResult as the body
        of the response.

        Ex:
            errorResult = {
                errors: [{ message: 'Grade should be a number' }],
                count: 267,
                pageCount: 0
            }
    */
    // Your code here
    if (errorResult.errors.length >= 1) {
        // errorResult.status = 400;
        // errorResult.name = 'BadRequest';
        errorResult.count = await Student.count();
        next(errorResult);
    };

    let result = {};

    // Phase 3A: Include total number of results returned from the query without
    // limits and offsets as a property of count on the result
    // Note: This should be a new query

    result.rows = await Student.findAll({ // TODO: return to just findAll
        attributes: ['id', 'firstName', 'lastName', 'leftHanded'],
        where,
        // Phase 1A: Order the Students search results
        order: [['lastName', 'ASC'], ['firstName', 'ASC']],
        // Phase 2D: Add limit and offset to the query
        limit,
        offset
    });

    result.count = await Student.count();

    // Phase 2E: Include the page number as a key of page in the response data
    // In the special case (page=0, size=0) that returns all students, set
    // page to 1
    /*
        Response should be formatted to look like this:
        {
            rows: [{ id... }] // query results,
            page: 1
        }
    */
    // Your code here
    result.page = page === 0 ? 1 : page

    // Phase 3B:
    // Include the total number of available pages for this query as a key
    // of pageCount in the response data
    // In the special case (page=0, size=0) that returns all students, set
    // pageCount to 1
    /*
        Response should be formatted to look like this:
        {
            count: 17 // total number of query results without pagination
            rows: [{ id... }] // query results,
            page: 2, // current page of this query
            pageCount: 10 // total number of available pages for this query
        }
    */
    // Your code here
    result.pageCount = page === 0 || size === 0 ? 1 : Math.ceil(result.count / size);

    res.json(result);
    // res.json({ page, size, limit, offset });
});

// Export class - DO NOT MODIFY
module.exports = router;

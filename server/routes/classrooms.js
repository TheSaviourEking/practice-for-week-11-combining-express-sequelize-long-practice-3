// Instantiate router - DO NOT MODIFY
const express = require('express');
const router = express.Router();

// Import model(s)
const { Classroom, Supply, StudentClassroom, Student, sequelize } = require('../db/models');
const { Op } = require('sequelize');

// List of classrooms
router.get('/', async (req, res, next) => {
    let errorResult = { errors: [], count: 0, pageCount: 0 };

    // Phase 6B: Classroom Search Filters
    /*
        name filter:
            If the name query parameter exists, set the name query
                filter to find a similar match to the name query parameter.
            For example, if name query parameter is 'Ms.', then the
                query should match with classrooms whose name includes 'Ms.'

        studentLimit filter:
            If the studentLimit query parameter includes a comma
                And if the studentLimit query parameter is two numbers separated
                    by a comma, set the studentLimit query filter to be between
                    the first number (min) and the second number (max)
                But if the studentLimit query parameter is NOT two integers
                    separated by a comma, or if min is greater than max, add an
                    error message of 'Student Limit should be two integers:
                    min,max' to errorResult.errors
            If the studentLimit query parameter has no commas
                And if the studentLimit query parameter is a single integer, set
                    the studentLimit query parameter to equal the number
                But if the studentLimit query parameter is NOT an integer, add
                    an error message of 'Student Limit should be a integer' to
                    errorResult.errors 
    */
    const where = {};

    // Your code here
    const name = req.query.name ? req.query.name : null;
    if (name) where.name = { [Op.substring]: name };

    let studentLimit = req.query.studentLimit ? req.query.studentLimit : null;
    if (studentLimit) {
        if (studentLimit.includes(',')) {
            let [minStudentLimit, maxStudentLimit] = studentLimit.split(',');
            minStudentLimit = minStudentLimit ? parseInt(minStudentLimit) : null;
            maxStudentLimit = maxStudentLimit ? parseInt(maxStudentLimit) : null;
            if (minStudentLimit && maxStudentLimit && minStudentLimit <= maxStudentLimit) {
                where.studentLimit = {
                    [Op.between]: [minStudentLimit, maxStudentLimit]
                }
            } else {
                errorResult.errors.push({ messae: 'Student Limit should be two numbers: min,max' });
            }
        } else {
            studentLimit = studentLimit ? Number(studentLimit) : null;
            if (studentLimit) where.studentLimit = { [Op.eq]: studentLimit };
            else { errorResult.errors.push({ message: 'Student Limit should be an integer' }) };
        }
    }

    if (errorResult.errors.length >= 1) {
        errorResult.count = await Classroom.count({ where });
        next(errorResult);
    };


    const classrooms = await Classroom.findAll({
        attributes: [
            'id',
            'name',
            'studentLimit',
            'createdAt',
            'updatedAt',
            [sequelize.fn('AVG', sequelize.col('StudentClassrooms.grade')), 'avgGrade'],
            [sequelize.fn('COUNT', sequelize.col('StudentClassrooms.studentId')), 'numStudents']
        ],
        where,
        // Phase 1B: Order the Classroom search results
        order: [['name', 'ASC']],
        include: [{
            model: StudentClassroom,
            attributes: []
        }, {
            model: Student,
            attributes: []
        }],
        group: ['Students.id'],
    });

    res.json(classrooms);
});

// Single classroom
router.get('/:id', async (req, res, next) => {
    let classroom = await Classroom.findByPk(req.params.id, {
        attributes: ['id', 'name', 'studentLimit'],
        // Phase 7:
        // Include classroom supplies and order supplies by category then
        // name (both in ascending order)
        // Include students of the classroom and order students by lastName
        // then firstName (both in ascending order)
        // (Optional): No need to include the StudentClassrooms
        // Your code here
        // include: [{
        //     model: Supply,
        //     where: { classroomId: req.params.id }
        // }],
        include: [{
            model: Supply,
            attributes: ['id', 'name', 'category', 'handed'],
            where: { classroomId: req.params.id }
        },
        {
            model: Student,
            attributes: ['id', 'firstName', 'lastName'],
            through: {
                // model: StudentClassroom,
                attributes: []
            }
        }
        ],

        order: [
            [Supply, 'category'], [Supply, 'name'],
            [Student, 'lastName'], [Student, 'lastName']
        ]

        // => phase 5A: Classroom's supply count option 2
        // raw: true
    });

    if (!classroom) {
        res.status(404);
        res.send({ message: 'Classroom Not Found' });
    }

    // Phase 5: Supply and Student counts, Overloaded classroom
    // Phase 5A: Find the number of supplies the classroom has and set it as
    // a property of supplyCount on the response
    // Phase 5B: Find the number of students in the classroom and set it as
    // a property of studentCount on the response
    // Phase 5C: Calculate if the classroom is overloaded by comparing the
    // studentLimit of the classroom to the number of students in the
    // classroom
    // Optional Phase 5D: Calculate the average grade of the classroom 
    // Your code here

    // => phase 5A: Classroom's supply count option 1
    classroom = classroom.toJSON();
    classroom.supplyCount = await Supply.count({ where: { classroomId: req.params.id } });
    classroom.studentCount = await StudentClassroom.count({ where: { classroomId: req.params.id } });
    if (classroom.studentCount > classroom.studentLimit) classroom.overloaded = true;
    else { classroom.overloaded = false };
    classroom.avgGrade = await StudentClassroom.findAll({
        where: { classroomId: req.params.id },
        attributes: [[sequelize.fn('AVG', sequelize.col('grade')), 'avgGrade']],
        raw: true
    });
    classroom.avgGrade = classroom.avgGrade[0].avgGrade;

    res.json(classroom);
});

// Export class - DO NOT MODIFY
module.exports = router;

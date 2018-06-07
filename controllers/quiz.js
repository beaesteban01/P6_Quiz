const Sequelize = require("sequelize");
const {models} = require("../models");

// Autoload the quiz with id equals to :quizId
exports.load = (req, res, next, quizId) => {

    models.quiz.findById(quizId)
    .then(quiz => {
        if (quiz) {
            req.quiz = quiz;
            next();
        } else {
            throw new Error('There is no quiz with id=' + quizId);
        }
    })
    .catch(error => next(error));
};


// GET /quizzes
exports.index = (req, res, next) => {

    models.quiz.findAll()
    .then(quizzes => {
        res.render('quizzes/index.ejs', {quizzes});
    })
    .catch(error => next(error));
};


// GET /quizzes/:quizId
exports.show = (req, res, next) => {

    const {quiz} = req;

    res.render('quizzes/show', {quiz});
};


// GET /quizzes/new
exports.new = (req, res, next) => {

    const quiz = {
        question: "", 
        answer: ""
    };

    res.render('quizzes/new', {quiz});
};

// POST /quizzes/create
exports.create = (req, res, next) => {

    const {question, answer} = req.body;

    const quiz = models.quiz.build({
        question,
        answer
    });

    // Saves only the fields question and answer into the DDBB
    quiz.save({fields: ["question", "answer"]})
    .then(quiz => {
        req.flash('success', 'Quiz created successfully.');
        res.redirect('/quizzes/' + quiz.id);
    })
    .catch(Sequelize.ValidationError, error => {
        req.flash('error', 'There are errors in the form:');
        error.errors.forEach(({message}) => req.flash('error', message));
        res.render('quizzes/new', {quiz});
    })
    .catch(error => {
        req.flash('error', 'Error creating a new Quiz: ' + error.message);
        next(error);
    });
};


// GET /quizzes/:quizId/edit
exports.edit = (req, res, next) => {

    const {quiz} = req;

    res.render('quizzes/edit', {quiz});
};


// PUT /quizzes/:quizId
exports.update = (req, res, next) => {

    const {quiz, body} = req;

    quiz.question = body.question;
    quiz.answer = body.answer;

    quiz.save({fields: ["question", "answer"]})
    .then(quiz => {
        req.flash('success', 'Quiz edited successfully.');
        res.redirect('/quizzes/' + quiz.id);
    })
    .catch(Sequelize.ValidationError, error => {
        req.flash('error', 'There are errors in the form:');
        error.errors.forEach(({message}) => req.flash('error', message));
        res.render('quizzes/edit', {quiz});
    })
    .catch(error => {
        req.flash('error', 'Error editing the Quiz: ' + error.message);
        next(error);
    });
};


// DELETE /quizzes/:quizId
exports.destroy = (req, res, next) => {

    req.quiz.destroy()
    .then(() => {
        req.flash('success', 'Quiz deleted successfully.');
        res.redirect('/quizzes');
    })
    .catch(error => {
        req.flash('error', 'Error deleting the Quiz: ' + error.message);
        next(error);
    });
};


// GET /quizzes/:quizId/play
exports.play = (req, res, next) => {

    const {quiz, query} = req;

    const answer = query.answer || '';

    res.render('quizzes/play', {
        quiz,
        answer
    });
};


// GET /quizzes/:quizId/check
exports.check = (req, res, next) => {

    const {quiz, query} = req;

    const answer = query.answer || "";
    const result = answer.toLowerCase().trim() === quiz.answer.toLowerCase().trim();

    res.render('quizzes/result', {
        quiz,
        result,
        answer
    });
};


//GET /quizzes/randomplay
exports.randomplay = (req, res, next) => {

    if(req.session.randomplay===undefined)          //array de IDs
        req.session.randomplay=[];


    var condition1 = {"id": {[Sequelize.Op.notIn]: req.session.randomplay}};        //excluyo los ID que ya respondi

    /*CASO QUE SE ME ACABAN LOS QUIZZES*/
    return models.quiz.count({where: condition1}) //Cuento los ids que quedan del arrays
        .then(rest => {
            if(rest === 0){
            var puntuacion = req.session.randomplay.length;
            req.session.randomplay = [];        //elimino la sesion
            res.render('quizzes/random_nomore', {score: puntuacion});   //renderizo pantalla final con puntuacion
        }
        randomId = Math.floor(Math.random() * rest);        //ID aleatoria
        return models.quiz.findAll({where: condition1, limit:1, offset: randomId})    //limito busqueda a
                                                                                    //quiz que no he respondido
                                                                                    //ID igual al random
                                                                                    //limito a coger solo 1 quiz
            .then(quiz => {
            return quiz[0];
            })
        })
        /*CASO QUE SIGO JUGANDO*/
        .then(quiz1 => {
            var puntuacion = req.session.randomplay.length;
            res.render('quizzes/random_play', {quiz: quiz1, score: puntuacion});    //renderizo pantalla juego con pregunta aleatoria
        })
        .catch(err => {
                console.log(err);
        })

};

//GET /quizzes/randomcheck
exports.randomcheck = (req, res, next) => {

    const {quiz, query} = req;

    const answer = query.answer || "";
    const result = answer.toLowerCase().trim() === quiz.answer.toLowerCase().trim();
    const quizId = quiz.id;

    if(result){     //si es correcto, guardo el ID acertado en session, incremento puntuacion y renderizo pantalla de resultado
        req.session.randomplay.push(quizId);
        var puntuacion = req.session.randomplay.length;
        res.render('quizzes/random_result', {score: puntuacion, answer, result});
    }
    else{       //si no es correcto, compruebo la puntuacion actual y renderizo la pantalla de resultado
        var puntuacion = req.session.randomplay.length;
        //nuevo = 1;
        res.render('quizzes/random_result', {score: puntuacion, answer, result})
    }
};
const Sequelize = require("sequelize");
const {models} = require("../models");


// Autoload the tip with id equals to :tipId
exports.load = (req, res, next, tipId) => {

    models.tip.findById(tipId)
    .then(tip => {
        if (tip) {
            req.tip = tip;
            next();
        } else {
            next(new Error('There is no tip with tipId=' + tipId));
        }
    })
    .catch(error => next(error));
};


// POST /quizzes/:quizId/tips
exports.create = (req, res, next) => {


    //autor
    const authorId = req.session.user && req.session.user.id || 0;
    const tip = models.tip.build(
        {
            text: req.body.text,
            quizId: req.quiz.id,
            authorId: authorId
        });


    tip.save()
    .then(tip => {
        req.flash('success', 'Tip created successfully.');
        res.redirect("back");
    })
    .catch(Sequelize.ValidationError, error => {
        req.flash('error', 'There are errors in the form:');
        error.errors.forEach(({message}) => req.flash('error', message));
        res.redirect("back");
    })
    .catch(error => {
        req.flash('error', 'Error creating the new tip: ' + error.message);
        next(error);
    });
};


// GET /quizzes/:quizId/tips/new
exports.new = (req, res, next) => {

    const tip = {
        text: ""
    };

    const {quiz} = req;

    res.render('tips/new', {
        tip,
        quiz
    });
};

// GET /quizzes/:quizId/tips/:tipId/accept
exports.accept = (req, res, next) => {

    const {tip} = req;

    tip.accepted = true;

    tip.save(["accepted"])
    .then(tip => {
        req.flash('success', 'Tip accepted successfully.');
        res.redirect('/quizzes/' + req.params.quizId);
    })
    .catch(error => {
        req.flash('error', 'Error accepting the tip: ' + error.message);
        next(error);
    });
};


// DELETE /quizzes/:quizId/tips/:tipId
exports.destroy = (req, res, next) => {

    req.tip.destroy()
    .then(() => {
        req.flash('success', 'tip deleted successfully.');
        res.redirect('/quizzes/' + req.params.quizId);
    })
    .catch(error => next(error));
};


//ADMIN O AUTOR
exports.adminOrAuthorRequired = (req, res, next) => {

    const isAdmin  = req.session.user.isAdmin;
    const isAuthor = req.tip.authorId === req.session.user.id;

    if (isAdmin || isAuthor) {
        next();
    } else {
        console.log('Prohibited route: it is not the logged in user, nor an administrator.');
        res.send(403);
    }

};

//GET /quizzes/tips/edit
exports.edit = (req, res, next) => {
    const {quiz, tip} = req;

    res.render('tips/edit.ejs', {quiz, tip});
};


//PUT /quizzes/tips
exports.update = (req, res, next) => {

    const {tip, body} = req;

    tip.text= body.newTip;

    tip.save({fields: ["text"]})
        .then(tip => {
            req.flash('success', 'Tip edited successfully.');
            res.redirect('/goback');
        })
        .catch(Sequelize.ValidationError, error => {
            req.flash('error', 'There are errors in the form:');
            error.errors.forEach(({message}) => req.flash('error', message));
            res.render('tips/edit', {tip});
        })
        .catch(error => {
            req.flash('error', 'Error editing the Quiz: ' + error.message);
            next(error);
        });
};
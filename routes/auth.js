const express = require('express');
const router = express.Router();
const db = require('../lib/dbconfig') 

//display login page
router.get("/", (req,res) =>{
      
    res.render('index', {title: 'Login', session: req.session});
    })

//authenticate user        
router.post("/dashboard", function(req,res, next) {
    var message = '';
    var email = req?.body?.email;
    var password = req?.body?.password;
    

    if (email && password)
    {

            db.query('SELECT * FROM users WHERE email = ? AND password = ?', [email, password],
            function(error, result, fields) {
            if (error) throw (error);
                    if(result.length)
                    {
                            req.session.loggedin = true;
                            req.session.email = email;
                            res.render('dashboard');
                    } else {
                            message = '';
                            res.render("index",{message:'Incorrect email or password'});
                            }
                    });
                    }    
    });

    //Logout user
    router.get('/logout', function (req, res){
        req.session.destroy();
        req.flash('success','Login Again Here');
        res.render('/index');
    });

    module.exports = (router);
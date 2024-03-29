//authenticate user        
dashboard = function(req,res) {
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
                    } else {
                            res.render('index',{message:'testing'});
                    }    
    };

    module.exports = dashboard;
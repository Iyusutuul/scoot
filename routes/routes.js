exports.login = function(req,res)
{
    var message = '';
    var sess = req.session;

    if(req.method == "POST"){
        var post = req.body;
        var username = post.username;
        var password = post.password;

        var sql="SELECT id, username, email, FROM `users` WHERE `dispatcher_id`='"+
        dispatcher_id+"' and password = '"+password+"'";

        db.query(sql, function(err, results){
            if(results.length){
                req.session.userId = results[0].id;
                req.session.user =  results[0];
                console.log(results[0].id)
                res.redirect('corporate');
            }
            else{
                message = 'You have entered an invalid id or password!.';
                res.render('index.ejs',{message:message});
            }
        });
    } else {
        res.render('index.ejs',{message:message});
    }
};
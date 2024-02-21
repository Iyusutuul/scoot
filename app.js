const express= require('express');
const mysql = require("mysql2")
const dotenv = require ('dotenv')
const app = express(); //create express object
const bodyParser= require("body-parser")
const encoder = bodyParser.urlencoded({extended:false});
const path = require('path')
const bcrypt = require("bcryptjs")
const session = require('express-session');
const { request } = require('http');

app.use(session({
        secret: 'secret',
        resave: true,
        saveUninitialized: true

}));

dotenv.config({path: './.env'})    


//specify view engine
app.set('view engine','ejs');
app.set('views', path.join(__dirname, 'views'));

//Function to serve css files use 
app.use('/styles', express.static('styles'));
//function to render images like logo etc 
app.use('/public', express.static('public'));
app.use (express.static('/public'));
//configure express to receive form values as json
app.use(express.json());
app.use(express.urlencoded({ extended: true}))



//receive values a s json


//! Routes start
app.get("/", (req,res) =>{
      
        res.render("login",)
        })
        
app.post("/auth", function(req,res) {
        
        var email = request?.body?.email;
        var password = request?.body?.password;
        

        if (email && password) {
                db.query('SELECT * FROM users WHERE email = ? AND password = ?', [email, password],
                function(error, results, fields) {
                if (error) throw (error);
                if (results.length > 0) {
                        request.session.loggedin = true;
                        request.session.email = email;
                        request.session.password = password;
                        res.redirect("./profile")
                } else {
                        res.send('Incorrect Dispatcher_id and /or Password');
                }
                        res.end();
        });
} else {
        res.send('Please enter email and Password!');
        res.end();
        }
});


app.get("./corporate", function(req,res){
if (request.session.loggedin) {
        response. send('Welcome back, ' + request.session.email + '!');
        } else {
                res.send('Please login to view this page');
        }
        response.end();
});


               // Database connection
               const db = mysql.createConnection({
                host: process.env.DB_HOST,
                database: process.env.DATBASE,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                })
                    
        db.connect(function (err) {
        if (err) {
        return console.error('error: ' + err.message);
        }
        console.log('Connected to the MySQL server.');
        })
                                                                                        
        //create connection
   
        app.listen(3000 , ()=> {
        console.log(`Server is running`) 
});                                                                 

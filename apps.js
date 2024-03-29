const createError = require('http-errors')
const express= require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan')
const dotenv = require ('dotenv');
const session = require('express-session');
const flash= require('req-flash');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
 
const mysql = require('mysql2');
dotenv.config({path: './.env'}) 
const db = require('./lib/dbconfig')

const indexRouter = require('./routes/index')
const authRouter = require('./routes/auth');

const app = express(); //create express object
 
  
   // Database connection

               
db.connect(function (err) {
                if (err) {
                return console.error('error: ' + err.message);
                }
                console.log('Connected to the MySQL server.');
                })
                      

//setup view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine','ejs');

app.use(logger('dev'));
//configure express to receive form values as json
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false}));
app.use(cookieParser());
app.use('/styles', express.static(path.join(__dirname, 'styles'))); //Function to serve css files
//function to render images like logo etc 
app.use('/public', express.static('public'));
app.use (express.static('/public'));

app.use(session({
        secret: 'secret',
        resave: true,
        saveUninitialized: true,
        cookie: {maxAge: 60000}
}));

app.use(flash());

app.use('/',indexRouter);
app.use('/dashboard', authRouter);

app.use(function(req, res, next){
    next(createError(404));})

//error handler
app.use(function(err,req,res,next){
    //set locals only providing err in dev stage
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    
    //render the error page
    res.status(err.status || 500);
    res.render('error');
});

//! Routes start //htttp://localhost:3000/

//display login page
app.get("/", (req,res) =>{
      
        res.render("index", {title: 'Express', session: req.session});
        })
   
//authenticate user        
app.post("/dashboard", function(req,res) {
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
        });
  
app.get("/signup",(req,res)=>{
        res.render("signup")
});
          
app.post('/signup',(req,res)=>{
        message =  " ";
        const {firstname,lastname,location,mobile_num,
        email,dispatcher_id,password, confirm_password} = req.body
        
        db.query('SELECT email FROM users WHERE email= ?',[email],async(error,result)=>{
        if(error) {
                console.log(error);
        }
        
        if(result.length > 0) {
                return res.render('signup',{
                        message : "This email is already in use"
                        })                
                }else if (password !== confirm_password) {
                return res.render('signuptest',{
                                message: 'Passwords do not match!'
                })
        }
        
                const saltRounds = 10;
                let hashedPassword =  await bcrypt.hash(password,saltRounds)
                console.log(hashedPassword)

        db.query('INSERT INTO users SET?',{firstname: firstname, lastname:lastname,
                location:location,mobile_num:mobile_num,email:email,dispatcher_id:dispatcher_id,
                password:hashedPassword},(error,result)=>{
                if (error){
                        console.log(error)
                }
                else {
                res.render('signup',{
                        message: 'Registration Successful!'
                });
        }
})
        })
})
//create connection
app.listen(3000 , ()=> {
console.log(`Server is running`) 
});                                                            

module.exports = (app)
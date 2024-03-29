const express= require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan')
const dotenv = require ('dotenv');
const session = require('express-session');
const flash= require('req-flash');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');

const app = express(); //create express object
dotenv.config({path: './.env'})  
  
   // Database connection
const db = require('./lib/dbconfig')
               
db.connect(function (err) {
                if (err) {
                return console.error('error: ' + err.message);
                }
                console.log('Connected to the MySQL server.');
                })
//specify port number     
app.set('port', process.env.PORT || 8080);

//specify view engine
app.set('view engine','ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(logger('dev'));
//configure express to receive form values as json
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false}));
app.use(cookieParser());
app.use('/styles', express.static(path.join(__dirname, 'styles'))); //Function to serve css files
//function to render images like logo etc 
app.use('/public', express.static('public'));
app.use (express.static('/views'));

app.use(session({
        secret: 'secret',
        resave: true,
        saveUninitialized: true,
        cookie: {maxAge: 60000}
}));

app.use(flash());

//! Routes start //htttp://localhost:3000/

//GET/display login page
app.get("/", (req,res) =>{
      const message = req.flash('message')
        res.render("index",{message});
        });
//authenticate user     
app.post("/dashboard", function(req,res) {
        
        const email = req?.body?.email;
        const password = req?.body?.password;
        

        if (email && password)
        {
                db.query('SELECT * FROM users WHERE email = ? AND password = ?', [email, password],
                function(error, result, fields) {
                if (error) throw (error);
                        if(result.length > 0)
                        {
                                req.session.loggedin = true;
                                req.session.email = email;
                                res.render('dashboard');
                        } else {   
                                message = 'Incorrect email or password!!'
                                res.render('index',{message: message});
                                };
                        });
                        }    
        });
  
app.get("/signup",(req,res)=>{
        message = '';
        message_success = '';
        res.render("signup")
});
    
app.get('/capture', (req,res)=>{
        res.render("data_capture")
});

app.post('/signup',(req,res)=>{
         message = '';
         message_success = '';

        const {firstname,lastname,location,mobile_num,
        email,dispatcher_id,password, confirm_password} = req.body
        
        db.query('SELECT email FROM users WHERE email= ?',[email],async(error,result)=>{
      
        if(result.length) {
                message = 'Email is already in use';
                return res.render('signup',{message:message
                })                 
                }
                else if (password !== confirm_password) {
                message = 'Passwords do not match!';
                return res.render('signup',{message:message})
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
                 message_success = 'User Registered, now you can Login';
                 res.render('index',{message_success: message_success});
        }
})
        })
})

//create connection
app.listen(8080 , ()=> {
console.log(`Server is running`) 
});                                                            
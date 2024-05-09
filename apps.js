require('dotenv').config();
const express = require('express');
const user = require('./routes/user');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan')
const dotenv = require ('dotenv');
const session = require('express-session');
const flash= require('req-flash');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');

const app = express(); //create express object

const { storage } = require('./storage/storage');
const multer = require('multer');
const upload = multer({ storage });

//.env configurations
dotenv.config({path: './.env'})  
  
   // Database connection
const db = require('./lib/dbconfig')
               

//specify port number     
app.set('port', process.env.PORT || 8080);

//specify view engine
app.set('view engine','ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(logger('dev'));
//configure express to receive form values as json
app.use(express.json());
app.use(express.urlencoded({ extended: true}));
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
      const firstname = req.flash('name')
      const message = req.flash('message')
      
        res.render("index",{message,firstname});
        });
//authenticate user     
app.post("/dashboard", function(req,res) {
        message = '';
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
                                message = 'Incorrect Email or Password!!'
                                res.render('index',{message: message});
                                };
                        });
                        }    
        });
  
app.get('/dashboard', (req,res)=>{
        res.render("index")
});
app.get('/capture', (req,res)=>{
        res.render("data_capture")
})

app.get('/visits', (req,res)=>{
        message = req.flash('message');
        message = ''
        res.render('daily_visits',{message})
})
//get index page
app.get('/login', (req,res)=>{
        res.render('index')
})
//get sign-up page
app.get("/signup",(req,res)=>{
        const firstname = req.flash('name')
        
        message = '';
        message_success = '';
        res.render('signup', { firstname })
});

app.post('/signup',(req,res)=>{

        const {firstname,lastname,location,mobile_num,
                email,dispatcher_id,password, confirm_password} = req.body

        message = '';
        message_success = '';
        
        db.query('SELECT email,dispatcher_id FROM users WHERE email= ?',[email,dispatcher_id],async(error,result)=>{
      
        if(result.length) {
                message = 'Email is already in use';
                return res.render('signup',{message:message})      
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
                req.flash('name', req.body.firstname)
                message_success = 'Registration Successful, Please Login';
                res.render('index',{message_success: message_success});
        }
})
        })
});
app.post('/visits', (req,res)=>{

        message_success = '';

        if(req.method == "POST"){

                const reference = req?.body?.reference;
                const merchant_name = req?.body?.merchant_name;
                const merchant_address = req?.body?.merchant_address;
                const terminal_id = req?.body?.terminal_id;
                const status = req?.body?.status;
                
        db.query('INSERT IGNORE INTO dailyvisits SET?',{reference: reference, merchant_name:merchant_name, merchant_address:merchant_address,
                terminal_id: terminal_id, status: status},(error,result)=>{
                if (error) {
                console.log(error)
        }
        else {                 
               message_success = 'Record has been successfully saved';
               return res.render('daily_visits', {message_success: message_success});
               };
       });
};
});

app.post('/visits', upload.single('image'), (req, res) => {
         console.log(req.file);
        res.send('Done');
})

//create connection
app.listen(8080 , ()=> {
console.log(`Server is running`) 
});                                                            

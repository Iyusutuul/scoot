const cloudinary = require('cloudinary'); 
require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan')
const dotenv = require ('dotenv');
const session = require('express-session');
const flash= require('req-flash');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const ejs = require('ejs');

const app = express(); //create express object

// const uploadMiddleware = require("./uploadMiddleware");
// const upload = uploadMiddleware("UP/PDO");

// UPLOAD METHOD 2
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
app.use(bodyParser.urlencoded({ extended: true}));
app.use(bodyParser.json())
app.use(cookieParser());
app.use('/styles', express.static(path.join(__dirname, 'styles'))); //Function to serve css files
//function to render images like logo etc 
app.use('/public', express.static('public'));
app.use (express.static('/views'));

app.use(session({
        secret: 'secret',
        secure: 'true',
        resave: true,
        saveUninitialized: true,
        cookie: {maxAge: 600000}
}));

app.use(flash());

//! Routes start //htttp://localhost:8080/
// Middleware to check if the user is authenticated
const isAuthenticated = (req, res, next) => {
        if (req.session.loggedin) {
            // User is authenticated, allow access to the requested route
            next();
        } else {
            // User is not authenticated, redirect to the login page
            res.redirect('/'); // Adjust the URL to your login page
        }
    };
    
    app.get('/logout', (req, res) => {
        // Clear the session or any user-related data
        req.session.destroy((err) => {
            if (err) {
                console.error('Error destroying session:', err);
            } else {
                // Redirect the user to a login page or any other appropriate page
                res.redirect('/');
            }
        });
    });


//GET/display login page
app.get("/", (req,res) =>{
    
        message = '';
        message_success= ''; 
        
        res.render("pages/index");
        });
//authenticate user     
app.post("/dashboard", (req,res)=>{
        message = '';
        message_success = '';
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
                                req.session.userId = result[0].id;
                                console.log(result[0].id)
                                req.session.user = result[0];
                                console.log(result[0])
                                req.session.email = email;
                                res.render('pages/dashboard');
                        } else {   
                                message = 'Incorrect Email or Password!!'
                                res.render('pages/index',{message: message});
                                console.log(req.body)
                                return
                                };
                        });
                        }    
        });
  
app.get('/dashboard', isAuthenticated, (req,res)=>{
        message = '';
        message_success = '';
        res.render("pages/dashboard")
});
app.get('/capture', isAuthenticated, (req,res)=>{
        res.render("pages/datacapture")
});

app.post('/capture', (req,res)=>{

        msg = '';

        if (req.method == "POST"){
        const {application_type,term_type,term_serial,sim_type,sim_serial,status,reference} = req.body

              db.query('INSERT INTO datacapture SET?',
              {application_type:application_type, term_type:term_type, term_serial:term_serial,
              sim_type:sim_type, sim_serial:sim_serial, status: status,reference: reference},(error, result)=>{
                if(error){
                console.log(error)
              }
              else {
                msg = "Data successfully stored"
                res.render('pages/datacapture',{msg: msg});
              };
       });
};
});

app.get('/profile', isAuthenticated, (req,res)=>{
        message='';
        message_success = '';
        
        var userId = req.session.userId;
        if (userId == null){
                res.render("pages/index");
                return
        }

        var sql="SELECT * FROM `users` WHERE `id` = '"+userId+"'";
        db.query(sql, function(err,result){
                res.render('pages/user_profile',{data:result});
        });
});

//render sign-up page
app.get("/signup",(req,res)=>{
        const reference = req.flash('ref')
        
        message = '';
        message_success = '';
        res.render('pages/signup', { reference })
});


app.post('/signup',(req,res)=>{

        const {firstname,lastname,location,mobile_num,
                email,dispatcher_id,password, confirm_password} = req.body

        message = '';
        message_success = '';
        
        db.query('SELECT email,dispatcher_id FROM users WHERE email= ?',[email,dispatcher_id],async(error,result)=>{
      
        if(result.length) {
                message = 'Email is already in use';
                return res.render('pages/signup',{message:message})      
                }
                
                
                else if (password !== confirm_password) {
                message = 'Passwords do not match!';
                return res.render('pages/signup',{message:message})
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
                res.render('pages/index',{message_success: message_success});
        }
})
        })
});


app.get('/visits', (req,res)=>{
        message = req.flash('message');
        msg_success = ''
        res.render('pages/dailyvisits',{msg_success})
});

//  app.post('/visits', (req,res)=>{
//          msg_success = '';
//          message = '';

//          if(req.method == "POST"){

//                  const reference = req?.body?.reference;
//                  const merchant_name = req?.body?.merchant_name;
//                  const merchant_address = req?.body?.merchant_address;
//                  const terminal_id = req?.body?.terminal_id;
//                  const status = req?.body?.status;
                
//          db.query('INSERT IGNORE INTO dailyvisits SET?',{reference: reference, merchant_name:merchant_name, merchant_address:merchant_address,
//                  terminal_id: terminal_id, status: status},(error,result)=>{
//                  if (error) {
//                  console.log(error)
//          }
//          else {                 req.flash('message_success', req.body.firstname)
//                 msg_success = 'Success, Record saved!!! ';
//                res.render('dailyvisits', {msg_success: msg_success});
//                 };
//         });
//  };
//  });

app.get('/indexAdmin', (req,res)=>{
        var q = req.query.q;
        var callback = function(result){
               
                var searchValue = '';
                if(q){
                        searchValue = q;
                }

        res.render('indexAdmin',{posts:result.resources, searchValue:searchValue});
        };
        if(q){
                cloudinary.api.resources(callback,
                        {
                        type:'upload', prefix: q});
                } else {
                        cloudinary.api.resources(callback);
                };
               
                });
       
 app.post('/visits', upload.single('image'), (req, res) => {
 // if (!req.file) {
//         // No file was uploaded
//         return res.status(500).json({ error: "No file uploaded" });
//       }
 console.log(req.file);
 res.send('File upload Successful');
})
 
//create connection
app.listen(8080 , ()=> {
console.log(`Server is running`) 
});                                                            

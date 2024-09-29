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
// const { v4: uuidv4 } = require('uuid');
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
        resave: false,
        saveUninitialized: false,
        cookie: {maxAge: 1000000}
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
        const message = req.query.message || '';
        message_success= ''; 
        
        res.render("pages/corporatelogin",{message});
        });

app.get("/supervisor", (req,res) =>{
        res.render("admin/supervisorDash");
});

app.get("/transGallery", (req,res)=>{
    res.render("admin/transSlip");
});

app.get("/viewpending", (req,res) =>{
        res.render("pages/pending_tasks")
})

//authenticate user     
app.post("/dashboard", (req,res)=>{
        let message = '';
        message_success = '';
        const { email,password } = req.body
       

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
                                console.log(req.session.email);
                                res.redirect('/dashboard');
                        } else {   
                                message = 'Incorrect Email or Password!!'
                               
                                res.redirect(303, `/?message=${encodeURIComponent(message)}`);
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
app.get('/capture', isAuthenticated, (req, res) => {
    const msg = req.query.msg || '';
    
    // Access user data directly from the session
    const userId = req.session.userId;

    if (!userId) {
        return res.redirect('/login'); // Redirect to login if user ID is not in session
    }

    const query = 'SELECT * FROM users WHERE id = ?';
    db.query(query, [userId], (err, results) => {
        if (err || results.length === 0) {
            return res.redirect('/login'); // Redirect if user not found
        }

        const user = results[0];
        const profilePicUrl = user.profile_pic_url || 'default-profile.png'; // Fallback image
        const firstname = user.firstname || 'User'; // Default name

        res.render("pages/datacapture", { msg, profilePicUrl, firstname });
    });
});

app.post('/capture', (req,res)=>{
        let msg = 'Record Saved';
        
        if (req.method == "POST"){
        const {application_type ,term_type,term_serial,sim_type,sim_serial,status,reference,rrn} = req.body

        const query = 'INSERT IGNORE INTO datacapture SET ?';
        const values = { application_type, term_type, term_serial, sim_type,
                         sim_serial, status, reference,rrn};

                         db.query(query, values, (err, result) => {
                                if (err) {
                                  console.error('Database error:', err);
                                  return res.status(500).send('Error saving record');
                                }
              else {
                msg = "Data Capture Successful"
                res.redirect(303, `/capture?msg=${encodeURIComponent(msg)}`);
                console.log(req.body);
              };
              
             
       });
};
});

//display profile page
app.get('/profile', isAuthenticated, (req, res) => {
    const userId = req.session.userId;
    console.log("User ID from session:", userId);

    if (userId == null) {
        res.render("pages/corporatelogin");
        return;
    }
    
    const sql = "SELECT * FROM `users` WHERE `id` = ?";
    console.log("SQL Query:", sql, [userId]);

    db.query(sql, [userId], (err, result) => {
        if (err) {
            console.error("Database query error:", err);
            res.status(500).send("Internal Server Error");
            return;
        }
        
        console.log("Query result:", result);

        if (result.length > 0) {
            const user = result[0];
            res.render('pages/user_profile', { 
                firstname: user.firstname,
                profilePicUrl: user.profile_pic_url 
            });
        } else {
            console.log("No user found for userId:", userId);
            res.status(404).send("User not found");
        }
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
                res.render('pages/corporatelogin',{message_success: message_success});
        }
})
         })
});

app.post('/visits', upload.single('image'), async (req, res) => {
    const { merchant_name, merchant_address, terminal_id, rrn, status } = req.body;
    const file = req.file;

    if (!file) {
        console.error('No file uploaded');
        return res.status(400).send('No file uploaded');
    }

    try {
        // Upload file to Cloudinary
        const result = await cloudinary.uploader.upload(file.path);

        // Get the Cloudinary URL of the uploaded file
        const image_url = result.secure_url;

    // Insert data into the database
    const query = 'INSERT IGNORE INTO dailyvisits SET ?';
    const values = {merchant_name, merchant_address, terminal_id, rrn, status, image_url, 
            tags: JSON.stringify(req.body.tags)};

        db.query(query, values, (error) => {
            if (error) {
                console.error('Database error:', error);
                return res.status(500).send('Error saving record');
            }

            const msg_success = 'Success, Record saved!!!';
            console.log('File uploaded to Cloudinary:', image_url);
            res.redirect(`/visits?msg_success=${encodeURIComponent(msg_success)}`);
        });
    } catch (err) {
        console.error('Cloudinary upload error:', err);
        res.status(500).send('Error uploading file to Cloudinary');
    }
});

app.get('/visits', isAuthenticated, (req,res)=>{
        const msg_success = req.query.msg_success || '';
        res.render('pages/dailyvisits', {msg_success});
});
  
  app.get('/indexAdmin', (req, res) => {
        var q = req.query.q;
        var nextCursor = req.query.next_cursor; // For pagination
        var callback = function(result) {
            var searchValue = '';
            if (q) {
                searchValue = q;
            }
    
            res.render('admin/indexAdmins', { 
                posts: result.resources, 
                searchValue: searchValue,
                nextCursor: result.next_cursor // Pass the next cursor for pagination
            });
        };
    
        var options = {
            max_results: 50 // Adjust this value based on desired page size
        };
    
        if (q) {
            options.type = 'upload';
            options.prefix = q;
        }
    
        if (nextCursor) {
            options.next_cursor = nextCursor;
        }
    
        cloudinary.api.resources(callback, options);
    });
    
    app.get('/loadMoreImages', (req, res) => {
        var nextCursor = req.query.next_cursor;
        var q = req.query.q;
        var callback = function(result) {
            res.json({
                posts: result.resources,
                nextCursor: result.next_cursor
            });
        };
    
        var options = {
            max_results: 50 // Adjust this value based on desired page size
        };
    
        if (q) {
            options.type = 'upload';
            options.prefix = q;
        }
    
        if (nextCursor) {
            options.next_cursor = nextCursor;
        }
    
        cloudinary.api.resources(callback, options);
    });
    
app.get('/pdoPerformance', (req,res)=>{
        res.render("admin/performanceChart")
    });
       
//  app.post('/visits', upload.single('image'), (req, res) => {
//   if (!req.file) {
//          // No file was uploaded
//          return res.status(500).json({ error: "No file uploaded" });
//        }
//  console.log(req.file);
//  res.send('File upload Successful');
// })
 
//create connection
app.listen(8080 , ()=> {
console.log(`Server is running on port 8080`) 
});                                                            

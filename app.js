import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import cloudinary from 'cloudinary';
import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import session from 'express-session';
import Sequelize from 'sequelize';
import connectSessionSequelize from 'connect-session-sequelize';
import flash from 'req-flash';
import bodyParser from 'body-parser';
import bcrypt from 'bcryptjs';

// Load environment variables
dotenv.config();

// Initialize SequelizeStore
const SequelizeStore = connectSessionSequelize(session.Store);


const pool = mysql.createPool({
  host: process.env.TIDB_HOST,
  user: process.env.TIDB_USER,
  password: process.env.TIDB_PASSWORD,
  database: process.env.TIDB_DATABASE,
  port: process.env.TIDB_PORT || 4000,
  ssl: {
    // TiDB Cloud typically requires SSL
    rejectUnauthorized: true
  }
});

const sequelize = new Sequelize(
  process.env.TIDB_DATABASE,
  process.env.TIDB_USER,
  process.env.TIDB_PASSWORD,
  {
    host: process.env.TIDB_HOST,
    port: process.env.TIDB_PORT || 4000,
    dialect: 'mysql',
    dialectOptions: {
      ssl: { rejectUnauthorized: true }
    },
    logging: false
  }
);
const store = new SequelizeStore({
  db: sequelize,
});

store.sync(); // Make sure the session table exists



// Initialize Cloudinary with your credentials
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET
});

const app = express(); //create express object

// const uploadMiddleware = require("./uploadMiddleware");
// const upload = uploadMiddleware("UP/PDO");

// UPLOAD METHOD 2
import { storage } from './storage/storage.js';
import multer from 'multer';
// import { v4 as uuidv4 } from 'uuid';
const upload = multer({ storage });
  
// // Database connection
// import pool from './lib/dbconfig.js';
               
//specify port number     
app.set('port', process.env.PORT || 8080);

//specify view engine
app.set('view engine','ejs');
app.set('views', path.join(path.resolve(), 'views')); // Ensure to set the correct folder

app.use(logger('dev'));
//configure express to receive form values as json
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true}));
app.use(bodyParser.json())
app.use(cookieParser());
app.use(express.static(path.join(process.cwd(), 'public'))); //Function to serve static files
app.use('/public', express.static('public'));
app.use (express.static('/views'));


app.set('trust proxy', 1); // Required on Render for secure cookies

app.use(session({
  secret: process.env.SESSION_SECRET || 'secret123',
  store: store,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 60 * 1000, // ✅ 30 minutes
    secure: false, // ✅ Ensures cookie only sent over HTTPS (Render uses HTTPS)
    sameSite: 'lax' // Good default for security
  }
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

 app.post('/signup', async (req, res) => {
    const { firstname, lastname, location, mobile_num, email, dispatcher_id, password, confirm_password } = req.body;

    let message = '';
    let message_success = '';

    pool.query('SELECT email FROM users WHERE email = ?', [email], async (error, result) => {
        if (result.length) {
            message = 'Email is already in use';
            return res.render('pages/signup', { message, message_success: '' });
        } 

        if (password !== confirm_password) {
            message = 'Passwords do not match!';
            return res.render('pages/signup', { message, message_success: '' });
        }

        const saltRounds = 10;
        let hashedPassword = await bcrypt.hash(password, saltRounds);
        console.log(hashedPassword);

        db.query('INSERT INTO users SET ?', {
            firstname,
            lastname,
            location,
            mobile_num,
            email,
            dispatcher_id,
            password: hashedPassword
        }, (error, result) => {
            if (error) {
                console.log(error);
                // Optionally render with error message
                message = 'NIN/ID already in DB.';
                return res.render('pages/signup', { message, message_success: '' });
            } else {
                req.flash('name', firstname);
                message_success = 'Registration Successful, Please Login';
                return res.render('pages/corporatelogin', { message: '', message_success });
            }
        });
    });
});

//GET/display login page
app.get("/", (req,res) =>{
        const message = req.query.message || '';
       
        
        res.render("pages/teteofafrica",{message});
        });

        //GET/display login page
app.get("/login", (req,res) =>{
        const message = req.query.message || '';
       
        
        res.render("pages/corporatelogin",{message});
        });

//supervisor dashboard
app.get("/supervisor", (req,res) =>{
        res.render("admin/supervisorDash");
});

app.get("/transGallery", (req,res)=>{
    res.render("admin/transSlip");
});

app.get("/pendingReview", (req,res)=>{
    res.render("admin/pendingApproval");
});

app.get("/viewpending", (req,res) =>{
        res.render("pages/pending_tasks")
})

app.get('/roadmap', (req, res) => {
    pool.query('SELECT * FROM roadmap WHERE status = "Pending"', (err, results) => {
        if (err) {
            console.error('Error fetching rows:', err);
            return res.status(500).send('Error fetching rows.');
        }

        // Render the "pending_tasks" page and pass the data
        res.render('pages/pending_tasks', { submissions: results });
    });
});

app.post('/update_roadmap', upload.single('image'), async (req, res) => {
    const { status, id } = req.body;  // Get status and id from the request body
    const file = req.file;  // File uploaded by the user

    // Check if the file and required fields are present
    if (!file) {
        console.error('No file uploaded');
        return res.status(400).send('No file uploaded');
    }

    if (!status || !id) {
        return res.status(400).send('Status or ID is missing');
    }

    try {
        // Step 1: Upload the file to Cloudinary
        const cloudinaryResult = await cloudinary.uploader.upload(file.path);
        const image_url = cloudinaryResult.secure_url;

        // Step 2: Update the database with the new status and image URL, marking as pending = false after submission
        const query = 'UPDATE roadmap SET status = ?, image_url = ?, pending = ? WHERE id = ?';
        const values = [status, image_url, false, id];  // Mark as processed (pending = false)

        pool.query(query, values, (error) => {
            if (error) {
                console.error('Database error:', error);
                return res.status(500).send('Error saving record');
            }

            console.log('File uploaded to Cloudinary:', image_url);

            // Step 3: Respond back to frontend with updated row info
            res.json({
                message: 'Roadmap updated successfully',
                updatedStatus: status,
                updatedImageUrl: image_url,
                updatedPending: false,  // Mark as processed (pending = false)
            });
        });
    } catch (err) {
        console.error('Cloudinary upload error:', err);
        res.status(500).send('Error uploading file to Cloudinary');
    }
});


app.get('/dashboard', isAuthenticated, (req, res) => {
    const userId = req.session.userId;
    const basePay = 309.09; // Set your fixed base pay here

    // Fetch user tag and other necessary data
    pool.query('SELECT tags, profile_pic_url FROM users WHERE id = ?', [userId], (error, results) => {
        if (error) {
            console.error('Database query error:', error);
            return res.status(500).send("Internal Server Error");
        }
    
        const userTag = results.length > 0 ? results[0].tags : null;
        const user = results[0]
        const profilePicUrl = results.length > 0 ? results[0].profile_pic_url : null;
    
        // Log the values
        console.log('User tag:', userTag);
        console.log('Profile Picture URL:', profilePicUrl);

        // Fetch additional metrics
        const queries = {
            totalInputs: 'SELECT COUNT(*) as count FROM dailyvisits WHERE tags = ?'
        };

        const promises = Object.entries(queries).map(([key, query]) => {
            return new Promise((resolve, reject) => {
                const queryParams = key === 'totalInputs' ? [userTag] : [];
                console.log(`Running query for ${key}:`, query, queryParams);
                pool.query(query, queryParams, (error, results) => {
                    if (error) {
                        console.error(`Database query error for ${key}:`, error);
                        return reject(error);
                    }
                    resolve(results[0] ? results[0].count : 0);
                });
            });
        });

        Promise.all(promises)
            .then(([totalInputs]) => {
                const totalEarnings = (basePay * totalInputs).toFixed(2); // Format to 2 decimal places
                // Render the dashboard and pass all data to the template
                res.render("pages/dashboard", { 
                    basePay, userTag, totalInputs,totalEarnings,
                    profilePicUrl: user.profile_pic_url });
            })
            .catch(err => {
                console.error('Error fetching additional data:', err);
                res.status(500).send("Internal Server Error");
            });
    });
});

//authenticate user     
app.post("/dashboard", (req,res)=>{
        let message = '';
        const { email,password } = req.body

        if (email && password)
        {
                pool.query('SELECT * FROM users WHERE email = ? AND password = ?', [email, password],
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
  
       
        

app.get('/capture', isAuthenticated, (req, res) => {
    const msg = req.query.msg || '';
    
    // Access user data directly from the session
    const userId = req.session.userId;

    if (!userId) {
        return res.redirect('/login'); // Redirect to login if user ID is not in session
    }

    const query = 'SELECT * FROM users WHERE id = ?';
    pool.query(query, [userId], (err, results) => {
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

                         pool.query(query, values, (err, result) => {
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

    pool.query(sql, [userId], (err, result) => {
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
app.get("/signup", (req, res) => {
    const reference = req.flash('ref');

    const message = '';
    const message_success = '';

    res.render('pages/signup', { reference, message, message_success });
});



//

app.get('/visits', isAuthenticated, async (req, res) => {
    const userId = req.session.userId;
    console.log("User ID from session:", userId);

    const msg_success = req.query.msg_success || '';

    try {
        const user = await getUserById(userId);
        if (!user) {
            return res.status(404).send('User not found');
        }

        res.render('pages/dailyvisits', {
            msg_success,
            firstname: user.firstname,
            profilePicUrl: user.profile_pic_url 
        });
    } catch (error) {
        console.error('Error retrieving user:', error);
        res.status(500).send('Internal Server Error');
    }
    async function getUserById(userId) {
        return new Promise((resolve, reject) => {
            pool.query('SELECT firstname, profile_pic_url FROM users WHERE id = ?', [userId], (error, results) => {
                if (error) return reject(error);
                resolve(results[0]); // Assuming you want the first result
            });
        });
    }
    
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

        pool.query(query, values, (error) => {
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

//displays the image gallery for admin to view cloudinary storage
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

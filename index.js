import express from 'express';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import bcrypt from 'bcrypt';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import session from 'express-session';
import dotenv from 'dotenv';
import db from './utils/db.js';
import { calculateTaxes } from './utils/taxCalculations.js';
import revenueRoutes from './routes/revenue.js';
import expenseRoutes from './routes/expense.js';
import adminRoutes from './routes/admin.js';
import dashboardRoutes from './routes/dashboard.js';
import { ensureAuthenticated, ensureAdminLevel } from './utils/authMiddleware.js';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 3000;

// Middleware setup
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/client'));
app.use('/admin', express.static(__dirname + '/client/admin'));

// Initialize session BEFORE passport middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 saat
    }
}));

// Initialize Passport AFTER session middleware
app.use(passport.initialize());
app.use(passport.session());

// Set EJS as template engine
app.set('view engine', 'ejs');
app.set('views', __dirname + '/client');

// Add findUserByUsername function before passport configuration
async function findUserByUsername(username) {
    try {
        const query = `SELECT * FROM users WHERE username = $1`;
        const result = await db.query(query, [username]);
        return result.rows[0];
    } catch (err) {
        console.error('Error finding user:', err);
        throw err;
    }
}

// Passport local strategy for user authentication
passport.use(
    new LocalStrategy(async (username, password, done) => {
        try {
            const user = await findUserByUsername(username);
            if (!user) return done(null, false, { message: 'Incorrect username.' });

            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) return done(null, false, { message: 'Incorrect password.' });

            return done(null, user);
        } catch (err) {
            return done(err);
        }
    })
);

// Serialize user for session management
passport.serializeUser((user, done) => done(null, user.id));

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
    try {
        const query = `SELECT * FROM users WHERE id = $1`;
        const result = await db.query(query, [id]);
        const user = result.rows[0];
        done(null, user);
    } catch (err) {
        done(err);
    }
});

// Login page route
app.get('/login', (req, res) => {
    res.render('login');
});

// Login process route
app.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            console.error('Authentication error:', err);
            return res.status(500).render('login', { error: 'Internal server error' });
        }
        if (!user) {
            // If authentication fails
            return res.status(401).render('login', { error: 'Incorrect username or password' });
        }
        req.logIn(user, (err) => {
            if (err) {
                console.error('Login error:', err);
                return res.status(500).render('login', { error: 'Internal server error' });
            }
            // Successful login
            return res.redirect('/dashboard');
        });
    })(req, res, next);
});

// Logout route
app.get('/logout', (req, res) => {
    req.logout(err => {
        if (err) return next(err);
        res.redirect('/login');
    });
});

// Admin routes
app.use('/admin', adminRoutes);

// Serve the index.ejs file
app.get('/', (req, res) => {
    res.render('index');
});

// Serve the register.ejs file
app.get('/register', (req, res) => {
    res.render('register');
});

// Handle register form submission
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // Check if email is already in use
        const emailCheck = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (emailCheck.rows.length > 0) {
            return res.render('register', { error: 'Email already in use' });
        }

        // Check if username is already taken
        const usernameCheck = await db.query('SELECT * FROM users WHERE username = $1', [username]);
        if (usernameCheck.rows.length > 0) {
            return res.render('register', { error: 'Username already taken' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert the new user into the database
        const query = `
            INSERT INTO users (username, email, password)
            VALUES ($1, $2, $3)
        `;
        const values = [username, email, hashedPassword];

        await db.query(query, values);

        // Redirect to the login page after successful registration
        res.redirect('/login');
    } catch (err) {
        console.error('Error registering user:', err.stack);
        res.render('register', { error: 'Error registering user' });
    }
});

// Add dashboard routes
app.use('/dashboard', dashboardRoutes);

// Serve the tax.ejs file with calculated cooperate tax, income tax, and accommodation tax
app.get('/tax', ensureAuthenticated, ensureAdminLevel(3), async (req, res) => {
    try {
        const selectedYear = parseInt(req.query.year) || new Date().getFullYear();

        // Calculate taxes using the calculateTaxes function
        const taxData = await calculateTaxes(selectedYear);

        res.render('tax', {
            ...taxData,
            selectedYear,
            user: req.user
        });
    } catch (err) {
        console.error('Error calculating taxes:', err.stack);
        res.status(500).send('Error calculating taxes');
    }
});

// Revenue routes
app.use('/revenue', revenueRoutes);

// Expense routes
app.use('/expense', expenseRoutes);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
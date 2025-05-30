// Import necessary modules
import express from 'express';
import bcrypt from 'bcrypt';
import db from '../utils/db.js';
import { logAction } from '../utils/logger.js';

const router = express.Router(); // Initialize the router

// Admin Login Page
// Renders the admin login page with an optional error message
router.get('/login', (req, res) => {
    res.render('admin/login', { 
        error: req.query.error // Pass error message if login fails
    });
});

// Admin Login Process
// Handles admin login by verifying username and password
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Query the database for the admin by username
        const query = 'SELECT * FROM admins WHERE username = $1';
        const result = await db.query(query, [username]);

        if (result.rows.length === 0) {
            // Redirect to login page with error if admin not found
            return res.redirect('/admin/login?error=invalid');
        }

        const admin = result.rows[0];
        const isPasswordValid = await bcrypt.compare(password, admin.password); // Verify password

        if (!isPasswordValid) {
            // Redirect to login page with error if password is incorrect
            return res.redirect('/admin/login?error=invalid');
        }

        // Set admin session details
        req.session.isAdmin = true;
        req.session.adminId = admin.id;
        req.session.adminUsername = admin.username;

        req.session.save(() => {
            // Redirect to admin home page after successful login
            res.redirect('/admin/home');
        });
    } catch (err) {
        console.error('Error during admin login:', err.stack); // Log errors
        res.redirect('/admin/login?error=server'); // Redirect on server error
    }
});

// Admin Home Page
// Displays a paginated list of all admins
router.get('/home', async (req, res) => {
    if (!req.session.isAdmin) {
        // Redirect to login page if not authenticated as admin
        return res.redirect('/admin/login');
    }
    
    try {
        const page = parseInt(req.query.page) || 1; // Get the current page number
        const limit = 10; // Number of admins per page
        const offset = (page - 1) * limit; // Calculate offset for pagination

        // Query the total number of admins
        const countResult = await db.query('SELECT COUNT(*) FROM admins');
        const totalEntries = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(totalEntries / limit);

        // Query the admins for the current page
        const result = await db.query(
            'SELECT id, username, email, created_at FROM admins ORDER BY id ASC LIMIT $1 OFFSET $2',
            [limit, offset]
        );

        // Render the admin home page with the list of admins
        res.render('admin/home', {
            user: {
                isAdmin: true,
                username: req.session.adminUsername,
                adminId: req.session.adminId
            },
            admins: result.rows,
            currentPage: page,
            totalPages: totalPages
        });
    } catch (err) {
        console.error('Error fetching admins:', err.stack); // Log errors
        res.status(500).send('Error fetching admins data'); // Send error response
    }
});

// Create New Admin
// Adds a new admin to the database
router.post('/create', async (req, res) => {
    if (!req.session.isAdmin) {
        // Return unauthorized error if not authenticated as admin
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const { username, email, password } = req.body;

    try {
        // Check if the username already exists
        const userCheck = await db.query('SELECT * FROM admins WHERE username = $1', [username]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert the new admin into the database
        const query = 'INSERT INTO admins (username, email, password) VALUES ($1, $2, $3) RETURNING id';
        const result = await db.query(query, [username, email, hashedPassword]);

        // Log the action
        await logAction(req.session.adminUsername, 'CREATE_ADMIN', `Created new admin: ${username}`);
        res.status(201).json({ message: 'Admin created successfully' });
    } catch (err) {
        console.error('Error creating admin:', err); // Log errors
        res.status(500).json({ message: 'Error creating admin' }); // Send error response
    }
});

// Delete Admin
// Deletes an admin from the database
router.delete('/delete/:id', async (req, res) => {
    if (!req.session.isAdmin) {
        // Return unauthorized error if not authenticated as admin
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (parseInt(id) === req.session.adminId) {
        return res.status(400).json({ message: 'Cannot delete yourself' });
    }

    try {
        // Delete the admin from the database
        const result = await db.query('DELETE FROM admins WHERE id = $1 RETURNING username', [id]);
        
        if (result.rows.length === 0) {
            // Return not found error if admin does not exist
            return res.status(404).json({ message: 'Admin not found' });
        }

        // Log the action
        await logAction(req.session.adminUsername, 'DELETE_ADMIN', `Deleted admin with ID: ${id}`);
        res.json({ message: 'Admin deleted successfully' });
    } catch (err) {
        console.error('Error deleting admin:', err); // Log errors
        res.status(500).json({ message: 'Error deleting admin' }); // Send error response
    }
});

// Admin Logs Page
// Displays a paginated list of system logs
router.get('/logs', async (req, res) => {
    if (!req.session.isAdmin) {
        // Redirect to login page if not authenticated as admin
        return res.redirect('/admin/login');
    }

    try {
        const page = parseInt(req.query.page) || 1; // Get the current page number
        const limit = 15; // Number of logs per page
        const offset = (page - 1) * limit; // Calculate offset for pagination

        // Query the total number of logs
        const countResult = await db.query('SELECT COUNT(*) FROM system_logs');
        const totalEntries = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(totalEntries / limit);

        // Query the logs for the current page
        const result = await db.query(
            'SELECT * FROM system_logs ORDER BY created_at DESC LIMIT $1 OFFSET $2',
            [limit, offset]
        );

        // Render the logs page with the list of logs
        res.render('admin/logs', {
            user: {
                isAdmin: true,
                username: req.session.adminUsername
            },
            logs: result.rows,
            currentPage: page,
            totalPages: totalPages
        });
    } catch (err) {
        console.error('Error fetching logs:', err.stack); // Log errors
        res.status(500).send('Error fetching logs data'); // Send error response
    }
});

// Admin Settings Page
// Displays a paginated list of users
router.get('/settings', async (req, res) => {
    if (!req.session.isAdmin) {
        // Redirect to login page if not authenticated as admin
        return res.redirect('/admin/login');
    }

    try {
        const page = parseInt(req.query.page) || 1; // Get the current page number
        const limit = 10; // Number of users per page
        const offset = (page - 1) * limit; // Calculate offset for pagination

        // Query the total number of users
        const countResult = await db.query('SELECT COUNT(*) FROM users');
        const totalEntries = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(totalEntries / limit);

        // Query the users for the current page
        const result = await db.query(
            'SELECT id, username, email, level, created_at FROM users ORDER BY id ASC LIMIT $1 OFFSET $2',
            [limit, offset]
        );

        // Render the settings page with the list of users
        res.render('admin/settings', {
            user: {
                isAdmin: true,
                username: req.session.adminUsername
            },
            users: result.rows,
            currentPage: page,
            totalPages: totalPages
        });
    } catch (err) {
        console.error('Error fetching users:', err.stack); // Log errors
        res.status(500).send('Error fetching users data'); // Send error response
    }
});

// Update User Level
// Updates the access level of a user
router.put('/users/:id/level', async (req, res) => {
    if (!req.session.isAdmin) {
        // Return unauthorized error if not authenticated as admin
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const { id } = req.params;
        const { level } = req.body;
        
        // Validate the level value
        if (![0, 1, 2, 3].includes(Number(level))) {
            return res.status(400).json({ error: 'Invalid level' });
        }

        // Update the user's level in the database
        await db.query('UPDATE users SET level = $1 WHERE id = $2', [level, id]);
        await logAction(req.session.adminUsername, 'UPDATE_USER_LEVEL', `Updated user ${id} level to ${level}`);
        
        res.json({ message: 'User level updated successfully' });
    } catch (err) {
        console.error('Error updating user level:', err.stack); // Log errors
        res.status(500).json({ error: 'Server error' }); // Send error response
    }
});

// Delete User
// Deletes a user from the database
router.delete('/users/:id', async (req, res) => {
    if (!req.session.isAdmin) {
        // Return unauthorized error if not authenticated as admin
        return res.status(401).json({ error: 'Unauthorized access' });
    }

    try {
        const { id } = req.params;
        
        // Check if the user exists
        const userCheck = await db.query('SELECT * FROM users WHERE id = $1', [id]);
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Delete the user from the database
        await db.query('DELETE FROM users WHERE id = $1', [id]);
        await logAction(req.session.adminUsername, 'DELETE_USER', `Deleted user ${id}`);
        
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error('Error deleting user:', err.stack); // Log errors
        res.status(500).json({ 
            error: 'Server error while deleting user',
            details: err.message 
        });
    }
});

export default router; // Export the router

import express from 'express';
import db from '../utils/db.js';
import { logAction } from '../utils/logger.js';
import { ensureAuthenticated } from '../utils/authMiddleware.js';
import { generateReport } from '../utils/reportGenerator.js';

const router = express.Router();

// Get Expense Data with Pagination
// Fetches expense data from the database and displays it with pagination
router.get('/', ensureAuthenticated, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; // Get the current page number
        const limit = 10; // Number of expenses per page
        const offset = (page - 1) * limit; // Calculate offset for pagination

        // Query the total number of expense entries
        const countResult = await db.query('SELECT COUNT(*) FROM expense');
        const totalEntries = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(totalEntries / limit);

        // Query the expense entries for the current page
        const result = await db.query(
            'SELECT * FROM expense ORDER BY date DESC LIMIT $1 OFFSET $2',
            [limit, offset]
        );

        // Render the expense page with the fetched data
        res.render('expense', {
            expense: result.rows, // Expense data for the current page
            currentPage: page, // Current page number
            totalPages: totalPages, // Total number of pages
            user: req.user // Pass the authenticated user data to the template
        });
    } catch (err) {
        console.error('Error fetching expense data:', err.stack); // Log errors
        res.status(500).send('Error fetching expense data'); // Send error response
    }
});

// Add New Expense
// Handles the addition of a new expense entry to the database
router.post('/', ensureAuthenticated, async (req, res) => {
    const { date, category, amount, vat, amortization } = req.body;

    const amortizationValue = parseInt(amortization, 10); // Ensure amortization is an integer
    const vatAmount = (amount * vat) / 100; // Calculate the VAT amount
    const grossExpense = amount - vatAmount; // Calculate the gross expense

    const query = `
        INSERT INTO expense (date, category, amount, vat, vat_amount, amortization, gross_expense)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;
    const values = [date, category, amount, vat, vatAmount, amortizationValue, grossExpense];

    try {
        await db.query(query, values); // Insert the expense into the database
        await logAction(req.user.username, 'ADD_EXPENSE', `Added expense: ${amount}`); // Log the action
        res.redirect('/expense'); // Redirect back to the expense page
    } catch (err) {
        console.error('Error inserting expense data:', err.stack); // Log errors
        res.status(500).send('Error inserting expense data'); // Send error response
    }
});

// Delete Expense
// Deletes an expense entry from the database
router.delete('/:id', ensureAuthenticated, async (req, res) => {
    try {
        const { id } = req.params; // Get the expense ID from the request parameters
        await db.query('DELETE FROM expense WHERE id = $1', [id]); // Delete the expense from the database
        res.status(200).json({ message: 'Expense deleted successfully' }); // Send success response
    } catch (err) {
        console.error('Error deleting expense:', err.stack); // Log errors
        res.status(500).json({ error: 'Error deleting expense' }); // Send error response
    }
});

// Update Expense
// Updates an existing expense entry in the database
router.put('/:id', ensureAuthenticated, async (req, res) => {
    try {
        const { id } = req.params; // Get the expense ID from the request parameters
        const { date, category, amount, vat } = req.body;

        const vatAmount = (amount * vat) / 100; // Calculate the VAT amount

        const query = `
            UPDATE expense
            SET date = $1, category = $2, amount = $3, vat = $4, vat_amount = $5
            WHERE id = $6
        `;
        const values = [date, category, amount, vat, vatAmount, id];

        await db.query(query, values); // Update the expense in the database
        res.status(200).json({ message: 'Expense updated successfully' }); // Send success response
    } catch (err) {
        console.error('Error updating expense:', err.stack); // Log errors
        res.status(500).json({ error: 'Error updating expense' }); // Send error response
    }
});

// Generate Expense Report
// Generates an Excel report for expenses within a specified date range
router.get('/report', ensureAuthenticated, async (req, res) => {
    try {
        const { startDate, endDate } = req.query; // Get the date range from the query parameters
        const workbook = await generateReport('expense', startDate, endDate); // Generate the report

        // Set response headers for Excel file download
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="Expense_Report_${startDate}_to_${endDate}.xlsx"`);

        await workbook.xlsx.write(res); // Write the workbook to the response
        res.end(); // End the response
    } catch (err) {
        console.error('Error generating expense report:', err.stack); // Log errors
        res.status(500).send('Error generating expense report'); // Send error response
    }
});

export default router; // Export the router

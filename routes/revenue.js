import express from 'express';
import db from '../utils/db.js';
import { logAction } from '../utils/logger.js';
import { ensureAuthenticated } from '../utils/authMiddleware.js';
import { generateReport } from '../utils/reportGenerator.js';

const router = express.Router();

// Get Revenue Data with Pagination
// Fetches revenue data from the database and displays it with pagination
router.get('/', ensureAuthenticated, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; // Get the current page number
        const limit = 10; // Number of revenue entries per page
        const offset = (page - 1) * limit; // Calculate offset for pagination

        // Query the total number of revenue entries
        const countResult = await db.query('SELECT COUNT(*) FROM revenue');
        const totalEntries = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(totalEntries / limit);

        // Query the revenue entries for the current page
        const result = await db.query(
            'SELECT * FROM revenue ORDER BY date DESC LIMIT $1 OFFSET $2',
            [limit, offset]
        );

        // Render the revenue page with the fetched data
        res.render('revenue', {
            revenue: result.rows, // Revenue data for the current page
            currentPage: page, // Current page number
            totalPages: totalPages, // Total number of pages
            user: req.user // Pass the authenticated user data to the template
        });
    } catch (err) {
        console.error('Error fetching revenue data:', err.stack); // Log errors
        res.status(500).send('Error fetching revenue data'); // Send error response
    }
});

// Add New Revenue
// Handles the addition of a new revenue entry to the database
router.post('/', ensureAuthenticated, async (req, res) => {
    const { date, category, amount, vat, accommodationTax } = req.body;

    const vatAmount = (amount * vat) / 100; // Calculate the VAT amount
    const grossProfit = amount - vatAmount; // Calculate the gross profit
    const isAccommodationTax = accommodationTax === 'true'; // Convert accommodationTax to a boolean
    const accommodationTaxAmount = isAccommodationTax ? (grossProfit * 2) / 100 : 0; // Calculate the accommodation tax amount

    const query = `
        INSERT INTO revenue (date, category, amount, vat, vat_amount, gross_profit, accommodation_tax, accommodation_tax_amount)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;
    const values = [date, category, amount, vat, vatAmount, grossProfit, isAccommodationTax, accommodationTaxAmount];

    try {
        await db.query(query, values); // Insert the revenue into the database
        await logAction(req.user.username, 'ADD_REVENUE', `Added revenue: ${amount}`); // Log the action
        res.redirect('/revenue'); // Redirect back to the revenue page
    } catch (err) {
        console.error('Error inserting revenue data:', err.stack); // Log errors
        res.status(500).send('Error inserting revenue data'); // Send error response
    }
});

// Delete Revenue
// Deletes a revenue entry from the database
router.delete('/:id', ensureAuthenticated, async (req, res) => {
    try {
        const { id } = req.params; // Get the revenue ID from the request parameters
        await db.query('DELETE FROM revenue WHERE id = $1', [id]); // Delete the revenue from the database
        res.status(200).json({ message: 'Revenue deleted successfully' }); // Send success response
    } catch (err) {
        console.error('Error deleting revenue:', err.stack); // Log errors
        res.status(500).json({ error: 'Error deleting revenue' }); // Send error response
    }
});

// Update Revenue
// Updates an existing revenue entry in the database
router.put('/:id', ensureAuthenticated, async (req, res) => {
    try {
        const { id } = req.params; // Get the revenue ID from the request parameters
        const { date, category, amount, vat, accommodationTax } = req.body;

        const vatAmount = (amount * vat) / 100; // Calculate the VAT amount
        const grossProfit = amount - vatAmount; // Calculate the gross profit
        const isAccommodationTax = accommodationTax === 'true'; // Convert accommodationTax to a boolean
        const accommodationTaxAmount = isAccommodationTax ? (grossProfit * 2) / 100 : 0; // Calculate the accommodation tax amount

        const query = `
            UPDATE revenue
            SET date = $1, category = $2, amount = $3, vat = $4, vat_amount = $5, gross_profit = $6, accommodation_tax = $7, accommodation_tax_amount = $8
            WHERE id = $9
        `;
        const values = [date, category, amount, vat, vatAmount, grossProfit, isAccommodationTax, accommodationTaxAmount, id];

        await db.query(query, values); // Update the revenue in the database
        res.status(200).json({ message: 'Revenue updated successfully' }); // Send success response
    } catch (err) {
        console.error('Error updating revenue:', err.stack); // Log errors
        res.status(500).json({ error: 'Error updating revenue' }); // Send error response
    }
});

// Generate Revenue Report
// Generates an Excel report for revenues within a specified date range
router.get('/report', ensureAuthenticated, async (req, res) => {
    try {
        const { startDate, endDate } = req.query; // Get the date range from the query parameters
        const workbook = await generateReport('revenue', startDate, endDate); // Generate the report

        // Set response headers for Excel file download
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="Revenue_Report_${startDate}_to_${endDate}.xlsx"`);

        await workbook.xlsx.write(res); // Write the workbook to the response
        res.end(); // End the response
    } catch (err) {
        console.error('Error generating revenue report:', err.stack); // Log errors
        res.status(500).send('Error generating revenue report'); // Send error response
    }
});

export default router; // Export the router

import express from 'express';
import db from '../utils/db.js';
import { ensureAuthenticated } from '../utils/authMiddleware.js';

const router = express.Router();

// Dashboard Route
// Fetches and displays revenue, expense, and gross profit data for the selected year
router.get('/', ensureAuthenticated, async (req, res) => {
    try {
        const selectedYear = parseInt(req.query.year) || new Date().getFullYear(); // Get the selected year or use the current year

        // Query monthly revenue data for the selected year
        const revenueResult = await db.query(
            `SELECT EXTRACT(MONTH FROM date) AS month, COALESCE(SUM(amount), 0) AS total_revenue
             FROM revenue
             WHERE EXTRACT(YEAR FROM date) = $1
             GROUP BY month
             ORDER BY month`,
            [selectedYear]
        );

        // Query monthly expense data for the selected year
        const expenseResult = await db.query(
            `SELECT EXTRACT(MONTH FROM date) AS month, COALESCE(SUM(amount), 0) AS total_expense
             FROM expense
             WHERE EXTRACT(YEAR FROM date) = $1
             GROUP BY month
             ORDER BY month`,
            [selectedYear]
        );

        // Prepare data for charts
        const revenueData = Array(12).fill(0); // Initialize an array for monthly revenue data
        const expenseData = Array(12).fill(0); // Initialize an array for monthly expense data
        const grossProfitData = Array(12).fill(0); // Initialize an array for monthly gross profit data

        // Populate revenue data
        revenueResult.rows.forEach(row => {
            revenueData[row.month - 1] = parseFloat(row.total_revenue); // Map revenue data to the corresponding month
        });

        // Populate expense data
        expenseResult.rows.forEach(row => {
            expenseData[row.month - 1] = parseFloat(row.total_expense); // Map expense data to the corresponding month
        });

        // Calculate gross profit data
        for (let i = 0; i < 12; i++) {
            grossProfitData[i] = revenueData[i] - expenseData[i]; // Calculate gross profit for each month
        }

        // Calculate yearly totals
        const totalRevenue = revenueData.reduce((sum, value) => sum + value, 0); // Sum up all monthly revenue
        const totalExpense = expenseData.reduce((sum, value) => sum + value, 0); // Sum up all monthly expenses
        const grossProfit = totalRevenue - totalExpense; // Calculate yearly gross profit

        // Render the dashboard page with the calculated data
        res.render('dashboard', {
            totalRevenue: parseFloat(totalRevenue).toFixed(2), // Format total revenue to 2 decimal places
            totalExpense: parseFloat(totalExpense).toFixed(2), // Format total expense to 2 decimal places
            grossProfit: parseFloat(grossProfit).toFixed(2), // Format gross profit to 2 decimal places
            revenueData: JSON.stringify(revenueData), // Serialize revenue data for charts
            expenseData: JSON.stringify(expenseData), // Serialize expense data for charts
            grossProfitData: JSON.stringify(grossProfitData), // Serialize gross profit data for charts
            selectedYear: selectedYear, // Pass the selected year to the template
            user: req.user // Pass the authenticated user data to the template
        });
    } catch (err) {
        console.error('Error fetching dashboard data:', err.stack); // Log errors
        res.status(500).send('Error fetching dashboard data'); // Send error response
    }
});

export default router; // Export the router

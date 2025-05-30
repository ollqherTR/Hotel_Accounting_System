import ExcelJS from 'exceljs'; // Library for creating and manipulating Excel files
import db from './db.js'; // Database utility for executing queries

// Generates an Excel report for either revenue or expense data within a specified date range.
export async function generateReport(type, startDate, endDate) {
    try {
        // Determine the database table to query based on the report type
        const table = type === 'revenue' ? 'revenue' : 'expense';

        // Query the database for data within the specified date range
        const result = await db.query(
            `SELECT * FROM ${table} WHERE date BETWEEN $1 AND $2 ORDER BY date ASC`,
            [startDate, endDate]
        );

        // Create a new Excel workbook and worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(`${type.charAt(0).toUpperCase() + type.slice(1)} Report`);

        // Add the header row based on the report type
        if (type === 'revenue') {
            worksheet.addRow(['Date', 'Category', 'Amount', 'VAT (%)', 'Gross Profit', 'Accommodation Tax']);
        } else {
            worksheet.addRow(['Date', 'Category', 'Amount', 'VAT (%)', 'Gross Expense', 'Amortization']);
        }

        // Add data rows to the worksheet
        result.rows.forEach(row => {
            if (type === 'revenue') {
                worksheet.addRow([
                    row.date, // Revenue date
                    row.category, // Revenue category
                    row.amount, // Revenue amount
                    row.vat, // VAT percentage
                    row.gross_profit, // Gross profit
                    row.accommodation_tax ? 'Yes' : 'No' // Accommodation tax status
                ]);
            } else {
                worksheet.addRow([
                    row.date, // Expense date
                    row.category, // Expense category
                    row.amount, // Expense amount
                    row.vat, // VAT percentage
                    row.gross_expense, // Gross expense
                    row.amortization // Amortization period
                ]);
            }
        });

        // Return the generated workbook
        return workbook;
    } catch (err) {
        // Log any errors that occur during report generation
        console.error(`Error generating ${type} report:`, err.stack);
        throw err; // Rethrow the error to be handled by the caller
    }
}

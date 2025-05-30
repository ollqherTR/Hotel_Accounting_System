// Import the database utility
import db from './db.js';

// Define tax brackets for different years
// Each year has progressive tax brackets with thresholds and rates
const TAX_BRACKETS = {
    2023: [
        { threshold: 70000, rate: 0.15 },
        { threshold: 150000, rate: 0.20 },
        { threshold: 370000, rate: 0.27 },
        { threshold: 1900000, rate: 0.35 },
        { threshold: Infinity, rate: 0.40 }
    ],
    2024: [
        { threshold: 110000, rate: 0.15 },
        { threshold: 230000, rate: 0.20 },
        { threshold: 580000, rate: 0.27 },
        { threshold: 3000000, rate: 0.35 },
        { threshold: Infinity, rate: 0.40 }
    ],
    2025: [
        { threshold: 158000, rate: 0.15 },
        { threshold: 330000, rate: 0.20 },
        { threshold: 800000, rate: 0.27 },
        { threshold: 4300000, rate: 0.35 },
        { threshold: Infinity, rate: 0.40 }
    ]
};

/**
 * Calculates various taxes (cooperate tax, income tax, VAT difference, etc.) for a selected year.
 * 
 * @param {number} selectedYear - The year for which taxes are to be calculated.
 * @returns {Object} - An object containing calculated tax values and net incomes.
 */
export async function calculateTaxes(selectedYear) {
    try {
        // Get the tax brackets for the selected year or use the default (2023)
        const incomeTaxBrackets = TAX_BRACKETS[selectedYear] || TAX_BRACKETS[2023];

        // Query total gross revenue for the selected year
        const grossRevenueResult = await db.query(
            `SELECT COALESCE(SUM(amount), 0) AS gross_revenue 
             FROM revenue 
             WHERE EXTRACT(YEAR FROM date) = $1`,
            [selectedYear]
        );
        const grossRevenue = parseFloat(grossRevenueResult.rows[0].gross_revenue) || 0;

        // Query total accommodation tax for the selected year
        const accommodationTaxResult = await db.query(
            `SELECT COALESCE(SUM(accommodation_tax_amount), 0) AS total_accommodation_tax 
             FROM revenue 
             WHERE EXTRACT(YEAR FROM date) = $1`,
            [selectedYear]
        );
        const totalAccommodationTax = parseFloat(accommodationTaxResult.rows[0].total_accommodation_tax) || 0;

        // Query amortized expenses for the selected year
        const amortizedExpenseResult = await db.query(
            `SELECT date, amount, amortization 
             FROM expense`
        );

        let amortizedExpense = 0;
        // Calculate the amortized expense for the selected year
        amortizedExpenseResult.rows.forEach(row => {
            const startYear = new Date(row.date).getFullYear();
            const amortizationYears = row.amortization > 0 ? row.amortization : 1; // Treat 0 as 1
            const amortizationPerYear = row.amount / amortizationYears;

            if (selectedYear >= startYear && selectedYear < startYear + amortizationYears) {
                amortizedExpense += amortizationPerYear;
            }
        });

        // Query total VAT/KDV from revenue for the selected year
        const revenueVATResult = await db.query(
            `SELECT COALESCE(SUM(vat_amount), 0) AS total_revenue_vat 
             FROM revenue 
             WHERE EXTRACT(YEAR FROM date) = $1`,
            [selectedYear]
        );
        const totalRevenueVAT = parseFloat(revenueVATResult.rows[0].total_revenue_vat) || 0;

        // Query total VAT/KDV from expense for the selected year
        const expenseVATResult = await db.query(
            `SELECT COALESCE(SUM(vat_amount), 0) AS total_expense_vat 
             FROM expense 
             WHERE EXTRACT(YEAR FROM date) = $1`,
            [selectedYear]
        );
        const totalExpenseVAT = parseFloat(expenseVATResult.rows[0].total_expense_vat) || 0;

        // Calculate the VAT difference
        const vatDifference = totalRevenueVAT - totalExpenseVAT;

        // Calculate taxable profit
        const taxableProfit = grossRevenue - amortizedExpense;
    
        // Calculate cooperate tax (25% of taxable profit)
        let cooperateTax = taxableProfit * 0.25;
        if (cooperateTax < 0) cooperateTax = 0;

        // Calculate income tax based on progressive tax system
        let incomeTax = 0;
        let remainingTaxableProfit = taxableProfit;

        if (remainingTaxableProfit < 0) {
            remainingTaxableProfit = 0; // Ensure no negative taxable profit
        }

        for (const bracket of incomeTaxBrackets) {
            if (remainingTaxableProfit > bracket.threshold) {
                const taxableAmount = bracket.threshold;
                incomeTax += taxableAmount * bracket.rate;
                remainingTaxableProfit -= taxableAmount;
            } else {
                incomeTax += remainingTaxableProfit * bracket.rate;
                break;
            }
        }

        // Calculate net incomes
        const cooperateNetIncome = taxableProfit - cooperateTax - vatDifference - totalAccommodationTax;
        const individualNetIncome = taxableProfit - incomeTax - vatDifference - totalAccommodationTax;

        // Return the calculated tax values and net incomes
        return {
            cooperateTax: cooperateTax.toFixed(2),
            incomeTax: incomeTax.toFixed(2),
            vatDifference: vatDifference.toFixed(2),
            totalAccommodationTax: totalAccommodationTax.toFixed(2),
            cooperateNetIncome: cooperateNetIncome.toFixed(2),
            individualNetIncome: individualNetIncome.toFixed(2)
        };
    } catch (err) {
        // Log any errors that occur during tax calculations
        console.error('Error calculating taxes:', err.stack);
        throw err; // Rethrow the error to be handled by the caller
    }
}

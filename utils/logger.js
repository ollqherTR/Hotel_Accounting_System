import db from './db.js';


export async function logAction(username, actionType, actionDetails = null) {
    try {
        // SQL query to insert a log entry into the system_logs table
        const query = 'INSERT INTO system_logs (username, action_type, action_details) VALUES ($1, $2, $3)';
        
        // Execute the query with the provided parameters
        await db.query(query, [username, actionType, actionDetails]);
    } catch (err) {
        // Log any errors that occur during the logging process
        console.error('Error logging action:', err);
    }
}

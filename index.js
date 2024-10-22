// server.js
const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');

// Initialize the Express app
const app = express();
app.use(bodyParser.json());
app.use(cors());

// Create a connection to MySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password', // Replace with your MySQL root password
    database: 'burger_db',
});

// Connect to the database
db.connect((err) => {
    if (err) {
        console.log('Error connecting to the database', err);
        return;
    }
    console.log('Connected to the MySQL database');
});

// Generate unique order number (e.g., BURG-001)
const generateOrderNumber = (orderId) => {
    const prefix = 'BURG';
    return `${prefix}-${String(orderId).padStart(3, '0')}`;
};

// POST route to save a new order
app.post('/order', (req, res) => {
    const { customer_mobile, total_price, burger_details } = req.body;

    // Insert the new order into the database
    db.query(
        'INSERT INTO orders (customer_mobile, total_price, burger_details) VALUES (?, ?, ?)',
        [customer_mobile, total_price, JSON.stringify(burger_details)],
        (err, result) => {
            if (err) {
                return res.status(500).send('Error saving order');
            }

            // Generate order number and update the record
            const orderNumber = generateOrderNumber(result.insertId);
            db.query(
                'UPDATE orders SET order_number = ? WHERE id = ?',
                [orderNumber, result.insertId],
                (updateErr) => {
                    if (updateErr) {
                        return res.status(500).send('Error updating order number');
                    }
                    // Send response with order number
                    res.status(200).json({ order_number: orderNumber });
                }
            );
        }
    );
});

// GET route to retrieve the next order number
app.get('/next-order-number', (req, res) => {
    db.query('SELECT MAX(id) AS last_id FROM orders', (err, result) => {
        if (err) {
            return res.status(500).send('Error retrieving next order number');
        }
        const lastOrderId = result[0].last_id || 0;
        const nextOrderNumber = generateOrderNumber(lastOrderId + 1);
        res.status(200).json({ next_order_number: nextOrderNumber });
    });
});

// Start the server
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

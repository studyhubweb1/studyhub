const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const path = require('path');
const userRoutes = require('./routes/userRoutes');
const documentRoutes = require('./routes/documentRoutes');
const database = require('./utils/database');

const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true })); // For parsing form data
app.use(express.json()); // For parsing JSON data
app.use(session({ secret: 'your-secret-key', resave: false, saveUninitialized: true })); //Session middleware
app.use(express.static(path.join(__dirname, '../frontend'))); // Serve static files

// Routes
app.use('/users', userRoutes);
app.use('/documents', documentRoutes);

//Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});


// Database connection
database.connect()
    .then(() => {
        app.listen(port, () => {
            console.log(`Server listening on port ${port}`);
        });
    })
    .catch(err => {
        console.error("Database connection failed:", err);
    });

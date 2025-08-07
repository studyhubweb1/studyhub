const userModel = require('../models/user');
const bcrypt = require('bcrypt');

exports.register = async (req, res) => {
    try {
        const { username, password } = req.body;
        await userModel.createUser(username, password);
        res.redirect('/login');  // Redirect to login page after registration
    } catch (error) {
        console.error(error);
        res.status(500).send('Registration failed');
    }
};

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await userModel.getUserByUsername(username);

        if (user && await bcrypt.compare(password, user.password)) {
            req.session.user = { username: user.username, id: user.id }; // Store user in session
            res.redirect('/documents'); // Redirect to document list
        } else {
            res.status(401).send('Invalid credentials');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Login failed');
    }
};

exports.logout = (req, res) => {
    req.session.destroy();
    res.redirect('/login');
};
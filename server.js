const express = require('express');
const bodyParser = require('body-parser');
const Airtable = require('airtable');

const app = express();
const port = 3000;


// Parse form data
app.use(bodyParser.urlencoded({ extended: true }));

// Airtable configuration
const base = new Airtable({ apiKey: 'patotgRvy7alagtTD.7bfe5a1a926011c00f7d1db8cd95236e7d287e8e4d67a3da9e88ca35a66b18b8' }).base('app9qUIWlaac9sEyg');

// Routes
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.get('/signup', (req, res) => {
    res.sendFile(__dirname + '/public/signup.html');
});

app.get('/admin', (req, res) => {
    res.sendFile(__dirname + '/public/admin.html');
});

app.get('/user/:name', (req, res) => {
    res.sendFile(__dirname + '/public/user.html');
});

// Handle sign-up
app.post('/signup', (req, res) => {
    const { name, password } = req.body;

    // Check if the user already exists
    base('Users').select({
        filterByFormula: `{Name} = '${name}'`
    }).firstPage((err, records) => {
        if (err) {
            console.error('Airtable Error:', err);
            return res.status(500).send('Error checking user existence');
        }

        if (records.length > 0) {
            return res.send('User already exists');
        }

        // Create a new user
        base('Users').create([
            {
                fields: {
                    Name: name,
                    Pass: password,
                    Admin: false // Default to non-admin
                }
            }
        ], (err, records) => {
            if (err) {
                console.error('Airtable Error:', err);
                return res.status(500).send('Error creating user');
            }
            // Redirect to signup page with success query parameter
            res.redirect('/signup?success=true');
        });
    });
});

// Handle login
app.post('/login', (req, res) => {
    const { name, password } = req.body;

    // Check if the user exists and the password matches
    base('Users').select({
        filterByFormula: `AND({Name} = '${name}', {Pass} = '${password}')`
    }).firstPage((err, records) => {
        if (err) {
            console.error('Airtable Error:', err);
            return res.status(500).send('Error fetching user data');
        }

        if (records.length === 0) {
            // Redirect to login page with error query parameter
            return res.redirect('/?error=credentials');
        }

        const user = records[0];
        const isAdmin = user.get('Admin') === true;

        // Redirect based on admin status
        if (isAdmin) {
            res.redirect('/admin');
        } else {
            res.redirect(`/user/${name}`);
        }
    });
});

// Admin page data
app.get('/admin-data', (req, res) => {
    base('Attendance').select({
        view: 'Grid view'
    }).firstPage((err, records) => {
        if (err) {
            console.error('Airtable Error:', err);
            return res.status(500).json({ error: 'Error fetching attendance data' });
        }

        const data = records.map(record => ({
            Name: record.get('Name'),
            Date: record.get('timestamp'),
            Status: record.get('Status')
        }));

        res.json(data);
    });
});

// User page data
app.get('/user-data/:name', (req, res) => {
    const userName = req.params.name;

    base('Attendance').select({
        filterByFormula: `{Name} = '${userName}'`
    }).firstPage((err, records) => {
        if (err) {
            console.error('Airtable Error:', err);
            return res.status(500).json({ error: 'Error fetching attendance data' });
        }

        const data = records.map(record => ({
            Name: record.get('Name'),
            Date: record.get('Date'),
            Status: record.get('Status')
        }));

        res.json(data); // Ensure this sends JSON
    });
});
// Serve static files from the 'public' directory
app.use(express.static('public'));

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
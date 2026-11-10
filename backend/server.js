const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// In-memory database with transaction histories.
const users = Object.create(null);

app.get('/', (req, res) => {
    res.send({ status: 'AREWA_TOPUP Backend is running smoothly!' });
});

app.post('/api/wallet/fund', (req, res) => {
    const { phone, amount } = req.body;
    const numericAmount = Number(amount);

    if (typeof phone !== 'string' || !phone.trim() || !Number.isFinite(numericAmount) || numericAmount <= 0) {
        return res.status(400).json({ error: 'Valid phone and amount are required' });
    }

    if (!users[phone]) {
        users[phone] = { phone, balance: 0, transactions: [] };
    }

    users[phone].balance += numericAmount;
    const txLog = {
        id: `TXN-${Date.now()}`,
        type: 'CREDIT',
        title: 'Wallet Top-Up',
        amount: numericAmount,
        status: 'SUCCESS',
        date: new Date().toLocaleString(),
    };
    users[phone].transactions.unshift(txLog);

    res.json({
        success: true,
        balance: users[phone].balance,
        transactions: users[phone].transactions,
        message: `₦${numericAmount} funded successfully!`,
    });
});

app.post('/api/vtu/buy', (req, res) => {
    const { phone, network, type, amount, recipient } = req.body;
    const numericAmount = Number(amount);

    if (
        typeof phone !== 'string' ||
        !phone.trim() ||
        typeof network !== 'string' ||
        !network.trim() ||
        typeof type !== 'string' ||
        !type.trim() ||
        typeof recipient !== 'string' ||
        !recipient.trim() ||
        !Number.isFinite(numericAmount) ||
        numericAmount <= 0
    ) {
        return res.status(400).json({ error: 'Missing or invalid transaction fields' });
    }

    if (!users[phone] || users[phone].balance < numericAmount) {
        return res.status(400).json({ error: 'Insufficient wallet balance' });
    }

    users[phone].balance -= numericAmount;
    const transactionType = type.toUpperCase();
    const txLog = {
        id: `VTU-${Date.now()}`,
        type: `VTU_${transactionType}`,
        title: `${network} ${transactionType}`,
        amount: numericAmount,
        recipient,
        status: 'SUCCESS',
        date: new Date().toLocaleString(),
    };
    users[phone].transactions.unshift(txLog);

    res.json({
        success: true,
        balance: users[phone].balance,
        transactions: users[phone].transactions,
        message: `${network} ${type} of ₦${numericAmount} sent to ${recipient} successfully!`,
    });
});

app.get('/api/user/:phone', (req, res) => {
    const { phone } = req.params;
    const user = users[phone] || { phone, balance: 0, transactions: [] };
    res.json(user);
});

app.listen(PORT, () => {
    console.log(`AREWA_TOPUP server running on port ${PORT}`);
});

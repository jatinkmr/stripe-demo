const dotenv = require('dotenv');
dotenv.config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const BE_PORT = process.env.BE_PORT;

const app = express();

app.use(cors());

app.use(express.json());

const products = [
    { id: 1, name: 'Product 1', price: 100 },
    { id: 2, name: 'Product 2', price: 200 },
    { id: 3, name: 'Product 3', price: 300 },
    { id: 4, name: 'Product 4', price: 400 },
    { id: 5, name: 'Product 5', price: 500 }
];

app.get('/products', (req, res) => {
    res.json({ success: true, message: 'Products fetched successfully', products: products });
});

app.post('/create-checkout-session', async (req, res) => {
    try {
        const { cart } = req.body;
        console.log('cart -> ', cart)

        if (!cart || !cart.length) {
            return res.json({ success: false, message: 'Please add items to the cart!!' });
        }

        const line_items = cart.map(product => {
            const productInfo = products.find(p => p.id === product.id);
            console.log('productInfo -> ', productInfo);
            return {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: productInfo.name
                    },
                    unit_amount: productInfo.price * 100 // Convert to cents
                },
                quantity: product.quantity
            };
        });

        console.log('line_items', line_items);

        const session = await stripe.checkout.sessions.create({
            line_items,
            mode: 'payment',
            allow_promotion_codes: true,
            success_url: `${process.env.REACT_APP_BE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.REACT_APP_BE_URL}/cancel?session_id={CHECKOUT_SESSION_ID}`
        });

        console.log('session -> ', session);
        res.json({ success: true, message: 'Session initiated', url: session.url });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({ success: false, message: 'Error creating checkout session', error: error.message });
    }
});

app.use('/success', async (req, res) => {
    const logFilePath = path.join(__dirname, 'success.log');
    const sessionId = req.query.session_id;

    // Base request log
    const baseLogEntry = {
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.originalUrl,
        headers: req.headers,
        query: req.query,
        body: req.body
    };

    try {
        // Always log the request metadata
        fs.appendFileSync(logFilePath, `${JSON.stringify(baseLogEntry)}\n`);

        if (!sessionId) {
            return res.status(200).send('Payment success recorded (no session_id provided)');
        }

        // Retrieve full session, payment intent and line items
        const session = await stripe.checkout.sessions.retrieve(sessionId, {
            expand: ['payment_intent', 'customer']
        });

        const lineItems = await stripe.checkout.sessions.listLineItems(sessionId);

        const paymentIntent = session.payment_intent;
        const firstCharge = paymentIntent?.charges?.data?.[0] ?? null;

        const paymentDetails = {
            logType: 'payment_success',
            timestamp: new Date().toISOString(),
            session: {
                id: session.id,
                status: session.status,
                payment_status: session.payment_status,
                amount_total: session.amount_total,
                currency: session.currency,
                customer_email: session.customer_details ? session.customer_details.email : null,
                mode: session.mode
            }
        };

        if (paymentIntent) {
            paymentDetails['payment_intent'] = {
                id: paymentIntent.id,
                status: paymentIntent.status,
                amount: paymentIntent.amount,
                currency: paymentIntent.currency,
                payment_method_types: paymentIntent.payment_method_types,
                created: paymentIntent.created,
                latest_charge_id: paymentIntent.latest_charge || (firstCharge ? firstCharge.id : null),
                receipt_url: firstCharge && firstCharge.receipt_url ? firstCharge.receipt_url : null
            }
        } else {
            paymentDetails['payment_intent'] = null;
        }

        if (lineItems && lineItems?.data && lineItems?.data?.length) {
            paymentDetails['line_items'] = lineItems.data.map(item => ({
                id: item.id,
                description: item.description,
                quantity: item.quantity,
                amount_subtotal: item.amount_subtotal,
                amount_total: item.amount_total,
                currency: item.currency
            }))
        } else {
            paymentDetails['line_items'] = null;
        }

        try {
            fs.appendFileSync(logFilePath, `${JSON.stringify(paymentDetails)}\n`);
        } catch (err) {
            console.error('Failed to write payment details to log:', err);
        }

        res.status(200).send('Payment success recorded');
    } catch (error) {
        console.error('Unexpected error handling success route:', error);
        res.status(500).send('Error recording payment success');
    }
})

app.use('/cancel', async (req, res) => {
    const logFilePath = path.join(__dirname, 'cancel.log');
    const sessionId = req.query.session_id;

    const baseLogEntry = {
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.originalUrl,
        headers: req.headers,
        query: req.query,
        body: req.body
    };

    try {
        // Always log the request metadata
        fs.appendFileSync(logFilePath, `${JSON.stringify(baseLogEntry)}\n`);

        if (!sessionId) {
            return res.status(200).send('Payment cancel recorded (no session_id provided)');
        }

        // Retrieve session and line items (may not have payment_intent if cancelled prior to payment)
        const session = await stripe.checkout.sessions.retrieve(sessionId, {
            expand: ['payment_intent', 'customer']
        });

        const lineItems = await stripe.checkout.sessions.listLineItems(sessionId);

        const paymentIntent = session.payment_intent || null;

        const cancelDetails = {
            logType: 'payment_cancel',
            timestamp: new Date().toISOString(),
            session: {
                id: session.id,
                status: session.status,
                payment_status: session.payment_status,
                amount_total: session.amount_total,
                currency: session.currency,
                customer_email: session.customer_details ? session.customer_details.email : null,
                mode: session.mode
            },
            payment_intent: paymentIntent
                ? {
                    id: paymentIntent.id,
                    status: paymentIntent.status,
                    amount: paymentIntent.amount,
                    currency: paymentIntent.currency,
                    payment_method_types: paymentIntent.payment_method_types,
                    created: paymentIntent.created,
                    latest_charge_id: paymentIntent.latest_charge || null
                }
                : null,
            line_items: lineItems && lineItems.data
                ? lineItems.data.map(item => ({
                    id: item.id,
                    description: item.description,
                    quantity: item.quantity,
                    amount_subtotal: item.amount_subtotal,
                    amount_total: item.amount_total,
                    currency: item.currency
                }))
                : []
        };

        try {
            fs.appendFileSync(logFilePath, `${JSON.stringify(cancelDetails)}\n`);
        } catch (err) {
            console.error('Failed to write cancel details to log:', err);
        }

        res.status(200).send('Payment cancel recorded');
    } catch (error) {
        console.error('Unexpected error handling cancel route:', error);
        res.status(500).send('Error recording payment cancel');
    }
})

app.post('/create-payment-intent', async (req, res) => {
    if (!req?.body?.amount) return { status: 400, message: 'Please specify the amount!!', success: false };

    const paymentIntent = await stripe.paymentIntents.create({
        amount: req.body.amount,
        currency: 'usd',
        automatic_payment_methods: { enabled: true },
    });

    res.json({ success: true, message: 'Intent created', clientSecret: paymentIntent.client_secret })
});

app.listen(BE_PORT, () => console.log(`Server is running on port ${BE_PORT}`));

import axios from 'axios';
import { useEffect, useState } from "react";
import StripeCardCheckout from './checkout';
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";

const API_BASE_URL = process.env.REACT_APP_BE_URL;

const stripe = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const Product = () => {
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [clientSecret, setClientSecret] = useState('');

    const getProducts = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/products`);
            if (response?.data?.success) {
                setProducts(response.data.products);
            }
        } catch (error) {
            console.error('Error:', error);
            setProducts([]);
            setCart([]);
        }
    }

    const addToCart = (productId) => {
        const productInfo = products.find((item) => item.id === productId);
        console.log('productInfo', productInfo);

        const product = cart.find((item) => item.id === productId);
        if (product) {
            setCart(cart.map((item) => item.id === productId ? { ...item, quantity: item.quantity + 1 } : item));
        } else {
            setCart([...cart, { id: productId, quantity: 1, ...productInfo }]);
        }
    }

    const removeFromCart = (productId) => {
        const product = cart.find((item) => item.id === productId);
        if (!product) {
            return;
        }

        if (product.quantity <= 1) {
            setCart(cart.filter((item) => item.id !== productId));
        } else {
            setCart(cart.map((item) => item.id === productId ? { ...item, quantity: item.quantity - 1 } : item));
        }
    }

    const updateCart = (product, quantity) => {
        setCart(cart.map((item) => item.id === product.id ? { ...item, quantity: quantity } : item));
    }

    const checkoutHandler = async (ev) => {
        try {
            ev.preventDefault();
            const response = await axios.post(`${API_BASE_URL}/create-checkout-session`, { cart });
            if (response?.data?.success && response?.data?.url) {
                window.location.href = response.data.url;
            }
        } catch (error) {
            console.log('Facing error while making checkout...', error);
        }
    }

    // Fetch client secret when cart changes
    useEffect(() => {
        const fetchClientSecret = async () => {
            try {
                const totalPrice = cart.reduce((total, item) => total + item.price * item.quantity, 0);
                const response = await axios.post(`${API_BASE_URL}/create-payment-intent`, { amount: totalPrice });
                console.log('response -> ', response);
                if (response?.data?.success && response?.data?.clientSecret) {
                    setClientSecret(response?.data?.clientSecret);
                }
            } catch (err) {
                console.log('Unable to fetch the clientSecret', err);
            }
        };

        if (cart.length > 0) {
            fetchClientSecret();
        } else {
            setClientSecret('');
        }
    }, [cart]);

    useEffect(() => {
        getProducts();
    }, []);

    if (products.length === 0) {
        return <div>No Products Found!!</div>;
    }

    const totalPrice = cart.reduce((total, item) => total + item.price * item.quantity, 0);

    return (
        <div>
            <h1>Products List</h1>
            <table style={{ borderCollapse: 'collapse', width: '100%', border: '1px solid #ddd' }}>
                <thead>
                    <tr style={{ backgroundColor: '#f2f2f2' }}>
                        <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>S.No.</th>
                        <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>Name</th>
                        <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>Price</th>
                        <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map((product) => (
                        <tr key={product.id}>
                            <td style={{ border: '1px solid #ddd', padding: '12px' }}>{product.id}</td>
                            <td style={{ border: '1px solid #ddd', padding: '12px' }}>{product.name}</td>
                            <td style={{ border: '1px solid #ddd', padding: '12px' }}>${product.price}</td>
                            <td style={{ border: '1px solid #ddd', padding: '12px' }}>
                                <button onClick={() => addToCart(product.id)}>+</button>
                                &nbsp;
                                <input type="number" value={cart.find((item) => item.id === product.id)?.quantity || 0} onChange={(e) => updateCart(product, e.target.value)} />
                                &nbsp;
                                <button onClick={() => removeFromCart(product.id)}>-</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {(cart?.length) ? (
                <>
                    <h1>Cart</h1>
                    <table style={{ borderCollapse: 'collapse', width: '100%', border: '1px solid #ddd' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f2f2f2' }}>
                                <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>S.No.</th>
                                <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>Name</th>
                                <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>Price</th>
                                <th style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>Quantity</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cart.map((item) => (
                                <tr key={item.id}>
                                    <td style={{ border: '1px solid #ddd', padding: '12px' }}>{item.id}</td>
                                    <td style={{ border: '1px solid #ddd', padding: '12px' }}>{item.name}</td>
                                    <td style={{ border: '1px solid #ddd', padding: '12px' }}>${item.price}</td>
                                    <td style={{ border: '1px solid #ddd', padding: '12px' }}>{item.quantity}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            ) : null}

            {cart?.length ? <h1>Total Price: ${totalPrice}</h1> : null}

            {cart?.length ? <button onClick={(ev) => checkoutHandler(ev)}>Stripe Checkout</button> : null}

            {cart?.length && clientSecret ? (
                <Elements stripe={stripe} options={{ clientSecret }}>
                    <StripeCardCheckout totalPrice={totalPrice} />
                </Elements>
            ) : null}
        </div>
    );
};

export default Product;

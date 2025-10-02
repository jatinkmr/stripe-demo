import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { useState } from "react";

const StripeCardCheckout = ({ totalPrice }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async (event) => {
        try {

            event.preventDefault();

            // Check if stripe and elements are loaded
            if (!stripe || !elements) {
                console.log('Stripe or Elements not loaded yet');
                return;
            }

            setIsLoading(true);
            setErrorMessage('');

            // Submit the form to validate fields
            const { error: submitError } = await elements.submit();
            if (submitError) {
                console.log('Submit Error:', submitError);
                setErrorMessage(submitError.message);
                setIsLoading(false);
                return;
            }

            // Confirm the payment
            const result = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: 'http://localhost:3001/redirect'
                },
                redirect: 'always'
            });

            if (result.error) {
                console.log('Error:', result.error);
                setErrorMessage(result.error.message);
                setIsLoading(false);
                return;
            }

            console.log('Result:', result);
        } catch (error) {
            console.log('error -> -> ', error);
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <div
                style={{
                    display: "flex",
                    flexDirection: 'column',
                    marginTop: 10,
                    marginBottom: 10,
                    alignItems: 'center'
                }}
            >
                <PaymentElement />
                {errorMessage && <div style={{ color: 'red', marginTop: 10 }}>{errorMessage}</div>}
                <button
                    style={{ alignSelf: 'left', padding: 10, marginTop: 10 }}
                    type="submit"
                    disabled={!stripe || isLoading}
                >
                    {isLoading ? 'Processing...' : `Pay $${totalPrice}`}
                </button>
            </div>
        </form>
    );
};

export default StripeCardCheckout;

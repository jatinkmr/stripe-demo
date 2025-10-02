# Stripe Demo

A React-based demo application showcasing Stripe payment integration with a full-stack setup including a frontend for product selection and checkout, and a backend server for handling Stripe sessions and logging.

## Features

- Product listing and selection
- Stripe Checkout integration for secure payments
- Payment success and cancel logging
- Support for multiple products with quantities
- Promotion codes support in checkout
- Express backend with CORS enabled
- Environment-based configuration

## Prerequisites

- Node.js (version 14 or higher)
- npm or yarn
- Stripe account with API keys

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd stripe-demo
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Environment Setup

Create a `.env` file in the root directory with the following variables:

```env
#APP
PORT=3002
BE_PORT=3003
REACT_APP_BE_URL=http://localhost:3003
REACT_APP_URL=http://localhost:3002

#STRIPE CREDENTIALS
STRIPE_SECRET_KEY=
REACT_APP_STRIPE_PUBLISHABLE_KEY=

```

- `STRIPE_SECRET_KEY`: Your Stripe secret key from the Stripe dashboard.
- `REACT_APP_STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key from the Stripe dashboard.
- `PORT`: Port for the frontend server (default: 3000).
- `BE_PORT`: Port for the backend server (default: 5000).
- `REACT_APP_BE_URL`: Base URL for the backend API.
- `REACT_APP_URL`: Base URL for the frontend.

## Usage

1. Start the backend server:
   ```bash
   npm run dev
   ```
   This will start the Express server on the specified port using nodemon for auto-reloading.

2. In a new terminal, start the React frontend:
   ```bash
   npm start
   ```
   This will start the development server on `http://localhost:3000`.

3. Open your browser and navigate to `http://localhost:3000` to interact with the application.

## API Endpoints

The backend provides the following endpoints:

- `GET /products`: Retrieves the list of available products.
- `POST /create-checkout-session`: Creates a Stripe checkout session with the selected products in the cart.
  - Body: `{ cart: [{ id: number, quantity: number }] }`
- `POST /create-payment-intent`: Creates a Stripe payment intent for a specified amount.
  - Body: `{ amount: number }`
- `GET /success`: Handles successful payment redirects and logs payment details.
- `GET /cancel`: Handles canceled payment redirects and logs cancel details.

## Project Structure

```
stripe-demo/
├── public/
│   ├── index.html
│   ├── manifest.json
│   └── ...
├── server/
│   └── server.js          # Express backend server
├── src/
│   ├── components/
│   │   ├── checkout.js    # Checkout component
│   │   └── product.js     # Product component
│   ├── App.js             # Main React app
│   ├── index.js           # React entry point
│   └── ...
├── package.json
├── README.md
└── .gitignore
```


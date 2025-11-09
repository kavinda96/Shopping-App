🛍️ Shopping App

Simple full-stack shop app with a React frontend, PHP backend, and a small Admin Panel for managing shops and promos.

✅ Features

React shop UI (shops, products, cart, checkout)

PHP API (auth, products, orders)

Stripe test payments

Basic admin panel

✅ Structure
Frontend/   → React app
Backend/    → PHP API

✅ Run Frontend
cd Frontend
npm install
npm run dev

✅ Run Backend (Laragon)

Move backend to:

C:\laragon\www\


Then:

cd C:\laragon\www\api
composer install


Open in browser:

http://api.test

✅ Environment Variables

Backend requires a .env with DB + Stripe keys
(not included in repo).

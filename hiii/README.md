# AgriShield AI - Booth Based Smart Climate & Market Intelligence Platform

A full-stack rural agriculture intelligence system for farmers without smartphones, operated by booth agents from village centers.

## Features

- **Role-Based Access Control**: Super Admin, Booth Agent, Farmer, Guest
- **Unique Farmer ID System**: VillageCode-Year-Random4Digits format
- **Climate Intelligence**: Real-time weather from OpenWeatherMap API
- **AI Crop Scoring**: Weighted algorithm for crop recommendations
- **Market Intelligence**: Product comparison across Amazon, Flipkart, Local Stores
- **Waste to Money**: Calculate income from agricultural waste
- **Voice Assistant**: Web Speech API for hands-free operation
- **Multi-Language**: English, Tamil, Hindi, Telugu

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript, Chart.js, i18next
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose

## Project Structure

```
agri-shield-ai/
├── backend/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── controllers/
│   ├── config/
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── pages/
│   ├── css/
│   ├── js/
│   ├── i18n/
│   └── index.html
├── .env
└── README.md
```

## Installation

1. Install backend dependencies:
```bash
cd backend
npm install
```

2. Install frontend dependencies:
```bash
cd frontend
npm install
```

3. Configure environment variables in `backend/.env`:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/agrishieldai
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
WEATHER_API_KEY=your_openweathermap_key
```

## Running the Application

1. Start MongoDB

2. Start backend server:
```bash
cd backend
npm start
```

3. Open frontend:
```bash
cd frontend
npx serve
```

Or simply open `frontend/index.html` in a browser.

## API Endpoints

- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/farmers/register` - Register farmer (Booth/Admin)
- `GET /api/weather/current` - Get current weather
- `GET /api/weather/forecast` - Get forecast
- `GET /api/crops/recommendation/:farmerId` - Get crop recommendations
- `GET /api/products/search` - Search products
- `POST /api/waste/calc` - Calculate waste income

## Default Login (Demo)

- **Super Admin**: Create via signup
- **Booth Agent**: Create via signup with booth_agent role
- **Farmer**: Use Farmer ID login after registration

## License

MIT

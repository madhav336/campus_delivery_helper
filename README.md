# Campus Delivery Helper

A full-stack application designed to streamline delivery management and logistics on campus.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Running Locally](#running-locally)
- [Environment Variables](#environment-variables)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v14 or higher)
- **npm** (v6 or higher) or **yarn**
- **Git**

## Project Structure

```
campus_delivery_helper/
├── backend/     # Express/Node.js API server
├── frontend/    # React Native/Expo mobile app
└── README.md
```

## Installation

### Backend Setup
```bash
cd backend
npm install
```

### Frontend Setup
```bash
cd frontend
npm install
```

## Running Locally

### Start the Backend
```bash
cd backend
npm run dev
```
The API server will start on `http://localhost:3000` (or your configured port).

### Start the Frontend
In a new terminal:
```bash
cd frontend
npx expo start
```
Scan the QR code with your phone to run the app, or press `i` for iOS or `a` for Android simulator.

## Environment Variables

Create a `.env` file in the `backend/` directory with the following variables:

```
PORT=3000
DATABASE_URL=your_database_url
API_SECRET=your_secret_key
```

Create a `.env` file in the `frontend/` directory if needed:

```
EXPO_PUBLIC_API_URL=http://localhost:3000
```

## Troubleshooting

### Backend won't start
- Ensure Node.js is installed: `node --version`
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check if port 3000 is already in use

### Frontend won't start
- Clear Expo cache: `npx expo start --clear`
- Ensure Expo CLI is updated: `npm install -g expo-cli@latest`

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/YourFeature`)
3. Commit your changes (`git commit -m 'Add YourFeature'`)
4. Push to the branch (`git push origin feature/YourFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
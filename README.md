# ORCA Disruption Monitoring

**ORCA Disruption Monitoring** is a web-based application designed to monitor and analyze global disruption events such as cyber-attacks, supply chain disruptions, natural disasters, and other business-critical incidents. It allows users to visualize trends, perform keyword analysis, and filter events by various criteria like time range, disruption type, and severity.

---

## 🚀 Features

- **Disruption Tracking**: Monitor events categorized by disruption types like Cyber Attacks, Port Disruptions, Supply Shortages, etc.
- **Severity Analysis**: Visualize the severity levels (Low, Medium, High) across different time ranges.
- **Time-Based Filtering**: Filter and display data for:
  - **Last Week**
  - **Last Month**
  - **All Time**
- **Keyword Analysis**: Perform analysis to detect top keywords from disruption-related articles.
- **Interactive Charts**: View data as **Donut Charts** and **Tree Maps** for better insights.
- **Map Visualization**: Display event locations on Google Maps.
- **Responsive UI**: A clean and interactive frontend for ease of use.

---

## 🛠️ Technologies Used

### Backend
- **Node.js** with **Express.js**
- **MongoDB** (Database)
- **NewsAPI**: To fetch disruption-related articles
- **OpenAI API**: For categorizing disruptions, extracting summaries, and determining event severity and location

### Frontend
- **React.js**
- **ApexCharts**: For interactive charts
- **Google Maps API**: For event location visualization
- **Bootstrap & Reactstrap**: For UI components

---

## ⚙️ Installation and Setup

Follow these steps to set up the project on your local machine:

### Prerequisites
- **Node.js** and **npm** installed
- **MongoDB** instance running locally or in the cloud
- API keys for:
  - [Google Maps API](https://console.cloud.google.com/)
  - [NewsAPI](https://newsapi.org/)
  - [OpenAI API](https://platform.openai.com/)

---

### 1. Clone the Repository

```bash
git clone https://github.com/birujung/ORCA_Disruption-Monitoring.git
cd ORCA_Disruption-Monitoring
```

---

### 2. Backend Setup

1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file and add the following:

   ```env
   PORT=5001
   MONGODB_URI=<Your MongoDB Connection String>
   DATABASE_NAME=<Your MongoDB Database Name>
   COLLECTION_NAME=<Your MongoDB Collection Name>
   GOOGLE_GEOCODING_API_KEY=<Your Google Geocoding API Key>
   NEWS_API_KEY=<Your NewsAPI Key>
   OPENAI_API_KEY=<Your OpenAI Key>
   ```

4. Start the backend server:
   ```bash
   nodemon app.js
   ```
   The backend will run at `http://localhost:5001`.

---

### 3. Frontend Setup

1. Navigate to the `frontend` folder:
   ```bash
   cd ../frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the frontend development server:
   ```bash
   npm start
   ```
   The frontend will run at `http://localhost:3000`.

---

### 4. Run Both (Backend and Frontend) Setup

1. Navigate to the root folder

2. Install dependencies:
   ```bash
   npm install
   ```

3. Install concurrently:
   ```bash
   npm install concurrently
   ```

4. Start both of the backend and frontend development server:
   ```bash
   concurrently "npm run start:backend" "npm run start:frontend"
   ```
   The frontend will run at `http://localhost:3000`.

---

## 🌐 API Keys Management

- Replace placeholders in the `.env` file with your API keys:
  - `GOOGLE_GEOCODING_API_KEY` for Google Maps.
  - `NEWS_API_KEY` for fetching articles from NewsAPI.
  - `OPENAI_API_KEY` for extracting disruption type, severity, and location insights.

---

## 🐞 Debugging and Logging

For debugging, add `console.log` statements in the following places:
- **Backend**: Inside MongoDB queries and API response blocks
- **Frontend**: Check responses using `console.log(response.data)` after API calls.

---

## 👨‍💻 Author

Developed by **[Birujung](https://github.com/birujung)**.

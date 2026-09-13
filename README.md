# CookieSolve

## Tech Stack

### Frontend
- React
- React DOM
- React Router DOM
- Vite
- JavaScript
- HTML
- CSS

### Backend
- Node.js
- Express.js
- Mongoose
- JSON Web Token (`jsonwebtoken`)
- bcryptjs
- cookie-parser
- CORS
- dotenv

### Database
- MongoDB

### Runtime Testing
- Playwright

### Development Tools
- Nodemon
- Git
- GitHub

---

## Installation

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd CookieSolve
```

### 2. Install Frontend Dependencies

```bash
cd client
npm install
```

Start the frontend:

```bash
npm run dev
```

The frontend normally runs at:

```text
http://localhost:5173
```

### 3. Install Backend Dependencies

Open a second terminal and navigate to the server folder:

```bash
cd server
npm install
```

Start the backend:

```bash
npm run dev
```

The backend normally runs at:

```text
http://localhost:5000
```

### 4. Configure Environment Variables

Create a `.env` file inside the `server` folder:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000
```

Replace the example values with your own MongoDB connection string and JWT secret.

Do not commit the `.env` file to GitHub.

### 5. Install Playwright Browsers

Run:

```bash
npx playwright install
```

### 6. Run the Application

Start the frontend:

```bash
cd client
npm run dev
```

Start the backend in a separate terminal:

```bash
cd server
npm run dev
```

Then open:

```text
http://localhost:5173
```

---

## Running the Controlled Test Scenarios

The controlled scenarios used for testing are included in the repository.

The evaluation set contains:

- 8 deliberately non-compliant scenarios
- 4 compliant scenarios
- 12 scenarios in total

### 1. Locate the Controlled Scenarios

Navigate to the folder containing the controlled test websites:

```bash
cd controlled-scenarios
```

Each scenario should be contained within its own folder.

### 2. Start a Scenario

Navigate into the scenario you want to test:

```bash
cd scenario-1
```

Install dependencies if required:

```bash
npm install
```

Start the scenario using the command configured for that project:

```bash
npm run dev
```

or:

```bash
npm start
```

Check the terminal output for the local address of the scenario.

For example:

```text
http://localhost:3000
```

or:

```text
http://localhost:5173
```

### 3. Make Sure CookieSolve Is Running

Frontend:

```bash
cd client
npm run dev
```

Backend:

```bash
cd server
npm run dev
```

Open CookieSolve at:

```text
http://localhost:5173
```

### 4. Scan the Controlled Scenario

In CookieSolve:

1. Open **New Scan**
2. Enter the local URL of the running controlled scenario
3. Provide the scenario source-code folder if source-code analysis is required
4. Keep the scan configuration consistent between scenarios where possible
5. Configure the runtime wait time
6. Start the scan
7. Record whether CookieSolve reports a violation or no violation

### 5. Repeat for the Remaining Scenarios

Repeat the same process for each controlled scenario.

The expected result for each scenario should already be defined before running CookieSolve so that the detected result can be compared against the predefined ground truth.

### Timing Note

Some tracking behaviour may execute after a delay.

One controlled scenario used during evaluation triggered analytics after approximately 2.2 seconds. The configured runtime wait time should therefore be long enough to allow delayed behaviour to execute before the scan finishes.

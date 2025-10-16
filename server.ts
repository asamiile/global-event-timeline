import express from 'express';
import * as path from 'path';
import * as fs from 'fs/promises';
import { parse } from 'csv-parse/sync';
import { fileURLToPath } from 'url';

// Data type definition (same as main.ts)
interface EventData {
  year: number;
  month: number;
  locationName: string;
  countryName: string;
  lon: number;
  lat: number;
  eventType: string;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname); // Use __dirname as the project root

const app = express();
const PORT = 3000;

// Variable that holds all event data
let allEvents: EventData[] = [];

// API endpoint: /api/events
// Return processed event data as JSON
app.get('/api/events', (req, res) => {
  res.json(allEvents);
});

// Add an endpoint to get min and max year from the data
app.get('/api/years', (req, res) => {
  const years = allEvents.map(event => event.year);
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);
  res.json({ minYear, maxYear });
});

// Serve static files (make public folder accessible from the browser)
app.use(express.static(path.join(__dirname, 'public')));
app.use('/data', express.static(path.join(__dirname, 'data')));

// Add a default route for '/'
app.get('/', (req, res) => {
  res.send('Hello, World!');
});

// Add Content Security Policy (CSP) headers
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', "default-src 'self'; connect-src 'self'");
  next();
});

// Load the CSV before starting the server
async function setupAndStartServer() {
  const csvPath = path.join(projectRoot, 'data/jma_high_temperature.csv');
  const csvFileContent = await fs.readFile(csvPath);
  allEvents = parse(csvFileContent, {
    columns: true,
    skip_empty_lines: true,
    cast: (value, context) => {
      if (['year', 'month', 'lon', 'lat'].includes(context.column as string)) {
        return parseFloat(value);
      }
      return value;
    },
  });
  console.log(`CSV loaded: ${allEvents.length} records`);

  app.listen(PORT, () => {
    console.log(`Server started: http://localhost:${PORT}`);
  });
}

setupAndStartServer();
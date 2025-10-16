import express from 'express';
import * as path from 'path';
import * as fs from 'fs/promises';
import { parse } from 'csv-parse/sync';
import { fileURLToPath } from 'url';

// Data type definition
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
const projectRoot = path.resolve(__dirname);

const app = express();
const PORT = 3000;

let allEvents: EventData[] = [];

// API endpoint: /api/events
app.get('/api/events', (req, res) => {
  res.json(allEvents);
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/data', express.static(path.join(__dirname, 'data')));

// Add Content Security Policy (CSP) headers
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', "default-src 'self'; connect-src 'self'");
  next();
});

// Load the CSV before starting the server
async function setupAndStartServer() {
  try {
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
  } catch (error) {
    console.error('Error loading CSV file:', error);
  }
}

setupAndStartServer();
import "dotenv/config";

const FIGMENT_API_BASE = 'api.figment.com';
const FIGMENT_API_KEY = process.env.FIGMENT_API_KEY;

if (!FIGMENT_API_KEY) {
  throw new Error("FIGMENT_API_KEY is required in .env file");
}

const env = {
  FIGMENT_API_BASE,
  FIGMENT_API_KEY,
};

export default env;

import express from "express";
import bodyParser from "body-parser";
import { body, validationResult } from "express-validator";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static("public"));

// Helper: compute operations
function compute(a, b, op) {
  switch (op) {
    case "+": return a + b;
    case "-": return a - b;
    case "*": return a * b;
    case "/": return b !== 0 ? a / b : "Error (divide by 0)";
    case "%": return a % b;
    case "^": return Math.pow(a, b);
    default: throw new Error("Unsupported operator");
  }
}

// ➤ POST /api/calculate
app.post(
  "/api/calculate",
  body("num1").isNumeric(),
  body("num2").isNumeric(),
  body("operator").isString(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const a = parseFloat(req.body.num1);
    const b = parseFloat(req.body.num2);
    const op = req.body.operator;

    let result;
    try {
      result = compute(a, b, op).toString();
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }

    const expression = `${a} ${op} ${b}`;
    res.json({ expression, operator: op, result });
  }
);

// Export app and compute function for testing
export { app, compute };

// Start server when run directly (not when imported for tests)
// Check if this file is being executed directly
const isMainModule = process.argv[1] && 
                     (process.argv[1].endsWith('index.js') || process.argv[1].endsWith('Program/index.js'));

if (isMainModule && !process.env.JEST_WORKER_ID) {
  app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
}
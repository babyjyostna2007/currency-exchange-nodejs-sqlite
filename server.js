const express = require("express");
const sqlite3 = require("sqlite3").verbose();            //verbodse--detailed debugging information in SQLite3.
const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());
app.use(express.static(__dirname));

const db = new sqlite3.Database("exchange.db", (err) => {
    if (err) {
        console.log("Database connection failed:", err.message);
    } else {
        console.log("Connected to SQLite database.");
    }
});

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS exchange_rates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            from_currency TEXT NOT NULL,
            to_currency TEXT NOT NULL,
            rate REAL NOT NULL,
            updated_at TEXT NOT NULL
        )
    `, (err) => {
        if (err) console.log("Table creation failed:", err.message);
        else console.log("Exchange rates table ready.");
    });

    db.get("SELECT COUNT(*) AS count FROM exchange_rates", [], (err, row) => {
        if (err) {
            console.log(err.message);
            return;
        }

        if (row.count === 0) {
            const sql = `
                INSERT INTO exchange_rates
                (from_currency, to_currency, rate, updated_at)
                VALUES (?, ?, ?, ?)
            `;
            const now = new Date().toISOString();

            db.run(sql, ["USD", "INR", 83.50, now]);
            db.run(sql, ["USD", "EUR", 0.92, now]);
            db.run(sql, ["EUR", "INR", 90.75, now]);
            db.run(sql, ["GBP", "INR", 105.20, now]);
            db.run(sql, ["INR", "USD", 0.012, now]);

            console.log("Sample exchange rates inserted.");
        }
    });
});

function validateCurrency(currency) {
    if (!currency) return "Currency is required.";
    if (!/^[A-Za-z]{3}$/.test(currency)) {
        return "Currency must contain exactly 3 letters.";
    }
    return null;
}

function successResponse(message, data) {
    return { success: true, message, data };
}

function errorResponse(message, error = null) {
    return { success: false, message, error };
}

app.get("/api/rates", (req, res) => {
    const sql = `SELECT * FROM exchange_rates ORDER BY id`;

    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json(
                errorResponse("Unable to retrieve exchange rates.", err.message)
            );
        }

        res.status(200).json(
            successResponse("Exchange rates retrieved successfully.", rows)
        );
    });
});

app.get("/api/rate", (req, res) => {
    const { from, to, amount } = req.query;

    const fromError = validateCurrency(from);
    if (fromError) {
        return res.status(400).json(
            errorResponse("Invalid from currency.", fromError)
        );
    }

    const toError = validateCurrency(to);
    if (toError) {
        return res.status(400).json(
            errorResponse("Invalid to currency.", toError)
        );
    }

    const numericAmount = Number(amount);

    if (
        amount === undefined ||
        amount === "" ||
        isNaN(numericAmount) ||
        numericAmount <= 0
    ) {
        return res.status(400).json(
            errorResponse(
                "Invalid amount.",
                "Amount must be greater than 0."
            )
        );
    }

    const fromCurrency = from.toUpperCase();
    const toCurrency = to.toUpperCase();

    const sql = `
        SELECT *
        FROM exchange_rates
        WHERE from_currency = ?
        AND to_currency = ?
    `;

    db.get(sql, [fromCurrency, toCurrency], (err, row) => {
        if (err) {
            return res.status(500).json(
                errorResponse("Database error.", err.message)
            );
        }

        if (!row) {
            return res.status(404).json(
                errorResponse(
                    "Exchange rate not found.",
                    `${fromCurrency} to ${toCurrency} rate is not available.`
                )
            );
        }

        const convertedAmount = numericAmount * row.rate;

        res.status(200).json(
            successResponse("Currency conversion successful.", {
                from: fromCurrency,
                to: toCurrency,
                amount: numericAmount,
                exchangeRate: row.rate,
                convertedAmount: Number(convertedAmount.toFixed(2)),
                updatedAt: row.updated_at
            })
        );
    });
});

app.post("/api/rates", (req, res) => {
    const { from_currency, to_currency, rate } = req.body;

    const fromError = validateCurrency(from_currency);
    if (fromError) {
        return res.status(400).json(
            errorResponse("Invalid from_currency.", fromError)
        );
    }

    const toError = validateCurrency(to_currency);
    if (toError) {
        return res.status(400).json(
            errorResponse("Invalid to_currency.", toError)
        );
    }

    if (
        rate === undefined ||
        typeof rate !== "number" ||
        rate <= 0
    ) {
        return res.status(400).json(
            errorResponse(
                "Invalid exchange rate.",
                "Rate must be a number greater than 0."
            )
        );
    }

    const now = new Date().toISOString();

    const sql = `
        INSERT INTO exchange_rates
        (from_currency, to_currency, rate, updated_at)
        VALUES (?, ?, ?, ?)
    `;

    db.run(
        sql,
        [
            from_currency.toUpperCase(),
            to_currency.toUpperCase(),
            rate,
            now
        ],
        function (err) {
            if (err) {
                return res.status(500).json(
                    errorResponse(
                        "Unable to add exchange rate.",
                        err.message
                    )
                );
            }

            res.status(201).json(
                successResponse("Exchange rate added successfully.", {
                    id: this.lastID,
                    from: from_currency.toUpperCase(),
                    to: to_currency.toUpperCase(),
                    rate,
                    updatedAt: now
                })
            );
        }
    );
});

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Currency Exchange API is running.",
        endpoints: [
            "GET /api/rates",
            "GET /api/rate?from=USD&to=INR&amount=100",
            "POST /api/rates"
        ]
    });
});

app.listen(PORT, () => {
    console.log(`Backend server running at http://localhost:${PORT}`);
});

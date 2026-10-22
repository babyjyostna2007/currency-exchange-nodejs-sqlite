const API_URL = "http://localhost:3000";

async function convertCurrency() {
    const from = document.getElementById("fromCurrency").value;
    const to = document.getElementById("toCurrency").value;
    const amount = document.getElementById("amount").value;
    const result = document.getElementById("result");

    if (amount === "" || Number(amount) <= 0) {
        showError(result, "Please enter an amount greater than 0.");
        return;
    }

    const url =
        `${API_URL}/api/rate` +
        `?from=${encodeURIComponent(from)}` +
        `&to=${encodeURIComponent(to)}` +
        `&amount=${encodeURIComponent(amount)}`;

    try {
        const response = await fetch(url);
        const resultData = await response.json();

        if (!resultData.success) {
            showError(
                result,
                resultData.message +
                "<br>" +
                (resultData.error || "")
            );
            return;
        }

        const data = resultData.data;

        result.style.display = "block";
        result.className = "result success";

        result.innerHTML = `
            <strong>Conversion Successful</strong>
            <br><br>
            ${data.amount} ${data.from}
            =
            <strong>${data.convertedAmount} ${data.to}</strong>
            <br>
            Exchange Rate: ${data.exchangeRate}
        `;
    } catch (error) {
        showError(result, "Unable to connect to backend server.");
    }
}

function showError(element, message) {
    element.style.display = "block";
    element.className = "result error";
    element.innerHTML = message;
}

async function showRates() {
    const ratesDiv = document.getElementById("rates");

    try {
        const response = await fetch(`${API_URL}/api/rates`);
        const resultData = await response.json();

        if (!resultData.success) {
            ratesDiv.innerHTML = resultData.message;
            return;
        }

        let html = "<h3>Available Exchange Rates</h3>";

        resultData.data.forEach((rate) => {
            html += `
                <div class="rate-item">
                    <strong>
                        ${rate.from_currency}
                        →
                        ${rate.to_currency}
                    </strong>
                    : ${rate.rate}
                </div>
            `;
        });

        ratesDiv.innerHTML = html;
    } catch (error) {
        ratesDiv.innerHTML = "Unable to load exchange rates.";
    }
}

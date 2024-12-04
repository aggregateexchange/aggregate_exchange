import { BigNumber } from 'bignumber.js';

export async function makeTransactionRequest(quote: any): Promise<any> {
    const url = 'https://aggregate.exchange/api/transaction';

    // Insert disable_gas_estimate: true into the quote
    quote.disable_gas_estimate = true;

    console.log('Transaction request API quote:');
    printJSON(quote);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: stringifyWithBigIntAndBigNumber(quote)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const rawResponseText = await response.text();
        console.log('Raw API Response:');
        console.log(rawResponseText);

        let data;
        try {
            data = JSON.parse(rawResponseText);
            console.log('Parsed Response:');
            console.log(JSON.stringify(data, null, 2));
        } catch (parseError) {
            console.error('Error parsing response as JSON:', parseError);
            console.log('Response was not valid JSON. Returning raw text.');
            return rawResponseText;
        }

        return data;
    } catch (error: any) {
        console.error('Error making request:', error.message);
        throw error;
    }
}

function printJSON(jsonData: any): void {
    const jsonStr = stringifyWithBigIntAndBigNumber(jsonData);
    const formattedStr = jsonStr.replace(/\\n/g, '\n');
    console.log('JSON representation of the quote:');
    console.log(formattedStr);
}

function stringifyWithBigIntAndBigNumber(obj: any): string {
    return JSON.stringify(obj, (key, value) => {
        if (typeof value === 'bigint') {
            return value.toString() + 'n';
        } else if (BigNumber.isBigNumber(value)) {
            return value.toString();
        }
        return value;
    }, 2);
}
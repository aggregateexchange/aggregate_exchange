import { EventEmitter } from 'events';

class QuoteStreamer extends EventEmitter {
    private _buffer: string;

    constructor() {
        super();
        this._buffer = '';
    }

    processBuffer() {
        let startIndex = 0;
        let endIndex;

        while ((endIndex = this._buffer.indexOf('}{', startIndex)) !== -1) {
            const fullQuote = this._buffer.substring(startIndex, endIndex + 1);
            try {
                JSON.parse(fullQuote); // Validate JSON
                this.emit('newQuote', fullQuote);
            } catch (error) {
                console.error('Invalid JSON in buffer:', fullQuote);
            }
            startIndex = endIndex + 1;
        }

        this._buffer = this._buffer.substring(startIndex);
    }

    addData(chunk: string) {
        this._buffer += chunk;
        this.processBuffer();
    }

    getRemainingBuffer(): string {
        return this._buffer;
    }
}

export function makeRequest(params: Record<string, any>): QuoteStreamer {
    const data = JSON.stringify(params);
    console.log('Requesting with params:', data);

    const quoteStreamer = new QuoteStreamer();

    fetch('https://aggregate.exchange/api/quote-stream', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: data
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error('No reader available on response body');
        }
        return processStream(reader, quoteStreamer);
    })
    .catch(error => {
        console.error('Request error:', error);
        quoteStreamer.emit('error', error);
    });

    return quoteStreamer;
}

function processStream(reader: ReadableStreamDefaultReader<Uint8Array>, quoteStreamer: QuoteStreamer): Promise<void> {
    const decoder = new TextDecoder();

    function processText({ done, value }: ReadableStreamReadResult<Uint8Array>): Promise<void> {
        if (done) {
            console.log('Full response received');
            const remainingBuffer = quoteStreamer.getRemainingBuffer();
            if (remainingBuffer.length > 0) {
                try {
                    JSON.parse(remainingBuffer); // Validate JSON
                    quoteStreamer.emit('newQuote', remainingBuffer);
                } catch (error) {
                    console.error('Invalid JSON in final buffer:', remainingBuffer);
                }
            }
            quoteStreamer.emit('end');
            return Promise.resolve();
        }

        const chunk = decoder.decode(value, { stream: true });
        //console.log('Received chunk:', chunk);
        quoteStreamer.addData(chunk);

        return reader.read().then(processText);
    }

    return reader.read().then(processText);
}
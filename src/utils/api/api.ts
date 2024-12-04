//src/utils/api/api
import axios from 'axios';

// Function to fetch chain data
export const fetchChainsData = async () => {
    const url = 'https://aggregate.exchange/api/chains';
    try {
        const response = await axios.get(url);
        console.log("Fetched Chains Data:", response.data);
        return response.data; // Return the data for use in the application.
    } catch (error) {
        console.error('Error fetching chains data:', error);
        return null; // Handle errors gracefully
    }
};

// Function to fetch token data
export const fetchTokensData = async () => {
    const url = 'https://aggregate.exchange/api/tokens';
    try {
        const response = await axios.get(url);
        console.log("Fetched Tokens Data:", response.data);
        return response.data; // Return the data for use in the application.
    } catch (error) {
        console.error('Error fetching tokens data:', error);
        return null; // Handle errors gracefully
    }
};

export const fetchDappsData = async () => {
    const url = 'https://aggregate.exchange/api/dapps';
    try {
        const response = await axios.get(url);
        console.log("Fetched Dapps Data:", response.data);
        return response.data; // Return the data for use in the application.
    } catch (error) {
        console.error('Error fetching dapps data:', error);
        return null; // Handle errors gracefully
    }
};

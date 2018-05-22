import Axios from 'axios';

const api = Axios.create({
  baseURL: 'https://api.pricefinder.com.au/v1',
  timeout: '4000'
});

export const suggestProperty = async (address) => {
  const response = await api.get(`/suggest/properties?q=${address}`);
}
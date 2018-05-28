const Axios = require('axios');

const tokenStr = process.env.PRICEFINDER_TOKEN || null;

if (tokenStr === null) {
  throw new Error('env variable PRICEFINDER_TOKEN must be set');
}

const api = Axios.create({
  baseURL: 'https://api.pricefinder.com.au/v1',
  timeout: '4000',
  headers: {'Authorization' : `Bearer ${tokenStr}`}
});

const suggestProperty = async (address) => {
  let repsonse;
  try {
    response = await api.get(`/suggest/properties?q=${address}`);
    return response.data;
  } catch(e) {
    throw new Error(e);
  }
}

const getPropertyFeature = async(propertyId)=>{
  let repsonse;
  try {
    response = await api.get(`/properties/${propertyId}`);
    return response.data.features;
  } catch(e) {
    throw new Error(e);
  }
}

const getPropertyImage = async (propertyId) => {
  let repsonse;
  try {
    response = await api.get(`/properties/${propertyId}/images/main`);
    return response.data._self;
  } catch(e) {
    throw new Error(e);
  }
}

module.exports = {
  suggestProperty,
  getPropertyImage,
  getPropertyFeature,
}
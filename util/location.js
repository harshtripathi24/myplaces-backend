const axios = require("axios");
const HttpError = require("../Models/http-error");

const API_KEY = "AIzaSyCLTz0uAgKYLJG9ALYKB4DteE1idbpT5AU";

async function getCoordsForAddress(address) {
  const response = await axios.get(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&key=${API_KEY}`
  );

  const data = response.data;

  if (!data || data.status === "ZERO_RESULTS") {
    const error = new HttpError(
      "Could not find loaction for the specified address",
      422
    );
    throw error;
  }

  const cordinates = data.results[0].geometry.location;

  return cordinates;
}

module.exports = getCoordsForAddress;

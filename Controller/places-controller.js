const fs = require("fs");

const { v4: uuid } = require("uuid");

const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const HttpError = require("../Models/http-error");

const getCoordsForAddress = require("../util/location");

const Place = require("../Models/place");

const User = require("../Models/user");

const getPlaceById = async (req, res, next) => {
  const placeId = req.params.placeId;

  let place;

  try {
    place = await Place.findById(placeId);
  } catch (error) {
    const err = new HttpError(
      "Something Went Wrong, could not find the place",
      500
    );
    return next(err);
  }

  if (!place) {
    const error = new HttpError(
      "Could Not Find a place with this for the provided place id, May be the user is yet to add some Places ! ",
      404
    );

    return next(error);
  } else {
    res.status(200).json({ place: place.toObject({ getters: true }) });
  }
};

const getPlacesByUserId = async (req, res, next) => {
  const { uid } = req.params;

  let userwithPlaces;
  try {
    userwithPlaces = await User.findById(uid).populate("places");
  } catch (error) {
    const err = new HttpError(
      "Something went wrong, could not find user's places",
      500
    );

    return next(err);
  }
  if (!userwithPlaces || userwithPlaces.places.length === 0) {
    const error = new HttpError(
      "Could Not Find a place with this error for the provided place id ",
      404
    );

    return next(error);
  } else {
    res.status(200).json({
      places: userwithPlaces.places.map((place) =>
        place.toObject({ getters: true })
      ),
    });
  }
};

const createPlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid input passed, please check your data", 422)
    );
  }

  const { title, description, address } = req.body;

  const cordinates = await getCoordsForAddress(address);

  const placeCreated = new Place({
    title,
    description,
    address,
    location: cordinates,
    image: req.file.path,
    creator: req.userData.userId,
  });

  let user;

  try {
    user = await User.findById(req.userData.userId);
  } catch (error) {
    const err = new HttpError(
      "Creating Place failed or the Provided Id didn't matched please try again.",
      500
    );

    return next(err);
  }

  if (!user) {
    const err = new HttpError(
      "Could not find the user with the provided creator id",
      404
    );

    return next(err);
  }

  try {
    const sess = await mongoose.startSession(); // Session and Transections for Making sure that both collection get updated or none
    sess.startTransaction();
    await placeCreated.save({ session: sess });
    user.places.push(placeCreated); //Mongooses automatically grab only the id of created palce and add it
    await user.save({ session: sess });
    await sess.commitTransaction(); // This will finally commit the change in data base
  } catch (error) {
    const err = new HttpError(
      "Creating Place failed please try again. buzzzz....",
      500
    );

    return next(err);
  }

  res.status(201).json({ place: placeCreated });
};

const updatePlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new HttpError("Invalid input passed, please check your data", 422);
  }
  const { title, description } = req.body;

  const placeId = req.params.placeId;

  let place;
  try {
    place = await Place.findById(placeId);
  } catch (error) {
    const err = new HttpError(
      "Something Went Wrong, could not update the place",
      500
    );
    return next(err);
  }

  if (place.creator.toString() !== req.userData.userId) {
    const err = new HttpError("You are not allowed to edit this place", 401);
    return next(err);
  }

  place.title = title;
  place.description = description;

  try {
    await place.save();
  } catch (error) {
    const err = new HttpError(
      "Something Went Wrong, could not update the place",
      500
    );
    return next(err);
  }

  res.status(200).json({ place: place.toObject({ getters: true }) });
};

const deletePlace = async (req, res, next) => {
  const placeId = req.params.placeId;

  let place;
  try {
    place = await Place.findById(placeId).populate("creator");
  } catch (error) {
    const err = new HttpError(
      "Something Went Wrong, could not Delete the place",
      500
    );
    return next(err);
  }

  if (!place) {
    const err = new HttpError("Could Not find place for this Id", 404);
    return next(err);
  }

  if (place.creator.id !== req.userData.userId) {
    const err = new HttpError(
      "You are not allowed for deleting this place",
      401
    );
    return next(err);
  }

  const imagePath = place.image;

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await place.remove({ session: sess });
    place.creator.places.pull(place);
    await place.creator.save({ session: sess });
    await sess.commitTransaction();
  } catch (error) {
    const err = new HttpError(
      "Something Went Wrong, could not Delete the place",
      500
    );
    return next(err);
  }

  fs.unlink(imagePath, (err) => {
    console.log(err);
  });
  res.status(200).json({ message: "Place Deleted" });
};

module.exports = {
  getPlaceById,
  getPlacesByUserId,
  createPlace,
  updatePlace,
  deletePlace,
};

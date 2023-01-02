const fs = require("fs"); //Node Built in file Sytem module
const path = require("path"); //Path Module built in
const mongoose = require("mongoose");

const express = require("express");

const placesRoutes = require("./routes/places-routes");
const usersRoutes = require("./routes/users-routes");
const bodyParse = require("body-parser");

const HttpError = require("./Models/http-error");
const { application } = require("express");
// All the Imports Above

const app = express();

// Using Middleware
app.use(bodyParse.json());

app.use("/uploads/images", express.static(path.join("uploads", "images")));

//Middleware for Handling CORS Error in Frontend
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Orgin, X-Requested-With, Content-Type, Accept, Authorization"
  );

  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE");
  next();
});

// Using Route attaching Middleware
app.use("/api/places", placesRoutes);
app.use("/api/users", usersRoutes);

app.use((req, res, next) => {
  const err = new HttpError("This Route does not exist ", 404);

  throw err;
});
app.use((error, req, res, next) => {
  if (req.file) {
    fs.unlink(req.file.path, (err) => {
      console.log(err);
    });
  }

  if (res.headerSent) {
    return next(error);
  }

  res.status(error.code || 500);
  res.json({ message: error.message || "An unknown error occupied !" });
});

mongoose
  .connect(
    `mongodb+srv://${process.env.DB_USER}:Y5QXkxkGDgv4hipV@placeshareapp.dnffe4f.mongodb.net/MyMernPlaces?retryWrites=true&w=majority`
  )
  .then(() => {
    console.log("Database Connected");
    app.listen(5000, () => {
      console.log("App listening to port 5000");
    });
  })
  .catch((error) => {
    console.log(error);
  });

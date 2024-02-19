const express = require("express");
const app = express();
const fs = require("fs");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const axios = require("axios");
const cors = require("cors");
const path = require('path');
const { google } = require("googleapis");
require('dotenv').config();
// const participants = require("./equilibrium_registration.json")

// console.log(participants[0]);

// for (var participant in participants) {
//     JSON.parse(participant);
//     console.log(participant.College);
// }

fs.readFile("./equilibrium_registrations.json", 'utf-8', (err, data) => {
    const participants = JSON.parse(data);
    console.log(participants[0]["Candidate's Name"]);
});

const updateSheet = async (participantDetails) => {
    const auth = new google.auth.GoogleAuth({
        keyFile: "equilibrium-24-414611-fe327b7599b4.json",
        scopes: "https://www.googleapis.com/auth/spreadsheets",
    });

    const authClientObject = await auth.getClient();

    const googleSheetsInstance = google.sheets({
        version: "v4",
        auth: authClientObject
    });

    const spreadsheetId = "1YW4a-kMYc5iKdgUf126kAX7-fVlAktX3Z6ZXkc_KJYo";

    await googleSheetsInstance.spreadsheets.values.append({
        auth,
        spreadsheetId,
        range: "Sheet1",
        valueInputOption: "USER_ENTERED",
        resource: {
            values: [participantDetails]
        }
    });
};

const axiosConfig = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.STRAPI_API_KEY}`,
    },
  };
const apiUrl = process.env.STRAPI_API_URL;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/:id", async (req, res) => {
    var response = await axios.get(`${apiUrl}/participants/${req.params.id}?populate=events`, axiosConfig);
    console.log(response.data.data.attributes.events.data);
    res.render('index', {details: response.data.data});
});

app.post("/sign-in", async (req, res) => {
    console.log(req.body);
    var participantId = req.body.participantId;
    var participantDetails = await axios.get(`${apiUrl}/participants/${participantId}`, axiosConfig);
    var detail = [participantDetails.data.data.attributes.Name, participantDetails.data.data.attributes.Contact, participantDetails.data.data.attributes.College, "in"];
    console.log(participantDetails.data);
    try {
        var signIn = await axios.put(`${apiUrl}/participants/${participantId}`, {data: {Day_1: true}} , axiosConfig);
        res.redirect(`/${participantId}`);
        updateSheet(detail);
    } catch (error) {
        console.error("Error Signing: ", error);
        res.status(500).send("Error while signing.");
    }
});

app.post("/sign-out", async (req, res) => {
    console.log(req.body);
    var participantId = req.body.participantId;
    var participantDetails = await axios.get(`${apiUrl}/participants/${participantId}`, axiosConfig);
    // console.log(participantDetails.data);
    try {
        var signOut = await axios.put(`${apiUrl}/participants/${participantId}`, {data: {Day_1: false}} , axiosConfig);
        res.redirect(`/${participantId}`);
    } catch (error) {
        console.error("Error Signing: ", error);
        res.status(500).send("Error while signing.");
    }
});

app.listen(3030, () => {
    console.log("Listening on port 3030");
});
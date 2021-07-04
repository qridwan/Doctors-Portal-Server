const express = require("express");
const cors = require("cors");
const MongoClient = require("mongodb").MongoClient;
require("dotenv").config();
const ObjectId = require("mongodb").ObjectId;
const fileUpload = require("express-fileupload");

const app = express();
const uri = ` mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.q83cw.mongodb.net/${process.env.DB_DbName}?retryWrites=true&w=majority`;

app.use(express.json());
app.use(cors());
//file uploader midleware
app.use(express.static("doctors"));
app.use(fileUpload());

app.get("/", (req, res) => {
  res.send("Server is Running");
});

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

client.connect((err) => {
  const AppointmentCollection = client
    .db(`${process.env.DB_DbName}`)
    .collection(`${process.env.DB_COLLECTION}`);
  const doctorCollection = client
    .db(`${process.env.DB_DbName}`)
    .collection("doctors");

  app.post("/booking", (req, res) => {
    const booking = req.body;

    AppointmentCollection.insertOne(booking)
      .then((result) => {
        console.log(result.insertedCount > 0);
        res.send(result.insertedCount > 0);
      })
      .catch((err) => {
        console.log(err);
      });
  });

  app.post("/appointmentsByDate", (req, res) => {
    const date = req.body;
    const email = req.body.email;
    console.log("REQ",{date} , {email});
    doctorCollection.find({ email: email }).toArray((err, doctors) => {
      const filter = { date: date.date };
      if (doctors.length === 0) {
        filter.email = email;
      }

      AppointmentCollection.find(filter).toArray((err, doc) => {
        const specificDaysAppointment = doc;

        AppointmentCollection.find(filter.email).toArray((err, documents) => {
          const userAppointments = documents;
          const infos = [
            {
              specificDaysAppointment: specificDaysAppointment,
              userAppointments: userAppointments,
            },
          ];
          res.send(infos);
        });
      });
    });
  });

  app.post("/addDoctor", function (req, res) {
    const file = req.files.file;
    const name = req.body.name;
    const email = req.body.email;
    const newImg = file.data;
    const encImg = newImg.toString("base64");
    const image = {
      contentType: file.mimetype,
      size: file.size,
      img: Buffer.from(encImg, "base64"),
    };
    //sending doctors information
    doctorCollection.insertOne({ name, email, image }).then((result) => {
      res.send(result.insertedCount > 0);
      console.log("New Doctor Added Successfully");
    });

    //for saving img in definite directory
    //      file.mv(`${__dirname}/doctors/${file.name}` , err => {
    // if (err) {
    //     console.log(err);
    //     return res.status(500).send({message: 'File uploading failed'})
    // }
    // return res.send({name: file.name, path: `/${file.name}`})
    //      })
  });

  //getting all doctors
  app.get("/doctors", (req, res) => {
    doctorCollection.find({}).toArray((err, documents) => {
      res.send(documents);
    });
  });

  app.post("/isDoctor", (req, res) => {
    const email = req.body.email;
    doctorCollection.find({ email: email }).toArray((err, doctors) => {
      console.log(
        "🚀 ~ file: index.js ~ line 103 ~ .toArray ~ doctors",
        doctors
      );
      res.send(doctors.length > 0);
    });
  });
});

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`Node is ready`);
});

const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const colors = require("colors");
const morgan = require("morgan");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();

const port = process.env.PORT || 8080;

// middleware
app.use(express.json());
app.use(cors());
app.use(morgan());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xmhqmx1.mongodb.net/`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const apartmentCollection = client
      .db("building-managment-system")
      .collection("apartment");

    const userCollection = client
      .db("building-managment-system")
      .collection("users");

    const announcementCollection = client
      .db("building-managment-system")
      .collection("announcements");

    const agrementCollection = client
      .db("building-managment-system")
      .collection("agrements");

    /////////////////////////////////
    //           JWT Api           //
    /////////////////////////////////
    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "7h",
      });
      res.send({ token });
    });

    // -------------------------- //
    //      Apartment restAPi     //
    // -------------------------  //
    // show all apartments
    app.get("/api/v1/apartments", async (req, res) => {
      const result = await apartmentCollection.find().toArray();
      res.send(result);
    });

    // find a single apertment using id
    app.get("/api/v1/apartment/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await apartmentCollection.findOne(query);
      res.send(result);
    });

    // create apartment
    app.post("/api/v1/apartment", async (req, res) => {
      const createApartment = req.body;
      const result = await apartmentCollection.insertOne(createApartment);
      res.send(result);
    });

    // delete apartment using id
    app.delete("/api/v1/apartment/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await apartmentCollection.deleteOne(query);
      res.send(result);
    });

    // Update apartment using id
    app.patch("/api/v1/apartment/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updateApartment = req.body;
      const result = await apartmentCollection.updateOne(query, {
        $set: updateApartment,
      });
      res.send(result);
    });

    // -------------------------- //
    //      User restAPi     //
    // -------------------------  //

    // create a user
    app.post("/api/v1/create-user", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "User already exist", insertedId: null });
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    app.get("/google", (req, res) => {
      res.send("<h2>I am goodle workd</h2>");
    });

    // single user show
    app.get("/api/v1/single-member/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      // const result = await userCollection.find().toArray();
      const result = await userCollection.findOne(query);

      res.send(result);
    });

    // show all users
    app.get("/api/v1/members", async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    // update use
    app.patch("/api/v1/update-user", async (req, res) => {
      const user = req.body;
      const email = { email: user.email };
      const result = await userCollection.updateOne(email, {
        $set: user,
      });
      res.send(result);
    });

    // Delete User
    app.delete("/api/v1/delete-user/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await userCollection.deleteOne(query);
      res.send(result);
    });

    // -------------------------- //
    //      Announcement          //
    // -------------------------  //

    // create annoncement
    app.post("/api/v1/make-announcement", async (req, res) => {
      const announcement = req.body;
      const result = await announcementCollection.insertOne(announcement);
      res.send(result);
    });

    // show all announcement
    app.get("/api/v1/announcements", async (req, res) => {
      const result = await announcementCollection.find().toArray();
      res.send(result);
    });

    // Edit Announcement
    app.patch("/api/v1/announcement/:id", async (req, res) => {
      const id = req.params.id;
      const updateAnnouncement = req.body;
      const query = { _id: new ObjectId(id) };
      const result = await announcementCollection.updateOne(query, {
        $set: updateAnnouncement,
      });

      res.send(result);
    });

    // Delete announcement
    app.delete("/api/v1/announcement/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await announcementCollection.deleteOne(query);
      res.send(result);
    });

    /****************************/
    /*        Agrements         */
    /****************************/
    // middleware
    const agrementCheck = async (req, res, next) => {
      const agrement = req.body;
      const id = { apartmentId: agrement.apartmentId };
      const query = await agrementCollection.findOne(id);
      if (query) {
        res.send({ message: "Already Ordered" });
        return;
      }
      next();
    };

    // get all agrements
    app.get("/api/v1/agrement", async (req, res) => {
      const result = await agrementCollection.find().toArray();
      res.send(result);
    });

    // show single user agrement
    app.get("/api/v1/user-agrement/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const result = await agrementCollection.find(query).toArray();

      res.send(result);
    });

    // create agrement
    app.post("/api/v1/agrement", agrementCheck, async (req, res) => {
      const agrement = req.body;
      // const id = { _id: new ObjectId(agrement._id) };
      const result = await agrementCollection.insertOne(agrement);
      res.send(result);
    });

    // update agrement
    app.patch("/api/v1/agrement/:id", async (req, res) => {
      const id = req.params.id;
      const status = req.body;
      const query = { _id: new ObjectId(id) };
      // const result = await agrementCollection.findOne(query);
      const result = await agrementCollection.updateOne(query, {
        $set: status,
      });

      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!".bgGreen
        .white
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// api
app.get("/", (req, res) => {
  res.send(
    "<h1 style='text-align: center'>Building Managment System Server</h1>"
  );
});

app.get("/api", (req, res) => {
  res.send("working api");
});

app.get("/api/v1", (req, res) => {
  res.send("working api v1");
});

app.get("/api/v1/data", (req, res) => {
  res.send({
    name: "Mahbubul Alam",
    phone: "01623361555",
  });
});

// post listen
app.listen(port, () => {
  console.log(
    `Server is running on port ${process.env.HOST}:${port}`.bgMagenta.white
  );
});

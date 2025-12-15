const express = require('express');
const cors = require('cors');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = process.env.PORT || 5000;


// middleware
app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@nurahad.0txpfm4.mongodb.net/?appName=Nurahad`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

app.get('/', (req, res) => {
  res.send('Local chef bazaar server is running')
})

async function run() {
  try {
    await client.connect();

    await client.db("admin").command({ ping: 1 });

    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    const db = client.db("localChefBazaar");
    const usersCollection = db.collection("users");
    const mealsCollection = db.collection("meals");
    const ordersCollection = db.collection("orders");
    const reviewsCollection = db.collection("reviews");

    /*---------------user---------------*/
    app.post("/users", async (req, res) => {
      const user = req.body;
      const exists = await usersCollection.findOne({ email: user.email });
      if (exists) return res.send({ message: "User already exists" });
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    app.get("/users", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    app.patch("/users/fraud/:id", async (req, res) => {
      const id = req.params.id;
      const result = await usersCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { status: "fraud" } }
      );
      res.send(result);
    });

    /*----------------chef-------------*/
    /*--meals--*/
    app.post("/meals", async (req, res) => {
      const meal = req.body;
      const result = await mealsCollection.insertOne(meal);
      res.send(result);
    });

    app.get("/meals", async (req, res) => {
      const result = await mealsCollection.find().toArray();
      res.send(result);
    });

    app.get("/meals/chef/:email", async (req, res) => {
      const email = req.params.email;
      const result = await mealsCollection.find({ chefEmail: email }).toArray();
      res.send(result);
    });

    app.delete("/meals/:id", async (req, res) => {
      const id = req.params.id;
      const result = await mealsCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    /*--orders--*/
    app.post("/orders", async (req, res) => {
      const order = req.body;
      order.orderStatus = "pending";
      order.paymentStatus = "pending";
      const result = await ordersCollection.insertOne(order);
      res.send(result);
    });

    app.get("/orders/user/:email", async (req, res) => {
      const email = req.params.email;
      const result = await ordersCollection.find({ userEmail: email }).toArray();
      res.send(result);
    });

    app.get("/orders/chef/:chefId", async (req, res) => {
      const chefId = req.params.chefId;
      const result = await ordersCollection.find({ chefId }).toArray();
      res.send(result);
    });

    app.patch("/orders/status/:id", async (req, res) => {
      const id = req.params.id;
      const { status } = req.body;
      const result = await ordersCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { orderStatus: status } }
      );
      res.send(result);
    });

    /*--reviews--*/
    app.post("/reviews", async (req, res) => {
      const review = req.body;
      const result = await reviewsCollection.insertOne(review);
      res.send(result);
    });

    app.get("/reviews/:mealId", async (req, res) => {
      const mealId = req.params.mealId;
      const result = await reviewsCollection.find({ mealId }).toArray();
      res.send(result);
    });
  }

  finally {

  }
}

run().catch(console.dir);

app.listen(port, () => {
  console.log(`local chef bazaar server running on port ${port}`)
})

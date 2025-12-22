// const express = require('express');
// const cors = require('cors');
// require('dotenv').config()
// const jwt = require('jsonwebtoken');
// const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

// const app = express()
// const port = process.env.PORT || 5000;

// // middleware
// app.use(cors())
// app.use(express.json())

// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@nurahad.0txpfm4.mongodb.net/?appName=Nurahad`;

// const client = new MongoClient(uri, {
//   serverApi: {
//     version: ServerApiVersion.v1,
//     strict: true,
//     deprecationErrors: true,
//   }
// });

// app.get('/', (req, res) => {
//   res.send('Local chef bazaar server is running')
// });

// /* ================= JWT & MIDDLEWARE ================= */

// const verifyToken = (req, res, next) => {
//   const authHeader = req.headers.authorization;
//   if (!authHeader) {
//     return res.status(401).send({ message: 'unauthorized' });
//   }

//   const token = authHeader.split(' ')[1];

//   jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
//     if (err) {
//       return res.status(401).send({ message: 'unauthorized' });
//     }

//     req.decoded = decoded;
//     next();
//   });
// };


// const verifyRole = (roles) => {
//   return async (req, res, next) => {
//     const email = req.decoded.email;
//     const user = await usersCollection.findOne({ email });
//     if (!user || !roles.includes(user.role)) {
//       return res.status(403).send({ message: "Forbidden" });
//     }
//     req.user = user;
//     next();
//   };
// };

// const verifyNotFraud = async (req, res, next) => {
//   const email = req.decoded.email;
//   const user = await usersCollection.findOne({ email });
//   if (user?.status === "fraud") {
//     return res.status(403).send({ message: "Fraud user blocked" });
//   }
//   next();
// };

// /* ================= RUN ================= */

// let usersCollection;
// let mealsCollection;
// let ordersCollection;
// let reviewsCollection;
// let favoritesCollection;
// let roleRequestCollection;

// async function run() {
//   try {
//     await client.connect();
//     await client.db("admin").command({ ping: 1 });
//     console.log("Pinged your deployment. You successfully connected to MongoDB!");

//     const db = client.db("localChefBazaar");
//     usersCollection = db.collection("users");
//     mealsCollection = db.collection("meals");
//     ordersCollection = db.collection("orders");
//     reviewsCollection = db.collection("reviews");
//     favoritesCollection = db.collection("favorites");
//     roleRequestCollection = db.collection("roleRequests");

//     /* ================= AUTH ================= */
//     // index.js (server)
//     app.post('/jwt', (req, res) => {
//       const user = req.body; // { email }
//       if (!user?.email) {
//         return res.status(400).send({ message: 'email required' });
//       }

//       const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
//         expiresIn: '1h',
//       });

//       res.send({ token });
//     });


//     /* ================= USERS ================= */
//     app.post("/users", async (req, res) => {
//       const user = req.body;
//       const exists = await usersCollection.findOne({ email: user.email });
//       if (exists) return res.send({ message: "User already exists" });
//       const result = await usersCollection.insertOne(user);
//       res.send(result);
//     });

//     app.get("/users", verifyToken, verifyRole(["admin"]), async (req, res) => {
//       const result = await usersCollection.find().toArray();
//       res.send(result);
//     });

//     app.get("/users/profile", verifyToken, async (req, res) => {
//       const email = req.query.email;

//       if (email !== req.decoded.email) {
//         return res.status(403).send({ message: "Forbidden access" });
//       }

//       const user = await usersCollection.findOne({ email });
//       res.send(user);
//     });


//     app.patch("/users/fraud/:id", verifyToken, verifyRole(["admin"]), async (req, res) => {
//       const id = req.params.id;
//       const result = await usersCollection.updateOne(
//         { _id: new ObjectId(id) },
//         { $set: { status: "fraud" } }
//       );
//       res.send(result);
//     });

//     /* ================= MEALS ================= */
//     app.post("/meals", verifyToken, verifyRole(["chef"]), verifyNotFraud, async (req, res) => {
//       const meal = req.body;
//       const result = await mealsCollection.insertOne(meal);
//       res.send(result);
//     });

//     app.get("/meals", async (req, res) => {
//       const result = await mealsCollection.find().toArray();
//       res.send(result);
//     });

//     app.get("/meals/chef/:email", verifyToken, async (req, res) => {
//       const email = req.params.email;
//       const result = await mealsCollection.find({ chefEmail: email }).toArray();
//       res.send(result);
//     });

//     app.delete("/meals/:id", verifyToken, verifyRole(["chef"]), async (req, res) => {
//       const id = req.params.id;
//       const result = await mealsCollection.deleteOne({ _id: new ObjectId(id) });
//       res.send(result);
//     });

//     /* ================= ORDERS ================= */
//     app.post("/orders", verifyToken, verifyRole(["user"]), verifyNotFraud, async (req, res) => {
//       const order = req.body;
//       order.orderStatus = "pending";
//       order.paymentStatus = "pending";
//       const result = await ordersCollection.insertOne(order);
//       res.send(result);
//     });

//     app.get("/orders/user/:email", verifyToken, async (req, res) => {
//       const email = req.params.email;
//       const result = await ordersCollection.find({ userEmail: email }).toArray();
//       res.send(result);
//     });

//     app.get("/orders/chef/:chefId", verifyToken, verifyRole(["chef"]), async (req, res) => {
//       const chefId = req.params.chefId;
//       const result = await ordersCollection.find({ chefId }).toArray();
//       res.send(result);
//     });

//     app.patch("/orders/status/:id", verifyToken, verifyRole(["chef"]), async (req, res) => {
//       const id = req.params.id;
//       const { status } = req.body;
//       const result = await ordersCollection.updateOne(
//         { _id: new ObjectId(id) },
//         { $set: { orderStatus: status } }
//       );
//       res.send(result);
//     });

//     /* ================= REVIEWS ================= */
//     app.post("/reviews", verifyToken, async (req, res) => {
//       const review = req.body;
//       const result = await reviewsCollection.insertOne(review);
//       res.send(result);
//     });

//     app.get("/reviews/:mealId", async (req, res) => {
//       const mealId = req.params.mealId;
//       const result = await reviewsCollection.find({ mealId }).toArray();
//       res.send(result);
//     });

//     /* ================= FAVORITES ================= */
//     app.post("/favorites", verifyToken, async (req, res) => {
//       const fav = req.body;
//       const result = await favoritesCollection.insertOne(fav);
//       res.send(result);
//     });

//     app.get("/favorites/:email", verifyToken, async (req, res) => {
//       const email = req.params.email;
//       const result = await favoritesCollection.find({ email }).toArray();
//       res.send(result);
//     });

//     /* ================= ROLE REQUEST ================= */
//     app.post("/role-request", verifyToken, async (req, res) => {
//       const request = req.body;
//       request.status = "pending";
//       const result = await roleRequestCollection.insertOne(request);
//       res.send(result);
//     });

//     app.get("/role-request", verifyToken, verifyRole(["admin"]), async (req, res) => {
//       const result = await roleRequestCollection.find().toArray();
//       res.send(result);
//     });

//     app.patch("/role-request/approve/:id", verifyToken, verifyRole(["admin"]), async (req, res) => {
//       const id = req.params.id;
//       const { role, email } = req.body;

//       await usersCollection.updateOne(
//         { email },
//         {
//           $set: {
//             role,
//             chefId: role === "chef" ? `CH-${Date.now()}` : null,
//           },
//         }
//       );

//       const result = await roleRequestCollection.updateOne(
//         { _id: new ObjectId(id) },
//         { $set: { status: "approved" } }
//       );

//       res.send(result);
//     });

//     /* ================= ADMIN STATS ================= */
//     app.get("/admin-stats", verifyToken, verifyRole(["admin"]), async (req, res) => {
//       const totalUsers = await usersCollection.countDocuments();
//       const totalOrders = await ordersCollection.countDocuments();
//       const deliveredOrders = await ordersCollection.countDocuments({ orderStatus: "delivered" });

//       res.send({ totalUsers, totalOrders, deliveredOrders });
//     });

//   } finally { }
// }

// run().catch(console.dir);

// app.listen(port, () => {
//   console.log(`local chef bazaar server running on port ${port}`)
// });


const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

// MongoDB URI
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@nurahad.0txpfm4.mongodb.net/?appName=Nurahad`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Collections
let usersCollection;
let mealsCollection;
let ordersCollection;
let reviewsCollection;
let favoritesCollection;
let roleRequestCollection;

app.get('/', (req, res) => {
  res.send('Local chef bazaar server is running');
});

async function run() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("✅ Successfully connected to MongoDB!");

    const db = client.db("localChefBazaar");

    usersCollection = db.collection("users");
    mealsCollection = db.collection("meals");
    ordersCollection = db.collection("orders");
    reviewsCollection = db.collection("reviews");
    favoritesCollection = db.collection("favorites");
    roleRequestCollection = db.collection("roleRequests");

    // 🔥 Generate sequential Chef ID like CH-001, CH-002
    const generateChefId = async () => {
      const chefCount = await usersCollection.countDocuments({
        role: "chef",
        chefId: { $exists: true },
      });

      return `CH-${String(chefCount + 1).padStart(3, "0")}`;
    };


    /* ================= USERS ================= */

    app.post("/users", async (req, res) => {
      const user = req.body;

      const exists = await usersCollection.findOne({ email: user.email });
      if (exists) return res.send({ message: "User already exists" });

      // Default role logic
      if (user.email === process.env.OWNER_EMAIL) {
        user.role = "admin"; // super admin
      } else {
        user.role = "user";
      }

      user.status = "active";

      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    app.get("/users", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    app.get("/users/profile", async (req, res) => {
      const email = req.query.email;
      const user = await usersCollection.findOne({ email });
      res.send(user);
    });

    app.patch("/users/fraud/:id", async (req, res) => {
      const id = req.params.id;
      const result = await usersCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { status: "fraud" } }
      );
      res.send(result);
    });

    /* ================= MEALS ================= */

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

    app.get("/meals/:id", async (req, res) => {
      const id = req.params.id;

      const meal = await mealsCollection.findOne({
        _id: new ObjectId(id),
      });

      if (!meal) {
        return res.status(404).send({ message: "Meal not found" });
      }

      res.send(meal);
    });


    app.delete("/meals/:id", async (req, res) => {
      const id = req.params.id;
      const result = await mealsCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    /* ================= ORDERS ================= */

    app.post("/orders", async (req, res) => {
      const order = req.body;
      order.orderStatus = "pending";
      order.paymentStatus = "pending";
      const result = await ordersCollection.insertOne(order);
      res.send(result);
    });

    app.get("/orders", async (req, res) => {
      try {
        const orders = await ordersCollection.find({}).toArray();
        res.send(orders);
      } catch (error) {
        res.status(500).send({ error: error.message });
      }
    });

    app.get("/orders/user/:email", async (req, res) => {
      const email = req.params.email;
      const result = await ordersCollection.find({ userEmail: email }).toArray();
      res.send(result);
    });

    // GET orders by chefId
    app.get('/orders/chef/:chefId', async (req, res) => {
      const chefId = req.params.chefId;

      const result = await ordersCollection
        .find({ chefId })
        .toArray();

      res.send(result);
    });


    app.patch("/orders/payment/:id", async (req, res) => {
      const id = req.params.id;

      const result = await ordersCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { paymentStatus: "paid" } }
      );

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

    /* ================= REVIEWS ================= */

    // POST
    app.post("/reviews", async (req, res) => {
      const review = req.body;
      // Ensure mealId is string
      review.mealId = review.mealsId.toString();
      const result = await reviewsCollection.insertOne(review);
      res.send(result);
    });

    // GET
    app.get("/reviews/:mealId", async (req, res) => {
      const mealId = req.params.mealId;
      const result = await reviewsCollection.find({ mealId }).toArray();
      res.send(result);
    });

    app.get("/reviews/user/:email", async (req, res) => {
      const email = req.params.email;
      const result = await reviewsCollection.find({ userEmail: email }).toArray();
      res.send(result);
    });


    app.delete("/reviews/:id", async (req, res) => {
      const id = req.params.id;
      const result = await reviewsCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    app.put("/reviews/:id", async (req, res) => {
      const id = req.params.id;
      const { review, rating } = req.body;

      try {
        const result = await reviewsCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { review, rating } }
        );
        res.send(result);
      } catch (err) {
        res.status(500).send({ error: err.message });
      }
    });



    /* ================= FAVORITES ================= */

    app.post("/favorites", async (req, res) => {
      const favorite = req.body;

      const exists = await favoritesCollection.findOne({
        userEmail: favorite.userEmail,
        mealId: favorite.mealId
      });

      if (exists) {
        return res.send({ exists: true });
      }

      favorite.addedTime = new Date();
      const result = await favoritesCollection.insertOne(favorite);
      res.send({ insertedId: result.insertedId });
    });

    app.get("/favorites/check", async (req, res) => {
      const { userEmail, mealId } = req.query;

      const exists = await favoritesCollection.findOne({ userEmail, mealId });
      res.send({ isFavorite: !!exists });
    });


    app.get("/favorites/user/:email", async (req, res) => {
      const email = req.params.email;
      const result = await favoritesCollection.find({ userEmail: email }).toArray();
      res.send(result);
    });

    app.delete("/favorites/:id", async (req, res) => {
      const id = req.params.id;
      const result = await favoritesCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });


    /* ================= ROLE REQUEST ================= */

    app.post("/role-request", async (req, res) => {
      const request = req.body;

      request.requestStatus = "pending";
      request.requestTime = new Date();

      const exists = await roleRequestCollection.findOne({
        userEmail: request.userEmail,
        requestStatus: "pending",
      });

      if (exists) {
        return res.status(400).send({ message: "Already requested" });
      }

      const result = await roleRequestCollection.insertOne(request);
      res.send(result);
    });

    app.get("/role-request", async (req, res) => {
      const result = await roleRequestCollection
        .find()
        .sort({ requestTime: -1 })
        .toArray();
      res.send(result);
    });

    app.patch("/role-request/approve/:id", async (req, res) => {
      const id = req.params.id;
      const { role, email } = req.body;

      let chefId = null;

      if (role === "chef") {
        chefId = await generateChefId(); // ✅ CH-001 format
      }

      await usersCollection.updateOne(
        { email },
        {
          $set: {
            role,
            chefId,
          },
        }
      );

      const result = await roleRequestCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { requestStatus: "approved" } }
      );

      res.send({ success: true, chefId });
    });


    app.patch("/role-request/reject/:id", async (req, res) => {
      const id = req.params.id;

      const result = await roleRequestCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { requestStatus: "rejected" } }
      );

      res.send(result);
    });

    /* ================= ADMIN STATS ================= */

    app.get("/admin-stats", async (req, res) => {
      const totalUsers = await usersCollection.countDocuments();
      const totalOrders = await ordersCollection.countDocuments();
      const deliveredOrders = await ordersCollection.countDocuments({
        orderStatus: "delivered",
      });

      res.send({ totalUsers, totalOrders, deliveredOrders });
    });

  } finally {
    // optional: client.close()
  }
}

run().catch(console.dir);

app.listen(port, () => {
  console.log(`🚀 Local Chef Bazaar server running on port ${port}`);
});


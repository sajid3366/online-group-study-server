const express = require('express');
const cors = require('cors');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;
const app = express();

// middleware
app.use(cors())
app.use(express.json())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.l9mlnno.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();


    const userCollection = client.db("studygroupDB").collection("user")
    const assignmentCollection = client.db("studygroupDB").collection("assignment")
    const myAssignmentCollection = client.db("studygroupDB").collection("myassignment")

    // for user collection
    app.get('/user', async (req, res) => {
      const cursor = userCollection.find();
      const result = await cursor.toArray()
      res.send(result)
    })

    app.post('/user', async (req, res) => {
      const newUser = req.body;
      const result = await userCollection.insertOne(newUser);
      res.send(result)
    })

    // for create assignment
    app.get('/assignment', async (req, res) => {
      const cursor = assignmentCollection.find();
      const result = await cursor.toArray()
      res.send(result)
    })

    app.post('/assignment', async (req, res) => {
      const newAssignment = req.body;
      const result = await assignmentCollection.insertOne(newAssignment);
      res.send(result)
    })

    app.get('/assignment/update/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const assignment = await assignmentCollection.findOne(query)
      res.send(assignment)
    })


    // this is for myassignment
    app.post('/myassignment', async (req, res) => {
      const newAssignment = req.body;
      const result = await myAssignmentCollection.insertOne(newAssignment);
      res.send(result)
    })

    app.get('/myassignment', async (req, res) => {
      const cursor = myAssignmentCollection.find();
      const result = await cursor.toArray()
      res.send(result)
    })

    app.get('/myassignment/submit/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const assignment = await myAssignmentCollection.findOne(query)
      res.send(assignment)
    })
    app.get('/myassignment/givemark/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const assignment = await myAssignmentCollection.findOne(query)
      res.send(assignment)
    })
    app.get('/myassignment/:status', async (req, res) => {
      const status = req.params.status;
      const query = { status: status }
      const pendingAssignment = await myAssignmentCollection.find(query).toArray()
      res.send(pendingAssignment)
    })

    app.put('/myassignment/givemark/:id', async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const markGivenAssignment = req.body;
      console.log("mark",markGivenAssignment);
      const filter = { _id: new ObjectId(id) }
      const options = { upsert: true };
      const assignment = {
        $set: {
          obtainedMark: markGivenAssignment.obtainedMark,
          feedback: markGivenAssignment.feedback,
          status: markGivenAssignment.status,
        }
      }
      const result = await myAssignmentCollection.updateOne(filter, assignment, options)
      res.send(result);

    })



    app.put('/assignment/:id', async (req, res) => {
      const id = req.params.id;
      const updatedAssignment = req.body;
      console.log(updatedAssignment);
      const filter = { _id: new ObjectId(id) }
      const options = { upsert: true };
      const assignment = {
        $set: {
          title: updatedAssignment.title,
          difficulty: updatedAssignment.difficulty,
          mark: updatedAssignment.mark,
          date: updatedAssignment.date,
          description: updatedAssignment.description,
          photo: updatedAssignment.photo,
          status : updatedAssignment.status
          
        }
      }
      const result = await assignmentCollection.updateOne(filter, assignment, options)
      res.send(result);

    })


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



// const { MongoClient, ServerApiVersion } = require('mongodb');
// const uri = "mongodb+srv://<automotiveCarHant>:<0TC2zduR3ASj24jq>@cluster0.l9mlnno.mongodb.net/?retryWrites=true&w=majority";

// // Create a MongoClient with a MongoClientOptions object to set the Stable API version
// const client = new MongoClient(uri, {
//   serverApi: {
//     version: ServerApiVersion.v1,
//     strict: true,
//     deprecationErrors: true,
//   }
// });

// async function run() {
//   try {
//     // Connect the client to the server	(optional starting in v4.7)
//     await client.connect();
//     // Send a ping to confirm a successful connection
//     await client.db("admin").command({ ping: 1 });
//     console.log("Pinged your deployment. You successfully connected to MongoDB!");
//   } finally {
//     // Ensures that the client will close when you finish/error
//     // await client.close();
//   }
// }
// run().catch(console.dir);



app.get("/", (req, res) => {
  res.send("online study group server is runnig");
})
app.listen(port, () => {
  console.log(`server is runnig on port: ${port}`);
})
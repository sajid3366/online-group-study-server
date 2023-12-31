const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;
const app = express();

// middleware
app.use(cors({
  origin: [
    // "http://localhost:5173",
    "https://online-group-study-auth.web.app",
    "online-group-study-auth.web.app",
    "online-group-study-auth.firebaseapp.com"
  ],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.l9mlnno.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


// middlewares

const logger = (req, res, next) => {
  console.log('request method and url', req.method, req.url);
  next();
}

const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: "unauthorized access" })
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unauthorized access" })
    }
    req.user = decoded;
    next();
  })
}


async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();


    const userCollection = client.db("studygroupDB").collection("user")
    const assignmentCollection = client.db("studygroupDB").collection("assignment")
    const myAssignmentCollection = client.db("studygroupDB").collection("myassignment")

    // for jwt auth api
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      console.log("user", user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
      res.cookie('token', token, {
        httpOnly: true,
        secure: true,
        sameSite: "none"
      })
        .send({ success: true })

    })

    app.post('/logout', async (req, res) => {
      const user = req.body;
      res.clearCookie('token', { maxAge: 0 }).send({ success: true })
    })


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
    
    app.post('/assignment', async (req, res) => {
      const newAssignment = req.body;
      const result = await assignmentCollection.insertOne(newAssignment);
      res.send(result)
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
          status: updatedAssignment.status

        }
      }
      const result = await assignmentCollection.updateOne(filter, assignment, options)
      res.send(result);

    })

    app.get('/assignment/update/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const assignment = await assignmentCollection.findOne(query)
      res.send(assignment)
    })

    app.get('/assignment/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await assignmentCollection.findOne(query)
      res.send(result)

    })
    app.get('/assignmentlevel/:difficulty', async (req, res) => {
      const difficulty = req.params.difficulty;
      const query = { difficulty: difficulty };
      const result = await assignmentCollection.find(query).toArray()
      res.send(result)

    })

    // assignment delete
    app.delete('/assignment/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await assignmentCollection.deleteOne(query);
      res.send(result)

    })
    // for pagination
    app.get('/countAssignment', async (req, res) => {
      const count = await assignmentCollection.estimatedDocumentCount();
      res.send({ count });
    })
    app.get('/assignment', async (req, res) => {
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size)
      // console.log("pagination query:", page, size);
      const result = await assignmentCollection.find().skip(page * size).limit(size).toArray();
  
      res.send(result);
    })

    // this is for myassignment
    app.post('/myassignment', async (req, res) => {
      const newAssignment = req.body;
      const result = await myAssignmentCollection.insertOne(newAssignment);
      res.send(result)
    })

    app.get('/myassignment', async (req, res) => {
      const result =await myAssignmentCollection.find().toArray();
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
    

    app.get('/myassignment/:email', logger, verifyToken, async (req, res) => {
      const email = req.params.email;
      console.log(email);
      console.log("req",req.user?.user);
      if(req.user.user !== email){
        return res.status(403).send({ message: "forbiden access" })
      }
      const query = { email: email }
      const userAssignment = await myAssignmentCollection.find(query).toArray()
      res.send(userAssignment)
    })

    app.get('/pendingassignment/:status', async (req, res) => {
      const status = req.params.status;
      // const email = req.body;
      // console.log("pendig email", email);
      // if(req.user.user !== email){
      //   return res.status(403).send({ message: "forbiden access" })
      // }
      const query = { status: status }
      const pendingAssignment = await myAssignmentCollection.find(query).toArray()
      res.send(pendingAssignment)
    })



    app.put('/myassignment/givemark/:id', async (req, res) => {
      const id = req.params.id;
      const markGivenAssignment = req.body;
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


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("online study group server is runnig");
})
app.listen(port, () => {
  console.log(`server is runnig on port: ${port}`);
})
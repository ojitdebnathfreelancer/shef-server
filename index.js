const express = require("express");
const cors = require("cors");
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;
require('dotenv').config();
const jwt = require("jsonwebtoken");

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("shafe server running");
});

const uri = `mongodb+srv://${process.env.SHAFE_USER}:${process.env.SHAFE_PASSWORD}@cluster0.r7d25w3.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const jwtVerify = (req, res, next) =>{
    const authHeader = req.headers.authorization;
    if(!authHeader){
        return res.status(401).send({message:"Unauthorized access"})
    };

    const mToken = authHeader.split(' ')[1];

    jwt.verify(mToken, process.env.ACCESS_TOKEN, (error, decoded)=>{
        if(error){
            return res.status(403).send({message:"Forbiden access1"})
        }

        req.decoded = decoded;
    })
    next();
};
// verify jwt token 

const shafeMongo = async() =>{
    try {
        console.log("db done");

        const servicesData = client.db("shafe").collection("services");
        const reviewsData = client.db("shafe").collection("reviews");

        app.post('/jwt',(req,res)=>{
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN, {expiresIn:"1d"});
            res.send({token});
        });
        // sent jwt token in client 

        app.get('/services', async(req, res)=>{
            const page = parseInt(req.query.page);
            const size = parseInt(req.query.size);
            const services = await servicesData.find({}).sort({_id:-1}).skip(page * size).limit(size).toArray();
            const count = await servicesData.estimatedDocumentCount();
            res.send({services, count});
        });
        // unlimited itme get 

        app.get('/homeservices', async(req, res)=>{
            const homeServices = await servicesData.find({}).sort({_id:-1}).limit(3).toArray();
            res.send(homeServices);
        });
        // limit item get 

        app.get('/services/:id', async(req, res)=>{
            const id = req.params.id;
            const query = {_id:ObjectId(id)};
            const servies = await servicesData.findOne(query);
            res.send(servies);
        });
        // single items get  

        app.post('/addservies', async (req,res)=>{
            const newServies = req.body;
            const ser = await servicesData.insertOne(newServies);
            res.send(ser);
        });
        // add servies 

        app.get('/reviews/:id', async (req, res)=>{
            const reviews = await reviewsData.find({
                serviesId:req.params.id}).toArray();
            res.send(reviews);
        });
        // get single servies reviews

        app.get('/editreviews/:id', async (req, res)=>{
            const reviews = await reviewsData.findOne({_id:ObjectId(req.params.id)});
            res.send(reviews);
        });
        // eidt review 

        app.post('/addreview', async(req,res)=>{
            const review = await reviewsData.insertOne(req.body);
            res.send(review);
        });
        // add review

        app.get('/myreviews', jwtVerify, async(req, res)=>{
            const decoded = req.decoded.email;

            if(decoded !== req.query.email){
                return res.status(403).send({"message":"Forbiden access2"})
            };

            let query = {};           
            if(req.query.email){
                query = {userEmail:req.query.email};
            };

            const myReviews = await reviewsData.find(query).toArray();
            res.send(myReviews);
        });
        // get my reviews from bd 

        app.get('/delete/:id', async(req, res)=>{
            const query = {_id:ObjectId(req.params.id)};
            const deleteReview = await reviewsData.deleteOne(query);
            res.send(deleteReview);
        });
        // delete review 

        app.get('/allreviewdelete', async(req, res)=>{
            const userEmail = req.query.email;
            const query = {userEmail:userEmail};
            const deleteReview = await reviewsData.deleteMany(query);
            res.send(deleteReview);
        });
        // delete all review 

        app.patch('/updatereview/:id', async (req, res) => {
            const id = req.params.id;
            const text = req.body;
            const filter = {_id:ObjectId(id)};
            const updateDoc ={
                $set:{
                    review:text.text,
                }
            }
            const result = await reviewsData.updateOne(filter, updateDoc, {upsert:true});
            res.send(result);
        });
        // update review 

    } 
    finally{

    }
}
shafeMongo().catch(error => console.log(error));




app.listen(port, () => {
    console.log("server running", port);
});
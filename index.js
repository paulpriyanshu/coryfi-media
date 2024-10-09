const express = require('express')
const authRoutes = require('./controller/users');
const product = require('./controller/product')
const cart = require('./controller/cart')
const search = require('./controller/search')
const limiter = require('./middleware/ratelimit')
const connectdb = require('./config/dbconnection');
const passport = require('passport');
const cors=require('cors')
// const swaggerUi = require('swagger-ui-express');
// const swaggerJSDoc = require('swagger-jsdoc');
// const swaggerSpec = require('./config/swaggerconf');
const app = express()

const port = 8080

connectdb()
app.use(cors())
require('./config/passport');
app.use(passport.initialize());

app.use(express.json());
app.use(limiter);

// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/', authRoutes);
app.use('/api/', product);
app.use('/api/',cart)
app.use('/api',search)

app.get('/getdata',(req,res)=>{
    res.json({msg:"hello"})
})

app.listen(port,()=>{
    console.log('app is running',port)
})
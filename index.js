const express = require('express')
const authRoutes = require('./controller/users');
const product = require('./controller/product')
const cart = require('./controller/cart')
const limiter = require('./middleware/ratelimit')
const connectdb = require('./config/dbconnection');
const passport = require('passport');
// const swaggerUi = require('swagger-ui-express');
// const swaggerJSDoc = require('swagger-jsdoc');
// const swaggerSpec = require('./config/swaggerconf');
const app = express()

const port = 8080

connectdb()

require('./config/passport');
app.use(passport.initialize());

app.use(express.json());
app.use(limiter);

// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/', authRoutes);
app.use('/api/', product);
app.use('/api/',cart)

app.get('/getdata',(req,res)=>{
    res.json({msg:"hello"})
})

app.listen(port,()=>{
    console.log('app is running',port)
})
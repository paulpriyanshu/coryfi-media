const express = require('express')
const { Product, Brand,
    Category,
    SubCategory,
    SubSubCategory, } = require('../models/product')
const {RecentSearch,MostSearch} = require('../models/search')
const nodemailer = require('nodemailer');
const passport = require('passport')
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const dotenv = require('dotenv');
const connectToRedis = require('../config/redisconnection');
const auth = require('../middleware/auth')
const { Client } = require('@elastic/elasticsearch');
const router = express.Router()
const mongoose = require("mongoose");
const users = require('../models/users');


const client = new Client({
    node: 'https://a3a51c31dafd4421b6830d422707ee5f.us-central1.gcp.cloud.es.io:443',
    auth: {
        username: 'enterprise_search',
        password: 'New@121004',
    },
});



//create product index
async function indexProducts() {
    try {


        const products = await Product.find({}).populate('brand').populate('category').populate('subCategory').populate('subSubCategory').populate('brand');

        for (const product of products) {
            // console.log(product.category.name)

            await client.index({
                index: 'products',
                id: product._id.toString(),
                body: {
                    name: product.name,
                    description: product.description,
                    price: product.price,
                    category: product.category.name,
                    subCategory: product.subCategory.name,
                    subSubCategory: product.subSubCategory.name,
                    brand:product.brand.name,
                    suggest: {
                        input: [product.name, product.category.name, product.subCategory.name, product.subSubCategory.name,product.brand.name], // Fields used for suggestions
                        weight: 1,
                    },
                },
            });
        }

        console.log('Products indexed successfully with suggest field!');
    } catch (error) {
        console.error('Error indexing products:', error);
    }
}

indexProducts();


router.post('/products/suggestion', async (req, res) => {
    try {
        const query = req.query.q;
        if (!query ) {
            return res.status(400).json({
                success: false,
                message: 'Search query is required.',
            });
        }


        const { body } = await client.search({
            index: 'products',
            body: {
                suggest: {
                    productSuggest: {
                        prefix: query,
                        completion: {
                            field: 'suggest',
                            fuzzy: {
                                fuzziness: 2,
                            },
                            size: 5,
                        },
                    },
                },
            },
        });

        const suggestions = body.suggest.productSuggest[0].options.map(option => option.text);

        res.status(200).json({
            success: true,
            suggestions,
        });
    } catch (error) {
        console.error('Error fetching suggestions:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
        });
    }
});


router.post('/products/search', async (req, res) => {
    const userid = req.body
    const query = req.query.q; 
    const category = req.query.category; 
    const minPrice = req.query.minPrice; 
    const maxPrice = req.query.maxPrice; 
    const brand = req.query.brand; 
    const subcategory = req.query.subcategory;
    const subsubcategory = req.query.subsubcategory;
    
    const user = await users.findOne({email:userid})


    let filter = [];

    if (category) {
        filter.push({
            term: { category: category }
        });
    }

    
    if (minPrice || maxPrice) {
        let priceRange = {};
        if (minPrice) priceRange.gte = minPrice; 
        if (maxPrice) priceRange.lte = maxPrice; 
        filter.push({
            range: { price: priceRange }
        });
    }

    if (brand) {
        filter.push({
            term: { brand: brand }
        });
    }

    if (subcategory) {
        filter.push({
            term: { subCategory: subcategory }
        });
    }

    if (subsubcategory) {
        filter.push({
            term: { subSubCategory: subsubcategory }
        });
    }


    try {
        const { body } = await client.search({
            index: 'products',
            body: {
                query: {
                    bool: {
                        must: [
                            {
                                match: {
                                    name: query,
                                },
                            },
                        ],
                        filter: filter, 
                    },
                },
            },
        });

        const products = body.hits.hits.map(hit => hit._source); 

        for (let product of products) {
            await MostSearch.findOneAndUpdate(
                { productId: product._id },
                { $inc: { searchCount: 1 }, $set: { createdAt: new Date() } },
                { upsert: true, new: true }
            );
            await RecentSearch.findOneAndUpdate(
               {productId:product._id ,userId:user.id},
               { $set: { createdAt: new Date() }},
               { upsert: true, new: true }
            );
        }


        
        res.status(200).json({
            success: true,
            products,
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
        });
    }
});


router.post('/recent-searches',auth, async (req, res) => {
    try {
        const userId = req.user._id; 

        const recentSearches = await RecentSearch.find({ userId })
            .sort({ createdAt: -1 }) 
            .limit(10); 

        res.status(200).json({
            success: true,
            recentSearches,
        });
    } catch (error) {
        console.error('Error fetching recent searches:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
        });
    }
});



module.exports = router;
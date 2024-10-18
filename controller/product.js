const express = require('express')
const users = require('../models/users')
const {  Brand,
    Category,
    SubCategory,
    SubSubCategory,
    Product,
    ProductVariant,} = require('../models/product')
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const dotenv = require('dotenv');
const auth = require('../middleware/auth')
const mongoose = require("mongoose");

const router = express.Router()


router.post('/createbrands', async (req, res) => {
    try {
        const { name } = req.body;
        if(!name){
            return res.status(400).json({ message: 'Enter name' });
        }
        const brandExists = await users.findOne({name});
        if(brandExists){
            return res.status(400).json({ message: 'Brand already exists' });
        }
        const brand = new Brand({ name });
        await brand.save();
        res.status(201).json({ success: true, data: brand });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
router.post('/deletebrand', async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ message: 'Enter brand name to delete' });
        }

        const brand = await Brand.findOneAndDelete({ name });

        if (!brand) {
            return res.status(404).json({ message: 'Brand not found' });
        }

        res.status(200).json({ success: true, message: 'Brand deleted successfully' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
router.post('/brands/name/:name', async (req, res) => {
    const { name } = req.params;
    const { image, isActive, comingSoon } = req.body;
  
    try {
      // Create an update object with only the fields provided in the request body
      const updateFields = {};
      if (image !== undefined) updateFields.image = image;
      if (isActive !== undefined) updateFields.isActive = isActive;
      if (comingSoon !== undefined) updateFields.comingSoon = comingSoon;
  
      // Find and update the brand by name
      const brand = await Brand.findOneAndUpdate(
        { name },
        updateFields,
        { new: true, runValidators: true }
      );
  
      if (!brand) {
        return res.status(404).json({ success: false, message: 'Brand not found' });
      }
  
      res.json({ success: true, data: brand });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  });
  
  
router.get('/getallbrands', async (req, res) => {
    try {
        const brands = await Brand.find();
        res.status(200).json({ success: true, data: brands });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// router.get('/brands/:name', async (req, res) => {
//     try {
//         const brand = await Brand.findById(req.params.name);
//         if (!brand) {
//             return res.status(404).json({ success: false, message: 'Brand not found' });
//         }
//         res.status(200).json({ success: true, data: brand });
//     } catch (error) {
//         res.status(400).json({ success: false, message: error.message });
//     }
// });

// router.put('/updatebrands/:name', async (req, res) => {
//     try {
//         const { name, isActive } = req.body;
//         const brand = await Brand.findByIdAndUpdate(
//             req.params.name,
//             { name, isActive, updatedAt: Date.now() },
//             { new: true, runValidators: true }
//         );
//         if (!brand) {
//             return res.status(404).json({ success: false, message: 'Brand not found' });
//         }
//         res.status(200).json({ success: true, data: brand });
//     } catch (error) {
//         res.status(400).json({ success: false, message: error.message });
//     }
// });

// router.delete('/deletebrands/:name', async (req, res) => {
//     try {
//         const brand = await Brand.findByIdAndDelete(req.params.name);
//         if (!brand) {
//             return res.status(404).json({ success: false, message: 'Brand not found' });
//         }
//         res.status(200).json({ success: true, message: 'Brand deleted successfully' });
//     } catch (error) {
//         res.status(400).json({ success: false, message: error.message });
//     }
// });

// router.post('/getwomencategory/:category',async(req,res)=>{
//     try {
//         const data = await Product.find().populate({
//             path:'category',
//             match:{name:req.params.category}
//         });
//         if (!data) {
//             return res.status(404).json({ success: false, message: 'data not found' });
//         }
//         res.status(200).json({ success: true, data: data });
//     } catch (error) {
//         res.status(400).json({ success: false, message: error.message });
//     }
// })

router.get('/categories', async (req, res) => {
    try {
        // Fetch all categories with their associated subcategories
        const categories = await Category.find().populate('subCategories');

        res.status(200).json({ success: true, categories });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
router.post('/createcategory', async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: 'Name is required' });
        }

        // Check if a category with the same name exists
        const existingCategory = await Category.findOne({ name });
        if (existingCategory) {
            return res.status(400).json({ success: false, message: 'Category with this name already exists' });
        }

        const category = new Category({ name });
        await category.save();

        res.status(201).json({ success: true, category });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
router.delete('/deletecategory/:name', async (req, res) => {
    try {
        const { name } = req.params;

        const category = await Category.findOne({ name }).populate('subCategories');
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        // Delete all associated SubCategories and SubSubCategories
        for (const subCategory of category.subCategories) {
            await SubSubCategory.deleteMany({ _id: { $in: subCategory.subSubCategories } });
            await SubCategory.findByIdAndDelete(subCategory._id);
        }

        // Delete the Category
        await category.deleteOne();

        res.status(200).json({ success: true, message: 'Category and its subcategories deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.post('/createsubcategory', async (req, res) => {
    try {
        const { name, categoryName } = req.body;

        if (!name || !categoryName) {
            return res.status(400).json({ success: false, message: 'Name and category name are required' });
        }

        // Find the category by name
        const category = await Category.findOne({ name: categoryName });
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        // Check if a subcategory with the same name already exists
        const existingSubCategory = await SubCategory.findOne({ name });
        if (existingSubCategory) {
            return res.status(400).json({ success: false, message: 'SubCategory with this name already exists' });
        }

        const subCategory = new SubCategory({ name });
        await subCategory.save();

        // Add the new SubCategory to the Category
        category.subCategories.push(subCategory._id);
        await category.save();

        res.status(201).json({ success: true, subCategory });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
router.delete('/deletesubcategory/:name', async (req, res) => {
    try {
        const { name } = req.params;

        const subCategory = await SubCategory.findOne({ name });
        if (!subCategory) {
            return res.status(404).json({ success: false, message: 'SubCategory not found' });
        }

        // Delete all associated SubSubCategories
        await SubSubCategory.deleteMany({ _id: { $in: subCategory.subSubCategories } });

        // Remove the subCategory from its parent Category
        await Category.updateOne(
            { subCategories: subCategory._id },
            { $pull: { subCategories: subCategory._id } }
        );

        // Delete the subCategory
        await subCategory.deleteOne();

        res.status(200).json({ success: true, message: 'SubCategory and its sub-subcategories deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
router.post('/createsubsubcategory', async (req, res) => {
    try {
        const { name, categoryName, subCategoryName } = req.body;

        if (!name || !categoryName || !subCategoryName) {
            return res.status(400).json({ 
                success: false, 
                message: 'Name, category name, and subcategory name are required' 
            });
        }

        // Find the category by name
        const category = await Category.findOne({ name: categoryName });
        if (!category) {
            return res.status(404).json({ 
                success: false, 
                message: 'Category not found' 
            });
        }

        // Find the subcategory by name within the found category
        const subCategory = await SubCategory.findOne({ 
            name: subCategoryName, 
            _id: { $in: category.subCategories } 
        });

        if (!subCategory) {
            return res.status(404).json({ 
                success: false, 
                message: 'SubCategory not found under the specified category' 
            });
        }

        // Check if a sub-subcategory with the same name already exists
        const existingSubSubCategory = await SubSubCategory.findOne({ name });
        if (existingSubSubCategory) {
            return res.status(400).json({ 
                success: false, 
                message: 'SubSubCategory with this name already exists' 
            });
        }

        // Create the new sub-subcategory
        const subSubCategory = new SubSubCategory({ name });
        await subSubCategory.save();

        // Add the new SubSubCategory to the SubCategory
        subCategory.subSubCategories.push(subSubCategory._id);
        await subCategory.save();

        res.status(201).json({ success: true, subSubCategory });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
router.delete('/deletesubsubcategory/:name', async (req, res) => {
    try {
        const { name } = req.params;

        const subSubCategory = await SubSubCategory.findOne({ name });
        if (!subSubCategory) {
            return res.status(404).json({ success: false, message: 'SubSubCategory not found' });
        }

        // Remove the subSubCategory from its parent SubCategory
        await SubCategory.updateOne(
            { subSubCategories: subSubCategory._id },
            { $pull: { subSubCategories: subSubCategory._id } }
        );

        // Delete the subSubCategory
        await subSubCategory.deleteOne();

        res.status(200).json({ success: true, message: 'SubSubCategory deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});
//craete product variant
router.post('/create-product-variant',async(req,res)=>{
    try{
        const {productId, variantType, variantName, variantPrice} = req.body
    if (!productId || !variantType || !variantName || !variantPrice) {
        return res.status(400).json({ message: 'productId, variant type, variant name, and variant price are required' });

    }
    const existingProduct = await Product.findById(productId);
    if (!existingProduct) {
        return res.status(404).json({ message: 'Product not found' });
    }
    const newVariant = new ProductVariant({
        productId,
        variantType,
        variantName,
        variantPrice
    });
    const savedVariant = await newVariant.save();
   
    if (!Array.isArray(existingProduct.variants)) {
        existingProduct.variants = [];
    }
    existingProduct.variants.push(savedVariant._id)
    await existingProduct.save();
    return res.status(201).json({ message: 'Product variant created successfully', variant: savedVariant });
    }
    catch(error){
        console.error('Error creating product variant:', error);
        return res.status(500).json({ message: 'Server error' });
    }
})  

//get product by variant
router.post('/getproducts-by-variant', async (req, res) => {
    try {
        const { variantType, variantName } = req.query;

        if (!variantType || !variantName) {
            return res.status(400).json({ message: 'variantType and variantName are required' });
        }

        const variants = await ProductVariant.find({variantType,
            variantName,}).populate('productId');

        if (variants.length === 0) {
            return res.status(404).json({ message: 'No products found for this variant' });
        }

        const products = variants.map(variant => variant.productId);

        return res.status(200).json({ products });
    } catch (error) {
        console.error('Error fetching products by variant:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});

// Create product
router.post('/createproduct', async (req, res) => {
    try {
        const { name, price, description, images, category, subCategory, subSubCategory, brand, seller, stock } = req.body;

        // Validate required fields
        if (!name || !price || !description || !category || !subCategory || !subSubCategory || !brand || !seller || stock === undefined) {
            return res.status(400).json({ message: 'All fields are mandatory' });
        }

        // Initialize variables for IDs
        let brandid, categoryid, subcategoryid, subsubcategoryid;

        // Check if brand exists; if not, create it
        const brandExist = await Brand.findOne({ name: brand });
        if (!brandExist) {
            const createBrand = new Brand({ name: brand });
            await createBrand.save();
            brandid = createBrand._id;
        } else {
            brandid = brandExist._id;
        }

        // Check if subSubCategory exists; if not, create it
        const subSubCategoryExist = await SubSubCategory.findOne({ name: subSubCategory });
        if (!subSubCategoryExist) {
            const createSubSubCategory = new SubSubCategory({ name: subSubCategory });
            await createSubSubCategory.save();
            subsubcategoryid = createSubSubCategory._id;
        } else {
            subsubcategoryid = subSubCategoryExist._id;
        }

        // Check if subCategory exists; if not, create it
        const subCategoryExist = await SubCategory.findOne({ name: subCategory });
        if (!subCategoryExist) {
            const createSubCategory = new SubCategory({ name: subCategory, subSubCategories: [subsubcategoryid] });
            await createSubCategory.save();
            subcategoryid = createSubCategory._id;
        } else {
            subcategoryid = subCategoryExist._id;
            // Add subSubCategory if it does not already exist in the subCategory
            if (!subCategoryExist.subSubCategories.includes(subsubcategoryid)) {
                subCategoryExist.subSubCategories.push(subsubcategoryid);
                await subCategoryExist.save();
            }
        }

        // Check if category exists; if not, create it
        const categoryExist = await Category.findOne({ name: category });
        if (!categoryExist) {
            const createCategory = new Category({ name: category, subCategories: [subcategoryid] });
            await createCategory.save();
            categoryid = createCategory._id;
        } else {
            categoryid = categoryExist._id;
            // Add subCategory if it does not already exist in the category
            if (!categoryExist.subCategories.includes(subcategoryid)) {
                categoryExist.subCategories.push(subcategoryid);
                await categoryExist.save();
            }
        }

        // Check if product already exists
        const existingProduct = await Product.findOne({
            name,
            category: categoryid,
            subCategory: subcategoryid,
            subSubCategory: subsubcategoryid,
            brand: brandid,
            seller
        });
        
        if (existingProduct) {
            return res.status(400).json({ message: 'Product already exists' });
        }

        // Create and save the new product
        const newProduct = new Product({
            name,
            price,
            description,
            images,
            brand: brandid,
            category: categoryid,
            subCategory: subcategoryid,
            subSubCategory: subsubcategoryid,
            seller,
            stock,
            // Note: Removed the user field as per your request
            // Optionally, add reviews if provided
            reviews: req.body.reviews || [] // Optional field, default to an empty array if not provided
        });

        const savedProduct = await newProduct.save();

        return res.status(201).json({ message: 'Product created successfully', product: savedProduct });
    } catch (error) {
        console.error('Error creating product:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});

//get allproduct
router.get('/getproducts',async(req,res)=>{
    try{
      const data = await Product.find().populate({path:'category',populate:{path:'subCategories',populate:{path:'subSubCategories'}}}).populate('brand')
   res.send(data)   
    }catch(error){
        res.send(error)
    }
})

// get products according to the filters
router.post('/products/filter', async (req, res) => {
    try {
        const { category, subCategory, subSubCategory, brand, seller, gender } = req.query;
        const query = {};

        // Retrieve ObjectIds based on names
        if (category) {
            const categoryObj = await Category.findOne({ name: category });
            if (categoryObj) query.category = categoryObj._id;
        }

        if (gender) {
            const categoryObj = await Category.findOne({ name: gender });
            if (categoryObj) query.category = categoryObj._id;
        }

        if (subCategory) {
            const subCategoryObj = await SubCategory.findOne({ name: subCategory });
            if (subCategoryObj) query.subCategory = subCategoryObj._id;
        }

        if (subSubCategory) {
            const subSubCategoryObj = await SubSubCategory.findOne({ name: subSubCategory });
            if (subSubCategoryObj) query.subSubCategory = subSubCategoryObj._id;
        }

        if (brand) {
            const brandObj = await Brand.findOne({ name: brand });
            if (brandObj) query.brand = brandObj._id;
        }

        if (seller) query.seller = seller;  

        const products = await Product.find(query).populate('category subCategory subSubCategory brand variants');
        return res.status(200).json(products);
    } catch (error) {
        console.error('Error filtering products:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});

// // search product 
// router.post('/products/search', async (req, res) => {
//     try {
//         const { query } = req.query;
//         let brandId, categoryId, subCategoryId, subSubCategoryId;

//         if (query) {
//             const brand = await Brand.findOne({ name: { $regex: query, $options: 'i' } });
//             if (brand) {
//                 brandId = brand._id;
//             }

//             // Search for the category by name and get its ObjectId
//             const category = await Category.findOne({ name: { $regex: query, $options: 'i' } });
//             if (category) {
//                 categoryId = category._id;
//             }

//             // Search for the subcategory by name and get its ObjectId
//             const subCategory = await SubCategory.findOne({ name: { $regex: query, $options: 'i' } });
//             if (subCategory) {
//                 subCategoryId = subCategory._id;
//             }

//             // Search for the subsubcategory by name and get its ObjectId
//             const subSubCategory = await SubSubCategory.findOne({ name: { $regex: query, $options: 'i' } });
//             if (subSubCategory) {
//                 subSubCategoryId = subSubCategory._id;
//             }
//         }

//         // Search products based on name, description, brand, category, subcategory, or subsubcategory
//         const products = await Product.find({
//             $or: [
//                 { name: { $regex: query, $options: 'i' } },
//                 { description: { $regex: query, $options: 'i' } },
//                 ...(brandId ? [{ brand: brandId }] : []),
//                 ...(categoryId ? [{ category: categoryId }] : []),
//                 ...(subCategoryId ? [{ subCategory: subCategoryId }] : []),
//                 ...(subSubCategoryId ? [{ subSubCategory: subSubCategoryId }] : [])
//             ]
//         }).populate('category subCategory subSubCategory brand variants');

//         return res.status(200).json(products);
//     } catch (error) {
//         console.error('Error searching products:', error);
//         return res.status(500).json({ message: 'Server error' });
//     }
// });


//get single product
router.get('/products/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        return res.status(200).json(product);
    } catch (error) {
        console.error('Error fetching product:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});


//update product 
router.post('/updateproduct/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, price, description, images, category, subCategory, subSubCategory, brand, seller, stock } = req.body;

        if (!name || !price || !description || !category || !subCategory || !brand || !subSubCategory || !seller || !stock) {
            return res.status(400).json({ message: 'All fields are mandatory' });
        }

        let brandid;
        let categoryid;
        let subcategoryid;
        let subsubcategoryid;

        const brandexist = await Brand.findOne({ name: brand });
        if (!brandexist) {
            const createbrand = new Brand({ name: brand });
            await createbrand.save();
            brandid = createbrand._id;
        } else {
            brandid = brandexist._id;
        }

        const subsubcategoryexist = await SubSubCategory.findOne({ name: subSubCategory });
        if (!subsubcategoryexist) {
            const createsubsubcategory = new SubSubCategory({ name: subSubCategory });
            await createsubsubcategory.save();
            subsubcategoryid = createsubsubcategory._id;
        } else {
            subsubcategoryid = subsubcategoryexist._id;
        }

        const subcategoryexist = await SubCategory.findOne({ name: subCategory });
        if (!subcategoryexist) {
            const createsubcategory = new SubCategory({ name: subCategory, subSubCategories: [subsubcategoryid] });
            await createsubcategory.save();
            subcategoryid = createsubcategory._id;
        } else {
            subcategoryid = subcategoryexist._id;
            if (!subcategoryexist.subSubCategories.includes(subsubcategoryid)) {
                subcategoryexist.subSubCategories.push(subsubcategoryid);
                await subcategoryexist.save();
            }
        }

        const categoryexist = await Category.findOne({ name: category });
        if (!categoryexist) {
            const createcategory = new Category({ name: category, subCategories: [subcategoryid] });
            await createcategory.save();
            categoryid = createcategory._id;
        } else {
            categoryid = categoryexist._id;
            if (!categoryexist.subCategories.includes(subcategoryid)) {
                categoryexist.subCategories.push(subcategoryid);
                await categoryexist.save();
            }
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            id,
            {
                name,
                price,
                description,
                images,
                brand: brandid,
                category: categoryid,
                subCategory: subcategoryid,
                subSubCategory: subsubcategoryid,
                seller,
                stock,
            },
            { new: true, runValidators: true }
        );

        if (!updatedProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }

        return res.status(200).json({ message: 'Product updated successfully', product: updatedProduct });
    } catch (error) {
        console.error('Error updating product:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});


//delete product
router.post('/deleteproduct/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const deletedProduct = await Product.findByIdAndDelete(id);

        if (!deletedProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }

        return res.status(200).json({ message: 'Product deleted successfully', product: deletedProduct });
    } catch (error) {
        console.error('Error deleting product:', error);
        return res.status(500).json({ message: 'Server error' });
    }
});


//sort by price
router.post('/products-sort-by-price', async (req, res) => {
    try {
        const sortOrder = req.query.sort === 'desc' ? -1 : 1; 

        const products = await Product.find()
            .sort({ price: sortOrder }) 
            .populate('category')
            .populate('subCategory')
            .populate('subSubCategory')
            .populate('brand')
            .populate('variants')
            .populate('user');

        res.status(200).json({
            success: true,
            count: products.length,
            products,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
        });
    }
});

router.get('/products/new-arrivals', async (req, res) => {
    try {
        const newArrivals = await Product.find({ isNewArrival: true })
            .populate('category')
            .populate('subCategory')
            .populate('subSubCategory')
            .populate('brand')
            .populate('variants');

        res.status(200).json({
            success: true,
            count: newArrivals.length,
            products: newArrivals,
        });
    } catch (error) {
        console.error("Error fetching new arrivals:", error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
        });
    }
});

router.get('/products/popular', async (req, res) => {
    try {
        const popular = await Product.find({ isTopSelling: true })
            .populate('category')
            .populate('subCategory')
            .populate('subSubCategory')
            .populate('brand')
            .populate('variants');

        res.status(200).json({
            success: true,
            count: popular.length,
            products: popular,
        });
    } catch (error) {
        console.error("Error fetching new arrivals:", error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
        });
    }
});


module.exports = router;
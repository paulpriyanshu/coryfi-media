const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please enter product name"],
        trim: true,
        maxLength: [100, "Product name cannot exceed 100 characters"],
    },
    price: {
        type: Number,
        required: [true, "Please enter product price"],
        maxLength: [5, "Product price cannot exceed 5 characters"],
        default: 0.0,
    },
    description: {
        type: String,
        required: [true, "Please enter product description"],
    },
    ratings: {
        type: Number,
        default: 0,
    },
    images: [{ type: String }],
    
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    subCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'SubCategory', required: true },
    subSubCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'SubSubCategory' },
    brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', required: true },
    variants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant' }],
    seller: {
        type: String,
        required: [true, "Please enter product seller"],
    },
    stock: {
        type: Number,
        required: [true, "Please enter product stock"],
        maxLength: [5, "Product stock cannot exceed 5 characters"],
        default: 0,
    },
    numOfReviews: {
        type: Number,
        default: 0,
    },
    reviews: [
        {
            user: {
                type: mongoose.Schema.ObjectId,
                ref: "User",
                required: false,  // Made optional
            },
            name: {
                type: String,
                required: false,  // Made optional
            },
            rating: {
                type: Number,
                required: false,  // Made optional
            },
            comment: {
                type: String,
                required: false,  // Made optional
            },
        },
    ],
    isActive: { type: Boolean, default: true },
    isTopSelling: { type: Boolean, default: false },
    isNewArrival: { type: Boolean, default: false },
    isBestSelling: { type: Boolean, default: false },
    isReturnable: { type: Boolean, default: true },

    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: { type: Date, default: Date.now }
});

// Brand schema
const brandSchema = new mongoose.Schema({
    name: { type: String, required: true },
    image: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    commingSoon: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Category Schema
const categorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    commingSoon: { type: Boolean, default: false },
    subCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SubCategory' }],
    createdAt: { type: Date, default: Date.now }
});

// Sub-Category Schema
const subCategorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    commingSoon: { type: Boolean, default: false },
    subSubCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SubSubCategory' }],
    createdAt: { type: Date, default: Date.now }
});

// Sub-Sub-Category Schema
const subSubCategorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

const productVariantSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    variantType: { type: String, required: true },
    variantName: { type: Array, required: true },
    commingSoon: { type: Boolean, default: false },
    variantPrice: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const Brand = mongoose.model('Brand', brandSchema);
const Category = mongoose.model("Category", categorySchema);
const SubCategory = mongoose.model("SubCategory", subCategorySchema);
const SubSubCategory = mongoose.model('SubSubCategory', subSubCategorySchema);
const Product = mongoose.model("Product", productSchema);
const ProductVariant = mongoose.model("ProductVariant", productVariantSchema);

module.exports = {
    Brand,
    Category,
    SubCategory,
    SubSubCategory,
    Product,
    ProductVariant,
}
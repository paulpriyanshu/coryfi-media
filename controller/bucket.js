const { S3Client, ListObjectsV2Command, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const express = require('express');

const router = express.Router();

// Create the S3 client instance
const s3Client = new S3Client({
    region: "ap-south-1",
    credentials: {
        accessKeyId: process.env.ACCESS_KEY_ID,
        secretAccessKey: process.env.SECRET_ACCESS_KEY
    }
});
// //console.log("this is s3 client", s3Client.config);

// Define a function to generate a unique filename using Date.now()
const generateUniqueFilename = (originalName) => {
    const fileExtension = originalName.substring(originalName.lastIndexOf('.'));
    return `Image-${Date.now()}${fileExtension}`;
};

// Define a function to get a direct URL for an image
const getImageUrl = (key) => {  
    return `https://coryfi-images.s3.ap-south-1.amazonaws.com/${key}`;
};  

// Define a function to get a signed URL for uploading an image
const imageUpload = async (filename) => {
    // Extract the file extension
    const fileExtension = filename.split('.').pop().toLowerCase();

    // Determine the ContentType based on the file extension
    const contentTypeMap = {
        jpeg: "image/jpeg",
        jpg: "image/jpeg",
        png: "image/png",
        heic: "image/heic", // Support for HEIC files
        webp: "image/webp",
    };

    const contentType = contentTypeMap[fileExtension] || "application/octet-stream"; // Default type if unknown

    const command = new PutObjectCommand({
        Bucket: "coryfi-images",
        Key: `images/${filename}`,
        ContentType: contentType,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 900 }); // Set expiration time to 900 seconds (15 minutes)

    return { url, filename };
};

// Define an endpoint to get a signed URL for uploading an image
const crypto = require("crypto");

router.get('/imageUpload/:name', async (req, res) => {
    try {
        const originalName = req.params.name;
        // Generate a unique identifier
        const uniqueId = crypto.randomBytes(4).toString('hex'); // 8-character unique ID
        const uniqueFilename = `${uniqueId}-${originalName}`;
        console.log("file name is",uniqueFilename)
        // Call your image upload function with the unique filename
        const { url } = await imageUpload(uniqueFilename);

        res.json({ url, filename: uniqueFilename });
    } catch (error) {
        console.error("Error generating signed upload URL:", error);
        res.status(500).json({ error: "Failed to generate signed upload URL" });
    }
});

// Define an endpoint to get the direct URL for an existing image
router.get('/image/:name', async (req, res) => {
    try {
        const url = getImageUrl(`images/${req.params.name}`);
        //console.log("Direct URL is:", url);
        res.json({ url });
    } catch (error) {
        console.error("Error generating direct URL:", error);
        res.status(500).json({ error: "Failed to generate direct URL" });
    }
});

module.exports = router;
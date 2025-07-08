import cloudinary from '../lib/cloudinary.js';
import { redis } from '../lib/redis.js';
import Product from '../models/product.model.js';

export const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find({});

        res.status(200).json({
            status: 'success',
            results: products.length,
            data: {
                products: products,
            },
        });
    } catch (error) {
        console.log('Error occuring in the getAllProducts controller:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error fetching products',
        });
    }
};

export const getFeaturedProducts = async (req, res) => {
    try {
        let featuredProducts = await redis.get('featured_products');

        if (featuredProducts) {
            return res.json(JSON.parse(featuredProducts));
        }

        featuredProducts = await Product.find({ isFeatured: true }).lean();

        if (!featuredProducts) {
            return res.status(404).json({
                status: 'error',
                message: 'No featured products found',
            });
        }

        await redis.set('featured_products', JSON.stringify(featuredProducts));

        res.status(200).json({
            status: 'success',
            results: featuredProducts.length,
            data: {
                products: featuredProducts,
            },
        });
    } catch (error) {
        console.log(
            'Error occuring in the getFeaturedProducts controller:',
            error
        );
        res.status(500).json({
            status: 'error',
            message: 'Error fetching featured products',
        });
    }
};

export const createProduct = async (req, res) => {
    try {
        const { name, description, price, category, image } = req.body;

        let cloudinaryResponse = null;
        if (image) {
            cloudinaryResponse = await cloudinary.uploader.upload(image, {
                folder: 'products',
            });
        }

        const product = await Product.create({
            name,
            description,
            price,
            category,
            image: cloudinaryResponse ? cloudinaryResponse.secure_url : '',
        });

        res.status(201).json({
            status: 'success',
            data: {
                product: product,
            },
        });
    } catch (error) {
        console.log('Error occuring in the createProduct controller:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error creating product',
        });
    }
};

export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);

        if (!product) {
            return res.status(404).json({
                status: 'Error',
                message: 'Product not found',
            });
        }

        // Delete image from cloudinary
        if (product.image) {
            const publicId = product.image.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(`products/${publicId}`);
        }

        res.status(204).json({
            status: 'success',
            message: 'product deleted successfully',
            data: null,
        });
    } catch (error) {
        console.log('Error occuring in the deleteProduct controller:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error deleting product',
        });
    }
};

export const getProductsByCategory = async (req, res) => {
    try {
        const { category } = req.params;

        const products = await Product.find({ category });

        if (!products) {
            return res.status(404).json({
                status: 'error',
                message: `No products found in the category: ${category}`,
            });
        }

        res.status(200).json({
            status: 'success',
            results: products.length,
            data: {
                products: products,
            },
        });
    } catch (error) {
        console.log(
            'Error occuring in the getProductsByCategory controller:',
            error
        );
        res.status(500).json({
            status: 'error',
            message: 'Error fetching products by category',
        });
    }
};

export const getRecommendedProducts = async (req, res) => {
    try {
        const products = await Product.aggregate([
            {
                $sample: { size: 3 },
            },
            {
                $project: {
                    name: 1,
                    description: 1,
                    price: 1,
                    category: 1,
                    image: 1,
                },
            },
        ]);

        res.status(200).json({
            status: 'success',
            results: products.length,
            data: {
                products: products,
            },
        });
    } catch (error) {
        console.log(
            'Error occuring in the getRecommendedProducts controller:',
            error
        );
        res.status(500).json({
            status: 'error',
            message: 'Error fetching recommended products',
        });
    }
};

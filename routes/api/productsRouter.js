var express = require('express');
var router = express.Router();
const productsModel = require('../../models/db/products')
const _ = require('lodash')
const CONST = require('../../constants');
const formidable = require('formidable')
const path = require('path')

router.get('/', getProducts);
router.get('/:productId', getProductById);
router.post('/', addProduct);
router.put('/', editProduct);
router.delete('/', deleteProduct);


module.exports = router;


function getProducts(req, res, next) {
    let options = {};

    options.page = req.query.page ? req.query.page : CONST.DEFAULT_PAGE;
    options.maxResults = req.query.maxResults ? req.query.maxResults : CONST.MAX_RESULT;
    options.categories = null;
    options.colors = null;
    options.minPrice = req.query.minPrice;
    options.maxPrice = req.query.maxPrice;
    options.nameSort = req.query.nameSort;
    options.priceSort = req.query.priceSort;
    options.searchKey = req.query.searchKey;

    //categories query
    if (req.query.categories) {
        if (Array.isArray(req.query.categories))
            options.categories = req.query.categories
        else(options.categories = [req.query.categories])
    } else options.categories = null;

    //colors query
    if (req.query.colors) {
        if (Array.isArray(req.query.colors))
            options.colors = req.query.colors
        else(options.colors = [req.query.colors])
    } else options.colors = null;

    productsModel.load(options, (err, productsResult) => {
        if (err) return res.send(err);
        res.send(productsResult);
    })
}

function getProductById(req, res, next) {
    productsModel.getById(req.params.productId, (err, result) => {
        if (err) return res.send(err);
        res.send(result);
    })
}

function addProduct(req, res, next) {
    var form = new formidable.IncomingForm();
    form.multiples = true;
    form.keepExtensions = true;
    form.uploadDir = path.join(__dirname, '/../../public/upload');


    form.parse(req, (err, fields, files) => {
        if (err) return res.send(err);
        if (!req.user) return res.send('Need to login first')
        let productInfo = {
            name: fields.name,
            oldPrice: fields.oldPrice,
            price: fields.price,
            description: fields.description,
            author: req.user._id,
        };
        if (fields.categories) productInfo.categories = _.flatten([fields.categories]);
        if (fields.colors) productInfo.colors = _.flatten([fields.colors]);
        // console.log(fields);
        if (!files.thumbnail || !files.images == undefined) return res.send('Did not upload enough images')

        Array.isArray(files.thumbnail) ? productInfo.thumbnail = getRelativePath(files.thumbnail[0].path) : productInfo.thumbnail = getRelativePath(files.thumbnail.path);
        Array.isArray(files.images) ? productInfo.images = files.images.map(image => getRelativePath(image.path)) : productInfo.images = [getRelativePath(files.images.path)];

        for (key in productInfo) {
            if (!productInfo[key]) delete productInfo[key];
        }

        productsModel.create(productInfo)
            .then((result) => {
                // console.log(result);
                res.send(result);
            })
            .catch(err => res.send(err));

        // console.log(productInfo);
    });


    // if(!req.body.categories)
}

function getRelativePath(fullURL) {
    // console.log(fullURL)
    // console.log('/' + fullURL.split(/\/|\\\\/).slice(-2).join('/'))
    return '/' + fullURL.split(/\/|\\\\|\\/).slice(-2).join('/');
}

function editProduct(req, res, next) {
    var form = new formidable.IncomingForm();
    form.multiples = true;
    form.keepExtensions = true;
    form.uploadDir = path.join(__dirname, '/../../public/upload');


    form.parse(req, (err, fields, files) => {
        // console.log(fields);
        if (err) return res.send(err);
        // if (!req.user) return res.send('Need to login first')

        let productInfo = {
            name: fields.name,
            oldPrice: fields.oldPrice,
            price: fields.price,
            description: fields.description,
            // author: req.user._id,
        };
        let deletedImages = fields.deletedImages;
        if (deletedImages)
        try {
            deletedImages = JSON.parse(fields.deletedImages);;
        } catch (err) {
            console.log(err);
            return res.send(err)
        }
        // console.log(deletedImages);

        let oldImages = null;
        let newlyAddedImages = [];
        if (fields.categories) productInfo.categories = _.flatten([fields.categories]);
        if (deletedImages) deletedImages = _.flatten([deletedImages]);
        // console.log('deletedImages.length='+deletedImages.length);
        if (fields.colors) productInfo.colors = _.flatten([fields.colors]);
        // console.log(fields);
        // if (!editedImagesList.length && !files.images) return res.send('Did not upload enough images')
        if (files.thumbnail) {
            Array.isArray(files.thumbnail) ? productInfo.thumbnail = getRelativePath(files.thumbnail[0].path) : productInfo.thumbnail = getRelativePath(files.thumbnail.path);
        }

        if (files.images) {
            Array.isArray(files.images) ? files.images.map(image => newlyAddedImages.push(getRelativePath(image.path))) : newlyAddedImages.push(getRelativePath(files.images.path));
        }
        for (key in productInfo) {
            if (!productInfo[key]) delete productInfo[key];
        }

        // productInfo.images = editedImagesList;\♥
        productsModel.findById(fields.productID).lean().exec((err, result) => {
            if (err) return res.send(err);
            oldImages = result.images;
            productInfo.images = [..._.difference(oldImages, deletedImages), ...newlyAddedImages];
            if (!productInfo.images.length) return res.send('Did not upload enough images')

            let query = {
                _id: fields.productID
            }
            productsModel.updateOne(query, productInfo)
                .then((result) => {
                    // console.log(result);
                    res.send(result);
                })
                .catch(err => res.send(err));

        })

        // console.log(productInfo);
    });
}

function deleteProduct(req, res, next) {
    if (!req.body.productID) return res.send('Id not found')
    productsModel.findOneAndRemove(req.body.productID)
        .then((result) => {
            res.send(result);
        })
        .catch(err => res.send(err))
}
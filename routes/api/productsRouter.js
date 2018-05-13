var express = require('express');
var router = express.Router();
const productsModel = require('../../models/db/products')

const CONST = require('../../constants');

router.get('/', getProducts);
router.get('/:productId', getProductById);

function getProducts(req, res, next) {
    let options = {};

    options.page = req.query.page ? req.query.page : CONST.DEFAULT_PAGE;
    options.maxResults = req.query.maxResults ? req.query.maxResults : CONST.MAX_RESULT; //results per page
    options.categories = null;
    // console.log('options');
    if (req.query.categories) {
        if (Array.isArray(req.query.categories))
            options.categories = req.query.categories
        else(options.categories = [req.query.categories])
    } else options.categories = null;

    productsModel.load(options, (err, productsResult) => {
        if (err) return next(err);
        res.send(productsResult);
    })
}

function getProductById(req, res, next) {
    productsModel.getById(req.params.productId, (err, result) => {
        if (err) return next(err);
        res.send(result);
    })
}
module.exports = router;
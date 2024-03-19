const paginate = (req, res, next) => {
    let page = req.query.page ? parseInt(req.query.page) : 1;
    let size = req.query.size ? parseInt(req.query.size) : 10;

    // if (parseInt(size) && size > 200) size = 200;
    if (page <= 0 || size <= 0) size = -1;

    req.query.limit = -1, req.query.offset = -1;
    if (page < 0) page = -page;
    if (size < 0) size = -size;

    if (page >= 1 && size >= 1) {
        req.query.limit = size;
        req.query.offset = (page - 1) * size;
    }
    next();
}

module.exports = paginate;

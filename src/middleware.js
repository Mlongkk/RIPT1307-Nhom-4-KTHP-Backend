// ============ MIDDLEWARE - XỬ LÝ CHUNG ============

/**
 * Middleware xử lý lỗi validation
 * @param {Array} errors - Danh sách lỗi
 * @param {Object} res - Response object
 */
const handleValidationErrors = (errors, res) => {
    if (errors.length > 0) {
        res.status(400).json({
            success: false,
            message: 'Dữ liệu không hợp lệ',
            errors: errors
        });
        return true;
    }
    return false;
};

/**
 * Middleware xử lý lỗi không tìm thấy
 * @param {Object} item - Đối tượng cần kiểm tra
 * @param {string} name - Tên đối tượng
 * @param {Object} res - Response object
 */
const handleNotFound = (item, name, res) => {
    if (!item) {
        res.status(404).json({
            success: false,
            message: `Không tìm thấy ${name}`
        });
        return true;
    }
    return false;
};

/**
 * Middleware xử lý lỗi server
 * @param {Error} error - Lỗi
 * @param {Object} res - Response object
 */
const handleServerError = (error, res) => {
    console.error('Lỗi server:', error);
    res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra trên server',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
};

/**
 * Middleware xử lý phân trang
 * @param {Object} query - Query parameters
 * @returns {Object} - { skip, take, page, pageSize }
 */
const getPaginationParams = (query) => {
    const page = parseInt(query.page) || 1;
    const pageSize = parseInt(query.pageSize) || 10;

    if (page < 1) return { page: 1, pageSize, skip: 0, take: pageSize };
    if (pageSize < 1 || pageSize > 100) return { page, pageSize: 10, skip: (page - 1) * 10, take: 10 };

    return {
        page,
        pageSize,
        skip: (page - 1) * pageSize,
        take: pageSize
    };
};

/**
 * Middleware xử lý tìm kiếm
 * @param {Object} query - Query parameters
 * @returns {Object} - { search, sortBy, sortOrder }
 */
const getSearchParams = (query) => {
    return {
        search: query.search || '',
        sortBy: query.sortBy || 'createdAt',
        sortOrder: (query.sortOrder === 'asc' ? 'asc' : 'desc')
    };
};

module.exports = {
    handleValidationErrors,
    handleNotFound,
    handleServerError,
    getPaginationParams,
    getSearchParams
};

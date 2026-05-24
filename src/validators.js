// ============ VALIDATORS - KIỂM TRA DỮ LIỆU ============

// Kiểm tra email hợp lệ
const isValidEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

// Kiểm tra PetOwner (chủ thú cưng)
const validatePetOwner = (data) => {
    const errors = [];
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
        errors.push('Tên chủ thú cưng không được để trống');
    }
    if (!data.email || !isValidEmail(data.email)) {
        errors.push('Email không hợp lệ');
    }
    if (data.phone && typeof data.phone !== 'string') {
        errors.push('Số điện thoại phải là chuỗi');
    }
    return errors;
};

// Kiểm tra Pet (thú cưng)
const validatePet = (data) => {
    const errors = [];
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
        errors.push('Tên thú cưng không được để trống');
    }
    if (!data.species || typeof data.species !== 'string' || data.species.trim().length === 0) {
        errors.push('Loài thú cưng không được để trống');
    }
    if (!data.ownerId || typeof data.ownerId !== 'string') {
        errors.push('ID chủ thú cưng không hợp lệ');
    }
    if (data.weight !== undefined && data.weight !== null) {
        const weight = parseFloat(data.weight);
        if (isNaN(weight) || weight <= 0) {
            errors.push('Cân nặng phải là số dương');
        }
    }
    return errors;
};

// Kiểm tra Service (dịch vụ)
const validateService = (data) => {
    const errors = [];
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
        errors.push('Tên dịch vụ không được để trống');
    }
    if (typeof data.price !== 'number' || data.price < 0) {
        errors.push('Giá dịch vụ phải là số dương');
    }
    if (typeof data.durationMin !== 'number' || data.durationMin < 1) {
        errors.push('Thời gian dịch vụ phải ≥ 1 phút');
    }
    return errors;
};

// Kiểm tra Appointment (lịch khám)
const validateAppointment = (data) => {
    const errors = [];
    if (!data.petId || typeof data.petId !== 'string') {
        errors.push('ID thú cưng không hợp lệ');
    }
    if (!data.serviceId || typeof data.serviceId !== 'string') {
        errors.push('ID dịch vụ không hợp lệ');
    }
    if (!data.scheduledAt) {
        errors.push('Ngày khám không được để trống');
    } else {
        const date = new Date(data.scheduledAt);
        if (isNaN(date.getTime())) {
            errors.push('Ngày khám không hợp lệ');
        } else if (date < new Date()) {
            errors.push('Ngày khám phải ở trong tương lai');
        }
    }
    return errors;
};

// Kiểm tra Invoice (hóa đơn)
const validateInvoice = (data) => {
    const errors = [];
    if (!data.petId || typeof data.petId !== 'string') {
        errors.push('ID thú cưng không hợp lệ');
    }
    if (!data.ownerId || typeof data.ownerId !== 'string') {
        errors.push('ID chủ thú cưng không hợp lệ');
    }
    if (typeof data.totalAmount !== 'number' || data.totalAmount < 0) {
        errors.push('Tổng tiền phải là số dương');
    }
    return errors;
};

// Kiểm tra Staff (nhân viên)
const validateStaff = (data) => {
    const errors = [];
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
        errors.push('Tên nhân viên không được để trống');
    }
    if (!data.email || !isValidEmail(data.email)) {
        errors.push('Email nhân viên không hợp lệ');
    }
    if (!data.role || typeof data.role !== 'string' || data.role.trim().length === 0) {
        errors.push('Chức vụ nhân viên không được để trống');
    }
    return errors;
};

// Kiểm tra User (tài khoản)
const validateUser = (data) => {
    const errors = [];
    if (!data.email || !isValidEmail(data.email)) {
        errors.push('Email không hợp lệ');
    }
    if (!data.password || data.password.length < 6) {
        errors.push('Mật khẩu phải ít nhất 6 ký tự');
    }
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
        errors.push('Tên người dùng không được để trống');
    }
    return errors;
};

module.exports = {
    validatePetOwner,
    validatePet,
    validateService,
    validateAppointment,
    validateInvoice,
    validateStaff,
    validateUser,
    isValidEmail
};

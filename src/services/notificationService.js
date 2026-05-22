const nodemailer = require('nodemailer');

// Config mail transporter
const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    secure: process.env.MAIL_SECURE === 'true',
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    },
});

/**
 * Gửi email notification
 */
const sendEmail = async (to, subject, htmlContent) => {
    try {
        const mailOptions = {
            from: process.env.MAIL_FROM,
            to,
            subject,
            html: htmlContent,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.messageId);
        return info;
    } catch (error) {
        console.error('Email send failed:', error);
        throw error;
    }
};

/**
 * Gửi reminder lịch khám
 */
const sendAppointmentReminder = async (appointment, customerEmail, customerName) => {
    const subject = 'Nhắc nhở: Lịch khám sắp tới';
    const htmlContent = `
        <h2>Nhắc nhở lịch khám</h2>
        <p>Xin chào ${customerName},</p>
        <p>Lịch khám của bạn sắp tới:</p>
        <ul>
            <li><strong>Thú cưng:</strong> ${appointment.pet.name}</li>
            <li><strong>Ngày giờ:</strong> ${new Date(appointment.appointment_date).toLocaleString('vi-VN')}</li>
            <li><strong>Lý do khám:</strong> ${appointment.reason || 'Không có'}</li>
            <li><strong>Độ ưu tiên:</strong> ${appointment.priority_level}</li>
        </ul>
        <p>Vui lòng đến đúng giờ.</p>
    `;

    return sendEmail(customerEmail, subject, htmlContent);
};

/**
 * Gửi thông báo appointment được xác nhận
 */
const sendAppointmentConfirmation = async (appointment, customerEmail, customerName, doctorName) => {
    const subject = 'Xác nhận lịch khám';
    const htmlContent = `
        <h2>Xác nhận lịch khám</h2>
        <p>Xin chào ${customerName},</p>
        <p>Lịch khám của bạn đã được xác nhận:</p>
        <ul>
            <li><strong>Thú cưng:</strong> ${appointment.pet.name}</li>
            <li><strong>Ngày giờ:</strong> ${new Date(appointment.appointment_date).toLocaleString('vi-VN')}</li>
            <li><strong>Bác sĩ:</strong> ${doctorName || 'Chưa được gán'}</li>
            <li><strong>Lý do khám:</strong> ${appointment.reason || 'Không có'}</li>
        </ul>
        <p>Cảm ơn bạn!</p>
    `;

    return sendEmail(customerEmail, subject, htmlContent);
};

/**
 * Gửi thông báo kết quả khám
 */
const sendMedicalResultNotification = async (medicalRecord, customerEmail, customerName, petName) => {
    const subject = 'Kết quả khám sức khỏe';
    const htmlContent = `
        <h2>Kết quả khám sức khỏe</h2>
        <p>Xin chào ${customerName},</p>
        <p>Kết quả khám sức khỏe của ${petName}:</p>
        <ul>
            <li><strong>Ngày khám:</strong> ${new Date(medicalRecord.visit_date).toLocaleString('vi-VN')}</li>
            <li><strong>Chẩn đoán:</strong> ${medicalRecord.diagnosis || 'Không có'}</li>
            <li><strong>Phương pháp điều trị:</strong> ${medicalRecord.treatment || 'Không có'}</li>
            <li><strong>Ghi chú:</strong> ${medicalRecord.notes || 'Không có'}</li>
        </ul>
        <p>Vui lòng liên hệ nếu có câu hỏi.</p>
    `;

    return sendEmail(customerEmail, subject, htmlContent);
};

/**
 * Gửi notification cho doctor
 */
const sendDoctorNotification = async (doctorEmail, doctorName, subject, content) => {
    const htmlContent = `
        <h2>${subject}</h2>
        <p>Xin chào ${doctorName},</p>
        <p>${content}</p>
    `;

    return sendEmail(doctorEmail, subject, htmlContent);
};

/**
 * Schedule appointment reminders (nên chạy bằng cron job)
 */
const scheduleAppointmentReminders = async (prisma) => {
    try {
        // Tìm appointments trong 24 giờ tới
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        tomorrow.setHours(23, 59, 59, 999);

        const upcomingAppointments = await prisma.appointment.findMany({
            where: {
                appointment_date: {
                    gte: today,
                    lte: tomorrow,
                },
                status: 'SCHEDULED',
            },
            include: {
                pet: true,
                customer: true,
            },
        });

        for (const appointment of upcomingAppointments) {
            try {
                await sendAppointmentReminder(
                    appointment,
                    appointment.customer.email,
                    appointment.customer.full_name
                );
            } catch (error) {
                console.error(`Failed to send reminder for appointment ${appointment.id}:`, error);
            }
        }

        return upcomingAppointments.length;
    } catch (error) {
        console.error('Error scheduling reminders:', error);
        throw error;
    }
};

module.exports = {
    sendEmail,
    sendAppointmentReminder,
    sendAppointmentConfirmation,
    sendMedicalResultNotification,
    sendDoctorNotification,
    scheduleAppointmentReminders,
};

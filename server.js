require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();

app.use(cors());
app.use(express.json());


const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT || 2525,
  secure: false, 
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Ошибка подключения к SMTP (проверьте логин/пароль):', error);
  } else {
    console.log('✅ Успешное подключение к почтовому серверу Timeweb!');
  }
});


app.post('/api/send-order', async (req, res) => {
  const { orderId, customerName, customerPhone, customerEmail, customerAddress, orderHtml, totalPrice } = req.body;

  try {
    const mailToCustomer = {
      from: `"Мотористофф" <${process.env.SMTP_USER}>`,
      to: customerEmail,
      subject: `Ваш заказ #${orderId} успешно оформлен!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #333;">Здравствуйте, ${customerName}!</h2>
          <p style="font-size: 16px; color: #555;">Спасибо за заказ в магазине "Мотористофф". Мы уже начали его обрабатывать.</p>
          
          <h3 style="border-bottom: 2px solid #c38b43; padding-bottom: 10px; color: #222;">Детали заказа #${orderId}:</h3>
          ${orderHtml}
          
          <h3 style="color: #c38b43; font-size: 20px;">Итого к оплате: ${totalPrice} ₽</h3>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <p style="margin: 0 0 10px 0;"><strong>Адрес доставки:</strong> ${customerAddress}</p>
            <p style="margin: 0;">В ближайшее время наш менеджер свяжется с вами по номеру <strong>${customerPhone}</strong> для подтверждения.</p>
          </div>
        </div>
      `,
    };

    const mailToAdmin = {
      from: `"Сайт Мотористофф" <${process.env.SMTP_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `🚨 НОВЫЙ ЗАКАЗ #${orderId} на сумму ${totalPrice} ₽`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 2px solid #c38b43; border-radius: 10px;">
          <h2 style="color: #d9534f; margin-top: 0;">Поступил новый заказ!</h2>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <p style="margin: 5px 0;"><strong>Клиент:</strong> ${customerName}</p>
            <p style="margin: 5px 0;"><strong>Телефон:</strong> <a href="tel:${customerPhone}">${customerPhone}</a></p>
            <p style="margin: 5px 0;"><strong>Email:</strong> <a href="mailto:${customerEmail}">${customerEmail}</a></p>
            <p style="margin: 5px 0;"><strong>Адрес:</strong> ${customerAddress}</p>
          </div>
          
          <h3 style="color: #333;">Состав заказа:</h3>
          ${orderHtml}
          
          <h2 style="color: #c38b43; text-align: right;">Сумма: ${totalPrice} ₽</h2>
        </div>
      `,
    };

    await Promise.all([
      transporter.sendMail(mailToCustomer),
      transporter.sendMail(mailToAdmin)
    ]);

    res.status(200).json({ message: 'Письма успешно отправлены!' });
    
  } catch (error) {
    console.error('❌ Ошибка при отправке писем:', error);
    res.status(500).json({ error: 'Ошибка сервера при отправке писем' });
  }
});

app.get('/', (req, res) => {
  res.send('Почтовый сервер Motoristoff API работает!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});